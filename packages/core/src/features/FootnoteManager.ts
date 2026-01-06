import type { WordDocument } from '../types';
import { EventEmitter } from '../events/EventEmitter';
import { Icons, createIconElement } from '../utils/icons';

/**
 * 脚注项
 */
interface FootnoteItem {
  id: string;
  type: 'footnote' | 'endnote';
  number: number;
  text: string;
  pageIndex?: number;
}

/**
 * 脚注/尾注管理器
 * 提供脚注悬停预览、尾注面板、点击导航等功能
 */
export class FootnoteManager {
  private document: WordDocument | null = null;
  private container: HTMLElement | null = null;
  private eventEmitter: EventEmitter;
  private footnotes: FootnoteItem[] = [];
  private endnotes: FootnoteItem[] = [];
  private panelElement: HTMLElement | null = null;
  private tooltipElement: HTMLElement | null = null;
  private classPrefix = 'wv';
  private hoverEnabled = true;

  constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter;
  }

  /**
   * 设置文档
   */
  setDocument(document: WordDocument, container: HTMLElement): void {
    this.document = document;
    this.container = container;
    this.extractFootnotes();
    this.renderFootnoteMarkers();
  }

  /**
   * 提取脚注和尾注
   */
  private extractFootnotes(): void {
    if (!this.document) return;

    this.footnotes = [];
    this.endnotes = [];

    let footnoteNumber = 1;
    let endnoteNumber = 1;
    let pageIndex = 0;

    for (const section of this.document.sections) {
      for (const content of section.content) {
        if (content.type === 'paragraph') {
          const paragraph = content as any;

          // 检查段落中的脚注引用
          if (paragraph.footnotes) {
            for (const fn of paragraph.footnotes) {
              this.footnotes.push({
                id: fn.id || `fn-${footnoteNumber}`,
                type: 'footnote',
                number: footnoteNumber++,
                text: fn.text || '',
                pageIndex
              });
            }
          }

          // 检查段落中的尾注引用
          if (paragraph.endnotes) {
            for (const en of paragraph.endnotes) {
              this.endnotes.push({
                id: en.id || `en-${endnoteNumber}`,
                type: 'endnote',
                number: endnoteNumber++,
                text: en.text || '',
                pageIndex
              });
            }
          }
        }
      }
      pageIndex++;
    }
  }

  /**
   * 渲染脚注标记
   */
  private renderFootnoteMarkers(): void {
    if (!this.container) return;

    // 为所有脚注/尾注引用添加交互
    const refs = this.container.querySelectorAll(
      `.${this.classPrefix}-footnote-ref, .${this.classPrefix}-endnote-ref`
    );

    refs.forEach((ref) => {
      const el = ref as HTMLElement;
      const noteId = el.dataset.noteId;
      const noteType = el.classList.contains(`${this.classPrefix}-footnote-ref`)
        ? 'footnote'
        : 'endnote';

      // 样式
      Object.assign(el.style, {
        cursor: 'pointer',
        color: '#1976d2',
        verticalAlign: 'super',
        fontSize: '0.8em',
        fontWeight: '500'
      });

      // 悬停显示 tooltip
      if (this.hoverEnabled) {
        el.addEventListener('mouseenter', (e) => {
          this.showTooltip(noteId!, noteType, e);
        });

        el.addEventListener('mouseleave', () => {
          this.hideTooltip();
        });
      }

      // 点击导航
      el.addEventListener('click', () => {
        this.navigateToNote(noteId!, noteType);
      });
    });
  }

  /**
   * 显示 tooltip
   */
  private showTooltip(
    noteId: string,
    type: 'footnote' | 'endnote',
    event: MouseEvent
  ): void {
    const notes = type === 'footnote' ? this.footnotes : this.endnotes;
    const note = notes.find((n) => n.id === noteId);
    
    if (!note) return;

    this.hideTooltip();

    const tooltip = document.createElement('div');
    tooltip.className = `${this.classPrefix}-note-tooltip`;

    Object.assign(tooltip.style, {
      position: 'fixed',
      zIndex: '10001',
      backgroundColor: '#333',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '6px',
      fontSize: '13px',
      maxWidth: '300px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      lineHeight: '1.5',
      pointerEvents: 'none'
    });

    // 标题
    const header = document.createElement('div');
    header.textContent = `${type === 'footnote' ? '脚注' : '尾注'} ${note.number}`;
    Object.assign(header.style, {
      fontSize: '11px',
      color: '#aaa',
      marginBottom: '4px',
      fontWeight: '500'
    });
    tooltip.appendChild(header);

    // 内容
    const content = document.createElement('div');
    content.textContent = note.text.length > 150 
      ? note.text.substring(0, 150) + '...' 
      : note.text;
    tooltip.appendChild(content);

    document.body.appendChild(tooltip);

    // 定位
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
    let top = rect.bottom + 8;

    // 边界检测
    if (left < 8) left = 8;
    if (left + tooltipRect.width > window.innerWidth - 8) {
      left = window.innerWidth - tooltipRect.width - 8;
    }
    if (top + tooltipRect.height > window.innerHeight - 8) {
      top = rect.top - tooltipRect.height - 8;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;

    this.tooltipElement = tooltip;
  }

  /**
   * 隐藏 tooltip
   */
  private hideTooltip(): void {
    if (this.tooltipElement) {
      this.tooltipElement.remove();
      this.tooltipElement = null;
    }
  }

  /**
   * 导航到脚注/尾注
   */
  navigateToNote(noteId: string, type: 'footnote' | 'endnote'): void {
    if (!this.container) return;

    // 查找脚注/尾注内容
    const noteContent = this.container.querySelector(
      `[data-${type}-id="${noteId}"]`
    );

    if (noteContent) {
      noteContent.scrollIntoView({ behavior: 'smooth', block: 'center' });
      this.highlightElement(noteContent as HTMLElement);

      this.eventEmitter.emit('footnote', {
        type: 'footnote',
        timestamp: Date.now(),
        action: 'navigate',
        noteId,
        noteType: type
      });
    }
  }

  /**
   * 导航到脚注引用
   */
  navigateToReference(noteId: string, type: 'footnote' | 'endnote'): void {
    if (!this.container) return;

    const refClass = type === 'footnote'
      ? `${this.classPrefix}-footnote-ref`
      : `${this.classPrefix}-endnote-ref`;

    const ref = this.container.querySelector(
      `.${refClass}[data-note-id="${noteId}"]`
    );

    if (ref) {
      ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
      this.highlightElement(ref as HTMLElement);
    }
  }

  /**
   * 高亮元素
   */
  private highlightElement(element: HTMLElement): void {
    const originalBg = element.style.backgroundColor;
    element.style.backgroundColor = '#fff176';
    element.style.transition = 'background-color 0.3s';

    setTimeout(() => {
      element.style.backgroundColor = originalBg;
    }, 2000);
  }

  /**
   * 获取所有脚注
   */
  getFootnotes(): FootnoteItem[] {
    return [...this.footnotes];
  }

  /**
   * 获取所有尾注
   */
  getEndnotes(): FootnoteItem[] {
    return [...this.endnotes];
  }

  /**
   * 切换悬停预览
   */
  toggleHover(): boolean {
    this.hoverEnabled = !this.hoverEnabled;
    return this.hoverEnabled;
  }

  /**
   * 渲染脚注/尾注面板
   */
  renderPanel(targetContainer: HTMLElement): HTMLElement {
    const panel = document.createElement('div');
    panel.className = `${this.classPrefix}-footnote-panel`;

    Object.assign(panel.style, {
      width: '100%',
      height: '100%',
      overflow: 'auto',
      padding: '12px',
      boxSizing: 'border-box',
      backgroundColor: '#fafafa'
    });

    // 标题
    const header = document.createElement('div');
    header.className = `${this.classPrefix}-footnote-header`;
    Object.assign(header.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '12px'
    });

    const title = document.createElement('h3');
    title.textContent = '脚注与尾注';
    Object.assign(title.style, {
      margin: '0',
      fontSize: '14px',
      fontWeight: '600',
      color: '#333'
    });

    header.appendChild(title);
    panel.appendChild(header);

    // 标签页
    const tabs = document.createElement('div');
    tabs.className = `${this.classPrefix}-footnote-tabs`;
    Object.assign(tabs.style, {
      display: 'flex',
      borderBottom: '1px solid #ddd',
      marginBottom: '12px'
    });

    const tabFootnotes = this.createTab('脚注', this.footnotes.length, true);
    const tabEndnotes = this.createTab('尾注', this.endnotes.length, false);

    tabs.appendChild(tabFootnotes);
    tabs.appendChild(tabEndnotes);
    panel.appendChild(tabs);

    // 内容区
    const content = document.createElement('div');
    content.className = `${this.classPrefix}-footnote-content`;

    const footnotesContent = document.createElement('div');
    footnotesContent.className = `${this.classPrefix}-footnotes-list`;
    this.renderNotesList(footnotesContent, this.footnotes, 'footnote');

    const endnotesContent = document.createElement('div');
    endnotesContent.className = `${this.classPrefix}-endnotes-list`;
    endnotesContent.style.display = 'none';
    this.renderNotesList(endnotesContent, this.endnotes, 'endnote');

    content.appendChild(footnotesContent);
    content.appendChild(endnotesContent);
    panel.appendChild(content);

    // 标签页切换
    tabFootnotes.addEventListener('click', () => {
      this.setActiveTab(tabFootnotes, tabEndnotes);
      footnotesContent.style.display = '';
      endnotesContent.style.display = 'none';
    });

    tabEndnotes.addEventListener('click', () => {
      this.setActiveTab(tabEndnotes, tabFootnotes);
      footnotesContent.style.display = 'none';
      endnotesContent.style.display = '';
    });

    this.panelElement = panel;
    targetContainer.appendChild(panel);

    return panel;
  }

  /**
   * 创建标签页
   */
  private createTab(label: string, count: number, active: boolean): HTMLElement {
    const tab = document.createElement('div');
    tab.className = `${this.classPrefix}-footnote-tab`;

    Object.assign(tab.style, {
      padding: '8px 16px',
      cursor: 'pointer',
      fontSize: '14px',
      color: active ? '#1976d2' : '#666',
      borderBottom: active ? '2px solid #1976d2' : '2px solid transparent',
      marginBottom: '-1px',
      transition: 'all 0.2s'
    });

    const text = document.createElement('span');
    text.textContent = label;
    tab.appendChild(text);

    if (count > 0) {
      const badge = document.createElement('span');
      badge.textContent = count.toString();
      Object.assign(badge.style, {
        marginLeft: '6px',
        backgroundColor: active ? '#1976d2' : '#e0e0e0',
        color: active ? 'white' : '#666',
        padding: '2px 6px',
        borderRadius: '10px',
        fontSize: '12px'
      });
      tab.appendChild(badge);
    }

    tab.addEventListener('mouseenter', () => {
      if (!tab.classList.contains('active')) {
        tab.style.color = '#1976d2';
      }
    });

    tab.addEventListener('mouseleave', () => {
      if (!tab.classList.contains('active')) {
        tab.style.color = '#666';
      }
    });

    if (active) {
      tab.classList.add('active');
    }

    return tab;
  }

  /**
   * 设置活动标签
   */
  private setActiveTab(activeTab: HTMLElement, inactiveTab: HTMLElement): void {
    activeTab.classList.add('active');
    activeTab.style.color = '#1976d2';
    activeTab.style.borderBottom = '2px solid #1976d2';
    
    const activeBadge = activeTab.querySelector('span:last-child');
    if (activeBadge && activeBadge !== activeTab.querySelector('span:first-child')) {
      (activeBadge as HTMLElement).style.backgroundColor = '#1976d2';
      (activeBadge as HTMLElement).style.color = 'white';
    }

    inactiveTab.classList.remove('active');
    inactiveTab.style.color = '#666';
    inactiveTab.style.borderBottom = '2px solid transparent';
    
    const inactiveBadge = inactiveTab.querySelector('span:last-child');
    if (inactiveBadge && inactiveBadge !== inactiveTab.querySelector('span:first-child')) {
      (inactiveBadge as HTMLElement).style.backgroundColor = '#e0e0e0';
      (inactiveBadge as HTMLElement).style.color = '#666';
    }
  }

  /**
   * 渲染脚注/尾注列表
   */
  private renderNotesList(
    container: HTMLElement,
    notes: FootnoteItem[],
    type: 'footnote' | 'endnote'
  ): void {
    container.innerHTML = '';

    if (notes.length === 0) {
      const empty = document.createElement('div');
      empty.className = `${this.classPrefix}-footnote-empty`;
      empty.textContent = `暂无${type === 'footnote' ? '脚注' : '尾注'}`;
      Object.assign(empty.style, {
        textAlign: 'center',
        color: '#999',
        padding: '20px',
        fontSize: '14px'
      });
      container.appendChild(empty);
      return;
    }

    for (const note of notes) {
      const item = this.createNoteItem(note, type);
      container.appendChild(item);
    }
  }

  /**
   * 创建脚注/尾注项
   */
  private createNoteItem(
    note: FootnoteItem,
    type: 'footnote' | 'endnote'
  ): HTMLElement {
    const item = document.createElement('div');
    item.className = `${this.classPrefix}-footnote-item`;

    Object.assign(item.style, {
      display: 'flex',
      padding: '10px 12px',
      borderRadius: '6px',
      backgroundColor: 'white',
      marginBottom: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
      transition: 'box-shadow 0.2s'
    });

    // 序号
    const number = document.createElement('div');
    number.textContent = note.number.toString();
    Object.assign(number.style, {
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      backgroundColor: '#e3f2fd',
      color: '#1976d2',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontWeight: '600',
      flexShrink: '0',
      marginRight: '10px'
    });
    item.appendChild(number);

    // 内容
    const content = document.createElement('div');
    content.style.flex = '1';
    content.style.minWidth = '0';

    const text = document.createElement('div');
    text.textContent = note.text;
    Object.assign(text.style, {
      fontSize: '14px',
      color: '#333',
      lineHeight: '1.5',
      wordBreak: 'break-word'
    });
    content.appendChild(text);

    if (note.pageIndex !== undefined) {
      const page = document.createElement('div');
      page.textContent = `第 ${note.pageIndex + 1} 页`;
      Object.assign(page.style, {
        fontSize: '12px',
        color: '#999',
        marginTop: '4px'
      });
      content.appendChild(page);
    }

    item.appendChild(content);

    // 定位按钮
    const gotoBtn = document.createElement('button');
    gotoBtn.title = '定位到引用';
    gotoBtn.appendChild(createIconElement(Icons.externalLink, { size: 16 }));
    
    Object.assign(gotoBtn.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '28px',
      height: '28px',
      border: 'none',
      borderRadius: '4px',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      color: '#999',
      flexShrink: '0',
      marginLeft: '8px',
      opacity: '0',
      transition: 'opacity 0.2s'
    });

    gotoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.navigateToReference(note.id, type);
    });

    item.appendChild(gotoBtn);

    // 悬停效果
    item.addEventListener('mouseenter', () => {
      item.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.12)';
      gotoBtn.style.opacity = '1';
    });

    item.addEventListener('mouseleave', () => {
      item.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.08)';
      gotoBtn.style.opacity = '0';
    });

    return item;
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.hideTooltip();

    if (this.panelElement && this.panelElement.parentNode) {
      this.panelElement.parentNode.removeChild(this.panelElement);
    }

    this.footnotes = [];
    this.endnotes = [];
    this.document = null;
    this.container = null;
    this.panelElement = null;
  }
}
