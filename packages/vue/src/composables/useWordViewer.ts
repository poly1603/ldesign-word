import { ref, shallowRef, onUnmounted, type Ref, type ShallowRef } from 'vue';
import {
  WordViewer,
  type WordViewerOptions,
  type WordDocument,
  type ThemeConfig,
  type PrintOptions,
  type TocItem,
  type SearchResult,
  type EventType,
  type EventData
} from '@word-viewer/core';

/**
 * useWordViewer 返回类型
 */
export interface UseWordViewerReturn {
  /** 查看器实例 */
  viewer: ShallowRef<WordViewer | null>;
  /** 是否正在加载 */
  isLoading: Ref<boolean>;
  /** 加载错误 */
  error: Ref<Error | null>;
  /** 文档对象 */
  document: ShallowRef<WordDocument | null>;
  /** 当前页码 */
  currentPage: Ref<number>;
  /** 总页数 */
  totalPages: Ref<number>;
  /** 当前缩放比例 */
  scale: Ref<number>;
  /** 目录 */
  toc: Ref<TocItem[]>;
  /** 搜索结果 */
  searchResults: Ref<SearchResult[]>;
  /** 当前搜索索引 */
  searchIndex: Ref<number>;

  // 方法
  /** 初始化查看器 */
  init: (container: HTMLElement, options?: Partial<WordViewerOptions>) => void;
  /** 加载文件 */
  loadFile: (file: File) => Promise<void>;
  /** 从 URL 加载 */
  loadUrl: (url: string) => Promise<void>;
  /** 从 ArrayBuffer 加载 */
  loadArrayBuffer: (buffer: ArrayBuffer, fileName?: string) => Promise<void>;
  /** 放大 */
  zoomIn: () => void;
  /** 缩小 */
  zoomOut: () => void;
  /** 设置缩放比例 */
  setScale: (scale: number) => void;
  /** 适应宽度 */
  fitWidth: () => void;
  /** 适应页面 */
  fitPage: () => void;
  /** 设置主题 */
  setTheme: (theme: 'light' | 'dark' | 'sepia' | ThemeConfig) => void;
  /** 打印 */
  print: (options?: PrintOptions) => void;
  /** 打印预览 */
  printPreview: () => void;
  /** 搜索 */
  search: (query: string) => SearchResult[];
  /** 下一个搜索结果 */
  searchNext: () => void;
  /** 上一个搜索结果 */
  searchPrev: () => void;
  /** 清除搜索 */
  clearSearch: () => void;
  /** 跳转到页面 */
  goToPage: (page: number) => void;
  /** 导航到标题 */
  navigateToHeading: (anchor: string) => void;
  /** 切换侧边栏 */
  toggleSidebar: () => void;
  /** 销毁查看器 */
  destroy: () => void;
}

/**
 * Word 文档查看器 Composable
 * 
 * @example
 * ```typescript
 * const {
 *   viewer,
 *   isLoading,
 *   document,
 *   init,
 *   loadFile
 * } = useWordViewer();
 * 
 * onMounted(() => {
 *   init(containerRef.value);
 * });
 * 
 * const handleFileChange = async (file: File) => {
 *   await loadFile(file);
 * };
 * ```
 */
