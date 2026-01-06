import { EventEmitter } from '../events/EventEmitter';

/**
 * 页面项
 */
interface PageItem {
  index: number;
  element: HTMLElement;
  height: number;
  top: number;
  rendered: boolean;
}

/**
 * 虚拟滚动配置
 */
interface VirtualScrollConfig {
  /** 缓冲区页数 */
  bufferPages: number;
  /** 预加载阈值（像素） */
  preloadThreshold: number;
  /** 是否启用 */
  enabled: boolean;
  /** 占位符高度 */
  placeholderHeight: number;
}

/**
 * 虚拟滚动渲染器
 * 优化大文档的渲染性能，通过只渲染可见区域的内容
 */
export class VirtualScrollRenderer {
  private container: HTMLElement | null = null;
  private contentContainer: HTMLElement | null = null;
  private eventEmitter: EventEmitter;
  private pages: PageItem[] = [];
  private visibleRange = { start: 0, end: 0 };
  private scrollHandler: (() => void) | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private classPrefix = 'wv';
  private totalHeight = 0;
  private config: VirtualScrollConfig = {
    bufferPages: 2,
    preloadThreshold: 200,
    enabled: true,
    placeholderHeight: 1122 // A4 高度近似值
  };

  constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter;
  }

  /**
   * 设置配置
   */
  setConfig(config: Partial<VirtualScrollConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 初始化
   */
  initialize(container: HTMLElement): void {
    this.container = container;
    this.setupScrollListener();
    this.setupResizeObserver();
    this.collectPages();
    this.calculateLayout();
    this.updateVisiblePages();
  }

  /**
   * 收集页面
   */
  private collectPages(): void {
    if (!this.container) return;

    const pageElements = this.container.querySelectorAll(`.${this.classPrefix}-page`);
    this.pages = [];

    pageElements.forEach((element, index) => {
      const el = element as HTMLElement;
      this.pages.push({
        index,
        element: el,
        height: el.offsetHeight || this.config.placeholderHeight,
        top: 0,
        rendered: true
      });
    });

    // 创建内容容器
    if (!this.contentContainer) {
      this.contentContainer = document.createElement('div');
      this.contentContainer.className = `${this.classPrefix}-virtual-content`;
      this.contentContainer.style.position = 'relative';
      
      // 移动页面到内容容器
      pageElements.forEach((element) => {
        this.contentContainer!.appendChild(element);
      });

      this.container.appendChild(this.contentContainer);
    }
  }

  /**
   * 计算布局
   */
  private calculateLayout(): void {
    let currentTop = 0;
    const gap = 20; // 页面间距

    for (const page of this.pages) {
      page.top = currentTop;
      currentTop += page.height + gap;
    }

    this.totalHeight = currentTop - gap;

    if (this.contentContainer) {
      this.contentContainer.style.height = `${this.totalHeight}px`;
    }
  }

  /**
   * 设置滚动监听
   */
  private setupScrollListener(): void {
    if (!this.container) return;

    this.scrollHandler = this.throttle(() => {
      this.updateVisiblePages();
    }, 16); // ~60fps

    this.container.addEventListener('scroll', this.scrollHandler, { passive: true });
  }

  /**
   * 设置大小变化监听
   */
  private setupResizeObserver(): void {
    if (!this.container) return;

    this.resizeObserver = new ResizeObserver(() => {
      this.calculateLayout();
      this.updateVisiblePages();
    });

    this.resizeObserver.observe(this.container);
  }

  /**
   * 更新可见页面
   */
  private updateVisiblePages(): void {
    if (!this.container || !this.config.enabled) return;

    const scrollTop = this.container.scrollTop;
    const viewportHeight = this.container.clientHeight;
    const threshold = this.config.preloadThreshold;

    // 计算可见范围
    const visibleStart = scrollTop - threshold;
    const visibleEnd = scrollTop + viewportHeight + threshold;

    // 找到可见的页面
    let startIndex = -1;
    let endIndex = -1;

    for (let i = 0; i < this.pages.length; i++) {
      const page = this.pages[i];
      const pageBottom = page.top + page.height;

      if (pageBottom >= visibleStart && startIndex === -1) {
        startIndex = i;
      }

      if (page.top <= visibleEnd) {
        endIndex = i;
      }
    }

    // 应用缓冲区
    startIndex = Math.max(0, startIndex - this.config.bufferPages);
    endIndex = Math.min(this.pages.length - 1, endIndex + this.config.bufferPages);

    // 检查是否需要更新
    if (startIndex === this.visibleRange.start && endIndex === this.visibleRange.end) {
      return;
    }

    this.visibleRange = { start: startIndex, end: endIndex };
    this.renderVisiblePages();

    // 触发事件
    this.eventEmitter.emit('scroll', {
      type: 'scroll',
      timestamp: Date.now(),
      scrollTop,
      visibleRange: this.visibleRange
    });
  }

  /**
   * 渲染可见页面
   */
  private renderVisiblePages(): void {
    for (let i = 0; i < this.pages.length; i++) {
      const page = this.pages[i];
      const isVisible = i >= this.visibleRange.start && i <= this.visibleRange.end;

      if (isVisible && !page.rendered) {
        // 恢复页面内容
        this.showPage(page);
      } else if (!isVisible && page.rendered) {
        // 隐藏页面内容
        this.hidePage(page);
      }
    }
  }

  /**
   * 显示页面
   */
  private showPage(page: PageItem): void {
    const element = page.element;
    
    // 移除占位符
    const placeholder = element.querySelector(`.${this.classPrefix}-page-placeholder`);
    if (placeholder) {
      placeholder.remove();
    }

    // 恢复内容可见性
    const content = element.querySelector(`.${this.classPrefix}-page-content`);
    if (content) {
      (content as HTMLElement).style.display = '';
    }

    element.style.visibility = 'visible';
    page.rendered = true;
  }

  /**
   * 隐藏页面
   */
  private hidePage(page: PageItem): void {
    const element = page.element;

    // 保存内容引用（如果需要）
    const content = element.querySelector(`.${this.classPrefix}-page-content`);
    if (content) {
      (content as HTMLElement).style.display = 'none';
    }

    // 添加占位符保持高度
    if (!element.querySelector(`.${this.classPrefix}-page-placeholder`)) {
      const placeholder = document.createElement('div');
      placeholder.className = `${this.classPrefix}-page-placeholder`;
      Object.assign(placeholder.style, {
        height: `${page.height}px`,
        backgroundColor: '#f5f5f5'
      });
      element.appendChild(placeholder);
    }

    element.style.visibility = 'hidden';
    page.rendered = false;
  }

  /**
   * 滚动到页面
   */
  scrollToPage(pageIndex: number, behavior: ScrollBehavior = 'smooth'): void {
    if (!this.container || pageIndex < 0 || pageIndex >= this.pages.length) return;

    const page = this.pages[pageIndex];
    
    this.container.scrollTo({
      top: page.top,
      behavior
    });
  }

  /**
   * 获取当前可见页面
   */
  getVisiblePages(): number[] {
    const result: number[] = [];
    
    for (let i = this.visibleRange.start; i <= this.visibleRange.end; i++) {
      result.push(i);
    }
    
    return result;
  }

  /**
   * 获取当前页面（视口中心）
   */
  getCurrentPage(): number {
    if (!this.container) return 0;

    const scrollTop = this.container.scrollTop;
    const viewportCenter = scrollTop + this.container.clientHeight / 2;

    for (let i = 0; i < this.pages.length; i++) {
      const page = this.pages[i];
      if (viewportCenter >= page.top && viewportCenter < page.top + page.height) {
        return i;
      }
    }

    return 0;
  }

  /**
   * 刷新布局
   */
  refresh(): void {
    // 重新收集页面高度
    for (const page of this.pages) {
      if (page.rendered) {
        page.height = page.element.offsetHeight || this.config.placeholderHeight;
      }
    }

    this.calculateLayout();
    this.updateVisiblePages();
  }

  /**
   * 添加页面
   */
  addPage(element: HTMLElement): void {
    const index = this.pages.length;
    
    this.pages.push({
      index,
      element,
      height: element.offsetHeight || this.config.placeholderHeight,
      top: 0,
      rendered: true
    });

    if (this.contentContainer) {
      this.contentContainer.appendChild(element);
    }

    this.calculateLayout();
    this.updateVisiblePages();
  }

  /**
   * 移除页面
   */
  removePage(index: number): void {
    if (index < 0 || index >= this.pages.length) return;

    const page = this.pages[index];
    page.element.remove();
    
    this.pages.splice(index, 1);

    // 更新索引
    for (let i = index; i < this.pages.length; i++) {
      this.pages[i].index = i;
    }

    this.calculateLayout();
    this.updateVisiblePages();
  }

  /**
   * 启用/禁用虚拟滚动
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;

    if (enabled) {
      this.updateVisiblePages();
    } else {
      // 显示所有页面
      for (const page of this.pages) {
        if (!page.rendered) {
          this.showPage(page);
        }
      }
    }
  }

  /**
   * 获取总页数
   */
  getPageCount(): number {
    return this.pages.length;
  }

  /**
   * 获取页面信息
   */
  getPageInfo(index: number): { top: number; height: number } | null {
    const page = this.pages[index];
    if (!page) return null;

    return {
      top: page.top,
      height: page.height
    };
  }

  /**
   * 节流函数
   */
  private throttle<T extends (...args: any[]) => void>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let lastCall = 0;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    return function (this: any, ...args: Parameters<T>) {
      const now = Date.now();

      if (now - lastCall >= limit) {
        lastCall = now;
        func.apply(this, args);
      } else {
        if (timeout) {
          clearTimeout(timeout);
        }
        timeout = setTimeout(() => {
          lastCall = Date.now();
          func.apply(this, args);
        }, limit - (now - lastCall));
      }
    };
  }

  /**
   * 销毁
   */
  destroy(): void {
    // 移除事件监听
    if (this.container && this.scrollHandler) {
      this.container.removeEventListener('scroll', this.scrollHandler);
    }

    // 移除大小监听
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    // 恢复所有页面
    for (const page of this.pages) {
      if (!page.rendered) {
        this.showPage(page);
      }
    }

    this.pages = [];
    this.container = null;
    this.contentContainer = null;
  }
}
