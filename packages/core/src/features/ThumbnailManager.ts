import type { WordDocument, ThumbnailConfig, ThumbnailItem } from '../types';
import { EventEmitter } from '../events/EventEmitter';
import { Icons, createIconElement } from '../utils/icons';

/**
 * 缩略图管理器
 * 提供页面缩略图生成和导航功能
 */
export class ThumbnailManager {
  private document: WordDocument | null = null;
  private container: HTMLElement | null = null;
  private eventEmitter: EventEmitter;
  private config: ThumbnailConfig;
  private thumbnails: ThumbnailItem[] = [];
  private panelElement: HTMLElement | null = null;
  private currentPage = 0;
  private classPrefix = 'wv';
  private observer: IntersectionObserver | null = null;

  constructor(eventEmitter: EventEmitter, config?: Partial<ThumbnailConfig>) {
    this.eventEmitter = eventEmitter;
    this.config = {
      width: 150,
      quality: 0.6,
      showPageNumber: true,
      lazyLoad: true,
      ...config
    };
  }

  /**
   * 设置文档
   */
  setDocument(document: WordDocument, container: HTMLElement): void {
    this.document = document;
    this.container = container;
    this.thumbnails = [];
    this.currentPage = 0;
  }

  /**
   * 渲染缩略图面板
   */
  renderPanel(targetContainer: HTMLElement): HTMLElement {
    // 创建面板容器
    const panel = document.createElement('div');
    panel.className = `${this.classPrefix}-thumbnail-panel`;

    Object.assign(panel.style, {
      width: '100%',
      height: '100%',
      overflow: 'auto',
      padding: '12px',
      boxSizing: 'border-box',
      backgroundColor: '#fafafa',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    });

    // 标题
    const header = document.createElement('div');
    header.className = `${this.classPrefix}-thumbnail-header`;
    Object.assign(header.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '8px'
    });

    const title = document.createElement('h3');
    title.textContent = '页面预览';
    Object.assign(title.style, {
      margin: '0',
      fontSize: '14px',
      fontWeight: '600',
      color: '#333'
    });

    header.appendChild(title);
    panel.appendChild(header);

    // 缩略图列表
    const list = document.createElement('div');
    list.className = `${this.classPrefix}-thumbnail-list`;
    Object.assign(list.style, {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      flex: '1',
      overflow: 'auto'
    });

    // 获取页面数量
    if (this.container) {
      const pages = this.container.querySelectorAll(`.${this.classPrefix}-page`);
      
      // 初始化缩略图数据
      this.thumbnails = Array.from({ length: pages.length }, (_, i) => ({
        pageIndex: i,
        generated: false
      }));

      // 创建缩略图项
      for (let i = 0; i < pages.length; i++) {
        const item = this.createThumbnailItem(i, pages[i] as HTMLElement);
        list.appendChild(item);
      }
    }

    panel.appendChild(list);

    // 设置懒加载观察器
    if (this.config.lazyLoad) {
      this.setupLazyLoad(list);
    }

    this.panelElement = panel;
    targetContainer.appendChild(panel);

