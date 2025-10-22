# Word Viewer v2.0 快速入门指南 🚀

> 5 分钟上手 Word 文档查看器库

## 📦 安装

```bash
npm install @word-viewer/core
# 或
yarn add @word-viewer/core
# 或
pnpm add @word-viewer/core
```

## 🎯 最简单的例子

### HTML
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Word Viewer Demo</title>
</head>
<body>
  <div id="viewer-container" style="width: 800px; height: 600px;"></div>
  <input type="file" id="file-input" accept=".docx,.doc" />
  
  <script type="module" src="app.js"></script>
</body>
</html>
```

### JavaScript/TypeScript
```typescript
import { WordViewer } from '@word-viewer/core';

// 创建查看器
const viewer = new WordViewer('#viewer-container');

// 监听文件选择
document.getElementById('file-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    await viewer.loadFile(file);
  }
});
```

✅ **就这么简单！** 文档会自动渲染，支持缩放、搜索等功能。

---

## 🎨 添加配置选项

```typescript
const viewer = new WordViewer('#viewer-container', {
  // 主题
  theme: 'light', // 'light' | 'dark' | 'auto'
  
  // 是否可编辑
  editable: false,
  
  // 显示工具栏
  showToolbar: true,
  
  // 初始缩放
  initialZoom: 1.0,
  
  // 渲染引擎
  renderEngine: 'auto', // 'docx-preview' | 'mammoth' | 'auto'
  
  // 语言
  language: 'zh-CN', // 'zh-CN' | 'en-US'
});
```

---

## 📤 导出文档

### 导出为 PDF
```typescript
// 基础导出
const pdfBlob = await viewer.exportToPDF();

// 高级选项
const pdfBlob = await viewer.exportToPDF({
  pageSize: 'A4',
  orientation: 'portrait',
  margin: { top: 20, right: 20, bottom: 20, left: 20 },
  header: '公司文档',
  footer: '第 1 页',
  watermark: {
    text: '机密文件',
    opacity: 0.3,
    fontSize: 48
  }
});

// 下载 PDF
const url = URL.createObjectURL(pdfBlob);
const a = document.createElement('a');
a.href = url;
a.download = 'document.pdf';
a.click();
URL.revokeObjectURL(url);
```

### 导出为其他格式
```typescript
// HTML
const html = viewer.exportToHTML();

// Markdown
const markdown = viewer.exportToMarkdown();

// RTF
const rtf = viewer.exportToRTF();

// 纯文本
const txt = viewer.exportToText();
```

---

## 🔍 搜索功能

```typescript
// 搜索文本
const results = viewer.search('关键词');
console.log(`找到 ${results.length} 个结果`);

// 高亮搜索结果
viewer.highlightSearch('关键词');

// 清除高亮
viewer.clearHighlight();
```

---

## ✏️ 编辑功能

```typescript
// 启用编辑
viewer.enableEdit();

// 插入文本
viewer.insertText('Hello World');

// 应用格式
viewer.applyFormat({
  bold: true,
  italic: true,
  fontSize: 16,
  color: '#FF0000'
});

// 插入图片
const imageFile = document.querySelector('input[type="file"]').files[0];
viewer.insertImage(imageFile, {
  width: 300,
  height: 200,
  alignment: 'center'
});

// 撤销/重做
viewer.undo();
viewer.redo();

// 禁用编辑
viewer.disableEdit();
```

---

## 📊 监听事件

```typescript
// 文档加载完成
viewer.on('loaded', (data) => {
  console.log('文档已加载', data);
});

// 加载进度
viewer.on('progress', (progress) => {
  console.log(`加载进度: ${progress.percentage}%`);
});

// 错误处理
viewer.on('error', (error) => {
  console.error('发生错误', error);
  alert(`加载失败: ${error.message}`);
});

// 文档内容改变
viewer.on('changed', () => {
  console.log('文档已修改');
  // 可以启用保存按钮
});

// 缩放改变
viewer.on('zoom', (level) => {
  console.log(`当前缩放: ${level * 100}%`);
});
```

---

## ⚡ 性能优化功能

### 1. 自动缓存（无需配置）
```typescript
// 第一次加载：解析 + 缓存
await viewer.loadFile(file); // ~2秒

// 第二次加载：从缓存读取
await viewer.loadFile(file); // ~100ms ⚡
```

### 2. 内存监控
```typescript
import { MemoryMonitor } from '@word-viewer/core/utils/memory';

const monitor = new MemoryMonitor();

monitor.onWarning((warning) => {
  console.warn(`内存警告 [${warning.level}]: ${warning.message}`);
  
  if (warning.level === 'critical') {
    // 采取措施：清理缓存、提示用户等
    alert('内存使用率过高，建议关闭一些文档');
  }
});

monitor.start();
```

### 3. 日志记录
```typescript
import { Logger, LogLevel } from '@word-viewer/core/utils/logger';

