/**
 * 文档查看模块
 * 支持虚拟滚动、搜索优化和性能监控
 */

import { SearchResult, PageInfo } from '../core/types';
import { createElement, clearElement } from '../utils/dom';
import { ZOOM_RANGE } from '../core/constants';
import { rafThrottle, debounce } from '../utils/throttle';
import { LazyImageLoader } from '../utils/image';
import type { WordViewer } from '../core/WordViewer';

export class ViewerModule {
  private viewer: WordViewer;
  private container: HTMLElement | null = null;
  private contentElement: HTMLElement | null = null;
  private currentZoom: number = 1.0;
  private currentPage: number = 1;
  private totalPages: number = 1;
  private renderedContent: HTMLElement | null = null;

  // 虚拟滚动相关
  private virtualScrollEnabled: boolean = false;
  private visiblePages: Set<number> = new Set();
  private pageElements: Map<number, HTMLElement> = new Map();
  private scrollObserver: IntersectionObserver | null = null;

  // 图片懒加载
  private lazyImageLoader: LazyImageLoader | null = null;

  // 搜索索引缓存
  private searchIndex: Map<string, SearchResult[]> = new Map();
  private searchWorker: Worker | null = null;

  constructor(viewer: WordViewer) {
    this.viewer = viewer;
    this.initialize();
  }

  /**
   * 初始化查看器
   */
  private initialize(): void {
    const viewerContainer = this.viewer.getContainer();

    // 创建内容容器
    this.container = createElement('div', {
      className: 'viewer-container',
    });

    this.contentElement = createElement('div', {
      className: 'viewer-content',
    });

    this.container.appendChild(this.contentElement);
    viewerContainer.appendChild(this.container);

    // 应用初始缩放
    const options = this.viewer.getOptions();
    this.currentZoom = options.initialZoom;
    this.applyZoom();

    // 初始化虚拟滚动
    this.initializeVirtualScroll();

    // 初始化图片懒加载
    this.lazyImageLoader = new LazyImageLoader({
      root: this.container,
      rootMargin: '100px',
    });

    // 初始化搜索 Worker
    this.initializeSearchWorker();
  }

