import type { WordDocument, TocItem, ParagraphElement, TextElement } from '../types';
import { EventEmitter } from '../events/EventEmitter';
import { Icons, createIconElement } from '../utils/icons';

/**
 * 目录管理器
 * 提供文档目录（TOC）生成、导航、展开/折叠、搜索过滤等功能
 */
export class TocManager {
  private document: WordDocument | null = null;
  private container: HTMLElement | null = null;
  private eventEmitter: EventEmitter;
  private toc: TocItem[] = [];
  private tocContainer: HTMLElement | null = null;
  private classPrefix = 'wv';
  private expandedItems = new Set<string>();
  private searchQuery = '';
  private activeAnchor: string | null = null;
  private scrollSyncEnabled = true;
  private scrollHandler: (() => void) | null = null;

  constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter;
  }

  /**
   * 设置文档
   */
  setDocument(document: WordDocument, container: HTMLElement): void {
    this.document = document;
    this.container = container;
    this.generateToc();
    this.setupScrollSync();
  }

  /**
   * 设置滚动同步
   */
  private setupScrollSync(): void {
    if (!this.container) return;

    // 移除旧的监听器
    if (this.scrollHandler) {
      this.container.removeEventListener('scroll', this.scrollHandler);
    }

    this.scrollHandler = this.throttle(() => {
      if (this.scrollSyncEnabled) {
        this.updateActiveItem();
      }
    }, 100);

    this.container.addEventListener('scroll', this.scrollHandler, { passive: true });
  }

  /**
   * 节流函数
   */
  private throttle<T extends (...args: any[]) => void>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let lastCall = 0;
    return function (this: any, ...args: Parameters<T>) {
      const now = Date.now();
      if (now - lastCall >= limit) {
        lastCall = now;
        func.apply(this, args);
      }
    };
  }

  /**
   * 生成目录
   */
  generateToc(): TocItem[] {
    if (!this.document) return [];

    const items: TocItem[] = [];
    const levelStack: TocItem[][] = [items];
    let currentLevel = 0;

    // 遍历所有节和段落，查找标题
    for (const section of this.document.sections) {
      for (const content of section.content) {
        if (content.type === 'paragraph') {
          const heading = this.extractHeading(content);
          if (heading) {
            // 确定层级
            while (heading.level <= currentLevel && levelStack.length > 1) {
              levelStack.pop();
              currentLevel--;
            }

            // 添加到当前层级
            const currentList = levelStack[levelStack.length - 1];
            if (currentList) {
              currentList.push(heading);
            }

            // 如果需要，创建子层级
            if (heading.level > currentLevel) {
              levelStack.push(heading.children);
              currentLevel = heading.level;
            }
          }
        }
      }
    }

    this.toc = items;
    return items;
  }

  /**
   * 从段落中提取标题信息
   */
  private extractHeading(paragraph: ParagraphElement): TocItem | null {
    const outlineLevel = paragraph.style?.outlineLevel;

    // 检查是否是标题（outlineLevel 0-8 表示标题 1-9）
    if (outlineLevel === undefined || outlineLevel > 8) {
      return null;
    }

    // 提取文本内容
    const text = this.extractParagraphText(paragraph);
    if (!text.trim()) return null;

    // 生成锚点 ID
    const anchor = this.generateAnchorId(text);

    return {
      level: outlineLevel + 1,
      text: text.trim(),
      anchor,
      children: []
    };
  }

  /**
   * 提取段落文本
   */
  private extractParagraphText(paragraph: ParagraphElement): string {
    let text = '';

    for (const run of paragraph.runs) {
      for (const child of run.children) {
        if (child.type === 'text') {
          text += (child as TextElement).text;
        }
      }
    }

    return text;
  }

  /**
   * 生成锚点 ID
   */
  private generateAnchorId(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50) || 'heading';
  }

  /**
   * 渲染目录面板
   */
  renderTocPanel(targetContainer: HTMLElement): HTMLElement {
    // 创建目录容器
    const panel = document.createElement('div');
    panel.className = `${this.classPrefix}-toc-panel`;

    Object.assign(panel.style, {
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      backgroundColor: '#fafafa'
    });

    // 创建头部
    const header = this.createHeader();
    panel.appendChild(header);

    // 搜索框
    const searchBox = this.createSearchBox();
    panel.appendChild(searchBox);

    // 创建目录列表容器
    const listContainer = document.createElement('div');
    listContainer.className = `${this.classPrefix}-toc-list-container`;
    Object.assign(listContainer.style, {
      flex: '1',
      overflow: 'auto',
      padding: '8px 12px'
    });

    const list = this.createTocList(this.toc);
    listContainer.appendChild(list);
    panel.appendChild(listContainer);

    this.tocContainer = panel;
    targetContainer.appendChild(panel);

    // 默认展开第一层
    this.expandLevel(1);

    return panel;
  }

  /**
   * 创建头部
   */
  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = `${this.classPrefix}-toc-header`;
    Object.assign(header.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 12px 8px 12px',
      borderBottom: '1px solid #e0e0e0'
    });

    const title = document.createElement('h3');
    title.textContent = '目录';
    Object.assign(title.style, {
      margin: '0',
      fontSize: '14px',
      fontWeight: '600',
      color: '#333'
    });

    const toolbar = document.createElement('div');
    toolbar.style.display = 'flex';
    toolbar.style.gap = '4px';

    // 全部展开
    const expandAllBtn = this.createToolbarButton(
      Icons.chevronDown,
      '全部展开',
      () => this.expandAll()
    );

    // 全部折叠
    const collapseAllBtn = this.createToolbarButton(
      Icons.chevronUp,
      '全部折叠',
      () => this.collapseAll()
    );

    // 滚动同步
    const syncBtn = this.createToolbarButton(
      Icons.link,
      '滚动同步',
      () => this.toggleScrollSync()
    );
    if (this.scrollSyncEnabled) {
      syncBtn.style.color = '#1976d2';
    }

    toolbar.appendChild(expandAllBtn);
    toolbar.appendChild(collapseAllBtn);
    toolbar.appendChild(syncBtn);

    header.appendChild(title);
    header.appendChild(toolbar);

    return header;
  }

  /**
   * 创建工具栏按钮
   */
  private createToolbarButton(
    icon: string,
    title: string,
    onClick: () => void
  ): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.title = title;
    btn.appendChild(createIconElement(icon, { size: 16 }));

    Object.assign(btn.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '26px',
      height: '26px',
      border: 'none',
      borderRadius: '4px',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      color: '#666'
    });

    btn.addEventListener('mouseenter', () => {
      btn.style.backgroundColor = '#e0e0e0';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.backgroundColor = 'transparent';
    });
    btn.addEventListener('click', onClick);

    return btn;
  }

  /**
   * 创建搜索框
   */
  private createSearchBox(): HTMLElement {
    const container = document.createElement('div');
    container.className = `${this.classPrefix}-toc-search`;
    Object.assign(container.style, {
      padding: '8px 12px',
      borderBottom: '1px solid #e0e0e0'
    });

    const inputWrapper = document.createElement('div');
    Object.assign(inputWrapper.style, {
      display: 'flex',
      alignItems: 'center',
      backgroundColor: '#fff',
      border: '1px solid #ddd',
      borderRadius: '6px',
      padding: '0 8px'
    });

    const icon = createIconElement(Icons.search, { size: 16 });
    icon.style.color = '#999';
    icon.style.marginRight = '6px';
    inputWrapper.appendChild(icon);

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = '搜索目录...';
    Object.assign(input.style, {
      flex: '1',
      border: 'none',
      outline: 'none',
      padding: '6px 0',
      fontSize: '13px',
      backgroundColor: 'transparent'
    });

    input.addEventListener('input', () => {
      this.filterToc(input.value);
    });

    inputWrapper.appendChild(input);
    container.appendChild(inputWrapper);

    return container;
  }

  /**
   * 过滤目录
   */
  filterToc(query: string): void {
    this.searchQuery = query.toLowerCase().trim();
    this.refreshTocList();
  }

  /**
   * 检查目录项是否匹配搜索
   */
  private matchesSearch(item: TocItem): boolean {
    if (!this.searchQuery) return true;

    if (item.text.toLowerCase().includes(this.searchQuery)) {
      return true;
    }

    // 检查子项
    for (const child of item.children) {
      if (this.matchesSearch(child)) {
        return true;
      }
    }

    return false;
  }

  /**
   * 刷新目录列表
   */
  private refreshTocList(): void {
    if (!this.tocContainer) return;

    const listContainer = this.tocContainer.querySelector(
      `.${this.classPrefix}-toc-list-container`
    );
    if (!listContainer) return;

    listContainer.innerHTML = '';
    const list = this.createTocList(this.toc);
    listContainer.appendChild(list);
  }

  /**
   * 创建目录列表
   */
  private createTocList(items: TocItem[], parentExpanded = true): HTMLElement {
    const ul = document.createElement('ul');
    Object.assign(ul.style, {
      listStyle: 'none',
      margin: '0',
      padding: '0'
    });

    for (const item of items) {
      // 搜索过滤
      if (this.searchQuery && !this.matchesSearch(item)) {
        continue;
      }

      const li = this.createTocItem(item, parentExpanded);
      ul.appendChild(li);
    }

    return ul;
  }

  /**
   * 创建目录项
   */
  private createTocItem(item: TocItem, parentExpanded: boolean): HTMLElement {
    const li = document.createElement('li');
    li.className = `${this.classPrefix}-toc-item`;
    li.dataset.anchor = item.anchor;
    li.dataset.level = item.level.toString();

    Object.assign(li.style, {
      margin: '2px 0'
    });

    const hasChildren = item.children.length > 0;
    const isExpanded = this.expandedItems.has(item.anchor) || !!this.searchQuery;

    // 创建链接容器
    const linkWrapper = document.createElement('div');
    Object.assign(linkWrapper.style, {
      display: 'flex',
      alignItems: 'center',
      paddingLeft: `${(item.level - 1) * 16}px`
    });

    // 展开/折叠按钮
    if (hasChildren) {
      const expandBtn = document.createElement('button');
      expandBtn.className = `${this.classPrefix}-toc-expand-btn`;
      expandBtn.appendChild(
        createIconElement(isExpanded ? Icons.chevronDown : Icons.chevronRight, { size: 14 })
      );

      Object.assign(expandBtn.style, {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '20px',
        height: '20px',
        border: 'none',
        borderRadius: '4px',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        color: '#666',
        padding: '0',
        flexShrink: '0'
      });

      expandBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleExpand(item.anchor);
      });

      linkWrapper.appendChild(expandBtn);
    } else {
      // 占位
      const spacer = document.createElement('span');
      spacer.style.width = '20px';
      spacer.style.flexShrink = '0';
      linkWrapper.appendChild(spacer);
    }

    // 图标
    const icon = createIconElement(
      this.getHeadingIcon(item.level),
      { size: 14 }
    );
    icon.style.color = '#999';
    icon.style.marginRight = '6px';
    icon.style.flexShrink = '0';
    linkWrapper.appendChild(icon);

    // 链接
    const link = document.createElement('a');
    link.href = `#${item.anchor}`;
    link.className = `${this.classPrefix}-toc-link`;
    link.dataset.anchor = item.anchor;

    // 高亮搜索关键词
    if (this.searchQuery) {
      link.innerHTML = this.highlightSearchText(item.text);
    } else {
      link.textContent = item.text;
    }

    const isActive = this.activeAnchor === item.anchor;

    Object.assign(link.style, {
      flex: '1',
      padding: '6px 8px',
      color: isActive ? '#1976d2' : '#333',
      textDecoration: 'none',
      borderRadius: '4px',
      fontSize: item.level === 1 ? '14px' : '13px',
      fontWeight: item.level === 1 ? '600' : '400',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      backgroundColor: isActive ? '#e3f2fd' : 'transparent',
      transition: 'background-color 0.15s, color 0.15s'
    });

    // 悬停效果
    link.addEventListener('mouseenter', () => {
      if (!isActive) {
        link.style.backgroundColor = '#f0f0f0';
      }
    });

    link.addEventListener('mouseleave', () => {
      if (!isActive) {
        link.style.backgroundColor = 'transparent';
      }
    });

    // 点击导航
    link.addEventListener('click', (e) => {
      e.preventDefault();
      this.navigateToHeading(item.anchor);
    });

    linkWrapper.appendChild(link);
    li.appendChild(linkWrapper);

    // 递归渲染子项
    if (hasChildren) {
      const childList = this.createTocList(item.children, isExpanded);
      childList.className = `${this.classPrefix}-toc-children`;
      childList.style.display = isExpanded ? '' : 'none';
      li.appendChild(childList);
    }

    return li;
  }

  /**
   * 获取标题图标
   */
  private getHeadingIcon(level: number): string {
    switch (level) {
      case 1:
        return Icons.fileText;
      case 2:
        return Icons.folder;
      default:
        return Icons.file;
    }
  }

  /**
   * 高亮搜索文本
   */
  private highlightSearchText(text: string): string {
    if (!this.searchQuery) return text;

    const regex = new RegExp(`(${this.escapeRegex(this.searchQuery)})`, 'gi');
    return text.replace(
      regex,
      '<mark style="background-color:#fff176;padding:0 2px;border-radius:2px">$1</mark>'
    );
  }

  /**
   * 转义正则特殊字符
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * 切换展开/折叠
   */
  toggleExpand(anchor: string): void {
    if (this.expandedItems.has(anchor)) {
      this.expandedItems.delete(anchor);
    } else {
      this.expandedItems.add(anchor);
    }
    this.refreshTocList();
  }

  /**
   * 展开指定层级
   */
  expandLevel(level: number): void {
    const traverse = (items: TocItem[]) => {
      for (const item of items) {
        if (item.level <= level && item.children.length > 0) {
          this.expandedItems.add(item.anchor);
        }
        traverse(item.children);
      }
    };
    traverse(this.toc);
    this.refreshTocList();
  }

  /**
   * 全部展开
   */
  expandAll(): void {
    const traverse = (items: TocItem[]) => {
      for (const item of items) {
        if (item.children.length > 0) {
          this.expandedItems.add(item.anchor);
        }
        traverse(item.children);
      }
    };
    traverse(this.toc);
    this.refreshTocList();
  }

  /**
   * 全部折叠
   */
  collapseAll(): void {
    this.expandedItems.clear();
    this.refreshTocList();
  }

  /**
   * 切换滚动同步
   */
  toggleScrollSync(): boolean {
    this.scrollSyncEnabled = !this.scrollSyncEnabled;

    // 更新按钮状态
    if (this.tocContainer) {
      const syncBtn = this.tocContainer.querySelector('button[title="滚动同步"]');
      if (syncBtn) {
        (syncBtn as HTMLElement).style.color = this.scrollSyncEnabled ? '#1976d2' : '#666';
      }
    }

    return this.scrollSyncEnabled;
  }

  /**
   * 导航到指定标题
   */
  navigateToHeading(anchor: string): void {
    if (!this.container) return;

    // 查找标题元素
    const headings = this.container.querySelectorAll('p, h1, h2, h3, h4, h5, h6');

    for (const heading of headings) {
      const text = heading.textContent || '';
      const generatedAnchor = this.generateAnchorId(text);

      if (generatedAnchor === anchor) {
        heading.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // 高亮效果
        const originalBg = (heading as HTMLElement).style.backgroundColor;
        (heading as HTMLElement).style.backgroundColor = '#fff3cd';
        (heading as HTMLElement).style.transition = 'background-color 0.3s';

        setTimeout(() => {
          (heading as HTMLElement).style.backgroundColor = originalBg;
        }, 2000);

        break;
      }
    }
  }

  /**
   * 获取目录
   */
  getToc(): TocItem[] {
    return [...this.toc];
  }

  /**
   * 获取扁平化的目录
   */
  getFlatToc(): TocItem[] {
    const flat: TocItem[] = [];

    const traverse = (items: TocItem[]) => {
      for (const item of items) {
        flat.push(item);
        if (item.children.length > 0) {
          traverse(item.children);
        }
      }
    };

    traverse(this.toc);
    return flat;
  }

  /**
   * 更新当前激活的目录项（根据滚动位置）
   */
  updateActiveItem(): void {
    if (!this.container || !this.tocContainer) return;

    const headings = this.container.querySelectorAll('p, h1, h2, h3, h4, h5, h6');
    const containerRect = this.container.getBoundingClientRect();

    let newActiveAnchor: string | null = null;

    for (const heading of headings) {
      const rect = heading.getBoundingClientRect();
      const relativeTop = rect.top - containerRect.top;

      if (relativeTop <= 100) {
        const text = heading.textContent || '';
        newActiveAnchor = this.generateAnchorId(text);
      } else {
        break;
      }
    }

    // 如果激活项没变，不更新
    if (newActiveAnchor === this.activeAnchor) return;

    this.activeAnchor = newActiveAnchor;

    // 更新目录面板中的激活状态
    const links = this.tocContainer.querySelectorAll(`.${this.classPrefix}-toc-link`);
    for (const link of links) {
      const anchor = (link as HTMLElement).dataset.anchor;
      const isActive = anchor === this.activeAnchor;
      
      (link as HTMLElement).style.backgroundColor = isActive ? '#e3f2fd' : 'transparent';
      (link as HTMLElement).style.color = isActive ? '#1976d2' : '#333';
    }

    // 滚动目录面板到激活项
    if (this.activeAnchor) {
      const activeLink = this.tocContainer.querySelector(
        `.${this.classPrefix}-toc-link[data-anchor="${this.activeAnchor}"]`
      );
      if (activeLink) {
        const listContainer = this.tocContainer.querySelector(
          `.${this.classPrefix}-toc-list-container`
        );
        if (listContainer) {
          const linkRect = activeLink.getBoundingClientRect();
          const containerRect = listContainer.getBoundingClientRect();
          
          // 如果激活项不在可视区域，滚动到可见
          if (linkRect.top < containerRect.top || linkRect.bottom > containerRect.bottom) {
            activeLink.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }

      // 自动展开父级
      this.expandParents(this.activeAnchor);
    }
  }

  /**
   * 展开父级目录项
   */
  private expandParents(anchor: string): void {
    const findAndExpand = (items: TocItem[], path: TocItem[]): boolean => {
      for (const item of items) {
        if (item.anchor === anchor) {
          // 展开所有父级
          for (const parent of path) {
            if (parent.children.length > 0) {
              this.expandedItems.add(parent.anchor);
            }
          }
          return true;
        }

        if (item.children.length > 0) {
          if (findAndExpand(item.children, [...path, item])) {
            return true;
          }
        }
      }
      return false;
    };

    const changed = findAndExpand(this.toc, []);
    if (changed) {
      this.refreshTocList();
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    // 移除滚动监听
    if (this.container && this.scrollHandler) {
      this.container.removeEventListener('scroll', this.scrollHandler);
    }

    if (this.tocContainer && this.tocContainer.parentNode) {
      this.tocContainer.parentNode.removeChild(this.tocContainer);
    }

    this.toc = [];
    this.expandedItems.clear();
    this.searchQuery = '';
    this.activeAnchor = null;
    this.document = null;
    this.container = null;
    this.tocContainer = null;
  }
}
