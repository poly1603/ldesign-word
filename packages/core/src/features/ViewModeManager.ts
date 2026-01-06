import type { ViewMode, ViewModeConfig } from '../types';
import { EventEmitter } from '../events/EventEmitter';

/**
 * 视图模式管理器
 * 提供单页/双页/连续/演示等视图模式切换
 */
export class ViewModeManager {
  private container: HTMLElement | null = null;
  private eventEmitter: EventEmitter;
  private config: ViewModeConfig;
  private classPrefix = 'wv';
  private fullscreenElement: HTMLElement | null = null;

  constructor(eventEmitter: EventEmitter, config?: Partial<ViewModeConfig>) {
    this.eventEmitter = eventEmitter;
    this.config = {
      mode: 'continuous',
      fullscreen: false,
      pageGap: 20,
      showPageShadow: true,
      ...config
    };

    // 监听全屏变化
    document.addEventListener('fullscreenchange', this.handleFullscreenChange.bind(this));
    document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange.bind(this));
  }

  /**
   * 设置容器
   */
  setContainer(container: HTMLElement): void {
    this.container = container;
    this.applyMode();
  }

  /**
   * 获取当前模式
   */
  getMode(): ViewMode {
    return this.config.mode;
  }

  /**
   * 设置视图模式
   */
  setMode(mode: ViewMode): void {
    const previousMode = this.config.mode;
    if (previousMode === mode) return;

    this.config.mode = mode;
    this.applyMode();

    // 触发事件
    this.eventEmitter.emit('viewModeChange', {
      type: 'viewModeChange',
      timestamp: Date.now(),
      mode,
      previousMode
    });
  }

  /**
   * 应用当前模式
   */
  private applyMode(): void {
    if (!this.container) return;

    const wrapper = this.container.querySelector(`.${this.classPrefix}-document`) as HTMLElement;
    if (!wrapper) return;

    const pages = wrapper.querySelectorAll(`.${this.classPrefix}-page`);

    // 重置样式
    wrapper.style.display = '';
    wrapper.style.flexDirection = '';
    wrapper.style.flexWrap = '';
    wrapper.style.justifyContent = '';
    wrapper.style.alignItems = '';
    wrapper.style.gap = '';

    pages.forEach((page) => {
      const pageEl = page as HTMLElement;
      pageEl.style.display = '';
      pageEl.style.margin = '';
      pageEl.style.flex = '';
    });

    // 应用新模式
    switch (this.config.mode) {
      case 'single':
        this.applySingleMode(wrapper, pages);
        break;
      case 'double':
        this.applyDoubleMode(wrapper, pages);
        break;
      case 'continuous':
        this.applyContinuousMode(wrapper, pages);
        break;
      case 'presentation':
        this.applyPresentationMode(wrapper, pages);
        break;
    }
  }

  /**
   * 单页模式
   */
  private applySingleMode(wrapper: HTMLElement, pages: NodeListOf<Element>): void {
    Object.assign(wrapper.style, {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    });

    // 只显示当前页
    const currentPageIndex = this.getCurrentVisiblePageIndex(pages);

    pages.forEach((page, index) => {
      const pageEl = page as HTMLElement;
      if (index === currentPageIndex) {
        pageEl.style.display = 'block';
        pageEl.style.margin = `${this.config.pageGap}px auto`;
      } else {
        pageEl.style.display = 'none';
      }
    });
  }

  /**
   * 双页模式
   */
  private applyDoubleMode(wrapper: HTMLElement, pages: NodeListOf<Element>): void {
    Object.assign(wrapper.style, {
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'flex-start',
      gap: `${this.config.pageGap}px`
    });

    pages.forEach((page) => {
      const pageEl = page as HTMLElement;
      pageEl.style.display = 'block';
      pageEl.style.margin = '0';
      pageEl.style.flex = '0 0 auto';
      
      // 缩小页面以便两页并排显示
      const scale = 0.48;
      pageEl.style.transform = `scale(${scale})`;
      pageEl.style.transformOrigin = 'top center';
      pageEl.style.marginBottom = `-${pageEl.offsetHeight * (1 - scale)}px`;
    });
  }

  /**
   * 连续模式
   */
  private applyContinuousMode(wrapper: HTMLElement, pages: NodeListOf<Element>): void {
    Object.assign(wrapper.style, {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    });

    pages.forEach((page) => {
      const pageEl = page as HTMLElement;
      pageEl.style.display = 'block';
      pageEl.style.margin = `${this.config.pageGap}px auto`;
      pageEl.style.transform = '';
      pageEl.style.marginBottom = '';
    });
  }

  /**
   * 演示模式
   */
  private applyPresentationMode(wrapper: HTMLElement, pages: NodeListOf<Element>): void {
    Object.assign(wrapper.style, {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100%'
    });

    // 只显示当前页，并居中
    const currentPageIndex = this.getCurrentVisiblePageIndex(pages);

    pages.forEach((page, index) => {
      const pageEl = page as HTMLElement;
      if (index === currentPageIndex) {
        pageEl.style.display = 'block';
        pageEl.style.margin = 'auto';
        
        // 自动缩放以适应窗口
        if (this.container) {
          const containerWidth = this.container.clientWidth - 40;
          const containerHeight = this.container.clientHeight - 40;
          const pageWidth = pageEl.offsetWidth;
          const pageHeight = pageEl.offsetHeight;
          
          const scaleX = containerWidth / pageWidth;
          const scaleY = containerHeight / pageHeight;
          const scale = Math.min(scaleX, scaleY, 1);
          
          pageEl.style.transform = `scale(${scale})`;
          pageEl.style.transformOrigin = 'center center';
        }
      } else {
        pageEl.style.display = 'none';
      }
    });
  }

  /**
   * 获取当前可见页面索引
   */
  private getCurrentVisiblePageIndex(pages: NodeListOf<Element>): number {
    if (!this.container) return 0;

    const containerRect = this.container.getBoundingClientRect();
    const containerCenter = containerRect.top + containerRect.height / 2;

    let closestIndex = 0;
    let closestDistance = Infinity;

    pages.forEach((page, index) => {
      const pageRect = page.getBoundingClientRect();
      const pageCenter = pageRect.top + pageRect.height / 2;
      const distance = Math.abs(pageCenter - containerCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  }

  /**
   * 切换到下一模式
   */
  cycleMode(): void {
    const modes: ViewMode[] = ['single', 'double', 'continuous', 'presentation'];
    const currentIndex = modes.indexOf(this.config.mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    const nextMode = modes[nextIndex];
    if (nextMode) {
      this.setMode(nextMode);
    }
  }

  /**
   * 进入全屏
   */
  async enterFullscreen(): Promise<void> {
    if (!this.container) return;

    try {
      if (this.container.requestFullscreen) {
        await this.container.requestFullscreen();
      } else if ((this.container as any).webkitRequestFullscreen) {
        await (this.container as any).webkitRequestFullscreen();
      }
      
      this.fullscreenElement = this.container;
      this.config.fullscreen = true;
      
      // 应用全屏样式
      this.applyFullscreenStyles(true);
    } catch (error) {
      console.error('进入全屏失败:', error);
    }
  }

  /**
   * 退出全屏
   */
  async exitFullscreen(): Promise<void> {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      }
    } catch (error) {
      console.error('退出全屏失败:', error);
    }
  }

  /**
   * 切换全屏
   */
  async toggleFullscreen(): Promise<void> {
    if (this.isFullscreen()) {
      await this.exitFullscreen();
    } else {
      await this.enterFullscreen();
    }
  }

  /**
   * 是否处于全屏
   */
  isFullscreen(): boolean {
    return !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
  }

  /**
   * 处理全屏变化
   */
  private handleFullscreenChange(): void {
    const isFullscreen = this.isFullscreen();
    this.config.fullscreen = isFullscreen;
    
    this.applyFullscreenStyles(isFullscreen);

    // 触发事件
    this.eventEmitter.emit('fullscreenChange', {
      type: 'fullscreenChange',
      timestamp: Date.now(),
      isFullscreen
    });

    // 如果是演示模式，重新应用
    if (this.config.mode === 'presentation') {
      this.applyMode();
    }
  }

  /**
   * 应用全屏样式
   */
  private applyFullscreenStyles(isFullscreen: boolean): void {
    if (!this.container) return;

    if (isFullscreen) {
      Object.assign(this.container.style, {
        backgroundColor: '#1e1e1e',
        padding: '20px'
      });
    } else {
      this.container.style.backgroundColor = '';
      this.container.style.padding = '';
    }
  }

  /**
   * 上一页（单页/演示模式）
   */
  previousPage(): void {
    if (this.config.mode !== 'single' && this.config.mode !== 'presentation') return;
    if (!this.container) return;

    const wrapper = this.container.querySelector(`.${this.classPrefix}-document`) as HTMLElement;
    if (!wrapper) return;

    const pages = wrapper.querySelectorAll(`.${this.classPrefix}-page`);
    const currentIndex = this.getCurrentVisiblePageIndex(pages);

    if (currentIndex > 0) {
      this.goToPage(currentIndex - 1);
    }
  }

  /**
   * 下一页（单页/演示模式）
   */
  nextPage(): void {
    if (this.config.mode !== 'single' && this.config.mode !== 'presentation') return;
    if (!this.container) return;

    const wrapper = this.container.querySelector(`.${this.classPrefix}-document`) as HTMLElement;
    if (!wrapper) return;

    const pages = wrapper.querySelectorAll(`.${this.classPrefix}-page`);
    const currentIndex = this.getCurrentVisiblePageIndex(pages);

    if (currentIndex < pages.length - 1) {
      this.goToPage(currentIndex + 1);
    }
  }

  /**
   * 跳转到指定页
   */
  goToPage(pageIndex: number): void {
    if (!this.container) return;

    const wrapper = this.container.querySelector(`.${this.classPrefix}-document`) as HTMLElement;
    if (!wrapper) return;

    const pages = wrapper.querySelectorAll(`.${this.classPrefix}-page`);
    if (pageIndex < 0 || pageIndex >= pages.length) return;

    if (this.config.mode === 'single' || this.config.mode === 'presentation') {
      // 重新应用模式以显示新页面
      pages.forEach((page, index) => {
        const pageEl = page as HTMLElement;
        pageEl.style.display = index === pageIndex ? 'block' : 'none';
      });

      // 触发页面变化事件
      this.eventEmitter.emit('pageChange', {
        type: 'pageChange',
        timestamp: Date.now(),
        currentPage: pageIndex + 1,
        totalPages: pages.length
      });
    } else {
      // 连续/双页模式：滚动到指定页
      const targetPage = pages[pageIndex];
      if (targetPage) {
        targetPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  /**
   * 获取配置
   */
  getConfig(): ViewModeConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<ViewModeConfig>): void {
    Object.assign(this.config, config);
    this.applyMode();
  }

  /**
   * 销毁
   */
  destroy(): void {
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange.bind(this));
    document.removeEventListener('webkitfullscreenchange', this.handleFullscreenChange.bind(this));
    
    this.container = null;
    this.fullscreenElement = null;
  }
}
