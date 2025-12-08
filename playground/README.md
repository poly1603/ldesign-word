# Word Viewer Playground

基于 Vite + Vue 3 的 Word 文档预览示例项目。

## 功能演示

- 📁 **文件上传** - 支持选择文件或拖放上传
- 📄 **文档预览** - 完整预览 Word 文档内容
- 📑 **目录导航** - 快速定位文档章节
- 🔍 **全文搜索** - 搜索文档内容并高亮显示
- 🎨 **主题切换** - 亮色/暗色/复古主题
- 📐 **缩放控制** - 放大/缩小/适应页面
- 🖨️ **打印功能** - 打印和打印预览

## 快速开始

```bash
# 从项目根目录运行
cd ..

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

开发服务器将在 http://localhost:3000 启动。

## 单独运行

```bash
# 进入 playground 目录
cd playground

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 项目结构

```
playground/
├── public/
│   └── vite.svg
├── src/
│   ├── styles/
│   │   └── index.css      # 全局样式
│   ├── App.vue            # 主应用组件
│   ├── main.ts            # 入口文件
│   └── vite-env.d.ts      # 类型声明
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## 使用说明

### 1. 上传文档

可以通过以下方式上传 Word 文档：

- 点击 "选择文件" 按钮选择本地文件
- 将文件拖放到上传区域
- 点击示例文档链接加载在线示例

### 2. 浏览文档

文档加载后，可以使用工具栏进行以下操作：

- **目录** - 点击目录按钮打开/关闭侧边栏目录
- **缩放** - 使用 +/- 按钮或输入百分比调整缩放
- **搜索** - 在搜索框输入关键字搜索内容
- **主题** - 点击主题按钮切换显示主题
- **打印** - 点击打印按钮打印文档

### 3. 关闭文档

点击文件信息栏右侧的 ✕ 按钮关闭当前文档，返回上传界面。

## 技术栈

- **Vue 3** - 渐进式 JavaScript 框架
- **Vite** - 下一代前端构建工具
- **TypeScript** - JavaScript 的超集
- **@word-viewer/core** - Word 文档解析和渲染核心
- **@word-viewer/vue** - Vue 3 组件封装

## License

MIT
