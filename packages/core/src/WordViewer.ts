import type {
  WordDocument,
  RenderOptions,
  ThemeConfig,
  PrintOptions,
  TocItem,
  SearchResult,
  EventType,
  EventData,
  ViewMode,
  BookmarkItem,
  AnnotationItem
} from './types';
import { THEMES } from './types';
import { DocxParser } from './parser/DocxParser';
import { DocumentRenderer } from './renderer/DocumentRenderer';
import { EventEmitter } from './events/EventEmitter';
import { SearchManager, SearchOptions } from './features/SearchManager';
import { TocManager } from './features/TocManager';
import { PrintManager } from './features/PrintManager';
import { ExportManager } from './features/ExportManager';
import { ThumbnailManager } from './features/ThumbnailManager';
import { ViewModeManager } from './features/ViewModeManager';
import { SelectionManager } from './features/SelectionManager';
import { BookmarkManager } from './features/BookmarkManager';
import { CommentManager } from './features/CommentManager';
import { FootnoteManager } from './features/FootnoteManager';
import { AnnotationManager } from './features/AnnotationManager';
import { VirtualScrollRenderer } from './features/VirtualScrollRenderer';
import { Icons, createIconElement } from './utils/icons';

/**
 * Word 文档查看器配置选项
 */
export interface WordViewerOptions extends Omit<Partial<RenderOptions>, 'container'> {
  /** 容器元素或选择器 */
  container: HTMLElement | string;
  /** 是否启用目录面板 */
  enableToc?: boolean;
  /** 是否启用搜索功能 */
  enableSearch?: boolean;
  /** 是否启用工具栏 */
  enableToolbar?: boolean;
  /** 是否启用打印功能 */
  enablePrint?: boolean;
  /** 是否启用导出功能 */
  enableExport?: boolean;
  /** 是否启用缩略图 */
  enableThumbnails?: boolean;
  /** 是否启用书签 */
  enableBookmarks?: boolean;
  /** 是否启用批注 */
  enableComments?: boolean;
  /** 是否启用脚注 */
  enableFootnotes?: boolean;
  /** 是否启用标注 */
  enableAnnotations?: boolean;
  /** 是否启用虚拟滚动 */
  enableVirtualScroll?: boolean;
  /** 初始缩放比例 */
  initialScale?: number;
  /** 初始主题 */
  initialTheme?: 'light' | 'dark' | 'sepia' | ThemeConfig;
  /** 初始视图模式 */
  initialViewMode?: ViewMode;
  /** 语言 */
  locale?: 'zh-CN' | 'en-US';
}

/**
 * WordViewer - Word 文档查看器主类
 * 
 * @example
 * ```typescript
 * const viewer = new WordViewer({
 *   container: '#viewer',
 *   enableToolbar: true,
 *   enableToc: true
 * });
 * 
 * await viewer.loadFile(file);
 * ```
 */
export class WordViewer {
  private options: WordViewerOptions;
  private container: HTMLElement;
  private document: WordDocument | null = null;
  private parser: DocxParser;
  private renderer: DocumentRenderer;
  private eventEmitter: EventEmitter;
  private searchManager: SearchManager;
  private tocManager: TocManager;
  private printManager: PrintManager;
  private exportManager: ExportManager;
  private thumbnailManager: ThumbnailManager;
  private viewModeManager: ViewModeManager;
  private selectionManager: SelectionManager;
  private bookmarkManager: BookmarkManager;
  private commentManager: CommentManager;
  private footnoteManager: FootnoteManager;
  private annotationManager: AnnotationManager;
  private virtualScrollRenderer: VirtualScrollRenderer;
  private isLoading = false;
  private classPrefix = 'wv';

  // UI 元素
  private rootElement: HTMLElement | null = null;
  private toolbarElement: HTMLElement | null = null;
  private sidebarElement: HTMLElement | null = null;
  private contentElement: HTMLElement | null = null;
  private statusBarElement: HTMLElement | null = null;

