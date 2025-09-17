#!/bin/bash

# 磁力工具单文件构建脚本
# 用于本地测试和手动构建

set -e

echo "🔨 开始构建磁力工具单文件版本..."

# 检查Node.js是否已安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 进入构建目录
cd "$(dirname "$0")"

echo "📦 安装依赖..."
npm install

echo "⬇️ 下载外部依赖..."
npm run download-deps

echo "🏗️ 构建单文件版本..."
npm run build

echo ""
echo "✅ 构建完成！"
echo "📁 输出文件: $(pwd)/dist/magnet-tool-standalone.html"
echo "📊 文件大小: $(du -h dist/magnet-tool-standalone.html | cut -f1)"
echo ""
echo "🚀 使用方法:"
echo "   在浏览器中打开 dist/magnet-tool-standalone.html 即可使用"
echo "   该文件包含所有依赖，可以完全离线运行"