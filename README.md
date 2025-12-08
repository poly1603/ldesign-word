# Word Viewer

功能强大的 Word 文档在线预览插件，参考腾讯文档设计，支持多种前端框架。

## 特性

### 核心功能
- 📄 **完整的 DOCX 解析** - 支持文本、表格、图片、超链接等元素
- 🎨 **丰富的样式支持** - 字体、段落、边框、底纹等样式完整渲染
- 📑 **目录导航** - 自动生成文档目录，快速定位
- 🔍 **全文搜索** - 支持关键字搜索、高亮显示、上下翻页
- 🖨️ **打印支持** - 支持打印和打印预览
- 📐 **缩放控制** - 支持多级缩放、适应宽度、适应页面
- 🎭 **主题切换** - 内置亮色、暗色、复古三种主题
- 💾 **多种加载方式** - 支持 File、URL、ArrayBuffer 加载

### 支持的 Word 特性

| 分类 | 特性 |
|------|------|
| **文本** | 字体、字号、颜色、加粗、斜体、下划线、删除线、上下标、高亮 |
| **段落** | 对齐、缩进、间距、行距、边框、底纹、编号、项目符号 |
| **表格** | 边框、合并、对齐、底纹、嵌套表格 |
| **图片** | 内嵌图片、浮动图片、图片大小 |
| **其他** | 超链接、页眉页脚、脚注尾注、分页符、目录 |

## 包结构

```
packages/
├── core/     # @word-viewer/core - 核心解析和渲染引擎（框架无关）
└── vue/      # @word-viewer/vue  - Vue 3 组件封装
```

## 安装

```bash
# 安装核心包
npm install @word-viewer/core

# 安装 Vue 适配包
npm install @word-viewer/vue @word-viewer/core
```

## 快速开始

### 原生 JavaScript

```typescript
import { WordViewer } from '@word-viewer/core';
import '@word-viewer/core/styles';

const viewer = new WordViewer({
  container: '#viewer',
  enableToolbar: true,
  enableToc: true,
  enableSearch: true
});

// 加载文件
const input = document.querySelector('input[type="file"]');
input.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  await viewer.loadFile(file);
});

// 监听事件
viewer.on('load', (event) => {
  console.log('文档加载完成', event.pageCount);
});
```

### Vue 3

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { WordViewer } from '@word-viewer/vue';
import '@word-viewer/core/styles';

const file = ref<File>();

const handleFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement;
  file.value = input.files?.[0];
};

const handleLoad = (document: any, pageCount: number) => {
  console.log('加载完成', pageCount, '页');
};
</script>

<template>
  <div>
    <input type="file" accept=".docx" @change="handleFileChange" />
    
    <WordViewer
      :file="file"
      :show-toolbar="true"
      :show-toc="true"
      height="600px"
      @load="handleLoad"
    />
  </div>
</template>
```

### Vue 3 Composable

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useWordViewer } from '@word-viewer/vue';
import '@word-viewer/core/styles';

const containerRef = ref<HTMLElement>();

const {
  isLoading,
  document,
  currentPage,
  totalPages,
  scale,
  init,
  loadFile,
  zoomIn,
  zoomOut
} = useWordViewer();

onMounted(() => {
  if (containerRef.value) {
    init(containerRef.value);
  }
});

const handleFileChange = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) await loadFile(file);
};
</script>

<template>
  <div>
    <input type="file" accept=".docx" @change="handleFileChange" />
    
    <div class="controls">
      <button @click="zoomOut">缩小</button>
      <span>{{ Math.round(scale * 100) }}%</span>
      <button @click="zoomIn">放大</button>
      <span>第 {{ currentPage }} 页，共 {{ totalPages }} 页</span>
    </div>
    
    <div ref="containerRef" style="height: 600px;"></div>
  </div>
</template>
```

## 开发

```bash
# 安装依赖
npm install

# 构建所有包
npm run build

# 构建核心包
npm run build:core

# 构建 Vue 包
npm run build:vue

# 运行测试
npm run test

# 类型检查
npm run type-check
```

## 项目架构

```
packages/core/src/
├── types/           # 类型定义
│   └── index.ts     # 所有类型导出
├── parser/          # 文档解析器
│   └── DocxParser.ts
├── renderer/        # 文档渲染器
│   └── DocumentRenderer.ts
├── events/          # 事件系统
│   └── EventEmitter.ts
├── features/        # 功能模块
│   ├── SearchManager.ts    # 搜索管理
│   ├── TocManager.ts       # 目录管理
│   └── PrintManager.ts     # 打印管理
├── utils/           # 工具类
│   ├── XmlUtils.ts         # XML 解析工具
│   └── UnitConverter.ts    # 单位转换工具
├── styles/          # 样式文件
│   └── index.css
├── WordViewer.ts    # 主类
└── index.ts         # 入口文件

packages/vue/src/
├── components/      # Vue 组件
│   └── WordViewer.vue
├── composables/     # Composition API
│   ├── useWordViewer.ts
│   └── useDocumentDrop.ts
└── index.ts         # 入口文件
```

## API 文档

详细的 API 文档请参考各包的 README：

- [@word-viewer/core README](./packages/core/README.md)
- [@word-viewer/vue README](./packages/vue/README.md)

## 浏览器支持

- Chrome >= 80
- Firefox >= 78
- Safari >= 14
- Edge >= 80

## 依赖

### 核心依赖
- [jszip](https://stuk.github.io/jszip/) - DOCX 文件解压

### 可选依赖
- [jspdf](https://parall.ax/products/jspdf) - PDF 导出
- [html2canvas](https://html2canvas.hertzen.com/) - 页面截图

## License

MIT
