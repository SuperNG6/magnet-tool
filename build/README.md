# 磁力工具构建脚本

这个目录包含了在GitHub Actions上构建单文件版本的所有脚本。

## 文件说明

- `package.json` - Node.js项目配置文件
- `download-dependencies.js` - 下载外部依赖的脚本
- `build-standalone.js` - 构建单文件版本的主脚本
- `deps/` - 下载的依赖文件存储目录（运行时创建）
- `dist/` - 构建输出目录（运行时创建）

## 构建过程

1. **下载依赖**: 下载TailwindCSS、DOMPurify、FontAwesome等外部依赖
2. **处理字体**: 将FontAwesome的字体文件转换为base64内联到CSS中
3. **转换图片**: 将本地图片文件转换为base64格式
4. **替换引用**: 将HTML中的外部链接替换为内联内容
5. **更新CSP**: 移除内容安全策略中的外部域名
6. **生成文件**: 输出完全独立的HTML文件

## 本地使用

```bash
cd build
npm install
npm run build
```

生成的文件位于 `build/dist/magnet-tool-standalone.html`

## 特性

- ✅ 完全离线可用
- ✅ 包含所有依赖
- ✅ 保持所有原始功能
- ✅ 文件大小优化
- ✅ 安全CSP策略

## 依赖说明

### 外部依赖
- **TailwindCSS**: CSS框架，提供样式支持
- **DOMPurify**: XSS防护库，确保内容安全
- **FontAwesome**: 图标字体库，提供UI图标

### 本地资源
- `logo.webp`: 网站图标
- `safari-pinned-tab.svg`: Safari标签图标

所有这些依赖都会被内联到最终的HTML文件中，确保完全离线运行。