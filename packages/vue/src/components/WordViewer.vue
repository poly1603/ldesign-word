<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue';
import {
  WordViewer as CoreWordViewer,
  type WordViewerOptions,
  type WordDocument,
  type ThemeConfig,
  type PrintOptions,
  type TocItem,
  type SearchResult,
  type EventType,
  type EventData
} from '@word-viewer/core';

// Props 定义
interface Props {
  /** 文档文件 */
  file?: File;
  /** 文档 URL */
  url?: string;
  /** 文档 ArrayBuffer */
  arrayBuffer?: ArrayBuffer;
  /** 初始缩放比例 */
  scale?: number;
  /** 主题 */
  theme?: 'light' | 'dark' | 'sepia' | ThemeConfig;
  /** 是否显示工具栏 */
  showToolbar?: boolean;
  /** 是否显示目录面板 */
  showToc?: boolean;
  /** 是否启用搜索 */
  enableSearch?: boolean;
  /** 是否启用打印 */
  enablePrint?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 语言 */
  locale?: 'zh-CN' | 'en-US';
  /** 高度 */
  height?: string | number;
  /** 宽度 */
  width?: string | number;
}

const props = withDefaults(defineProps<Props>(), {
  scale: 1,
  theme: 'light',
  showToolbar: true,
  showToc: true,
  enableSearch: true,
  enablePrint: true,
  locale: 'zh-CN',
  height: '100%',
  width: '100%'
});

// Emits 定义
const emit = defineEmits<{
  /** 文档加载完成 */
  (e: 'load', document: WordDocument, pageCount: number): void;
  /** 文档加载失败 */
  (e: 'loadError', error: Error): void;
  /** 渲染完成 */
  (e: 'render', pageCount: number): void;
  /** 页码变化 */
  (e: 'pageChange', currentPage: number, totalPages: number): void;
  /** 缩放变化 */
  (e: 'scaleChange', scale: number, previousScale: number): void;
  /** 链接点击 */
  (e: 'linkClick', href: string, isExternal: boolean): void;
  /** 图片点击 */
  (e: 'imageClick', src: string): void;
  /** 搜索结果 */
  (e: 'searchResult', results: SearchResult[], currentIndex: number): void;
  /** 主题变化 */
  (e: 'themeChange', theme: ThemeConfig): void;
  /** 打印 */
  (e: 'print'): void;
}>();

// Refs
const viewerContainerRef = ref<HTMLElement>();
const viewer = ref<CoreWordViewer>();
const isLoading = ref(false);
const loadError = ref<Error | null>(null);
const document = ref<WordDocument | null>(null);
const currentPage = ref(1);
const totalPages = ref(1);
const currentScale = ref(props.scale);

// 计算样式
const containerStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  height: typeof props.height === 'number' ? `${props.height}px` : props.height
}));

// 初始化查看器
const initViewer = () => {
  if (!viewerContainerRef.value) return;

  const options: WordViewerOptions = {
    container: viewerContainerRef.value,
    enableToc: props.showToc,
    enableSearch: props.enableSearch,
    enableToolbar: props.showToolbar,
    enablePrint: props.enablePrint,
    initialScale: props.scale,
    initialTheme: props.theme,
    locale: props.locale
  };

  viewer.value = new CoreWordViewer(options);

  // 绑定事件
  viewer.value.on<EventData>('load', (event) => {
    const data = event as { document: WordDocument; pageCount: number };
    document.value = data.document;
    totalPages.value = data.pageCount;
    emit('load', data.document, data.pageCount);
  });

  viewer.value.on<EventData>('loadError', (event) => {
    const data = event as { error: Error };
    loadError.value = data.error;
    emit('loadError', data.error);
  });

  viewer.value.on<EventData>('render', (event) => {
    const data = event as { pageCount: number };
    emit('render', data.pageCount);
  });

  viewer.value.on<EventData>('pageChange', (event) => {
    const data = event as { currentPage: number; totalPages: number };
    currentPage.value = data.currentPage;
    totalPages.value = data.totalPages;
    emit('pageChange', data.currentPage, data.totalPages);
  });

  viewer.value.on<EventData>('scaleChange', (event) => {
    const data = event as { scale: number; previousScale: number };
    currentScale.value = data.scale;
    emit('scaleChange', data.scale, data.previousScale);
  });

  viewer.value.on<EventData>('linkClick', (event) => {
    const data = event as { href: string; isExternal: boolean };
    emit('linkClick', data.href, data.isExternal);
  });

  viewer.value.on<EventData>('imageClick', (event) => {
    const data = event as { src: string };
    emit('imageClick', data.src);
  });

  viewer.value.on<EventData>('searchResult', (event) => {
    const data = event as { results: SearchResult[]; currentIndex: number };
    emit('searchResult', data.results, data.currentIndex);
  });

  viewer.value.on<EventData>('themeChange', (event) => {
    const data = event as { theme: ThemeConfig };
    emit('themeChange', data.theme);
  });

  viewer.value.on<EventData>('print', () => {
    emit('print');
  });
};