const logger = new Logger({
  level: LogLevel.INFO,
  prefix: '[MyApp]'
});

logger.info('应用启动');
logger.warn('这是警告');
logger.error('发生错误', { error: new Error() });

// 导出日志
const logs = logger.export('json');
console.log(logs);
```

---

## 🎨 框架集成

### Vue 3
```vue
<template>
  <div>
    <input type="file" @change="handleFileChange" />
    <WordViewer
      ref="viewerRef"
      :source="documentFile"
      :zoom="1.2"
      :editable="true"
      theme="light"
      @loaded="onLoaded"
      @error="onError"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { WordViewer } from '@word-viewer/vue';

const viewerRef = ref(null);
const documentFile = ref(null);

const handleFileChange = (e) => {
  documentFile.value = e.target.files[0];
};

const onLoaded = (data) => {
  console.log('文档已加载', data);
};

const onError = (error) => {
  console.error('加载错误', error);
};

// 导出 PDF
const exportPdf = async () => {
  const viewer = viewerRef.value?.getViewer();
  if (viewer) {
    const pdf = await viewer.exportToPDF();
    // 处理 PDF
  }
};
</script>
```

### React
```tsx
import { useRef, useState } from 'react';
import { WordViewerComponent, WordViewerRef } from '@word-viewer/react';

function App() {
  const viewerRef = useRef<WordViewerRef>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const exportPdf = async () => {
    const viewer = viewerRef.current?.getViewer();
    if (viewer) {
      const pdf = await viewer.exportToPDF();
      // 处理 PDF
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={exportPdf}>导出 PDF</button>
      
      <WordViewerComponent
        ref={viewerRef}
        source={file}
        zoom={1.0}
        editable={false}
        theme="light"
        onLoaded={(data) => console.log('已加载', data)}
        onError={(error) => console.error('错误', error)}
      />
    </div>
  );
}
```

---

## 🐛 错误处理

```typescript
import { ErrorBoundary, LoadError, ParseError } from '@word-viewer/core/errors';

// 创建错误边界
const boundary = new ErrorBoundary();

boundary.addHandler((error) => {
  // 记录到日志服务
  console.error('[错误]', error.toJSON());
  
  // 显示用户友好的错误消息
  if (error instanceof LoadError) {
    alert('文档加载失败，请检查文件格式');
  } else if (error instanceof ParseError) {
    alert('文档解析失败，文件可能已损坏');
  }
});

// 注册恢复策略
boundary.registerRecovery('LOAD_ERROR', () => {
  console.log('尝试重新加载...');
  // 重试逻辑
});

// 使用
try {
  await viewer.loadFile(file);
} catch (error) {
  boundary.handleError(error);
}
```

---

## 🔧 常见问题

### Q1: 如何处理大文件？
```typescript
// 使用流式加载
const parser = new ParserModule(viewer);
await parser.parseFileChunked(largeFile, (loaded, total) => {
  const percent = (loaded / total * 100).toFixed(1);
  console.log(`加载进度: ${percent}%`);
  // 更新进度条
});
```

### Q2: 如何自定义主题？
```typescript
viewer.updateOptions({
  theme: 'dark',
  customStyles: `
    .word-viewer-container {
      background: #1e1e1e;
      color: #ffffff;
    }
  `
});
```

### Q3: 如何批量导出？
```typescript
import { ExporterModule } from '@word-viewer/core/modules/exporter';

const exporter = new ExporterModule(viewer);
const documents = [
  { name: 'doc1', content: element1 },
  { name: 'doc2', content: element2 },
];

// 导出为 ZIP
const zipBlob = await exporter.exportAsZip(documents, 'pdf');
```

### Q4: 如何优化性能？
```typescript
// 1. 启用缓存（默认已启用）
// 2. 监控内存
const monitor = new MemoryMonitor();
monitor.start();

// 3. 使用虚拟滚动（大文档自动启用）
// 4. 启用日志记录定位性能瓶颈
const logger = new Logger({ level: LogLevel.DEBUG });
```

---

## 📖 更多资源

- [完整 API 文档](./API.md)
- [快速参考](./QUICK_REFERENCE.md)
- [优化总结](./OPTIMIZATION_SUMMARY.md)
- [示例代码](./examples/)

---

## 💡 提示

1. ✅ 总是监听 `error` 事件
2. ✅ 使用 TypeScript 获得更好的类型提示
3. ✅ 大文件使用流式加载
4. ✅ 启用内存监控
5. ✅ 使用日志系统调试

---

## 🎉 你已经准备好了！

现在你可以：
- ✅ 加载和渲染 Word 文档
- ✅ 导出为多种格式
- ✅ 实现搜索和编辑
- ✅ 监控性能和内存
- ✅ 处理错误

**开始构建你的应用吧！** 🚀

---

**需要帮助？** 查看 [快速参考](./QUICK_REFERENCE.md) 或提交 [Issue](https://github.com/your-repo/issues)