  constructor(options: WordViewerOptions) {
    this.options = {
      enableToc: true,
      enableSearch: true,
      enableToolbar: true,
      enablePrint: true,
      enableExport: true,
      enableThumbnails: true,
      enableBookmarks: true,
      enableComments: true,
      enableFootnotes: true,
      enableAnnotations: true,
      enableVirtualScroll: false,
      initialScale: 1,
      initialTheme: 'light',
      initialViewMode: 'continuous',
      locale: 'zh-CN',
      ...options
    };

    // 获取容器元素
    if (typeof options.container === 'string') {
      const el = document.querySelector(options.container);
      if (!el) {
        throw new Error(`找不到容器元素: ${options.container}`);
      }
      this.container = el as HTMLElement;
    } else {
      this.container = options.container;
    }

    // 初始化事件发射器
    this.eventEmitter = new EventEmitter();

    // 获取主题
    const theme = this.getTheme(this.options.initialTheme);

    // 初始化渲染器
    this.renderer = new DocumentRenderer(this.eventEmitter, {
      ...this.options,
      container: this.container,
      scale: this.options.initialScale,
      theme
    });

    // 初始化解析器
    this.parser = new DocxParser();

    // 初始化功能管理器
    this.searchManager = new SearchManager(this.eventEmitter);
    this.tocManager = new TocManager(this.eventEmitter);
    this.printManager = new PrintManager(this.eventEmitter);
    this.exportManager = new ExportManager(this.eventEmitter);
    this.thumbnailManager = new ThumbnailManager(this.eventEmitter);
    this.viewModeManager = new ViewModeManager(this.eventEmitter);
    this.selectionManager = new SelectionManager(this.eventEmitter);
    this.bookmarkManager = new BookmarkManager(this.eventEmitter);
    this.commentManager = new CommentManager(this.eventEmitter);
    this.footnoteManager = new FootnoteManager(this.eventEmitter);
    this.annotationManager = new AnnotationManager(this.eventEmitter);
    this.virtualScrollRenderer = new VirtualScrollRenderer(this.eventEmitter);

    // 构建 UI
    this.buildUI();
  }

  /**
   * 获取主题配置
   */
  private getTheme(theme?: string | ThemeConfig): ThemeConfig {
    if (!theme) return THEMES['light']!;
    if (typeof theme === 'string') {
      return THEMES[theme] || THEMES['light']!;
    }
    return theme;
  }

  /**
   * 构建 UI
   */
  private buildUI(): void {
    // 清空容器
    this.container.innerHTML = '';

    // 创建根元素
    this.rootElement = document.createElement('div');
    this.rootElement.className = `${this.classPrefix}-root`;
    Object.assign(this.rootElement.style, {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    });

    // 创建工具栏
    if (this.options.enableToolbar) {
      this.toolbarElement = this.buildToolbar();
      this.rootElement.appendChild(this.toolbarElement);
    }

    // 创建主体区域
    const mainArea = document.createElement('div');
    mainArea.className = `${this.classPrefix}-main`;
    Object.assign(mainArea.style, {
      display: 'flex',
      flex: '1',
      overflow: 'hidden'
    });

    // 创建侧边栏（目录）
    if (this.options.enableToc) {
      this.sidebarElement = document.createElement('div');
      this.sidebarElement.className = `${this.classPrefix}-sidebar`;
      Object.assign(this.sidebarElement.style, {
        width: '280px',
        flexShrink: '0',
        borderRight: '1px solid #e0e0e0',
        overflow: 'hidden',
        display: 'none' // 初始隐藏
      });
      mainArea.appendChild(this.sidebarElement);
    }

    // 创建内容区域
    this.contentElement = document.createElement('div');
    this.contentElement.className = `${this.classPrefix}-content`;
    Object.assign(this.contentElement.style, {
      flex: '1',
      overflow: 'auto',
      position: 'relative'
    });
    mainArea.appendChild(this.contentElement);

    this.rootElement.appendChild(mainArea);

    // 创建状态栏
    this.statusBarElement = this.buildStatusBar();
    this.rootElement.appendChild(this.statusBarElement);

    // 添加到容器
    this.container.appendChild(this.rootElement);
  }

  /**
   * 构建工具栏
   */
  private buildToolbar(): HTMLElement {
    const toolbar = document.createElement('div');
    toolbar.className = `${this.classPrefix}-toolbar`;
    Object.assign(toolbar.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e0e0e0',
      flexShrink: '0'
    });

    // 目录按钮
    if (this.options.enableToc) {
      const tocBtn = this.createToolbarIconButton(Icons.panelLeft, '目录', () => this.toggleSidebar());
      toolbar.appendChild(tocBtn);
    }

    // 分隔符
    toolbar.appendChild(this.createSeparator());