// 加载文档
const loadDocument = async () => {
  if (!viewer.value) return;

  isLoading.value = true;
  loadError.value = null;

  try {
    if (props.file) {
      await viewer.value.loadFile(props.file);
    } else if (props.url) {
      await viewer.value.loadUrl(props.url);
    } else if (props.arrayBuffer) {
      await viewer.value.loadArrayBuffer(props.arrayBuffer);
    }
  } catch (error) {
    loadError.value = error instanceof Error ? error : new Error(String(error));
  } finally {
    isLoading.value = false;
  }
};

// 暴露的方法
const zoomIn = () => viewer.value?.zoomIn();
const zoomOut = () => viewer.value?.zoomOut();
const setScale = (scale: number) => viewer.value?.setScale(scale);
const getScale = () => viewer.value?.getScale() ?? 1;
const fitWidth = () => viewer.value?.fitWidth();
const fitPage = () => viewer.value?.fitPage();
const toggleSidebar = () => viewer.value?.toggleSidebar();
const showSidebar = () => viewer.value?.showSidebar();
const hideSidebar = () => viewer.value?.hideSidebar();
const setTheme = (theme: 'light' | 'dark' | 'sepia' | ThemeConfig) => viewer.value?.setTheme(theme);
const print = (options?: PrintOptions) => viewer.value?.print(options);
const printPreview = () => viewer.value?.printPreview();
const search = (query: string) => viewer.value?.search(query) ?? [];
const getToc = (): TocItem[] => viewer.value?.getToc() ?? [];
const navigateToHeading = (anchor: string) => viewer.value?.navigateToHeading(anchor);
const goToPage = (page: number) => viewer.value?.goToPage(page);
const getCurrentPage = () => viewer.value?.getCurrentPage() ?? 1;
const getTotalPages = () => viewer.value?.getTotalPages() ?? 1;
const getDocument = () => viewer.value?.getDocument() ?? null;

// 暴露方法和状态
defineExpose({
  // 状态
  isLoading,
  loadError,
  document,
  currentPage,
  totalPages,
  currentScale,
  
  // 方法
  loadDocument,
  zoomIn,
  zoomOut,
  setScale,
  getScale,
  fitWidth,
  fitPage,
  toggleSidebar,
  showSidebar,
  hideSidebar,
  setTheme,
  print,
  printPreview,
  search,
  getToc,
  navigateToHeading,
  goToPage,
  getCurrentPage,
  getTotalPages,
  getDocument,
  
  // 原始实例
  viewer
});

// 监听 props 变化
watch(() => props.scale, (newScale) => {
  if (viewer.value && newScale !== currentScale.value) {
    viewer.value.setScale(newScale);
  }
});

watch(() => props.theme, (newTheme) => {
  if (viewer.value) {
    viewer.value.setTheme(newTheme);
  }
});

watch([() => props.file, () => props.url, () => props.arrayBuffer], () => {
  nextTick(() => {
    loadDocument();
  });
});

// 生命周期
onMounted(async () => {
  await nextTick();
  initViewer();
  
  if (props.file || props.url || props.arrayBuffer) {
    await loadDocument();
  }
});

onUnmounted(() => {
  viewer.value?.destroy();
  viewer.value = undefined;
});
</script>

<template>
  <!-- 简单容器 - 完全由核心库控制 -->
  <div 
    ref="viewerContainerRef" 
    :class="['wv-vue-container', className]"
    :style="containerStyle"
  ></div>
</template>

<style scoped>
.wv-vue-container {
  position: relative;
  overflow: hidden;
}

.wv-vue-loading,
.wv-vue-error,
.wv-vue-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 200px;
}

.wv-vue-loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e0e0e0;
  border-top-color: #1976d2;
  border-radius: 50%;
  animation: wv-vue-spin 0.8s linear infinite;
}

.wv-vue-loading-text {
  margin-top: 16px;
  font-size: 14px;
  color: #666;
}

@keyframes wv-vue-spin {
  to {
    transform: rotate(360deg);
  }
}

.wv-vue-error-icon,
.wv-vue-empty-icon {
  margin-bottom: 16px;
  color: #94a3b8;
}

.wv-vue-error-icon {
  color: #ef4444;
}

.wv-vue-error-message,
.wv-vue-empty-text {
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
}

.wv-vue-error-retry {
  padding: 8px 24px;
  font-size: 14px;
  color: white;
  background-color: #1976d2;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.wv-vue-error-retry:hover {
  background-color: #1565c0;
}
</style>
