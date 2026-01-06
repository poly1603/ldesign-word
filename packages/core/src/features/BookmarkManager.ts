import type { WordDocument, BookmarkItem, ParagraphElement } from '../types';
import { EventEmitter } from '../events/EventEmitter';
import { Icons, createIconElement } from '../utils/icons';

/**
 * 书签管理器
 * 提供文档书签解析、导航和用户自定义书签功能
 */
export class BookmarkManager {
  private document: WordDocument | null = null;
  private container: HTMLElement | null = null;
  private eventEmitter: EventEmitter;
  private bookmarks: BookmarkItem[] = [];
  private userBookmarks: BookmarkItem[] = [];
  private panelElement: HTMLElement | null = null;
  private classPrefix = 'wv';
  private storageKey = 'wv-bookmarks';

  constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter;
  }

  /**
   * 设置文档
   */
  setDocument(document: WordDocument, container: HTMLElement): void {
    this.document = document;
    this.container = container;
    this.extractBookmarks();
    this.loadUserBookmarks();
  }

  /**
   * 提取文档书签
   */
  private extractBookmarks(): void {
    if (!this.document) return;

    this.bookmarks = [];
    let pageIndex = 0;

    for (const section of this.document.sections) {
      for (const content of section.content) {
        if (content.type === 'paragraph') {
          const paragraph = content as ParagraphElement;
          
          if (paragraph.bookmarkStart) {
            for (const bookmark of paragraph.bookmarkStart) {
              // 跳过内部书签（以 _ 开头）
              if (bookmark.name.startsWith('_')) continue;

              this.bookmarks.push({
                id: bookmark.id,
                name: bookmark.name,
                anchor: `bookmark-${bookmark.id}`,
                pageIndex,
                isUserCreated: false
              });
            }
          }
        }
      }
      pageIndex++;
    }
  }

  /**
   * 加载用户书签
   */
  private loadUserBookmarks(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        // 只加载当前文档的书签
        const documentId = this.getDocumentId();
        this.userBookmarks = (data[documentId] || []).map((b: any) => ({
          ...b,
          createdAt: b.createdAt ? new Date(b.createdAt) : undefined
        }));
      }
    } catch (error) {
      console.warn('加载用户书签失败:', error);
      this.userBookmarks = [];
    }
  }

  /**
   * 保存用户书签
   */
  private saveUserBookmarks(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      const data = stored ? JSON.parse(stored) : {};
      const documentId = this.getDocumentId();
      data[documentId] = this.userBookmarks;
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('保存用户书签失败:', error);
    }
  }

  /**
   * 获取文档ID
   */
  private getDocumentId(): string {
    if (this.document?.metadata?.title) {
      return this.document.metadata.title;
    }
    return 'default';
  }

  /**
   * 获取所有书签
   */
  getAllBookmarks(): BookmarkItem[] {
    return [...this.bookmarks, ...this.userBookmarks];
  }

  /**
   * 获取文档书签
   */
  getDocumentBookmarks(): BookmarkItem[] {
    return [...this.bookmarks];
  }

  /**
   * 获取用户书签
   */
  getUserBookmarks(): BookmarkItem[] {
    return [...this.userBookmarks];
  }

  /**
   * 添加用户书签
   */
  addBookmark(name: string, pageIndex?: number, anchor?: string): BookmarkItem {
    const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const bookmark: BookmarkItem = {
      id,
      name,
      anchor,
      pageIndex,
      isUserCreated: true,
      createdAt: new Date()
    };

    this.userBookmarks.push(bookmark);
    this.saveUserBookmarks();
    this.updatePanel();

    // 触发事件
    this.eventEmitter.emit('bookmarkClick', {
      type: 'bookmarkClick',
      timestamp: Date.now(),
      action: 'add',
      bookmark
    });

    return bookmark;
  }

  /**
   * 从当前位置添加书签
   */
  addBookmarkAtCurrentPosition(name: string): BookmarkItem | null {
    if (!this.container) return null;

    // 获取当前可见页面
    const pages = this.container.querySelectorAll(`.${this.classPrefix}-page`);
    let currentPageIndex = 0;

    const containerRect = this.container.getBoundingClientRect();
    const containerCenter = containerRect.top + containerRect.height / 2;

    pages.forEach((page, index) => {
      const pageRect = page.getBoundingClientRect();
      if (pageRect.top <= containerCenter && pageRect.bottom >= containerCenter) {
        currentPageIndex = index;
      }
    });

    return this.addBookmark(name, currentPageIndex);
  }

  /**
   * 删除用户书签
   */
  removeBookmark(id: string): boolean {
    const index = this.userBookmarks.findIndex((b) => b.id === id);
    if (index === -1) return false;

    const bookmark = this.userBookmarks[index];
    this.userBookmarks.splice(index, 1);
    this.saveUserBookmarks();
    this.updatePanel();

    // 触发事件
    this.eventEmitter.emit('bookmarkClick', {
      type: 'bookmarkClick',
      timestamp: Date.now(),
      action: 'remove',
      bookmark
    });

    return true;
  }

  /**
   * 重命名书签
   */
  renameBookmark(id: string, newName: string): boolean {
    const bookmark = this.userBookmarks.find((b) => b.id === id);
    if (!bookmark) return false;

    bookmark.name = newName;
    this.saveUserBookmarks();
    this.updatePanel();

    return true;
  }

  /**
   * 导航到书签
   */
  navigateToBookmark(id: string): void {
    const bookmark = this.getAllBookmarks().find((b) => b.id === id);
    if (!bookmark || !this.container) return;

    // 优先使用锚点
    if (bookmark.anchor) {
      const element = this.container.querySelector(`[data-bookmark-id="${bookmark.id}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        this.highlightElement(element as HTMLElement);
        return;
      }
    }

    // 使用页面索引
    if (bookmark.pageIndex !== undefined) {
      const pages = this.container.querySelectorAll(`.${this.classPrefix}-page`);
      const targetPage = pages[bookmark.pageIndex];
      if (targetPage) {
        targetPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
        this.highlightElement(targetPage as HTMLElement);
      }
    }

    // 触发事件
    this.eventEmitter.emit('bookmarkClick', {
      type: 'bookmarkClick',
      timestamp: Date.now(),
      action: 'navigate',
      bookmark
    });
  }

  /**
   * 高亮元素
   */
  private highlightElement(element: HTMLElement): void {
    const originalBg = element.style.backgroundColor;
    element.style.backgroundColor = '#fff3cd';
    element.style.transition = 'background-color 0.3s';

    setTimeout(() => {
      element.style.backgroundColor = originalBg;
    }, 2000);
  }

  /**
   * 渲染书签面板
   */
  renderPanel(targetContainer: HTMLElement): HTMLElement {
    const panel = document.createElement('div');
    panel.className = `${this.classPrefix}-bookmark-panel`;

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
    header.className = `${this.classPrefix}-bookmark-header`;
    Object.assign(header.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '12px'
    });

    const title = document.createElement('h3');
    title.textContent = '书签';
    Object.assign(title.style, {
      margin: '0',
      fontSize: '14px',
      fontWeight: '600',
      color: '#333'
    });

    // 添加书签按钮
    const addBtn = document.createElement('button');
    addBtn.className = `${this.classPrefix}-bookmark-add-btn`;
    addBtn.title = '添加书签';
    addBtn.appendChild(createIconElement(Icons.plus, { size: 16 }));
    
    Object.assign(addBtn.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '28px',
      height: '28px',
      border: 'none',
      borderRadius: '4px',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      color: '#666'
    });

    addBtn.addEventListener('mouseenter', () => {
      addBtn.style.backgroundColor = '#e0e0e0';
    });
    addBtn.addEventListener('mouseleave', () => {
      addBtn.style.backgroundColor = 'transparent';
    });
    addBtn.addEventListener('click', () => {
      this.showAddBookmarkDialog();
    });

    header.appendChild(title);
    header.appendChild(addBtn);
    panel.appendChild(header);

    // 书签列表
    const list = document.createElement('div');
    list.className = `${this.classPrefix}-bookmark-list`;
    
    this.renderBookmarkList(list);
    panel.appendChild(list);

    this.panelElement = panel;
    targetContainer.appendChild(panel);

    return panel;
  }

  /**
   * 渲染书签列表
   */
  private renderBookmarkList(container: HTMLElement): void {
    container.innerHTML = '';

    const allBookmarks = this.getAllBookmarks();

    if (allBookmarks.length === 0) {
      const empty = document.createElement('div');
      empty.className = `${this.classPrefix}-bookmark-empty`;
      empty.textContent = '暂无书签';
      Object.assign(empty.style, {
        textAlign: 'center',
        color: '#999',
        padding: '20px',
        fontSize: '14px'
      });
      container.appendChild(empty);
      return;
    }

    // 文档书签
    if (this.bookmarks.length > 0) {
      const docSection = this.createBookmarkSection('文档书签', this.bookmarks, false);
      container.appendChild(docSection);
    }

    // 用户书签
    if (this.userBookmarks.length > 0) {
      const userSection = this.createBookmarkSection('我的书签', this.userBookmarks, true);
      container.appendChild(userSection);
    }
  }

  /**
   * 创建书签分组
   */
  private createBookmarkSection(
    title: string,
    bookmarks: BookmarkItem[],
    editable: boolean
  ): HTMLElement {
    const section = document.createElement('div');
    section.className = `${this.classPrefix}-bookmark-section`;
    Object.assign(section.style, {
      marginBottom: '16px'
    });

    const sectionTitle = document.createElement('div');
    sectionTitle.textContent = title;
    Object.assign(sectionTitle.style, {
      fontSize: '12px',
      fontWeight: '500',
      color: '#666',
      marginBottom: '8px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    });
    section.appendChild(sectionTitle);

    for (const bookmark of bookmarks) {
      const item = this.createBookmarkItem(bookmark, editable);
      section.appendChild(item);
    }

    return section;
  }

  /**
   * 创建书签项
   */
  private createBookmarkItem(bookmark: BookmarkItem, editable: boolean): HTMLElement {
    const item = document.createElement('div');
    item.className = `${this.classPrefix}-bookmark-item`;
    item.dataset.bookmarkId = bookmark.id;

    Object.assign(item.style, {
      display: 'flex',
      alignItems: 'center',
      padding: '8px 10px',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'background-color 0.15s',
      marginBottom: '4px'
    });

    // 图标
    const icon = document.createElement('span');
    icon.style.marginRight = '8px';
    icon.style.color = '#666';
    icon.style.display = 'flex';
    icon.appendChild(createIconElement(Icons.bookmark, { size: 16 }));
    item.appendChild(icon);

    // 名称
    const name = document.createElement('span');
    name.textContent = bookmark.name;
    name.style.flex = '1';
    name.style.fontSize = '14px';
    name.style.color = '#333';
    name.style.overflow = 'hidden';
    name.style.textOverflow = 'ellipsis';
    name.style.whiteSpace = 'nowrap';
    item.appendChild(name);

    // 页码
    if (bookmark.pageIndex !== undefined) {
      const page = document.createElement('span');
      page.textContent = `P${bookmark.pageIndex + 1}`;
      page.style.fontSize = '12px';
      page.style.color = '#999';
      page.style.marginLeft = '8px';
      item.appendChild(page);
    }

    // 删除按钮（仅用户书签）
    if (editable) {
      const deleteBtn = document.createElement('button');
      deleteBtn.className = `${this.classPrefix}-bookmark-delete`;
      deleteBtn.title = '删除';
      deleteBtn.appendChild(createIconElement(Icons.trash2, { size: 14 }));
      
      Object.assign(deleteBtn.style, {
        display: 'none',
        alignItems: 'center',
        justifyContent: 'center',
        width: '24px',
        height: '24px',
        border: 'none',
        borderRadius: '4px',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        color: '#999',
        marginLeft: '4px'
      });

      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeBookmark(bookmark.id);
      });

      item.appendChild(deleteBtn);

      // 悬停显示删除按钮
      item.addEventListener('mouseenter', () => {
        deleteBtn.style.display = 'flex';
      });
      item.addEventListener('mouseleave', () => {
        deleteBtn.style.display = 'none';
      });
    }

    // 悬停效果
    item.addEventListener('mouseenter', () => {
      item.style.backgroundColor = '#e3f2fd';
    });
    item.addEventListener('mouseleave', () => {
      item.style.backgroundColor = 'transparent';
    });

    // 点击导航
    item.addEventListener('click', () => {
      this.navigateToBookmark(bookmark.id);
    });

    return item;
  }

  /**
   * 显示添加书签对话框
   */
  private showAddBookmarkDialog(): void {
    const overlay = document.createElement('div');
    overlay.className = `${this.classPrefix}-dialog-overlay`;
    Object.assign(overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '10000'
    });

    const dialog = document.createElement('div');
    dialog.className = `${this.classPrefix}-dialog`;
    Object.assign(dialog.style, {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '20px',
      width: '300px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
    });

    const title = document.createElement('h3');
    title.textContent = '添加书签';
    Object.assign(title.style, {
      margin: '0 0 16px 0',
      fontSize: '16px',
      fontWeight: '600'
    });
    dialog.appendChild(title);

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = '输入书签名称...';
    Object.assign(input.style, {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '14px',
      marginBottom: '16px',
      boxSizing: 'border-box'
    });
    dialog.appendChild(input);

    const buttons = document.createElement('div');
    Object.assign(buttons.style, {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '8px'
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '取消';
    Object.assign(cancelBtn.style, {
      padding: '8px 16px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      backgroundColor: 'white',
      cursor: 'pointer',
      fontSize: '14px'
    });
    cancelBtn.addEventListener('click', () => overlay.remove());

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = '确定';
    Object.assign(confirmBtn.style, {
      padding: '8px 16px',
      border: 'none',
      borderRadius: '4px',
      backgroundColor: '#1976d2',
      color: 'white',
      cursor: 'pointer',
      fontSize: '14px'
    });
    confirmBtn.addEventListener('click', () => {
      const name = input.value.trim();
      if (name) {
        this.addBookmarkAtCurrentPosition(name);
      }
      overlay.remove();
    });

    buttons.appendChild(cancelBtn);
    buttons.appendChild(confirmBtn);
    dialog.appendChild(buttons);

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // 聚焦输入框
    input.focus();

    // Enter 确认
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        confirmBtn.click();
      } else if (e.key === 'Escape') {
        cancelBtn.click();
      }
    });

    // 点击遮罩关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });
  }

  /**
   * 更新面板
   */
  private updatePanel(): void {
    if (!this.panelElement) return;

    const list = this.panelElement.querySelector(`.${this.classPrefix}-bookmark-list`);
    if (list) {
      this.renderBookmarkList(list as HTMLElement);
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    if (this.panelElement && this.panelElement.parentNode) {
      this.panelElement.parentNode.removeChild(this.panelElement);
    }

    this.bookmarks = [];
    this.userBookmarks = [];
    this.document = null;
    this.container = null;
    this.panelElement = null;
  }
}
