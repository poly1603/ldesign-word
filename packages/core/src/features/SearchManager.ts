import type { SearchResult, WordDocument, ParagraphElement, TextElement } from '../types';
import { EventEmitter } from '../events/EventEmitter';

/**
 * 搜索管理器
 * 提供文档内容搜索功能
 */
export class SearchManager {
  private document: WordDocument | null = null;
  private container: HTMLElement | null = null;
  private eventEmitter: EventEmitter;
  private results: SearchResult[] = [];
  private currentIndex = -1;
  private highlightClass = 'wv-search-highlight';
  private activeHighlightClass = 'wv-search-highlight-active';
  private highlightElements: HTMLElement[] = [];

  constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter;
  }

  /**
   * 设置文档
   */
  setDocument(document: WordDocument, container: HTMLElement): void {
    this.document = document;
    this.container = container;
  }

  /**
   * 搜索文本
   */
  search(query: string, options?: SearchOptions): SearchResult[] {
    if (!this.document || !query.trim()) {
      this.clearHighlights();
      this.results = [];
      this.currentIndex = -1;
      return [];
    }

    const searchQuery = options?.caseSensitive ? query : query.toLowerCase();
    const results: SearchResult[] = [];
    let elementIndex = 0;

    // 遍历所有节和段落
    for (let sectionIndex = 0; sectionIndex < this.document.sections.length; sectionIndex++) {
      const section = this.document.sections[sectionIndex];
      if (!section) continue;

      for (const content of section.content) {
        if (content.type === 'paragraph') {
          const paragraphResults = this.searchInParagraph(
            content,
            searchQuery,
            sectionIndex,
            elementIndex,
            options
          );
          results.push(...paragraphResults);
        }
        elementIndex++;
      }
    }

    this.results = results;
    this.currentIndex = results.length > 0 ? 0 : -1;

    // 高亮显示结果
    this.highlightResults();

    // 触发搜索结果事件
    this.eventEmitter.emit('searchResult', {
      type: 'searchResult',
      timestamp: Date.now(),
      query,
      results,
      currentIndex: this.currentIndex
    });

    return results;
  }

  /**
   * 在段落中搜索
   */
  private searchInParagraph(
    paragraph: ParagraphElement,
    query: string,
    pageIndex: number,
    elementIndex: number,
    options?: SearchOptions
  ): SearchResult[] {
    const results: SearchResult[] = [];

    // 获取段落的全部文本
    let fullText = '';
    const textPositions: { runIndex: number; childIndex: number; startPos: number }[] = [];

    for (let runIndex = 0; runIndex < paragraph.runs.length; runIndex++) {
      const run = paragraph.runs[runIndex];
      if (!run) continue;

      for (let childIndex = 0; childIndex < run.children.length; childIndex++) {
        const child = run.children[childIndex];
        if (child?.type === 'text') {
          textPositions.push({
            runIndex,
            childIndex,
            startPos: fullText.length
          });
          fullText += (child as TextElement).text;
        }
      }
    }

    // 搜索匹配
    const searchText = options?.caseSensitive ? fullText : fullText.toLowerCase();
    let startIndex = 0;

    while (true) {
      const foundIndex = options?.wholeWord
        ? this.findWholeWord(searchText, query, startIndex)
        : searchText.indexOf(query, startIndex);

      if (foundIndex === -1) break;

      // 获取匹配文本的上下文
      const contextStart = Math.max(0, foundIndex - 30);
      const contextEnd = Math.min(fullText.length, foundIndex + query.length + 30);
      const context = fullText.substring(contextStart, contextEnd);

      results.push({
        pageIndex,
        elementIndex,
        startOffset: foundIndex,
        endOffset: foundIndex + query.length,
        text: fullText.substring(foundIndex, foundIndex + query.length),
        context: (contextStart > 0 ? '...' : '') + context + (contextEnd < fullText.length ? '...' : '')
      });

      startIndex = foundIndex + 1;
    }

    return results;
  }

  /**
   * 查找整词匹配
   */
  private findWholeWord(text: string, word: string, startIndex: number): number {
    const regex = new RegExp(`\\b${this.escapeRegex(word)}\\b`, 'gi');
    regex.lastIndex = startIndex;
    const match = regex.exec(text);
    return match ? match.index : -1;
  }

  /**
   * 转义正则表达式特殊字符
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * 高亮显示搜索结果
   */
  private highlightResults(): void {
    this.clearHighlights();

    if (!this.container || this.results.length === 0) return;

    // 使用 TreeWalker 遍历文本节点
    const walker = document.createTreeWalker(
      this.container,
      NodeFilter.SHOW_TEXT,
      null
    );

    const textNodes: Text[] = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode as Text);
    }

    // 这里简化处理：在容器中查找并高亮匹配文本
    // 实际实现需要更精确的位置映射
    for (const result of this.results) {
      this.highlightTextInContainer(result.text);
    }

    // 跳转到第一个结果
    if (this.highlightElements.length > 0 && this.highlightElements[0]) {
      this.highlightElements[0].classList.add(this.activeHighlightClass);
      this.highlightElements[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  /**
   * 在容器中高亮文本
   */
  private highlightTextInContainer(text: string): void {
    if (!this.container) return;

    const walker = document.createTreeWalker(
      this.container,
      NodeFilter.SHOW_TEXT,
      null
    );

    const nodesToProcess: { node: Text; matches: RegExpMatchArray[] }[] = [];

    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      const content = node.textContent || '';
      const regex = new RegExp(this.escapeRegex(text), 'gi');
      const matches: RegExpMatchArray[] = [];
      let match: RegExpExecArray | null;

      while ((match = regex.exec(content)) !== null) {
        matches.push(match);
      }

      if (matches.length > 0) {
        nodesToProcess.push({ node, matches });
      }
    }

    // 从后向前处理以避免索引变化
    for (const { node, matches } of nodesToProcess.reverse()) {
      for (const match of [...matches].reverse()) {
        const startIndex = match.index!;
        const endIndex = startIndex + match[0].length;

        const range = document.createRange();
        range.setStart(node, startIndex);
        range.setEnd(node, endIndex);

        const highlight = document.createElement('mark');
        highlight.className = this.highlightClass;
        Object.assign(highlight.style, {
          backgroundColor: '#ffeb3b',
          padding: '0 2px',
          borderRadius: '2px'
        });

        range.surroundContents(highlight);
        this.highlightElements.push(highlight);
      }
    }
  }

  /**
   * 清除高亮
   */
  clearHighlights(): void {
    for (const el of this.highlightElements) {
      const parent = el.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(el.textContent || ''), el);
        parent.normalize();
      }
    }
    this.highlightElements = [];
  }

  /**
   * 跳转到下一个结果
   */
  next(): SearchResult | null {
    if (this.results.length === 0) return null;

    // 移除当前高亮
    if (this.currentIndex >= 0 && this.highlightElements[this.currentIndex]) {
      this.highlightElements[this.currentIndex]?.classList.remove(this.activeHighlightClass);
    }

    // 移动到下一个
    this.currentIndex = (this.currentIndex + 1) % this.results.length;

    // 添加新的高亮
    const currentEl = this.highlightElements[this.currentIndex];
    if (currentEl) {
      currentEl.classList.add(this.activeHighlightClass);
      currentEl.style.backgroundColor = '#ff9800';
      currentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    this.emitSearchResult();
    return this.results[this.currentIndex] || null;
  }

  /**
   * 跳转到上一个结果
   */
  previous(): SearchResult | null {
    if (this.results.length === 0) return null;

    // 移除当前高亮
    if (this.currentIndex >= 0 && this.highlightElements[this.currentIndex]) {
      this.highlightElements[this.currentIndex]?.classList.remove(this.activeHighlightClass);
      const el = this.highlightElements[this.currentIndex];
      if (el) el.style.backgroundColor = '#ffeb3b';
    }

    // 移动到上一个
    this.currentIndex = this.currentIndex <= 0 ? this.results.length - 1 : this.currentIndex - 1;

    // 添加新的高亮
    const currentEl = this.highlightElements[this.currentIndex];
    if (currentEl) {
      currentEl.classList.add(this.activeHighlightClass);
      currentEl.style.backgroundColor = '#ff9800';
      currentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    this.emitSearchResult();
    return this.results[this.currentIndex] || null;
  }

  /**
   * 跳转到指定结果
   */
  goTo(index: number): SearchResult | null {
    if (index < 0 || index >= this.results.length) return null;

    // 移除当前高亮
    if (this.currentIndex >= 0 && this.highlightElements[this.currentIndex]) {
      this.highlightElements[this.currentIndex]?.classList.remove(this.activeHighlightClass);
      const el = this.highlightElements[this.currentIndex];
      if (el) el.style.backgroundColor = '#ffeb3b';
    }

    this.currentIndex = index;

    // 添加新的高亮
    const currentEl = this.highlightElements[this.currentIndex];
    if (currentEl) {
      currentEl.classList.add(this.activeHighlightClass);
      currentEl.style.backgroundColor = '#ff9800';
      currentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    this.emitSearchResult();
    return this.results[this.currentIndex] || null;
  }

  /**
   * 触发搜索结果事件
   */
  private emitSearchResult(): void {
    this.eventEmitter.emit('searchResult', {
      type: 'searchResult',
      timestamp: Date.now(),
      query: '',
      results: this.results,
      currentIndex: this.currentIndex
    });
  }

  /**
   * 获取当前结果索引
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * 获取结果总数
   */
  getResultCount(): number {
    return this.results.length;
  }

  /**
   * 获取所有结果
   */
  getResults(): SearchResult[] {
    return [...this.results];
  }

  /**
   * 清除搜索
   */
  clear(): void {
    this.clearHighlights();
    this.results = [];
    this.currentIndex = -1;
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.clear();
    this.document = null;
    this.container = null;
  }
}

/**
 * 搜索选项
 */
export interface SearchOptions {
  /** 区分大小写 */
  caseSensitive?: boolean;
  /** 整词匹配 */
  wholeWord?: boolean;
  /** 使用正则表达式 */
  useRegex?: boolean;
}
