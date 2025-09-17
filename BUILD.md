# 磁力工具单文件构建指南

## 概述

这个构建系统允许您在GitHub Actions上自动创建包含所有依赖的单文件版本，该文件可以完全离线运行。

## 🏗️ 构建架构

### 外部依赖处理
- **TailwindCSS**: 从CDN下载完整的JS文件，内联到HTML中
- **DOMPurify**: 下载压缩版本，内联为script标签
- **FontAwesome**: 下载CSS和所有字体文件，转换为base64内联

### 本地资源处理
- **logo.webp**: 转换为base64，替换所有引用
- **safari-pinned-tab.svg**: 转换为base64，替换所有引用

### 安全策略更新
- 移除CSP中的外部域名
- 保持安全策略的完整性

## 🚀 使用方法

### 自动构建（推荐）

1. **推送代码触发构建**:
   ```bash
   git add .
   git commit -m "Update magnet tool"
   git push origin main
   ```

2. **创建Release版本**:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

3. **在GitHub上查看**:
   - 访问仓库的Actions页面查看构建进度
   - 构建完成后，在Releases页面下载单文件版本

### 手动构建（本地测试）

```bash
# 进入构建目录
cd build

# 运行构建脚本
./build.sh

# 或者分步执行
npm install
npm run download-deps
npm run build
```

## 📁 文件结构

```
build/
├── package.json              # Node.js依赖配置
├── download-dependencies.js  # 依赖下载脚本
├── build-standalone.js       # 单文件构建脚本
├── build.sh                  # 便捷构建脚本
├── README.md                 # 构建说明文档
├── deps/                     # 下载的依赖（自动创建）
│   ├── tailwindcss.js
│   ├── dompurify.min.js
│   ├── fontawesome.css
│   └── fonts/
└── dist/                     # 构建输出（自动创建）
    └── magnet-tool-standalone.html
```

## ⚙️ GitHub Actions配置

工作流文件位于 `.github/workflows/build.yml`，包含以下功能：

### 触发条件
- ✅ Push到main分支
- ✅ 创建新的tag (v*)
- ✅ Pull Request到main分支
- ✅ 手动触发

### 构建步骤
1. 检出代码
2. 设置Node.js环境
3. 安装构建依赖
4. 下载外部依赖
5. 构建单文件版本
6. 上传构建产物

### 发布逻辑
- **Tag推送**: 自动创建Release并附加单文件
- **Main分支**: 上传为最新构建产物
- **PR**: 仅构建测试，不发布

## 🔧 自定义配置

### 修改依赖版本
编辑 `build/download-dependencies.js` 中的依赖URL：

```javascript
const dependencies = {
  tailwindcss: 'https://cdn.tailwindcss.com/3.3.0',
  dompurify: 'https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js',
  fontawesome: 'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css'
};
```

### 添加新的依赖
1. 在 `download-dependencies.js` 中添加新的依赖URL
2. 在 `build-standalone.js` 中添加相应的替换逻辑
3. 更新HTML文件的CSP策略（如需要）

## 🐛 故障排除

### 常见问题

**Q: 构建失败，显示网络错误**
A: 检查CDN链接是否可访问，可能需要更换CDN源

**Q: 字体文件显示异常**
A: 确保FontAwesome的字体文件都已正确下载和转换

**Q: 单文件过大**
A: 考虑使用压缩版本的依赖，或移除不必要的字体格式

**Q: 功能异常**
A: 检查CSP策略是否正确，确保没有阻止必要的内联内容

### 调试方法

1. **本地测试**:
   ```bash
   cd build
   ./build.sh
   ```

2. **检查依赖**:
   ```bash
   ls -la build/deps/
   ```

3. **验证单文件**:
   在浏览器中打开生成的文件，检查控制台是否有错误

## 📊 性能优化

### 当前优化
- ✅ 使用压缩版本的库
- ✅ 字体文件base64内联
- ✅ 移除外部网络请求

### 进一步优化建议
- 🔄 使用更轻量的CSS框架
- 🔄 按需加载FontAwesome图标
- 🔄 压缩内联的CSS和JS

## 🔒 安全考虑

- ✅ 更新CSP策略移除外部域名
- ✅ 保持DOMPurify的XSS防护
- ✅ 使用完整性检查的依赖版本
- ✅ 避免在构建过程中执行不可信代码

## 📝 更新日志

版本更新时，请更新以下内容：
1. 依赖版本号
2. 构建脚本
3. GitHub Actions配置
4. 文档说明

---

如有问题，请查看GitHub Actions的构建日志或创建Issue。