  /**
   * 初始化虚拟滚动
   */
  private initializeVirtualScroll(): void {
    if (!('IntersectionObserver' in window)) {
      console.warn('浏览器不支持 IntersectionObserver，禁用虚拟滚动');
      return;
    }

    this.virtualScrollEnabled = true;

    this.scrollObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const pageElement = entry.target as HTMLElement;
          const pageNumber = parseInt(pageElement.dataset.page || '0', 10);

          if (entry.isIntersecting) {
            this.visiblePages.add(pageNumber);
            this.renderPage(pageNumber);
          } else {
            this.visiblePages.delete(pageNumber);
            // 可选：移除不可见页面的内容以节省内存
            // this.unrenderPage(pageNumber);
          }
        });
      },
      {
        root: this.container,
        rootMargin: '200px', // 提前加载上下 200px 的内容
        threshold: 0.01,
      }
    );
  }

  /**
   * 初始化搜索 Worker
   */
  private initializeSearchWorker(): void {
    if (typeof Worker === 'undefined') {
      return;
    }

    try {
      const workerCode = `
        self.onmessage = (event) => {
          const { id, text, keyword } = event.data;
          const results = [];
          const lowerText = text.toLowerCase();
          const lowerKeyword = keyword.toLowerCase();
          
          let position = lowerText.indexOf(lowerKeyword);
          
          while (position !== -1) {
            const contextStart = Math.max(0, position - 50);
            const contextEnd = Math.min(text.length, position + keyword.length + 50);
            const context = text.substring(contextStart, contextEnd);
            
            results.push({
              position,
              text: text.substring(position, position + keyword.length),
              context: '...' + context + '...',
              pageNumber: 1,
            });
            
            position = lowerText.indexOf(lowerKeyword, position + keyword.length);
          }
          
          self.postMessage({ id, results });
        };
      `;

      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      this.searchWorker = new Worker(url);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.warn('无法创建搜索 Worker:', error);
    }
  }

  /**
   * 渲染页面
   */
  private renderPage(pageNumber: number): void {
    // 这里应该渲染特定页面的内容
    // 简化实现，实际应该从文档数据中获取该页的内容
  }

  /**
   * 取消渲染页面
   */
  private unrenderPage(pageNumber: number): void {
    const pageElement = this.pageElements.get(pageNumber);
    if (pageElement) {
      clearElement(pageElement);
    }
  }

  /**
   * 渲染文档
   */
  async render(buffer: ArrayBuffer): Promise<void> {
    if (!this.contentElement) {
      throw new Error('内容元素未初始化');
    }

    try {
      // 清空现有内容
      clearElement(this.contentElement);

      const options = this.viewer.getOptions();

      // 根据渲染引擎选择不同的渲染方式
      if (options.renderEngine === 'docx-preview' || options.renderEngine === 'auto') {
        await this.renderWithDocxPreview(buffer);
      } else if (options.renderEngine === 'mammoth') {
        await this.renderWithMammoth(buffer);
      }

      // 更新页面信息
      this.updatePageInfo();
    } catch (error) {
      console.error('渲染文档失败:', error);
      this.renderError(error instanceof Error ? error.message : '渲染失败');
      throw error;
    }
  }

  /**
   * 使用 docx-preview 渲染
   */
  private async renderWithDocxPreview(buffer: ArrayBuffer): Promise<void> {
    try {
      // 动态导入 docx-preview
      const { renderAsync } = await import('docx-preview');

      if (!this.contentElement) return;

      await renderAsync(buffer, this.contentElement, undefined, {
        className: 'docx-preview-content',
        inWrapper: true,
        ignoreWidth: false,
        ignoreHeight: false,
        ignoreFonts: false,
        breakPages: true,
        ignoreLastRenderedPageBreak: true,
        experimental: true,
        trimXmlDeclaration: true,
        useBase64URL: false,
        useMathMLPolyfill: false,
        renderHeaders: true,
        renderFooters: true,
        renderFootnotes: true,
        renderEndnotes: true,
      });

      this.renderedContent = this.contentElement.firstElementChild as HTMLElement;
    } catch (error) {
      console.error('docx-preview 渲染失败:', error);
      // 降级到 mammoth
      await this.renderWithMammoth(buffer);
    }
  }

  /**
   * 使用 mammoth 渲染
   */
  private async renderWithMammoth(buffer: ArrayBuffer): Promise<void> {
    try {
      // 动态导入 mammoth
      const mammoth = await import('mammoth');

      if (!this.contentElement) return;

      const result = await mammoth.convertToHtml(
        { arrayBuffer: buffer },
        {
          styleMap: [
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Heading 3'] => h3:fresh",
            "p[style-name='Title'] => h1.title:fresh",
          ],
        }
      );

      const contentWrapper = createElement('div', {
        className: 'mammoth-content',
      });
      contentWrapper.innerHTML = result.value;

      this.contentElement.appendChild(contentWrapper);
      this.renderedContent = contentWrapper;

      // 显示警告（如果有）
      if (result.messages.length > 0) {
        console.warn('Mammoth 转换警告:', result.messages);
      }
    } catch (error) {
      console.error('Mammoth 渲染失败:', error);
      throw error;
    }
  }

  /**
   * 渲染错误信息
   */
  private renderError(message: string): void {
    if (!this.contentElement) return;

    const errorElement = createElement('div', {
      className: 'error-message',
      children: [
        createElement('h3', { children: ['加载失败'] }),
        createElement('p', { children: [message] }),
      ],
    });

    clearElement(this.contentElement);
    this.contentElement.appendChild(errorElement);
  }

  /**
   * 设置缩放级别
   */
  setZoom(level: number): void {
    this.currentZoom = Math.max(
      ZOOM_RANGE.MIN,
      Math.min(ZOOM_RANGE.MAX, level)
    );
    this.applyZoom();
  }

  /**
   * 获取当前缩放级别
   */
  getZoom(): number {
    return this.currentZoom;
  }

  /**
   * 应用缩放
   */
  private applyZoom(): void {
    if (this.contentElement) {
      this.contentElement.style.transform = `scale(${this.currentZoom})`;
      this.contentElement.style.transformOrigin = 'top left';
    }
  }

  /**
   * 跳转到指定页
   */
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      console.warn(`页码超出范围: ${page}`);
      return;
    }

    this.currentPage = page;

    // 查找对应页面元素并滚动到该位置
    if (this.contentElement) {
      const pages = this.contentElement.querySelectorAll('.docx-wrapper section');
      if (pages.length > 0 && pages[page - 1]) {
        pages[page - 1].scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  /**
   * 获取页面信息
   */
  getPageInfo(): PageInfo {
    return {
      current: this.currentPage,
      total: this.totalPages,
    };
  }

  /**
   * 更新页面信息
   */
  private updatePageInfo(): void {
    if (!this.contentElement) return;

    // 尝试计算页数
    const pages = this.contentElement.querySelectorAll('.docx-wrapper section');
    this.totalPages = pages.length || 1;
  }

  /**
   * 搜索文本（优化版本）
   */
  search(keyword: string): SearchResult[] {
    if (!this.contentElement || !keyword) {
      return [];
    }

    // 检查缓存
    const cached = this.searchIndex.get(keyword.toLowerCase());
    if (cached) {
      console.log('使用缓存的搜索结果');
      return cached;
    }

    // 使用 Worker 搜索（如果可用）
    if (this.searchWorker) {
      return this.searchInWorker(keyword);
    }

    // 降级到主线程搜索
    const results = this.searchInMainThread(keyword);

    // 缓存结果
    this.searchIndex.set(keyword.toLowerCase(), results);

    return results;
  }

  /**
   * 在 Worker 中搜索
   */
  private searchInWorker(keyword: string): SearchResult[] {
    // 注意：这里返回同步结果，实际应该改为异步
    // 为了保持接口兼容，这里简化处理
    return this.searchInMainThread(keyword);
  }

  /**
   * 在主线程搜索
   */
  private searchInMainThread(keyword: string): SearchResult[] {
    const results: SearchResult[] = [];
    const text = this.contentElement!.textContent || '';
    const lowerText = text.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();

    let position = lowerText.indexOf(lowerKeyword);

    while (position !== -1) {
      const contextStart = Math.max(0, position - 50);
      const contextEnd = Math.min(text.length, position + keyword.length + 50);
      const context = text.substring(contextStart, contextEnd);

      results.push({
        pageNumber: this.currentPage,
        position,
        text: keyword,
        context: `...${context}...`,
      });

      position = lowerText.indexOf(lowerKeyword, position + keyword.length);
    }

    return results;
  }

  /**
   * 异步搜索（使用 Worker）
   */
  async searchAsync(keyword: string): Promise<SearchResult[]> {
    if (!this.contentElement || !keyword) {
      return [];
    }

    // 检查缓存
    const cached = this.searchIndex.get(keyword.toLowerCase());
    if (cached) {
      return cached;
    }

    if (!this.searchWorker) {
      const results = this.searchInMainThread(keyword);
      this.searchIndex.set(keyword.toLowerCase(), results);
      return results;
    }

    return new Promise((resolve) => {
      const id = `search_${Date.now()}_${Math.random()}`;
      const text = this.contentElement!.textContent || '';

      const handler = (event: MessageEvent) => {
        if (event.data.id === id) {
          this.searchWorker!.removeEventListener('message', handler);
          const results = event.data.results as SearchResult[];
          this.searchIndex.set(keyword.toLowerCase(), results);
          resolve(results);
        }
      };

      this.searchWorker.addEventListener('message', handler);
      this.searchWorker.postMessage({ id, text, keyword });
    });
  }

  /**
   * 高亮搜索结果（优化版本）
   */
  highlightSearch(keyword: string): void {
    if (!this.contentElement || !keyword) return;

    // 移除之前的高亮
    this.clearHighlight();

    // 使用 DocumentFragment 批量更新 DOM
    const walker = document.createTreeWalker(
      this.contentElement,
      NodeFilter.SHOW_TEXT,
      null
    );

    const replacements: Array<{
      node: Node;
      parent: Node;
      fragment: DocumentFragment;
    }> = [];

    let node: Node | null;

    while ((node = walker.nextNode())) {
      const text = node.textContent || '';
      if (!text.toLowerCase().includes(keyword.toLowerCase())) {
        continue;
      }

      const parent = node.parentNode!;
      const fragment = document.createDocumentFragment();
      const regex = new RegExp(`(${this.escapeRegExp(keyword)})`, 'gi');
      const parts = text.split(regex);

      parts.forEach((part, index) => {
        if (index % 2 === 0) {
          // 普通文本
          if (part) {
            fragment.appendChild(document.createTextNode(part));
          }
        } else {
          // 匹配的文本
          const mark = document.createElement('mark');
          mark.className = 'word-viewer-highlight';
          mark.textContent = part;
          fragment.appendChild(mark);
        }
      });

      replacements.push({ node, parent, fragment });
    }

    // 批量替换节点
    replacements.forEach(({ node, parent, fragment }) => {
      parent.replaceChild(fragment, node);
    });
  }

  /**
   * 转义正则表达式特殊字符
   */
  private escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * 清除高亮
   */
  clearHighlight(): void {
    if (!this.contentElement) return;

    const highlights = this.contentElement.querySelectorAll('.word-viewer-highlight');
    highlights.forEach((mark) => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
      }
    });
  }

  /**
   * 查找并替换
   */
  findAndReplace(findText: string, replaceText: string, replaceAll: boolean = false): number {
    if (!this.contentElement || !findText) {
      return 0;
    }

    let count = 0;
    const walker = document.createTreeWalker(
      this.contentElement,
      NodeFilter.SHOW_TEXT,
      null
    );

    const nodesToProcess: Array<{ node: Text; parent: Node }> = [];
    let node: Node | null;

    // 收集所有包含查找文本的文本节点
    while ((node = walker.nextNode())) {
      const textNode = node as Text;
      if (textNode.textContent && textNode.textContent.includes(findText)) {
        nodesToProcess.push({ node: textNode, parent: textNode.parentNode! });
      }
    }

    // 处理节点
    nodesToProcess.forEach(({ node, parent }) => {
      const text = node.textContent || '';
      let newText: string;

      if (replaceAll) {
        newText = text.split(findText).join(replaceText);
        const occurrences = text.split(findText).length - 1;
        count += occurrences;
      } else {
        // 只替换第一个
        if (count === 0 && text.includes(findText)) {
          newText = text.replace(findText, replaceText);
          count = 1;
        } else {
          return;
        }
      }

      const newNode = document.createTextNode(newText);
      parent.replaceChild(newNode, node);
    });

    logger.info(`替换完成: ${count} 处`, { findText, replaceText });
    return count;
  }

  /**
   * 查找下一个
   */
  findNext(keyword: string, currentPosition: number = 0): SearchResult | null {
    if (!this.contentElement || !keyword) {
      return null;
    }

    const text = this.contentElement.textContent || '';
    const lowerText = text.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();

    const position = lowerText.indexOf(lowerKeyword, currentPosition);

    if (position === -1) {
      return null;
    }

    const contextStart = Math.max(0, position - 50);
    const contextEnd = Math.min(text.length, position + keyword.length + 50);
    const context = text.substring(contextStart, contextEnd);

    return {
      pageNumber: this.currentPage,
      position,
      text: keyword,
      context: `...${context}...`,
    };
  }

  /**
   * 查找上一个
   */
  findPrevious(keyword: string, currentPosition: number): SearchResult | null {
    if (!this.contentElement || !keyword) {
      return null;
    }

    const text = this.contentElement.textContent || '';
    const lowerText = text.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();

    const position = lowerText.lastIndexOf(lowerKeyword, currentPosition - 1);

    if (position === -1) {
      return null;
    }

    const contextStart = Math.max(0, position - 50);
    const contextEnd = Math.min(text.length, position + keyword.length + 50);
    const context = text.substring(contextStart, contextEnd);

    return {
      pageNumber: this.currentPage,
      position,
      text: keyword,
      context: `...${context}...`,
    };
  }

  /**
   * 销毁查看器
   */
  destroy(): void {
    this.clearHighlight();

    // 断开滚动观察器
    if (this.scrollObserver) {
      this.scrollObserver.disconnect();
      this.scrollObserver = null;
    }

    // 销毁图片懒加载
    if (this.lazyImageLoader) {
      this.lazyImageLoader.disconnect();
      this.lazyImageLoader = null;
    }

    // 终止搜索 Worker
    if (this.searchWorker) {
      this.searchWorker.terminate();
      this.searchWorker = null;
    }

    // 清理缓存
    this.searchIndex.clear();
    this.pageElements.clear();
    this.visiblePages.clear();

    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }

    this.container = null;
    this.contentElement = null;
    this.renderedContent = null;
  }
}



