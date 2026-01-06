import type { SelectionInfo, ContextMenuItem } from '../types';
import { EventEmitter } from '../events/EventEmitter';
import { Icons, createIconElement } from '../utils/icons';

/**
 * 选择管理器
 * 提供文本选择、复制和右键菜单功能
 */
export class SelectionManager {
  private container: HTMLElement | null = null;
  private eventEmitter: EventEmitter;
  private classPrefix = 'wv';
  private contextMenuElement: HTMLElement | null = null;
  private customMenuItems: ContextMenuItem[] = [];
  private selectionChangeHandler: (() => void) | null = null;

  constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter;
  }

  /**
   * 设置容器
   */
  setContainer(container: HTMLElement): void {
    this.container = container;
    this.setupEventListeners();
  }

  /**
   * 设置事件监听
   */
  private setupEventListeners(): void {
    if (!this.container) return;

    // 监听选择变化
    this.selectionChangeHandler = this.handleSelectionChange.bind(this);
    document.addEventListener('selectionchange', this.selectionChangeHandler);

    // 监听右键菜单
    this.container.addEventListener('contextmenu', this.handleContextMenu.bind(this));

    // 点击其他地方关闭菜单
    document.addEventListener('click', this.hideContextMenu.bind(this));
    document.addEventListener('scroll', this.hideContextMenu.bind(this), true);
  }

  /**
   * 处理选择变化
   */
  private handleSelectionChange(): void {
    const selection = this.getSelection();
    
    this.eventEmitter.emit('selectionChange', {
      type: 'selectionChange',
      timestamp: Date.now(),
      selectedText: selection.text,
      range: selection.range
    });
  }

  /**
   * 获取当前选择
   */
  getSelection(): SelectionInfo {
    const selection = window.getSelection();
    
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return { text: '', range: null };
    }

    const range = selection.getRangeAt(0);
    const text = selection.toString();

    // 检查选择是否在容器内
    if (this.container && !this.container.contains(range.commonAncestorContainer)) {
      return { text: '', range: null };
    }

    // 获取边界矩形
    const boundingRect = range.getBoundingClientRect();

    // 获取页面信息
    let startPage: number | undefined;
    let endPage: number | undefined;

    if (this.container) {
      const pages = this.container.querySelectorAll(`.${this.classPrefix}-page`);
      
      pages.forEach((page, index) => {
        if (page.contains(range.startContainer)) {
          startPage = index;
        }
        if (page.contains(range.endContainer)) {
          endPage = index;
        }
      });
    }

    return {
      text,
      range,
      startPage,
      endPage,
      boundingRect
    };
  }

  /**
   * 复制选中文本
   */
  async copySelection(): Promise<boolean> {
    const selection = this.getSelection();
    
    if (!selection.text) {
      return false;
    }

    try {
      await navigator.clipboard.writeText(selection.text);
      
      // 显示复制成功提示
      this.showCopyToast('已复制到剪贴板');
      
      return true;
    } catch (error) {
      // 使用备用方法
      try {
        const textarea = document.createElement('textarea');
        textarea.value = selection.text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        this.showCopyToast('已复制到剪贴板');
        
        return true;
      } catch {
        console.error('复制失败:', error);
        return false;
      }
    }
  }

  /**
   * 显示复制提示
   */
  private showCopyToast(message: string): void {
    const toast = document.createElement('div');
    toast.className = `${this.classPrefix}-toast`;
    toast.textContent = message;

    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '8px 16px',
      backgroundColor: '#333',
      color: 'white',
      borderRadius: '4px',
      fontSize: '14px',
      zIndex: '10000',
      opacity: '0',
      transition: 'opacity 0.2s'
    });

    document.body.appendChild(toast);

    // 显示动画
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
    });

    // 自动消失
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        toast.remove();
      }, 200);
    }, 1500);
  }

  /**
   * 处理右键菜单
   */
  private handleContextMenu(event: MouseEvent): void {
    const selection = this.getSelection();
    
    // 如果没有选中文本且没有自定义菜单项，使用默认行为
    if (!selection.text && this.customMenuItems.length === 0) {
      return;
    }

    event.preventDefault();
    this.showContextMenu(event.clientX, event.clientY, selection);
  }

  /**
   * 显示右键菜单
   */
  private showContextMenu(x: number, y: number, selection: SelectionInfo): void {
    this.hideContextMenu();

    const menu = document.createElement('div');
    menu.className = `${this.classPrefix}-context-menu`;

    Object.assign(menu.style, {
      position: 'fixed',
      left: `${x}px`,
      top: `${y}px`,
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      padding: '4px 0',
      minWidth: '160px',
      zIndex: '10000',
      overflow: 'hidden'
    });

    // 默认菜单项
    const defaultItems: ContextMenuItem[] = [];

    if (selection.text) {
      defaultItems.push({
        id: 'copy',
        label: '复制',
        shortcut: 'Ctrl+C',
        icon: 'copy',
        onClick: () => this.copySelection()
      });

      defaultItems.push({
        id: 'selectAll',
        label: '全选',
        shortcut: 'Ctrl+A',
        onClick: () => this.selectAll()
      });
    }

    // 合并自定义菜单项
    const allItems = [...defaultItems, ...this.customMenuItems];

    // 创建菜单项
    allItems.forEach((item, index) => {
      if (item.separator) {
        const separator = document.createElement('div');
        separator.className = `${this.classPrefix}-context-menu-separator`;
        Object.assign(separator.style, {
          height: '1px',
          backgroundColor: '#e0e0e0',
          margin: '4px 0'
        });
        menu.appendChild(separator);
        return;
      }

      const menuItem = this.createMenuItem(item);
      menu.appendChild(menuItem);
    });

    // 添加到文档
    document.body.appendChild(menu);
    this.contextMenuElement = menu;

    // 调整位置确保在视口内
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      menu.style.left = `${window.innerWidth - rect.width - 10}px`;
    }
    if (rect.bottom > window.innerHeight) {
      menu.style.top = `${window.innerHeight - rect.height - 10}px`;
    }

    // 触发事件
    this.eventEmitter.emit('contextMenu', {
      type: 'contextMenu',
      timestamp: Date.now(),
      x,
      y,
      selection
    });
  }

  /**
   * 创建菜单项
   */
  private createMenuItem(item: ContextMenuItem): HTMLElement {
    const menuItem = document.createElement('div');
    menuItem.className = `${this.classPrefix}-context-menu-item`;

    Object.assign(menuItem.style, {
      display: 'flex',
      alignItems: 'center',
      padding: '8px 12px',
      cursor: item.disabled ? 'not-allowed' : 'pointer',
      opacity: item.disabled ? '0.5' : '1',
      transition: 'background-color 0.15s'
    });

    // 图标
    if (item.icon) {
      const iconContainer = document.createElement('span');
      iconContainer.style.marginRight = '8px';
      iconContainer.style.display = 'flex';
      iconContainer.style.alignItems = 'center';
      iconContainer.style.color = '#666';
      
      // 使用 Icons 对象
      const iconFn = (Icons as any)[item.icon];
      if (iconFn) {
        iconContainer.appendChild(createIconElement(iconFn, { size: 16 }));
      }
      
      menuItem.appendChild(iconContainer);
    }

    // 标签
    const label = document.createElement('span');
    label.textContent = item.label;
    label.style.flex = '1';
    label.style.fontSize = '14px';
    label.style.color = '#333';
    menuItem.appendChild(label);

    // 快捷键
    if (item.shortcut) {
      const shortcut = document.createElement('span');
      shortcut.textContent = item.shortcut;
      shortcut.style.fontSize = '12px';
      shortcut.style.color = '#999';
      shortcut.style.marginLeft = '16px';
      menuItem.appendChild(shortcut);
    }

    // 悬停效果
    if (!item.disabled) {
      menuItem.addEventListener('mouseenter', () => {
        menuItem.style.backgroundColor = '#f5f5f5';
      });

      menuItem.addEventListener('mouseleave', () => {
        menuItem.style.backgroundColor = 'transparent';
      });

      // 点击处理
      menuItem.addEventListener('click', () => {
        this.hideContextMenu();
        item.onClick?.();
      });
    }

    return menuItem;
  }

  /**
   * 隐藏右键菜单
   */
  hideContextMenu(): void {
    if (this.contextMenuElement) {
      this.contextMenuElement.remove();
      this.contextMenuElement = null;
    }
  }

  /**
   * 全选
   */
  selectAll(): void {
    if (!this.container) return;

    const range = document.createRange();
    const content = this.container.querySelector(`.${this.classPrefix}-document`);
    
    if (content) {
      range.selectNodeContents(content);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }

  /**
   * 清除选择
   */
  clearSelection(): void {
    const selection = window.getSelection();
    selection?.removeAllRanges();
  }

  /**
   * 添加自定义菜单项
   */
  addMenuItem(item: ContextMenuItem): void {
    this.customMenuItems.push(item);
  }

  /**
   * 移除自定义菜单项
   */
  removeMenuItem(id: string): void {
    this.customMenuItems = this.customMenuItems.filter((item) => item.id !== id);
  }

  /**
   * 设置自定义菜单项
   */
  setMenuItems(items: ContextMenuItem[]): void {
    this.customMenuItems = items;
  }

  /**
   * 获取自定义菜单项
   */
  getMenuItems(): ContextMenuItem[] {
    return [...this.customMenuItems];
  }

  /**
   * 高亮选中文本
   */
  highlightSelection(color: string = '#ffff00'): HTMLElement | null {
    const selection = this.getSelection();
    
    if (!selection.range || !selection.text) {
      return null;
    }

    try {
      const highlight = document.createElement('mark');
      highlight.className = `${this.classPrefix}-highlight`;
      highlight.style.backgroundColor = color;
      highlight.style.padding = '0 2px';
      highlight.style.borderRadius = '2px';

      selection.range.surroundContents(highlight);
      
      // 清除选择
      this.clearSelection();

      return highlight;
    } catch (error) {
      console.error('高亮失败:', error);
      return null;
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    if (this.selectionChangeHandler) {
      document.removeEventListener('selectionchange', this.selectionChangeHandler);
    }

    this.hideContextMenu();
    this.customMenuItems = [];
    this.container = null;
  }
}
