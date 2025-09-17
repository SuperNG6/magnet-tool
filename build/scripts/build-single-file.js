const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(ROOT, '..');
const TEMP_DIR = path.join(ROOT, 'temp');
const DIST_DIR = path.join(ROOT, 'dist');
const SRC_HTML = path.join(REPO_ROOT, 'index.html');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function runTailwind() {
  ensureDir(TEMP_DIR);
  execSync('npx tailwindcss -i ./src/tailwind.css -o ./temp/tailwind.css --minify', {
    cwd: ROOT,
    stdio: 'inherit',
  });
  return fs.readFileSync(path.join(TEMP_DIR, 'tailwind.css'), 'utf8');
}

function inlineFontawesome() {
  const faCssPath = require.resolve('@fortawesome/fontawesome-free/css/all.min.css');
  let css = fs.readFileSync(faCssPath, 'utf8');
  const fontDir = path.dirname(faCssPath);
  css = css.replace(/url\(([^)]+)\)/g, (match, url) => {
    const cleanUrl = url.replace(/['"]/g, '');
    if (cleanUrl.startsWith('data:')) return match;
    const fontPath = path.resolve(fontDir, cleanUrl);
    const ext = path.extname(fontPath).toLowerCase();
    const mime = { '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.eot': 'application/vnd.ms-fontobject', '.svg': 'image/svg+xml' }[ext];
    if (!mime) return match;
    const data = fs.readFileSync(fontPath).toString('base64');
    return `url('data:${mime};base64,${data}')`;
  });
  return css;
}

function inlineDomPurify() {
  const p = require.resolve('dompurify/dist/purify.min.js');
  return fs.readFileSync(p, 'utf8');
}

function buildHtml({ tailwindCss, faCss, domPurifyJs }) {
  let html = fs.readFileSync(SRC_HTML, 'utf8');

  const tailwindScriptRegex = /<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>\s*/;
  const faLinkRegex = /<link rel="stylesheet" href="https:\/\/cdn\.jsdelivr\.net\/npm\/@fortawesome\/fontawesome-free@[^>]+>\s*/;
  const domPurifyScriptRegex = /<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/dompurify@[^>]+><\/script>\s*/;

  html = html.replace(tailwindScriptRegex, () => `<style id="inline-tailwind">${tailwindCss}\n${faCss}</style>`);
  html = html.replace(faLinkRegex, '');
  html = html.replace(dompurifyScriptRegex, () => `<script id="inline-dompurify">${domPurifyJs}</script>`);

  html = html.replace(
    /<meta http-equiv="Content-Security-Policy"[^>]+>/,
    '<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; img-src \'self\' data:; style-src \'self\' \'unsafe-inline\'; script-src \'self\' \'unsafe-inline\'; font-src \'self\' data:; connect-src \'self\';">'
  );

  ensureDir(DIST_DIR);
  fs.writeFileSync(path.join(DIST_DIR, 'magnet-tool.html'), html, 'utf8');
}

function main() {
  const tailwindCss = runTailwind();
  const faCss = inlineFontawesome();
  const domPurifyJs = inlineDomPurify();
  buildHtml({ tailwindCss, faCss, domPurifyJs });
  console.log('Built build/dist/magnet-tool.html');
}

main();