    // 缩放控制
    const zoomOutBtn = this.createToolbarIconButton(Icons.minus, '缩小', () => this.zoomOut());
    const zoomLabel = document.createElement('span');
    zoomLabel.className = `${this.classPrefix}-zoom-label`;
    zoomLabel.textContent = '100%';
    Object.assign(zoomLabel.style, {
      minWidth: '50px',
      textAlign: 'center',
      fontSize: '13px'
    });
    const zoomInBtn = this.createToolbarIconButton(Icons.plus, '放大', () => this.zoomIn());

    toolbar.appendChild(zoomOutBtn);
    toolbar.appendChild(zoomLabel);
    toolbar.appendChild(zoomInBtn);

    // 分隔符
    toolbar.appendChild(this.createSeparator());

    // 适应宽度按钮
    const fitWidthBtn = this.createToolbarIconButton(Icons.arrowLeftRight, '适应宽度', () => this.fitWidth());
    toolbar.appendChild(fitWidthBtn);

    // 适应页面按钮
    const fitPageBtn = this.createToolbarIconButton(Icons.maximize, '适应页面', () => this.fitPage());
    toolbar.appendChild(fitPageBtn);

    // 分隔符
    toolbar.appendChild(this.createSeparator());

    // 搜索
    if (this.options.enableSearch) {
      const searchContainer = this.buildSearchInput();
      toolbar.appendChild(searchContainer);
    }

    // 弹性空间
    const spacer = document.createElement('div');
    spacer.style.flex = '1';
    toolbar.appendChild(spacer);

    // 主题切换
    const themeBtn = this.createToolbarIconButton(Icons.palette, '切换主题', () => this.cycleTheme());
    toolbar.appendChild(themeBtn);

    // 打印按钮
    if (this.options.enablePrint) {
      const printBtn = this.createToolbarIconButton(Icons.printer, '打印', () => this.print());
      toolbar.appendChild(printBtn);
    }

