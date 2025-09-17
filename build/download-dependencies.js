const fs = require('fs-extra');
const fetch = require('node-fetch');
const path = require('path');

// 依赖URL配置
const dependencies = {
  tailwindcss: 'https://cdn.tailwindcss.com/3.3.0',
  dompurify: 'https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js',
  fontawesome: 'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css'
};

// 字体文件URL模式（需要从CSS中提取）
const fontBaseUrl = 'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/webfonts/';

async function downloadFile(url, outputPath) {
  console.log(`正在下载: ${url}`);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const content = await response.text();
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, content, 'utf8');
    console.log(`已保存: ${outputPath}`);
    return content;
  } catch (error) {
    console.error(`下载失败 ${url}:`, error.message);
    throw error;
  }
}

async function downloadBinaryFile(url, outputPath) {
  console.log(`正在下载二进制文件: ${url}`);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const buffer = await response.buffer();
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, buffer);
    console.log(`已保存: ${outputPath}`);
    return buffer;
  } catch (error) {
    console.error(`下载失败 ${url}:`, error.message);
    throw error;
  }
}

async function extractFontUrls(cssContent) {
  // 从CSS中提取字体文件URL
  const fontUrls = [];
  const urlRegex = /url\(['"]?([^'")\s]+\.(woff2?|ttf|eot|svg))['"]?\)/g;
  let match;
  
  while ((match = urlRegex.exec(cssContent)) !== null) {
    let fontUrl = match[1];
    // 如果是相对路径，转换为绝对路径
    if (fontUrl.startsWith('../')) {
      fontUrl = fontBaseUrl + fontUrl.replace('../webfonts/', '');
    } else if (!fontUrl.startsWith('http')) {
      fontUrl = fontBaseUrl + fontUrl;
    }
    if (!fontUrls.includes(fontUrl)) {
      fontUrls.push(fontUrl);
    }
  }
  
  return fontUrls;
}

async function downloadDependencies() {
  console.log('开始下载依赖文件...');
  
  const depsDir = path.join(__dirname, 'deps');
  await fs.ensureDir(depsDir);
  
  try {
    // 下载TailwindCSS
    console.log('\\n=== 下载TailwindCSS ===');
    await downloadFile(dependencies.tailwindcss, path.join(depsDir, 'tailwindcss.js'));
    
    // 下载DOMPurify
    console.log('\\n=== 下载DOMPurify ===');
    await downloadFile(dependencies.dompurify, path.join(depsDir, 'dompurify.min.js'));
    
    // 下载FontAwesome CSS
    console.log('\\n=== 下载FontAwesome CSS ===');
    const fontAwesomeCss = await downloadFile(dependencies.fontawesome, path.join(depsDir, 'fontawesome.css'));
    
    // 提取并下载字体文件
    console.log('\\n=== 下载FontAwesome字体文件 ===');
    const fontUrls = await extractFontUrls(fontAwesomeCss);
    const fontsDir = path.join(depsDir, 'fonts');
    await fs.ensureDir(fontsDir);
    
    for (const fontUrl of fontUrls) {
      const fileName = path.basename(fontUrl.split('?')[0]); // 移除查询参数
      const fontPath = path.join(fontsDir, fileName);
      try {
        await downloadBinaryFile(fontUrl, fontPath);
      } catch (error) {
        console.warn(`字体文件下载失败，跳过: ${fontUrl}`);
      }
    }
    
    console.log('\\n✅ 所有依赖下载完成！');
    console.log(`依赖文件保存在: ${depsDir}`);
    
  } catch (error) {
    console.error('\\n❌ 下载依赖时发生错误:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  downloadDependencies().catch(console.error);
}

module.exports = { downloadDependencies };