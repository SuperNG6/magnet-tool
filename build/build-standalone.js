const fs = require('fs-extra');
const path = require('path');
const { downloadDependencies } = require('./download-dependencies');

async function convertImageToBase64(imagePath) {
  try {
    const imageBuffer = await fs.readFile(imagePath);
    const ext = path.extname(imagePath).toLowerCase();
    let mimeType;
    
    switch (ext) {
      case '.webp':
        mimeType = 'image/webp';
        break;
      case '.svg':
        mimeType = 'image/svg+xml';
        break;
      case '.png':
        mimeType = 'image/png';
        break;
      case '.jpg':
      case '.jpeg':
        mimeType = 'image/jpeg';
        break;
      default:
        throw new Error(`不支持的图片格式: ${ext}`);
    }
    
    return `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
  } catch (error) {
    console.warn(`图片转换失败 ${imagePath}:`, error.message);
    return null;
  }
}

async function processCSS(cssContent, fontsDir) {
  let processedCss = cssContent;
  
  // 处理字体文件引用
  if (await fs.pathExists(fontsDir)) {
    const fontFiles = await fs.readdir(fontsDir);
    
    for (const fontFile of fontFiles) {
      const fontPath = path.join(fontsDir, fontFile);
      const fontBuffer = await fs.readFile(fontPath);
      const ext = path.extname(fontFile).toLowerCase();
      
      let mimeType;
      switch (ext) {
        case '.woff2':
          mimeType = 'font/woff2';
          break;
        case '.woff':
          mimeType = 'font/woff';
          break;
        case '.ttf':
          mimeType = 'font/ttf';
          break;
        case '.eot':
          mimeType = 'application/vnd.ms-fontobject';
          break;
        case '.svg':
          mimeType = 'image/svg+xml';
          break;
        default:
          continue;
      }
      
      const base64Font = fontBuffer.toString('base64');
      const dataUri = `data:${mimeType};base64,${base64Font}`;
      
      // 替换所有对该字体文件的引用
      const fontRegex = new RegExp(`url\\(['"]?[^'"]*${fontFile.replace('.', '\\.')}[^'"]*['"]?\\)`, 'g');
      processedCss = processedCss.replace(fontRegex, `url('${dataUri}')`);
    }
  }
  
  return processedCss;
}

async function buildStandalone() {
  console.log('开始构建单文件版本...');
  
  const rootDir = path.dirname(__dirname);
  const depsDir = path.join(__dirname, 'deps');
  const outputDir = path.join(__dirname, 'dist');
  const htmlPath = path.join(rootDir, 'index.html');
  
  try {
    // 确保依赖已下载
    if (!(await fs.pathExists(depsDir))) {
      console.log('依赖文件不存在，开始下载...');
      await downloadDependencies();
    }
    
    // 确保输出目录存在
    await fs.ensureDir(outputDir);
    
    // 读取原始HTML文件
    console.log('读取原始HTML文件...');
    let htmlContent = await fs.readFile(htmlPath, 'utf8');
    
    // 读取依赖文件
    console.log('读取依赖文件...');
    const tailwindJs = await fs.readFile(path.join(depsDir, 'tailwindcss.js'), 'utf8');
    const dompurifyJs = await fs.readFile(path.join(depsDir, 'dompurify.min.js'), 'utf8');
    const fontawesomeCss = await fs.readFile(path.join(depsDir, 'fontawesome.css'), 'utf8');
    
    // 处理FontAwesome CSS中的字体引用
    console.log('处理FontAwesome字体文件...');
    const processedFontAwesome = await processCSS(fontawesomeCss, path.join(depsDir, 'fonts'));
    
    // 转换本地图片为base64
    console.log('转换本地图片为base64...');
    const logoBase64 = await convertImageToBase64(path.join(rootDir, 'logo.webp'));
    const safariIconBase64 = await convertImageToBase64(path.join(rootDir, 'safari-pinned-tab.svg'));
    
    // 替换外部依赖
    console.log('替换外部依赖为内联内容...');
    
    // 1. 替换TailwindCSS
    htmlContent = htmlContent.replace(
      '<script src="https://cdn.tailwindcss.com"></script>',
      `<script>\\n${tailwindJs}\\n</script>`
    );
    
    // 2. 替换DOMPurify
    htmlContent = htmlContent.replace(
      /<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/dompurify@3\.0\.6\/dist\/purify\.min\.js"[^>]*><\/script>/,
      `<script>\\n${dompurifyJs}\\n</script>`
    );
    
    // 3. 替换FontAwesome CSS
    htmlContent = htmlContent.replace(
      /<link rel="stylesheet" href="https:\/\/cdn\.jsdelivr\.net\/npm\/@fortawesome\/fontawesome-free@6\.4\.0\/css\/all\.min\.css">/,
      `<style>\\n${processedFontAwesome}\\n</style>`
    );
    
    // 4. 替换本地图片引用
    if (logoBase64) {
      htmlContent = htmlContent.replace(
        /https:\/\/cdn\.jsdelivr\.net\/gh\/SuperNG6\/magnet-tool@main\/logo\.webp/g,
        logoBase64
      );
    }
    
    if (safariIconBase64) {
      htmlContent = htmlContent.replace(
        /https:\/\/cdn\.jsdelivr\.net\/gh\/SuperNG6\/magnet-tool@main\/safari-pinned-tab\.svg/g,
        safariIconBase64
      );
    }
    
    // 5. 更新CSP策略，移除外部域名
    htmlContent = htmlContent.replace(
      /content="default-src 'self'; img-src 'self' data: https:\/\/cdn\.jsdelivr\.net; style-src 'self' 'unsafe-inline' https:\/\/cdn\.tailwindcss\.com https:\/\/cdn\.jsdelivr\.net; script-src 'self' 'unsafe-inline' https:\/\/cdn\.tailwindcss\.com https:\/\/cdn\.jsdelivr\.net; font-src 'self' data: https:\/\/cdn\.jsdelivr\.net; connect-src 'self';"/,
      'content="default-src \'self\'; img-src \'self\' data:; style-src \'self\' \'unsafe-inline\'; script-src \'self\' \'unsafe-inline\'; font-src \'self\' data:; connect-src \'self\';"'
    );
    
    // 添加构建信息注释
    const buildInfo = `<!--
    单文件构建版本
    构建时间: ${new Date().toISOString()}
    包含依赖: TailwindCSS, DOMPurify, FontAwesome
    离线可用: 是
-->`;
    
    htmlContent = htmlContent.replace('<!DOCTYPE html>', `${buildInfo}\\n<!DOCTYPE html>`);
    
    // 写入最终文件
    const outputFile = path.join(outputDir, 'magnet-tool-standalone.html');
    await fs.writeFile(outputFile, htmlContent, 'utf8');
    
    // 生成文件统计信息
    const stats = await fs.stat(outputFile);
    const sizeInMB = (stats.size / 1024 / 1024).toFixed(2);
    
    console.log(`\\n✅ 单文件构建完成！`);
    console.log(`输出文件: ${outputFile}`);
    console.log(`文件大小: ${sizeInMB} MB`);
    console.log(`包含的依赖:`);
    console.log(`  - TailwindCSS (完整版)`);
    console.log(`  - DOMPurify v3.0.6`);
    console.log(`  - FontAwesome v6.4.0 (含字体文件)`);
    console.log(`  - 本地图片文件 (base64编码)`);
    console.log(`\\n该文件可以完全离线使用，无需网络连接！`);
    
  } catch (error) {
    console.error('\\n❌ 构建失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  buildStandalone().catch(console.error);
}

module.exports = { buildStandalone };