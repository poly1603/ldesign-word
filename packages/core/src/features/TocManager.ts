import type { WordDocument, TocItem, ParagraphElement, TextElement } from '../types';
import { EventEmitter } from '../events/EventEmitter';

/**
 * 目录管理器
 * 提供文档目录（TOC）生成和导航功能
 */
export class TocManager {
  private document: WordDocument | null = null;
  private container: HTMLElement | null = null;
  private eventEmitter: EventEmitter;
  private toc: TocItem[] = [];
  private tocContainer: HTMLElement | null = null;
  private classPrefix = 'wv';

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
      overflow: 'auto',
      padding: '16px',
      boxSizing: 'border-box',
      backgroundColor: '#fafafa',
      borderRight: '1px solid #e0e0e0'
    });

    // 创建标题
    const title = document.createElement('h3');
    title.textContent = '目录';
    Object.assign(title.style, {
      margin: '0 0 16px 0',
      fontSize: '16px',
      fontWeight: '600',
      color: '#333'
    });
    panel.appendChild(title);

    // 创建目录列表
    const list = this.createTocList(this.toc);
    panel.appendChild(list);

    this.tocContainer = panel;
    targetContainer.appendChild(panel);

    return panel;
  }

  /**
   * 创建目录列表
   */
  private createTocList(items: TocItem[]): HTMLElement {
    const ul = document.createElement('ul');
    Object.assign(ul.style, {
      listStyle: 'none',
      margin: '0',
      padding: '0'
    });

    for (const item of items) {
      const li = this.createTocItem(item);
      ul.appendChild(li);
    }

    return ul;
  }

  /**
   * 创建目录项
   */
  private createTocItem(item: TocItem): HTMLElement {
    const li = document.createElement('li');
    Object.assign(li.style, {
      margin: '4px 0',
      paddingLeft: `${(item.level - 1) * 16}px`
    });

    const link = document.createElement('a');
    link.href = `#${item.anchor}`;
    link.textContent = item.text;
    link.className = `${this.classPrefix}-toc-link`;

    Object.assign(link.style, {
      display: 'block',
      padding: '6px 12px',
      color: '#333',
      textDecoration: 'none',
      borderRadius: '4px',
      fontSize: item.level === 1 ? '14px' : '13px',
      fontWeight: item.level === 1 ? '600' : '400',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      transition: 'background-color 0.2s, color 0.2s'
    });

    // 悬停效果
    link.addEventListener('mouseenter', () => {
      link.style.backgroundColor = '#e3f2fd';
      link.style.color = '#1976d2';
    });

    link.addEventListener('mouseleave', () => {
      link.style.backgroundColor = 'transparent';
      link.style.color = '#333';
    });

    // 点击导航
    link.addEventListener('click', (e) => {
      e.preventDefault();
      this.navigateToHeading(item.anchor);
    });

    li.appendChild(link);

    // 递归渲染子项
    if (item.children.length > 0) {
      const childList = this.createTocList(item.children);
      li.appendChild(childList);
    }

    return li;
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
    const scrollTop = this.container.scrollTop;
    const containerRect = this.container.getBoundingClientRect();

    let activeAnchor: string | null = null;

    for (const heading of headings) {
      const rect = heading.getBoundingClientRect();
      const relativeTop = rect.top - containerRect.top;

      if (relativeTop <= 100) {
        const text = heading.textContent || '';
        activeAnchor = this.generateAnchorId(text);
      } else {
        break;
      }
    }

    // 更新目录面板中的激活状态
    if (activeAnchor) {
      const links = this.tocContainer.querySelectorAll(`.${this.classPrefix}-toc-link`);
      for (const link of links) {
        const href = (link as HTMLAnchorElement).getAttribute('href');
        if (href === `#${activeAnchor}`) {
          (link as HTMLElement).style.backgroundColor = '#e3f2fd';
          (link as HTMLElement).style.color = '#1976d2';
        } else {
          (link as HTMLElement).style.backgroundColor = 'transparent';
          (link as HTMLElement).style.color = '#333';
        }
      }
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    if (this.tocContainer && this.tocContainer.parentNode) {
      this.tocContainer.parentNode.removeChild(this.tocContainer);
    }
    this.toc = [];
    this.document = null;
    this.container = null;
    this.tocContainer = null;
  }
}
