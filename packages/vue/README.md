# @word-viewer/vue

Word 文档查看器 Vue 3 组件，基于 `@word-viewer/core`。

## 特性

- 🖼️ **Vue 3 组件** - 开箱即用的 Vue 组件
- 🎣 **Composition API** - 提供 `useWordViewer` 等 composables
- 📦 **TypeScript** - 完整的类型定义
- 🎨 **插槽支持** - 支持自定义加载、错误、空状态
- 🖱️ **拖放支持** - 内置 `useDocumentDrop` composable

## 安装

```bash
npm install @word-viewer/vue @word-viewer/core
# 或
yarn add @word-viewer/vue @word-viewer/core
# 或
pnpm add @word-viewer/vue @word-viewer/core
```

## 快速开始

### 使用组件

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

### 使用 Plugin 全局注册

```typescript
// main.ts
import { createApp } from 'vue';
import { WordViewerPlugin } from '@word-viewer/vue';
import '@word-viewer/core/styles';
import App from './App.vue';

const app = createApp(App);
app.use(WordViewerPlugin);
app.mount('#app');
```

```vue
<!-- 使用全局注册的组件 -->
<template>
  <WordViewer :file="file" />
</template>
```

### 使用 useWordViewer

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useWordViewer } from '@word-viewer/vue';
import '@word-viewer/core/styles';

const containerRef = ref<HTMLElement>();
const fileInput = ref<HTMLInputElement>();

const {
  isLoading,
  document,
  currentPage,
  totalPages,
  scale,
  toc,
  init,
  loadFile,
  zoomIn,
  zoomOut,
  setTheme
} = useWordViewer();

onMounted(() => {
  if (containerRef.value) {
    init(containerRef.value, {
      enableToolbar: true,
      enableToc: true
    });
  }
});

const handleFileChange = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) {
    await loadFile(file);
  }
};
</script>

<template>
  <div>
    <input 
      ref="fileInput"
      type="file" 
      accept=".docx" 
      @change="handleFileChange" 
    />
    
    <div class="controls">
      <button @click="zoomOut">缩小</button>
      <span>{{ Math.round(scale * 100) }}%</span>
      <button @click="zoomIn">放大</button>
      <span>{{ currentPage }} / {{ totalPages }}</span>
    </div>
    
    <div ref="containerRef" style="height: 600px;"></div>
  </div>
</template>
```

### 使用拖放功能

```vue
<script setup lang="ts">
import { ref, watch } from 'vue';
import { useDocumentDrop, useWordViewer } from '@word-viewer/vue';
import '@word-viewer/core/styles';

const containerRef = ref<HTMLElement>();
const { init, loadFile } = useWordViewer();

const { isDragging, droppedFile, error } = useDocumentDrop({
  target: containerRef,
  accept: ['.docx'],
  onDrop: async (file) => {
    await loadFile(file);
  },
  onError: (err) => {
    console.error(err);
  }
});
</script>

<template>
  <div 
    ref="containerRef" 
    :class="{ 'dragging': isDragging }"
    style="height: 600px; border: 2px dashed #ccc;"
  >
    <div v-if="isDragging" class="drop-hint">
      释放以加载文档
    </div>
  </div>
</template>

<style>
.dragging {
  border-color: #1976d2 !important;
  background-color: #e3f2fd;
}
</style>
```

## API

### WordViewer 组件

#### Props

| Prop | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `file` | `File` | - | 要加载的文件 |
| `url` | `string` | - | 文档 URL |
| `arrayBuffer` | `ArrayBuffer` | - | 文档数据 |
| `scale` | `number` | `1` | 缩放比例 |
| `theme` | `'light' \| 'dark' \| 'sepia'` | `'light'` | 主题 |
| `showToolbar` | `boolean` | `true` | 显示工具栏 |
| `showToc` | `boolean` | `true` | 显示目录 |
| `enableSearch` | `boolean` | `true` | 启用搜索 |
| `enablePrint` | `boolean` | `true` | 启用打印 |
| `height` | `string \| number` | `'100%'` | 高度 |
| `width` | `string \| number` | `'100%'` | 宽度 |
| `locale` | `'zh-CN' \| 'en-US'` | `'zh-CN'` | 语言 |

#### Events

| 事件 | 参数 | 描述 |
|------|------|------|
| `@load` | `(document, pageCount)` | 加载完成 |
| `@loadError` | `(error)` | 加载失败 |
| `@render` | `(pageCount)` | 渲染完成 |
| `@pageChange` | `(currentPage, totalPages)` | 页码变化 |
| `@scaleChange` | `(scale, previousScale)` | 缩放变化 |
| `@linkClick` | `(href, isExternal)` | 链接点击 |
| `@imageClick` | `(src)` | 图片点击 |
| `@searchResult` | `(results, currentIndex)` | 搜索结果 |
| `@themeChange` | `(theme)` | 主题变化 |
| `@print` | - | 打印 |

#### Slots

| 插槽 | 作用域 | 描述 |
|------|--------|------|
| `loading` | - | 加载状态 |
| `error` | `{ error }` | 错误状态 |
| `empty` | - | 空状态 |

#### Expose

组件通过 `ref` 暴露以下方法和状态：

```typescript
const viewerRef = ref();

// 状态
viewerRef.value.isLoading
viewerRef.value.document
viewerRef.value.currentPage
viewerRef.value.totalPages
viewerRef.value.currentScale

// 方法
viewerRef.value.loadDocument()
viewerRef.value.zoomIn()
viewerRef.value.zoomOut()
viewerRef.value.setScale(scale)
viewerRef.value.fitWidth()
viewerRef.value.fitPage()
viewerRef.value.setTheme(theme)
viewerRef.value.print()
viewerRef.value.search(query)
viewerRef.value.getToc()
viewerRef.value.goToPage(page)
```

### useWordViewer

```typescript
const {
  // 状态
  viewer,        // 原始查看器实例
  isLoading,     // 是否加载中
  error,         // 错误
  document,      // 文档对象
  currentPage,   // 当前页
  totalPages,    // 总页数
  scale,         // 缩放比例
  toc,           // 目录
  searchResults, // 搜索结果
  searchIndex,   // 当前搜索索引
  
  // 方法
  init,              // 初始化
  loadFile,          // 加载文件
  loadUrl,           // 从 URL 加载
  loadArrayBuffer,   // 从 ArrayBuffer 加载
  zoomIn,            // 放大
  zoomOut,           // 缩小
  setScale,          // 设置缩放
  fitWidth,          // 适应宽度
  fitPage,           // 适应页面
  setTheme,          // 设置主题
  print,             // 打印
  printPreview,      // 打印预览
  search,            // 搜索
  searchNext,        // 下一个结果
  searchPrev,        // 上一个结果
  clearSearch,       // 清除搜索
  goToPage,          // 跳转页面
  navigateToHeading, // 导航到标题
  toggleSidebar,     // 切换侧边栏
  destroy            // 销毁
} = useWordViewer();
```

### useDocumentDrop

```typescript
const {
  isDragging,   // 是否拖拽中
  droppedFile,  // 拖放的文件
  error         // 错误
} = useDocumentDrop({
  target: containerRef,       // 目标元素
  accept: ['.docx', '.doc'],  // 接受的类型
  onDrop: (file) => {},       // 拖放回调
  onError: (error) => {}      // 错误回调
});
```

## License

MIT