    return panel;
  }

  /**
   * 创建缩略图项
   */
  private createThumbnailItem(index: number, pageElement: HTMLElement): HTMLElement {
    const item = document.createElement('div');
    item.className = `${this.classPrefix}-thumbnail-item`;
    item.dataset.pageIndex = index.toString();

    Object.assign(item.style, {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      cursor: 'pointer',
      padding: '8px',
      borderRadius: '8px',
      border: '2px solid transparent',
      transition: 'all 0.2s ease',
      backgroundColor: 'white',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    });

    // 缩略图容器
    const thumbContainer = document.createElement('div');
    thumbContainer.className = `${this.classPrefix}-thumbnail-image`;
    Object.assign(thumbContainer.style, {
      width: `${this.config.width}px`,
      aspectRatio: pageElement.offsetWidth / pageElement.offsetHeight + '',
      backgroundColor: '#f0f0f0',
      borderRadius: '4px',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative'
    });

    // 加载占位符
    const placeholder = document.createElement('div');
    placeholder.className = `${this.classPrefix}-thumbnail-placeholder`;
    Object.assign(placeholder.style, {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      color: '#999'
    });
    placeholder.appendChild(createIconElement(Icons.fileText, { size: 24 }));
    
    const loadingText = document.createElement('span');
    loadingText.textContent = '加载中...';
    loadingText.style.fontSize = '12px';
    placeholder.appendChild(loadingText);
    
    thumbContainer.appendChild(placeholder);
    item.appendChild(thumbContainer);

    // 页码标签
    if (this.config.showPageNumber) {
      const pageLabel = document.createElement('span');
      pageLabel.className = `${this.classPrefix}-thumbnail-label`;
      pageLabel.textContent = `第 ${index + 1} 页`;
      Object.assign(pageLabel.style, {
        marginTop: '6px',
        fontSize: '12px',
        color: '#666'
      });
      item.appendChild(pageLabel);
    }

    // 悬停效果
    item.addEventListener('mouseenter', () => {
      if (!item.classList.contains('active')) {
        item.style.backgroundColor = '#f5f5f5';
        item.style.borderColor = '#e0e0e0';
      }
    });

    item.addEventListener('mouseleave', () => {
      if (!item.classList.contains('active')) {
        item.style.backgroundColor = 'white';
        item.style.borderColor = 'transparent';
      }
    });

    // 点击跳转
    item.addEventListener('click', () => {
      this.goToPage(index);
    });

    return item;
  }

  /**
   * 设置懒加载
   */
  private setupLazyLoad(list: HTMLElement): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const item = entry.target as HTMLElement;
            const pageIndex = parseInt(item.dataset.pageIndex || '0', 10);
            this.generateThumbnail(pageIndex, item);
            this.observer?.unobserve(item);
          }
        }
      },
      {
        root: list,
        rootMargin: '100px',
        threshold: 0.1
      }
    );

    // 观察所有缩略图项
    const items = list.querySelectorAll(`.${this.classPrefix}-thumbnail-item`);
    items.forEach((item) => this.observer?.observe(item));
  }

  /**
   * 生成缩略图
   */
  async generateThumbnail(pageIndex: number, itemElement: HTMLElement): Promise<void> {
    if (!this.container || this.thumbnails[pageIndex]?.generated) return;

    const pages = this.container.querySelectorAll(`.${this.classPrefix}-page`);
    const page = pages[pageIndex] as HTMLElement;
    if (!page) return;

    try {
      // 尝试使用 html2canvas
      let html2canvas = (window as any).html2canvas;
      
      if (!html2canvas) {
        try {
          const module = await import('html2canvas');
          html2canvas = module.default;
        } catch {
          // 使用简化方案
          this.generateSimpleThumbnail(pageIndex, page, itemElement);
          return;
        }
      }

      // 计算缩放比例
      const scale = (this.config.width || 150) / page.offsetWidth;

      const canvas = await html2canvas(page, {
        scale: scale * 2, // 高清缩略图
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      // 更新缩略图
      const thumbContainer = itemElement.querySelector(`.${this.classPrefix}-thumbnail-image`);
      if (thumbContainer) {
        thumbContainer.innerHTML = '';
        
        const img = document.createElement('img');
        img.src = canvas.toDataURL('image/jpeg', this.config.quality);
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        
        thumbContainer.appendChild(img);
      }

      // 更新状态
      if (this.thumbnails[pageIndex]) {
        this.thumbnails[pageIndex].generated = true;
        this.thumbnails[pageIndex].imageUrl = canvas.toDataURL('image/jpeg', this.config.quality);
      }

      // 触发事件
      this.eventEmitter.emit('thumbnailGenerate', {
        type: 'thumbnailGenerate',
        timestamp: Date.now(),
        pageIndex,
        imageUrl: this.thumbnails[pageIndex]?.imageUrl
      });

    } catch (error) {
      console.warn('生成缩略图失败:', error);
      this.generateSimpleThumbnail(pageIndex, page, itemElement);
    }
  }

  /**
   * 生成简化缩略图（不依赖 html2canvas）
   */
  private generateSimpleThumbnail(
    pageIndex: number,
    page: HTMLElement,
    itemElement: HTMLElement
  ): void {
    const thumbContainer = itemElement.querySelector(`.${this.classPrefix}-thumbnail-image`);
    if (!thumbContainer) return;

    // 清空占位符
    thumbContainer.innerHTML = '';

    // 创建简化预览
    const preview = document.createElement('div');
    Object.assign(preview.style, {
      width: '100%',
      height: '100%',
      padding: '8px',
      boxSizing: 'border-box',
      overflow: 'hidden',
      backgroundColor: 'white',
      fontSize: '4px',
      lineHeight: '1.5',
      color: '#666'
    });

    // 获取页面文本内容的前200个字符
    const text = page.textContent?.slice(0, 200) || '';
    preview.textContent = text;

    thumbContainer.appendChild(preview);

    if (this.thumbnails[pageIndex]) {
      this.thumbnails[pageIndex].generated = true;
    }
  }

  /**
   * 跳转到指定页
   */
  goToPage(pageIndex: number): void {
    if (!this.container) return;

    const pages = this.container.querySelectorAll(`.${this.classPrefix}-page`);
    const targetPage = pages[pageIndex];

    if (targetPage) {
      targetPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.setCurrentPage(pageIndex);
    }
  }

  /**
   * 设置当前页
   */
  setCurrentPage(pageIndex: number): void {
    if (this.currentPage === pageIndex) return;

    const previousPage = this.currentPage;
    this.currentPage = pageIndex;

    // 更新缩略图高亮
    this.updateActiveState();

    // 触发页面变化事件
    this.eventEmitter.emit('pageChange', {
      type: 'pageChange',
      timestamp: Date.now(),
      currentPage: pageIndex + 1,
      totalPages: this.thumbnails.length,
      previousPage: previousPage + 1
    });
  }

  /**
   * 更新激活状态
   */
  private updateActiveState(): void {
    if (!this.panelElement) return;

    const items = this.panelElement.querySelectorAll(`.${this.classPrefix}-thumbnail-item`);
    
    items.forEach((item, index) => {
      const htmlItem = item as HTMLElement;
      if (index === this.currentPage) {
        htmlItem.classList.add('active');
        htmlItem.style.borderColor = '#1976d2';
        htmlItem.style.backgroundColor = '#e3f2fd';
        
        // 滚动到可见位置
        htmlItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        htmlItem.classList.remove('active');
        htmlItem.style.borderColor = 'transparent';
        htmlItem.style.backgroundColor = 'white';
      }
    });
  }

  /**
   * 重新生成所有缩略图
   */
  async regenerateAll(): Promise<void> {
    if (!this.panelElement) return;

    // 重置状态
    this.thumbnails = this.thumbnails.map((t) => ({
      ...t,
      generated: false,
      imageUrl: undefined
    }));

    // 重新生成
    const items = this.panelElement.querySelectorAll(`.${this.classPrefix}-thumbnail-item`);
    for (let i = 0; i < items.length; i++) {
      await this.generateThumbnail(i, items[i] as HTMLElement);
    }
  }

  /**
   * 获取缩略图数据
   */
  getThumbnails(): ThumbnailItem[] {
    return [...this.thumbnails];
  }

  /**
   * 获取当前页
   */
  getCurrentPage(): number {
    return this.currentPage;
  }

  /**
   * 销毁
   */
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.panelElement && this.panelElement.parentNode) {
      this.panelElement.parentNode.removeChild(this.panelElement);
    }

    this.thumbnails = [];
    this.document = null;
    this.container = null;
    this.panelElement = null;
  }
}
