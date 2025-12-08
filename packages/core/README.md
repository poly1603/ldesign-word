# @word-viewer/core

核心 Word 文档解析和渲染引擎，与框架无关。

## 特性

- 📄 **DOCX 解析** - 完整解析 Word 文档结构
- 🎨 **丰富的样式支持** - 字体、段落、表格、图片等样式渲染
- 📑 **目录导航** - 自动生成文档目录
- 🔍 **全文搜索** - 支持关键字搜索和高亮
- 🖨️ **打印支持** - 支持打印和打印预览
- 🎭 **主题切换** - 内置亮色、暗色、复古三种主题
- 📐 **缩放控制** - 支持多级缩放
- ⚡ **高性能** - 支持虚拟滚动大文档

## 安装

```bash
npm install @word-viewer/core
# 或
yarn add @word-viewer/core
# 或
pnpm add @word-viewer/core
```

## 快速开始

```typescript
import { WordViewer } from '@word-viewer/core';
import '@word-viewer/core/styles';

// 创建查看器实例
const viewer = new WordViewer({
  container: '#viewer',
  enableToolbar: true,
  enableToc: true,
  enableSearch: true
});

// 加载文档
const fileInput = document.querySelector('input[type="file"]');
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  await viewer.loadFile(file);
});

// 从 URL 加载
await viewer.loadUrl('https://example.com/document.docx');

// 监听事件
viewer.on('load', (event) => {
  console.log('文档加载完成', event.pageCount);
});
```

## API

### WordViewer

主要的文档查看器类。

#### 构造函数选项

```typescript
interface WordViewerOptions {
  container: HTMLElement | string;  // 容器元素或选择器
  enableToc?: boolean;              // 是否启用目录面板
  enableSearch?: boolean;           // 是否启用搜索
  enableToolbar?: boolean;          // 是否启用工具栏
  enablePrint?: boolean;            // 是否启用打印
  initialScale?: number;            // 初始缩放比例
  initialTheme?: 'light' | 'dark' | 'sepia';  // 初始主题
  locale?: 'zh-CN' | 'en-US';       // 语言
}
```

#### 方法

| 方法 | 描述 |
|------|------|
| `loadFile(file: File)` | 从 File 对象加载文档 |
| `loadUrl(url: string)` | 从 URL 加载文档 |
| `loadArrayBuffer(buffer: ArrayBuffer)` | 从 ArrayBuffer 加载文档 |
| `zoomIn()` | 放大 |
| `zoomOut()` | 缩小 |
| `setScale(scale: number)` | 设置缩放比例 |
| `fitWidth()` | 适应宽度 |
| `fitPage()` | 适应页面 |
| `setTheme(theme)` | 设置主题 |
| `print(options?)` | 打印文档 |
| `printPreview()` | 打印预览 |
| `search(query: string)` | 搜索文本 |
| `getToc()` | 获取目录 |
| `navigateToHeading(anchor)` | 导航到标题 |
| `goToPage(page: number)` | 跳转到页面 |
| `on(event, handler)` | 订阅事件 |
| `off(event, handler?)` | 取消订阅 |
| `destroy()` | 销毁实例 |

#### 事件

| 事件 | 描述 |
|------|------|
| `load` | 文档加载完成 |
| `loadError` | 文档加载失败 |
| `render` | 渲染完成 |
| `pageChange` | 页码变化 |
| `scaleChange` | 缩放变化 |
| `themeChange` | 主题变化 |
| `searchResult` | 搜索结果 |
| `linkClick` | 链接点击 |
| `imageClick` | 图片点击 |
| `print` | 打印 |

### 单独使用解析器

```typescript
import { DocxParser } from '@word-viewer/core';

const parser = new DocxParser();
const document = await parser.parse(file);

console.log(document.metadata);
console.log(document.sections);
```

### 单独使用渲染器

```typescript
import { DocxParser, DocumentRenderer, EventEmitter } from '@word-viewer/core';

const parser = new DocxParser();
const document = await parser.parse(file);

const eventEmitter = new EventEmitter();
const renderer = new DocumentRenderer(eventEmitter, {
  scale: 1,
  showPageBorder: true
});

renderer.render(document, containerElement);
```

## 支持的 Word 特性

### 文本格式
- ✅ 字体（名称、大小、颜色）
- ✅ 加粗、斜体、下划线、删除线
- ✅ 上标、下标
- ✅ 高亮
- ✅ 字间距

### 段落格式
- ✅ 对齐方式（左对齐、居中、右对齐、两端对齐）
- ✅ 缩进（首行缩进、悬挂缩进）
- ✅ 段间距、行间距
- ✅ 边框和底纹
- ✅ 编号和项目符号

### 表格
- ✅ 表格边框
- ✅ 单元格合并
- ✅ 单元格对齐
- ✅ 单元格底纹
- ✅ 嵌套表格

### 图片
- ✅ 内嵌图片
- ✅ 浮动图片
- ✅ 图片大小

### 其他
- ✅ 超链接
- ✅ 页眉页脚
- ✅ 脚注尾注
- ✅ 分页符
- ✅ 目录

## 浏览器支持

- Chrome >= 80
- Firefox >= 78
- Safari >= 14
- Edge >= 80

## License

MIT