    return toolbar;
  }

  /**
   * 创建工具栏图标按钮
   */
  private createToolbarIconButton(
    iconFn: (opts?: { size?: number; color?: string }) => string,
    title: string,
    onClick: () => void
  ): HTMLElement {
    const btn = document.createElement('button');
    btn.className = `${this.classPrefix}-toolbar-btn`;
    btn.title = title;
    btn.appendChild(createIconElement(iconFn, { size: 18 }));

    Object.assign(btn.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '32px',
      height: '32px',
      border: 'none',
      borderRadius: '4px',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      color: '#374151',
      transition: 'background-color 0.15s, color 0.15s'
    });

    btn.addEventListener('mouseenter', () => {
      btn.style.backgroundColor = '#f3f4f6';
      btn.style.color = '#111827';
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.backgroundColor = 'transparent';
      btn.style.color = '#374151';
    });

    btn.addEventListener('click', onClick);

    return btn;
  }

  /**
   * 创建分隔符
   */
  private createSeparator(): HTMLElement {
    const sep = document.createElement('div');
    sep.className = `${this.classPrefix}-separator`;
    Object.assign(sep.style, {
      width: '1px',
      height: '20px',
      backgroundColor: '#e0e0e0',
      margin: '0 4px'
    });
    return sep;
  }

  /**
   * 构建搜索输入框
   */
  private buildSearchInput(): HTMLElement {
    const container = document.createElement('div');
    container.className = `${this.classPrefix}-search`;
    Object.assign(container.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    });

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = '搜索...';
    input.className = `${this.classPrefix}-search-input`;
    Object.assign(input.style, {
      width: '200px',
      height: '28px',
      padding: '0 8px',
      border: '1px solid #e0e0e0',
      borderRadius: '4px',
      fontSize: '13px',
      outline: 'none'
    });

    input.addEventListener('focus', () => {
      input.style.borderColor = '#1976d2';
    });

    input.addEventListener('blur', () => {
      input.style.borderColor = '#e0e0e0';
    });

    let searchTimeout: ReturnType<typeof setTimeout>;
    input.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.search(input.value);
      }, 300);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        if (e.shiftKey) {
          this.searchManager.previous();
        } else {
          this.searchManager.next();
        }
      } else if (e.key === 'Escape') {
        input.value = '';
        this.searchManager.clear();
      }
    });

    // 上一个/下一个按钮
    const prevBtn = this.createToolbarIconButton(Icons.chevronUp, '上一个 (Shift+Enter)', () => this.searchManager.previous());
    const nextBtn = this.createToolbarIconButton(Icons.chevronDown, '下一个 (Enter)', () => this.searchManager.next());

    container.appendChild(input);
    container.appendChild(prevBtn);
    container.appendChild(nextBtn);

    return container;
  }

  /**
   * 构建状态栏
   */
  private buildStatusBar(): HTMLElement {
    const statusBar = document.createElement('div');
    statusBar.className = `${this.classPrefix}-status-bar`;
    Object.assign(statusBar.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '4px 16px',
      backgroundColor: '#f5f5f5',
      borderTop: '1px solid #e0e0e0',
      fontSize: '12px',
      color: '#666',
      flexShrink: '0'
    });

    // 左侧：页码
    const pageInfo = document.createElement('span');
    pageInfo.className = `${this.classPrefix}-page-info`;
    pageInfo.textContent = '未加载文档';
    statusBar.appendChild(pageInfo);

    // 右侧：状态信息
    const status = document.createElement('span');
    status.className = `${this.classPrefix}-status`;
    status.textContent = '就绪';
    statusBar.appendChild(status);

    return statusBar;
  }

  /**
   * 加载文件
   */
  async loadFile(file: File): Promise<void> {
    if (this.isLoading) return;

    this.isLoading = true;
    this.updateStatus('加载中...');

    try {
      // 解析文档
      this.document = await this.parser.parse(file);

      // 设置到各管理器
      if (this.contentElement) {
        this.searchManager.setDocument(this.document, this.contentElement);
        this.tocManager.setDocument(this.document, this.contentElement);
        this.printManager.setDocument(this.document, this.contentElement);
        this.exportManager.setDocument(this.document, this.contentElement);
        this.thumbnailManager.setDocument(this.document, this.contentElement);
        this.viewModeManager.setDocument(this.document, this.contentElement);
        this.selectionManager.setDocument(this.document, this.contentElement);
        this.bookmarkManager.setDocument(this.document, this.contentElement);
        this.commentManager.setDocument(this.document, this.contentElement);
        this.footnoteManager.setDocument(this.document, this.contentElement);
        this.annotationManager.setDocument(this.document, this.contentElement);
        
        // 虚拟滚动
        if (this.options.enableVirtualScroll) {
          this.virtualScrollRenderer.initialize(this.contentElement);
        }
      }

      // 渲染文档
      if (this.contentElement) {
        this.renderer.render(this.document, this.contentElement);
      }

      // 渲染目录
      if (this.options.enableToc && this.sidebarElement) {
        this.sidebarElement.innerHTML = '';
        this.tocManager.renderTocPanel(this.sidebarElement);
      }

      // 更新状态
      this.updatePageInfo();
      this.updateStatus('加载完成');

      // 触发加载事件
      this.eventEmitter.emit('load', {
        type: 'load',
        timestamp: Date.now(),
        document: this.document,
        pageCount: this.renderer.getTotalPages()
      });

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.updateStatus(`加载失败: ${err.message}`);

      this.eventEmitter.emit('loadError', {
        type: 'loadError',
        timestamp: Date.now(),
        error: err
      });

      throw err;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * 从 URL 加载文档
   */
  async loadUrl(url: string): Promise<void> {
    this.updateStatus('下载中...');

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP 错误: ${response.status}`);
      }

      const blob = await response.blob();
      const file = new File([blob], 'document.docx', { type: blob.type });

      await this.loadFile(file);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.updateStatus(`下载失败: ${err.message}`);
      throw err;
    }
  }

  /**
   * 从 ArrayBuffer 加载文档
   */
  async loadArrayBuffer(buffer: ArrayBuffer, fileName = 'document.docx'): Promise<void> {
    const file = new File([buffer], fileName, {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
    await this.loadFile(file);
  }

  /**
   * 搜索
   */
  search(query: string, options?: SearchOptions): SearchResult[] {
    return this.searchManager.search(query, options);
  }

  /**
   * 放大
   */
  zoomIn(): void {
    const currentScale = this.renderer.getScale();
    this.setScale(currentScale + 0.1);
  }

  /**
   * 缩小
   */
  zoomOut(): void {
    const currentScale = this.renderer.getScale();
    this.setScale(currentScale - 0.1);
  }

  /**
   * 设置缩放比例
   */
  setScale(scale: number): void {
    this.renderer.setScale(scale);
    this.updateZoomLabel();
  }

  /**
   * 获取缩放比例
   */
  getScale(): number {
    return this.renderer.getScale();
  }

  /**
   * 适应宽度
   */
  fitWidth(): void {
    if (!this.contentElement || !this.document) return;

    const containerWidth = this.contentElement.clientWidth - 40;
    const pageWidth = this.document.sections[0]?.properties.pageSettings.width || 816;
    const scale = containerWidth / pageWidth;

    this.setScale(Math.min(scale, 2));
  }

  /**
   * 适应页面
   */
  fitPage(): void {
    if (!this.contentElement || !this.document) return;

    const containerWidth = this.contentElement.clientWidth - 40;
    const containerHeight = this.contentElement.clientHeight - 40;
    const pageWidth = this.document.sections[0]?.properties.pageSettings.width || 816;
    const pageHeight = this.document.sections[0]?.properties.pageSettings.height || 1056;

    const scaleW = containerWidth / pageWidth;
    const scaleH = containerHeight / pageHeight;
    const scale = Math.min(scaleW, scaleH, 2);

    this.setScale(scale);
  }

  /**
   * 切换侧边栏
   */
  toggleSidebar(): void {
    if (this.sidebarElement) {
      const isVisible = this.sidebarElement.style.display !== 'none';
      this.sidebarElement.style.display = isVisible ? 'none' : 'block';
    }
  }

  /**
   * 显示侧边栏
   */
  showSidebar(): void {
    if (this.sidebarElement) {
      this.sidebarElement.style.display = 'block';
    }
  }

  /**
   * 隐藏侧边栏
   */
  hideSidebar(): void {
    if (this.sidebarElement) {
      this.sidebarElement.style.display = 'none';
    }
  }

  /**
   * 循环切换主题
   */
  cycleTheme(): void {
    const themes = ['light', 'dark', 'sepia'] as const;
    const currentTheme = this.renderer.getTheme();
    const currentIndex = themes.findIndex(t => t === currentTheme.name);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextThemeName = themes[nextIndex];

    if (nextThemeName) {
      this.setTheme(nextThemeName);
    }
  }

  /**
   * 设置主题
   */
  setTheme(theme: 'light' | 'dark' | 'sepia' | ThemeConfig): void {
    const themeConfig = this.getTheme(theme);
    this.renderer.setTheme(themeConfig);
  }

  /**
   * 打印
   */
  print(options?: PrintOptions): void {
    this.printManager.print(options);
  }

  /**
   * 打印预览
   */
  printPreview(): void {
    this.printManager.printPreview();
  }

  /**
   * 获取目录
   */
  getToc(): TocItem[] {
    return this.tocManager.getToc();
  }

  /**
   * 导航到指定标题
   */
  navigateToHeading(anchor: string): void {
    this.tocManager.navigateToHeading(anchor);
  }

  /**
   * 跳转到指定页
   */
  goToPage(page: number): void {
    this.renderer.goToPage(page);
    this.updatePageInfo();
  }

  /**
   * 获取当前页码
   */
  getCurrentPage(): number {
    return this.renderer.getCurrentPage();
  }

  /**
   * 获取总页数
   */
  getTotalPages(): number {
    return this.renderer.getTotalPages();
  }

  /**
   * 获取文档对象
   */
  getDocument(): WordDocument | null {
    return this.document;
  }

  /**
   * 订阅事件
   */
  on<T extends EventData>(type: EventType, handler: (event: T) => void): () => void {
    return this.eventEmitter.on(type, handler);
  }

  /**
   * 取消订阅事件
   */
  off(type: EventType, handler?: (event: EventData) => void): void {
    this.eventEmitter.off(type, handler);
  }

  /**
   * 更新缩放标签
   */
  private updateZoomLabel(): void {
    const label = this.toolbarElement?.querySelector(`.${this.classPrefix}-zoom-label`);
    if (label) {
      label.textContent = `${Math.round(this.renderer.getScale() * 100)}%`;
    }
  }

  /**
   * 更新页码信息
   */
  private updatePageInfo(): void {
    const pageInfo = this.statusBarElement?.querySelector(`.${this.classPrefix}-page-info`);
    if (pageInfo) {
      pageInfo.textContent = `第 ${this.renderer.getCurrentPage()} 页，共 ${this.renderer.getTotalPages()} 页`;
    }
  }

  /**
   * 更新状态信息
   */
  private updateStatus(text: string): void {
    const status = this.statusBarElement?.querySelector(`.${this.classPrefix}-status`);
    if (status) {
      status.textContent = text;
    }
  }

  /**
   * 销毁查看器
   */
  destroy(): void {
    this.searchManager.destroy();
    this.tocManager.destroy();
    this.printManager.destroy();
    this.exportManager.destroy();
    this.thumbnailManager.destroy();
    this.viewModeManager.destroy();
    this.selectionManager.destroy();
    this.bookmarkManager.destroy();
    this.commentManager.destroy();
    this.footnoteManager.destroy();
    this.annotationManager.destroy();
    this.virtualScrollRenderer.destroy();
    this.renderer.destroy();
    this.eventEmitter.removeAllListeners();

    if (this.rootElement && this.rootElement.parentNode) {
      this.rootElement.parentNode.removeChild(this.rootElement);
    }

    this.document = null;
    this.rootElement = null;
    this.toolbarElement = null;
    this.sidebarElement = null;
    this.contentElement = null;
    this.statusBarElement = null;
  }

  // ==================== 新增功能方法 ====================

  /**
   * 导出为 PDF
   */
  async exportToPdf(filename?: string): Promise<void> {
    await this.exportManager.exportToPdf({ filename });
  }

  /**
   * 导出为图片
   */
  async exportToImage(format: 'png' | 'jpeg' | 'webp' = 'png'): Promise<string[]> {
    return await this.exportManager.exportToImage({ format });
  }

  /**
   * 导出为 HTML
   */
  async exportToHtml(): Promise<string> {
    return await this.exportManager.exportToHtml();
  }

  /**
   * 导出为纯文本
   */
  async exportToText(): Promise<string> {
    return await this.exportManager.exportToText();
  }

  /**
   * 设置视图模式
   */
  setViewMode(mode: ViewMode): void {
    this.viewModeManager.setMode(mode);
  }

  /**
   * 获取视图模式
   */
  getViewMode(): ViewMode {
    return this.viewModeManager.getMode();
  }

  /**
   * 切换全屏
   */
  toggleFullscreen(): void {
    this.viewModeManager.toggleFullscreen();
  }

  /**
   * 进入演示模式
   */
  enterPresentationMode(): void {
    this.viewModeManager.setMode('presentation');
  }

  /**
   * 显示缩略图面板
   */
  showThumbnails(container: HTMLElement): HTMLElement {
    return this.thumbnailManager.renderPanel(container);
  }

  /**
   * 获取书签
   */
  getBookmarks(): BookmarkItem[] {
    return this.bookmarkManager.getAllBookmarks();
  }

  /**
   * 添加书签
   */
  addBookmark(name: string): BookmarkItem | null {
    return this.bookmarkManager.addBookmarkAtCurrentPosition(name);
  }

  /**
   * 导航到书签
   */
  navigateToBookmark(id: string): void {
    this.bookmarkManager.navigateToBookmark(id);
  }

  /**
   * 显示书签面板
   */
  showBookmarks(container: HTMLElement): HTMLElement {
    return this.bookmarkManager.renderPanel(container);
  }

  /**
   * 显示批注面板
   */
  showComments(container: HTMLElement): HTMLElement {
    return this.commentManager.renderPanel(container);
  }

  /**
   * 显示脚注面板
   */
  showFootnotes(container: HTMLElement): HTMLElement {
    return this.footnoteManager.renderPanel(container);
  }

  /**
   * 获取标注
   */
  getAnnotations(): AnnotationItem[] {
    return this.annotationManager.getAllAnnotations();
  }

  /**
   * 显示标注面板
   */
  showAnnotations(container: HTMLElement): HTMLElement {
    return this.annotationManager.renderPanel(container);
  }

  /**
   * 导出标注
   */
  exportAnnotations(): string {
    return this.annotationManager.exportAnnotations();
  }

  /**
   * 导入标注
   */
  importAnnotations(json: string): void {
    this.annotationManager.importAnnotations(json);
  }

  /**
   * 切换虚拟滚动
   */
  setVirtualScrollEnabled(enabled: boolean): void {
    this.virtualScrollRenderer.setEnabled(enabled);
  }

  /**
   * 获取选中文本
   */
  getSelectedText(): string | null {
    return this.selectionManager.getSelectedText();
  }

  /**
   * 复制选中内容
   */
  copySelection(): void {
    this.selectionManager.copyToClipboard();
  }
}