export function useWordViewer(): UseWordViewerReturn {
  // 状态
  const viewer = shallowRef<WordViewer | null>(null);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);
  const document = shallowRef<WordDocument | null>(null);
  const currentPage = ref(1);
  const totalPages = ref(1);
  const scale = ref(1);
  const toc = ref<TocItem[]>([]);
  const searchResults = ref<SearchResult[]>([]);
  const searchIndex = ref(-1);

  /**
   * 初始化查看器
   */
  const init = (container: HTMLElement, options?: Partial<WordViewerOptions>) => {
    if (viewer.value) {
      viewer.value.destroy();
    }

    viewer.value = new WordViewer({
      container,
      ...options
    });

    // 绑定事件
    viewer.value.on<EventData>('load', (event) => {
      const data = event as { document: WordDocument; pageCount: number };
      document.value = data.document;
      totalPages.value = data.pageCount;

      // 获取目录
      if (viewer.value) {
        toc.value = viewer.value.getToc();
      }
    });

    viewer.value.on<EventData>('loadError', (event) => {
      const data = event as { error: Error };
      error.value = data.error;
    });

    viewer.value.on<EventData>('pageChange', (event) => {
      const data = event as { currentPage: number; totalPages: number };
      currentPage.value = data.currentPage;
      totalPages.value = data.totalPages;
    });

    viewer.value.on<EventData>('scaleChange', (event) => {
      const data = event as { scale: number };
      scale.value = data.scale;
    });

    viewer.value.on<EventData>('searchResult', (event) => {
      const data = event as { results: SearchResult[]; currentIndex: number };
      searchResults.value = data.results;
      searchIndex.value = data.currentIndex;
    });
  };

  /**
   * 加载文件
   */
  const loadFile = async (file: File): Promise<void> => {
    if (!viewer.value) {
      throw new Error('查看器未初始化');
    }

    isLoading.value = true;
    error.value = null;

    try {
      await viewer.value.loadFile(file);
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e));
      throw error.value;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 从 URL 加载
   */
  const loadUrl = async (url: string): Promise<void> => {
    if (!viewer.value) {
      throw new Error('查看器未初始化');
    }

    isLoading.value = true;
    error.value = null;

    try {
      await viewer.value.loadUrl(url);
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e));
      throw error.value;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 从 ArrayBuffer 加载
   */
  const loadArrayBuffer = async (buffer: ArrayBuffer, fileName?: string): Promise<void> => {
    if (!viewer.value) {
      throw new Error('查看器未初始化');
    }

    isLoading.value = true;
    error.value = null;

    try {
      await viewer.value.loadArrayBuffer(buffer, fileName);
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e));
      throw error.value;
    } finally {
      isLoading.value = false;
    }
  };

  // 缩放方法
  const zoomIn = () => viewer.value?.zoomIn();
  const zoomOut = () => viewer.value?.zoomOut();
  const setScale = (s: number) => viewer.value?.setScale(s);
  const fitWidth = () => viewer.value?.fitWidth();
  const fitPage = () => viewer.value?.fitPage();

  // 主题方法
  const setTheme = (theme: 'light' | 'dark' | 'sepia' | ThemeConfig) => {
    viewer.value?.setTheme(theme);
  };

  // 打印方法
  const print = (options?: PrintOptions) => viewer.value?.print(options);
  const printPreview = () => viewer.value?.printPreview();

  // 搜索方法
  const search = (query: string): SearchResult[] => {
    return viewer.value?.search(query) ?? [];
  };

  const searchNext = () => {
    // 搜索管理器在 core 包内部处理
  };

  const searchPrev = () => {
    // 搜索管理器在 core 包内部处理
  };

  const clearSearch = () => {
    searchResults.value = [];
    searchIndex.value = -1;
  };

  // 导航方法
  const goToPage = (page: number) => viewer.value?.goToPage(page);
  const navigateToHeading = (anchor: string) => viewer.value?.navigateToHeading(anchor);
  const toggleSidebar = () => viewer.value?.toggleSidebar();

  // 销毁
  const destroy = () => {
    viewer.value?.destroy();
    viewer.value = null;
    document.value = null;
    toc.value = [];
    searchResults.value = [];
    searchIndex.value = -1;
  };

  // 自动清理
  onUnmounted(() => {
    destroy();
  });

  return {
    // 状态
    viewer,
    isLoading,
    error,
    document,
    currentPage,
    totalPages,
    scale,
    toc,
    searchResults,
    searchIndex,

    // 方法
    init,
    loadFile,
    loadUrl,
    loadArrayBuffer,
    zoomIn,
    zoomOut,
    setScale,
    fitWidth,
    fitPage,
    setTheme,
    print,
    printPreview,
    search,
    searchNext,
    searchPrev,
    clearSearch,
    goToPage,
    navigateToHeading,
    toggleSidebar,
    destroy
  };
}
