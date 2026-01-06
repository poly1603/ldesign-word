import { Icons, createIconElement } from '../utils/icons';

export interface ToolbarOptions {
  /** 工具栏容器元素 */
  container: HTMLElement;
  /** 文档内容容器（用于查找页面、应用水印等） */
  documentContainer?: HTMLElement;
  /** CSS 类前缀 */
  classPrefix?: string;
  /** 是否启用打印 */
  enablePrint?: boolean;
  /** 是否启用下载 */
  enableDownload?: boolean;
  /** 是否启用全屏 */
  enableFullscreen?: boolean;
  /** 是否启用缩放 */
  enableZoom?: boolean;
  /** 是否启用页码 */
  enablePageNumber?: boolean;
  /** 是否启用水印 */
  enableWatermark?: boolean;
  /** 水印文字 */
  watermarkText?: string;
  /** 当前缩放比例 */
  initialScale?: number;
}

export interface ToolbarCallbacks {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  onPrint?: () => void;
  onDownload?: () => void;
  onFullscreen?: () => void;
  onPageChange?: (page: number) => void;
}

/**
 * 文档工具栏
 * 提供常用的文档操作功能
 */
export class Toolbar {
  private container: HTMLElement;
  private documentContainer: HTMLElement | null = null;
  private options: Required<ToolbarOptions>;
  private callbacks: ToolbarCallbacks = {};
  private toolbarElement: HTMLElement | null = null;
  private zoomLabel: HTMLElement | null = null;
  private pageInput: HTMLInputElement | null = null;
  private totalPagesLabel: HTMLElement | null = null;
  private currentScale = 100;
  private currentPage = 1;
  private totalPages = 1;
  private classPrefix: string;
  private watermarkElement: HTMLElement | null = null;
  private printStyleElement: HTMLStyleElement | null = null;

  constructor(options: ToolbarOptions) {
    this.container = options.container;
    this.documentContainer = options.documentContainer || null;
    this.classPrefix = options.classPrefix || 'wv';
    this.options = {
      container: options.container,
      documentContainer: options.documentContainer || options.container,
      classPrefix: this.classPrefix,
      enablePrint: options.enablePrint ?? true,
      enableDownload: options.enableDownload ?? true,
      enableFullscreen: options.enableFullscreen ?? true,
      enableZoom: options.enableZoom ?? true,
      enablePageNumber: options.enablePageNumber ?? true,
      enableWatermark: options.enableWatermark ?? false,
      watermarkText: options.watermarkText ?? '',
      initialScale: options.initialScale ?? 100
    };
    this.currentScale = this.options.initialScale;

    // 添加打印样式
    this.addPrintStyles();
  }

  /**
   * 设置回调函数
   */
  setCallbacks(callbacks: ToolbarCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }


  /**
   * 渲染工具栏
   */
  render(): HTMLElement {
    this.toolbarElement = document.createElement('div');
    this.toolbarElement.className = `${this.classPrefix}-toolbar`;

    Object.assign(this.toolbarElement.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '8px 16px',
      backgroundColor: 'var(--bg-card, #ffffff)',
      borderBottom: '1px solid var(--border-color, #e5e7eb)',
      flexShrink: '0',
      height: '52px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    });

    // 缩放控制
    if (this.options.enableZoom) {
      this.addZoomControls(this.toolbarElement);
      this.addSeparator(this.toolbarElement);
    }

    // 页码导航
    if (this.options.enablePageNumber) {
      this.addPageNavigation(this.toolbarElement);
      this.addSeparator(this.toolbarElement);
    }

    // 弹性空间
    const spacer = document.createElement('div');
    spacer.style.flex = '1';
    this.toolbarElement.appendChild(spacer);

    // 水印按钮
    if (this.options.enableWatermark) {
      this.addButton(this.toolbarElement, Icons.type, '设置水印', () => {
        this.showWatermarkDialog();
      });
    }

    // 全屏按钮
    if (this.options.enableFullscreen) {
      this.addButton(this.toolbarElement, Icons.maximize, '全屏', () => {
        this.callbacks.onFullscreen?.();
        this.toggleFullscreen();
      });
    }

    // 打印按钮
    if (this.options.enablePrint) {
      this.addButton(this.toolbarElement, Icons.printer, '打印文档', () => {
        this.callbacks.onPrint?.();
        this.printContent();
      });
    }

    // 下载按钮
    if (this.options.enableDownload) {
      this.addButton(this.toolbarElement, Icons.download, '下载', () => {
        this.callbacks.onDownload?.();
      });
    }

    // 直接添加到容器
    this.container.appendChild(this.toolbarElement);

    // 初始化水印
    if (this.options.enableWatermark && this.options.watermarkText) {
      this.setWatermark(this.options.watermarkText);
    }

    return this.toolbarElement;
  }

  /**
   * 添加打印样式
   */
  private addPrintStyles(): void {
    if (this.printStyleElement) return;

    this.printStyleElement = document.createElement('style');
    this.printStyleElement.textContent = `
      @media print {
        body * {
          visibility: hidden;
        }
        .${this.classPrefix}-toolbar,
        .sidebar {
          display: none !important;
        }
        .docx-wrapper,
        .docx-wrapper * {
          visibility: visible !important;
        }
        .docx-wrapper {
          position: absolute;
          left: 0;
          top: 0;
          width: 100% !important;
          transform: none !important;
        }
        .docx-wrapper > section.docx {
          margin: 0 !important;
          box-shadow: none !important;
        }
        .${this.classPrefix}-watermark {
          display: none !important;
        }
        .${this.classPrefix}-page-number {
          display: block !important;
        }
      }
    `;
    document.head.appendChild(this.printStyleElement);
  }

  /**
   * 添加缩放控制
   */
  private addZoomControls(parent: HTMLElement): void {
    this.addButton(parent, Icons.zoomOut, '缩小', () => {
      this.zoomOut();
      this.callbacks.onZoomOut?.();
    });

    this.zoomLabel = document.createElement('span');
    this.zoomLabel.className = `${this.classPrefix}-zoom-label`;
    this.zoomLabel.textContent = `${this.currentScale}%`;
    Object.assign(this.zoomLabel.style, {
      minWidth: '56px',
      height: '32px',
      lineHeight: '32px',
      textAlign: 'center',
      fontSize: '13px',
      fontWeight: '500',
      color: 'var(--text-secondary, #374151)',
      background: 'var(--bg-primary, #ffffff)',
      border: '1px solid var(--border-color, #e5e7eb)',
      borderRadius: '6px',
      userSelect: 'none',
      cursor: 'pointer',
      transition: 'all 0.15s ease'
    });
    this.zoomLabel.title = '点击重置为 100%';
    this.zoomLabel.addEventListener('click', () => {
      this.setScale(100);
      this.callbacks.onZoomReset?.();
    });
    parent.appendChild(this.zoomLabel);

    this.addButton(parent, Icons.zoomIn, '放大', () => {
      this.zoomIn();
      this.callbacks.onZoomIn?.();
    });
  }

  /**
   * 添加页码导航
   */
  private addPageNavigation(parent: HTMLElement): void {
    // 上一页
    this.addButton(parent, Icons.chevronLeft, '上一页', () => {
      this.goToPage(this.currentPage - 1);
    });

    // 页码输入
    this.pageInput = document.createElement('input');
    this.pageInput.type = 'text';
    this.pageInput.value = '1';
    this.pageInput.className = `${this.classPrefix}-page-input`;
    Object.assign(this.pageInput.style, {
      width: '44px',
      height: '32px',
      textAlign: 'center',
      border: '1px solid var(--border-color, #e5e7eb)',
      borderRadius: '6px',
      fontSize: '13px',
      fontWeight: '500',
      color: 'var(--text-primary, #111827)',
      background: 'var(--bg-primary, #ffffff)',
      outline: 'none',
      transition: 'all 0.15s ease'
    });
    this.pageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const page = parseInt(this.pageInput!.value, 10);
        if (!isNaN(page)) {
          this.goToPage(page);
        }
      }
    });
    this.pageInput.addEventListener('focus', () => {
      this.pageInput!.select();
    });
    parent.appendChild(this.pageInput);

    // 总页数
    const slash = document.createElement('span');
    slash.textContent = ' / ';
    slash.style.color = 'var(--text-muted, #6b7280)';
    slash.style.fontSize = '13px';
    parent.appendChild(slash);

    this.totalPagesLabel = document.createElement('span');
    this.totalPagesLabel.textContent = '1';
    this.totalPagesLabel.style.color = 'var(--text-secondary, #374151)';
    this.totalPagesLabel.style.fontSize = '13px';
    parent.appendChild(this.totalPagesLabel);

    // 下一页
    this.addButton(parent, Icons.chevronRight, '下一页', () => {
      this.goToPage(this.currentPage + 1);
    });
  }

  /**
   * 添加按钮
   */
  private addButton(
    parent: HTMLElement,
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
      width: '36px',
      height: '36px',
      border: 'none',
      borderRadius: '8px',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      color: 'var(--text-tertiary, #6b7280)',
      transition: 'all 0.15s ease'
    });

    btn.addEventListener('mouseenter', () => {
      btn.style.backgroundColor = 'var(--bg-tertiary, #f3f4f6)';
      btn.style.color = 'var(--text-primary, #111827)';
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.backgroundColor = 'transparent';
      btn.style.color = 'var(--text-tertiary, #6b7280)';
    });

    btn.addEventListener('click', onClick);
    parent.appendChild(btn);

    return btn;
  }

  /**
   * 添加分隔符
   */
  private addSeparator(parent: HTMLElement): void {
    const sep = document.createElement('div');
    Object.assign(sep.style, {
      width: '1px',
      height: '24px',
      backgroundColor: 'var(--border-color, #e5e7eb)',
      margin: '0 12px'
    });
    parent.appendChild(sep);
  }

  /**
   * 放大
   */
  zoomIn(): void {
    this.setScale(Math.min(this.currentScale + 10, 200));
  }

  /**
   * 缩小
   */
  zoomOut(): void {
    this.setScale(Math.max(this.currentScale - 10, 50));
  }

  /**
   * 设置缩放比例
   */
  setScale(scale: number): void {
    this.currentScale = scale;
    if (this.zoomLabel) {
      this.zoomLabel.textContent = `${scale}%`;
    }

    const docContainer = this.getDocContainer();
    const docWrapper = docContainer.querySelector('.docx-wrapper') as HTMLElement;
    if (docWrapper) {
      docWrapper.style.transform = `scale(${scale / 100})`;
      docWrapper.style.transformOrigin = 'top center';
    }
  }

  /**
   * 获取当前缩放比例
   */
  getScale(): number {
    return this.currentScale;
  }

  /**
   * 设置文档容器
   */
  setDocumentContainer(container: HTMLElement): void {
    this.documentContainer = container;
  }

  /**
   * 获取文档容器
   */
  private getDocContainer(): HTMLElement {
    return this.documentContainer || this.container;
  }

  /**
   * 更新页数
   */
  updatePageCount(): void {
    const docContainer = this.getDocContainer();
    const pages = docContainer.querySelectorAll('.docx-wrapper > section.docx');
    this.totalPages = pages.length || 1;
    if (this.totalPagesLabel) {
      this.totalPagesLabel.textContent = String(this.totalPages);
    }

    // 添加页码到每一页
    if (this.options.enablePageNumber) {
      this.addPageNumbers();
    }
  }

  /**
   * 添加页码
   */
  private addPageNumbers(): void {
    const docContainer = this.getDocContainer();
    const pages = docContainer.querySelectorAll('.docx-wrapper > section.docx');
    pages.forEach((page, index) => {
      // 移除旧的页码
      const oldPageNum = page.querySelector(`.${this.classPrefix}-page-number`);
      if (oldPageNum) oldPageNum.remove();

      const pageNum = document.createElement('div');
      pageNum.className = `${this.classPrefix}-page-number`;
      pageNum.textContent = `${index + 1} / ${pages.length}`;
      Object.assign(pageNum.style, {
        position: 'absolute',
        bottom: '20px',
        right: '30px',
        fontSize: '12px',
        color: '#6b7280',
        fontFamily: 'Arial, sans-serif'
      });

      // 确保页面有相对定位
      (page as HTMLElement).style.position = 'relative';
      page.appendChild(pageNum);
    });
  }

  /**
   * 跳转到指定页
   */
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;

    this.currentPage = page;
    if (this.pageInput) {
      this.pageInput.value = String(page);
    }

    const docContainer = this.getDocContainer();
    const pages = docContainer.querySelectorAll('.docx-wrapper > section.docx');
    const targetPage = pages[page - 1];
    if (targetPage) {
      targetPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    this.callbacks.onPageChange?.(page);
  }

  /**
   * 切换全屏
   */
  private toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      this.container.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  /**
   * 打印内容（只打印文档区域）
   */
  private printContent(): void {
    window.print();
  }

  /**
   * 设置水印
   */
  setWatermark(text: string): void {
    if (!text) {
      this.removeWatermark();
      return;
    }

    if (!this.watermarkElement) {
      this.watermarkElement = document.createElement('div');
      this.watermarkElement.className = `${this.classPrefix}-watermark`;
      Object.assign(this.watermarkElement.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: '1000',
        overflow: 'hidden'
      });
    }

    // 生成水印 canvas - 整齐的网格布局
    const canvas = document.createElement('canvas');
    const cellWidth = 200;
    const cellHeight = 120;
    canvas.width = cellWidth;
    canvas.height = cellHeight;
    const ctx = canvas.getContext('2d')!;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 设置水印样式
    ctx.font = '14px Arial, sans-serif';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 在单元格中心绘制倾斜的水印
    ctx.save();
    ctx.translate(cellWidth / 2, cellHeight / 2);
    ctx.rotate(-25 * Math.PI / 180);
    ctx.fillText(text, 0, 0);
    ctx.restore();

    this.watermarkElement.style.backgroundImage = `url(${canvas.toDataURL()})`;
    this.watermarkElement.style.backgroundRepeat = 'repeat';
    this.watermarkElement.style.backgroundSize = `${cellWidth}px ${cellHeight}px`;

    // 添加到文档容器
    const docContainer = this.getDocContainer();
    const docWrapper = docContainer.querySelector('.docx-wrapper') as HTMLElement;
    if (docWrapper) {
      docWrapper.style.position = 'relative';
      docWrapper.appendChild(this.watermarkElement);
    }
  }

  /**
   * 移除水印
   */
  removeWatermark(): void {
    if (this.watermarkElement) {
      this.watermarkElement.remove();
      this.watermarkElement = null;
    }
  }

  /**
   * 显示水印设置对话框
   */
  private showWatermarkDialog(): void {
    const text = prompt('请输入水印文字（留空则移除水印）：', '');
    if (text !== null) {
      this.setWatermark(text);
    }
  }

  /**
   * 销毁工具栏
   */
  destroy(): void {
    if (this.toolbarElement) {
      this.toolbarElement.remove();
      this.toolbarElement = null;
    }
    if (this.printStyleElement) {
      this.printStyleElement.remove();
      this.printStyleElement = null;
    }
    this.removeWatermark();
  }
}
