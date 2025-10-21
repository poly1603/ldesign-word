# Word Viewer - Vue 3 示例

使用 Vite + Vue 3 的完整示例。

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

浏览器将自动打开 http://localhost:3001

### 3. 构建生产版本

```bash
npm run build
```

## ✨ 功能演示

- ✅ 文档加载
- ✅ 缩放控制
- ✅ 编辑模式
- ✅ 主题切换
- ✅ 文本搜索
- ✅ PDF/HTML 导出
- ✅ 文档信息显示
- ✅ 响应式 UI
- ✅ 平滑动画

## 📝 使用说明

1. 点击 "选择文档" 按钮选择一个 .docx 文件
2. 文档将自动加载并显示
3. 使用工具栏按钮测试各种功能
4. 查看浏览器控制台了解详细日志

## 🎯 技术栈

- Vue 3 (Composition API)
- Vite 5
- @word-viewer/core
- CSS3 动画

## 📦 Vite 配置

项目使用 Vite alias 配置直接引用本地核心包：

```javascript
resolve: {
  alias: {
    '@word-viewer/core': path.resolve(__dirname, '../../packages/core/dist/index.esm.js'),
  },
}
```

