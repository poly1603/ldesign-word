/**
 * 工具栏组件
 * 提供可视化的编辑界面
 */

import { Logger } from '../../utils/logger';
import { KeyboardManager } from '../../utils/accessibility';
import { t } from '../../i18n';
import type { WordViewer } from '../../core/WordViewer';

const logger = new Logger({ prefix: '[Toolbar]' });

export interface ToolbarItem {
  type: 'button' | 'dropdown' | 'separator' | 'group';
  id: string;
  label?: string;
  icon?: string;
  tooltip?: string;
  action?: () => void;
  children?: ToolbarItem[];
  disabled?: boolean;
}

export interface ToolbarOptions {
  position?: 'top' | 'bottom' | 'left' | 'right';
  theme?: 'light' | 'dark';
  items?: ToolbarItem[];
  customClass?: string;
}

/**
 * 工具栏类
 */
export class Toolbar {
  private viewer: WordViewer;
  private container: HTMLElement;
  private toolbarElement: HTMLElement | null = null;
  private options: ToolbarOptions;
  private keyboardManager: KeyboardManager;

  constructor(viewer: WordViewer, container: HTMLElement, options: ToolbarOptions = {}) {
    this.viewer = viewer;
    this.container = container;
    this.options = {
      position: options.position || 'top',
      theme: options.theme || 'light',
      items: options.items || this.getDefaultItems(),
      customClass: options.customClass,
    };

    this.keyboardManager = new KeyboardManager(container);
    this.render();

    logger.info('工具栏已初始化', { position: this.options.position });
  }

  /**
   * 获取默认工具栏项
   */
  private getDefaultItems(): ToolbarItem[] {
    return [
      // 文件操作组
      {
        type: 'group',
        id: 'file',
        children: [
          {
            type: 'button',
            id: 'save',
            label: t('common.save'),
            icon: '💾',
            tooltip: '保存文档 (Ctrl+S)',
            action: () => this.handleSave(),
          },
          {
            type: 'button',
            id: 'export',
            label: t('export.title'),
            icon: '📤',
            tooltip: '导出文档',
            action: () => this.handleExport(),
          },
        ],
      },
      { type: 'separator', id: 'sep1' },

      // 编辑操作组
      {
        type: 'group',
        id: 'edit',
        children: [
          {
            type: 'button',
            id: 'undo',
            label: t('editor.undo'),
            icon: '↶',
            tooltip: '撤销 (Ctrl+Z)',
            action: () => this.viewer.undo(),
          },
          {
            type: 'button',
            id: 'redo',
            label: t('editor.redo'),
            icon: '↷',
            tooltip: '重做 (Ctrl+Y)',
            action: () => this.viewer.redo(),
          },
        ],
      },
      { type: 'separator', id: 'sep2' },

      // 格式化组
      {
        type: 'group',
        id: 'format',
        children: [
          {
            type: 'button',
            id: 'bold',
            label: t('editor.bold'),
            icon: 'B',
            tooltip: '加粗 (Ctrl+B)',
            action: () => this.handleBold(),
          },
          {
            type: 'button',
            id: 'italic',
            label: t('editor.italic'),
            icon: 'I',
            tooltip: '斜体 (Ctrl+I)',
            action: () => this.handleItalic(),
          },
          {
            type: 'button',
            id: 'underline',
            label: t('editor.underline'),
            icon: 'U',
            tooltip: '下划线 (Ctrl+U)',
            action: () => this.handleUnderline(),
          },
        ],
      },
      { type: 'separator', id: 'sep3' },

      // 插入组
      {
        type: 'group',
        id: 'insert',
        children: [
          {
            type: 'button',
            id: 'insertImage',
            label: t('editor.insertImage'),
            icon: '🖼️',
            tooltip: '插入图片',
            action: () => this.handleInsertImage(),
          },
          {
            type: 'button',
            id: 'insertTable',
            label: t('editor.insertTable'),
            icon: '📊',
            tooltip: '插入表格',
            action: () => this.handleInsertTable(),
          },
          {
            type: 'button',
            id: 'insertLink',
            label: t('editor.insertLink'),
            icon: '🔗',
            tooltip: '插入链接',
            action: () => this.handleInsertLink(),
          },
        ],
      },
      { type: 'separator', id: 'sep4' },

      // 视图组
      {
        type: 'group',
        id: 'view',
        children: [
          {
            type: 'button',
            id: 'zoomIn',
            label: t('viewer.zoomIn'),
            icon: '🔍+',
            tooltip: '放大',
            action: () => this.handleZoomIn(),
          },
          {
            type: 'button',
            id: 'zoomOut',
            label: t('viewer.zoomOut'),
            icon: '🔍-',
            tooltip: '缩小',
            action: () => this.handleZoomOut(),
          },
        ],
      },
    ];
  }

  /**
   * 渲染工具栏
   */
  private render(): void {
    this.toolbarElement = document.createElement('div');
    this.toolbarElement.className = `word-viewer-toolbar word-viewer-toolbar-${this.options.position} theme-${this.options.theme}`;

    if (this.options.customClass) {
      this.toolbarElement.classList.add(this.options.customClass);
    }

    this.toolbarElement.style.cssText = this.getToolbarStyles();

    // 渲染工具栏项
    this.options.items?.forEach(item => {
      const element = this.renderItem(item);
      if (element) {
        this.toolbarElement!.appendChild(element);
      }
    });

    // 添加到容器
    this.container.insertBefore(this.toolbarElement, this.container.firstChild);
  }

  /**
   * 获取工具栏样式
   */
  private getToolbarStyles(): string {
    const position = this.options.position;

    const baseStyles = `
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px;
      background-color: ${this.options.theme === 'dark' ? '#2d2d2d' : '#f5f5f5'};
      border: 1px solid ${this.options.theme === 'dark' ? '#444' : '#ddd'};
      z-index: 100;
    `;

    const positionStyles = {
      top: 'position: sticky; top: 0; left: 0; right: 0;',
      bottom: 'position: sticky; bottom: 0; left: 0; right: 0;',
      left: 'position: sticky; top: 0; bottom: 0; left: 0; flex-direction: column;',
      right: 'position: sticky; top: 0; bottom: 0; right: 0; flex-direction: column;',
    };

    return baseStyles + positionStyles[position!];
  }

  /**
   * 渲染工具栏项
   */
  private renderItem(item: ToolbarItem): HTMLElement | null {
    switch (item.type) {
      case 'button':
        return this.renderButton(item);
      case 'dropdown':
        return this.renderDropdown(item);
      case 'separator':
        return this.renderSeparator();
      case 'group':
        return this.renderGroup(item);
      default:
        return null;
    }
  }

  /**
   * 渲染按钮
   */
  private renderButton(item: ToolbarItem): HTMLElement {
    const button = document.createElement('button');
    button.className = 'toolbar-button';
    button.id = `toolbar-${item.id}`;
    button.setAttribute('aria-label', item.tooltip || item.label || '');

    if (item.disabled) {
      button.disabled = true;
    }

    const content = item.icon ? `${item.icon} ${item.label || ''}` : item.label || '';
    button.textContent = content.trim();

    button.style.cssText = `
      padding: 6px 12px;
      border: 1px solid ${this.options.theme === 'dark' ? '#555' : '#ccc'};
      background: ${this.options.theme === 'dark' ? '#3d3d3d' : '#fff'};
      color: ${this.options.theme === 'dark' ? '#fff' : '#333'};
      cursor: pointer;
      border-radius: 4px;
      font-size: 14px;
      transition: all 0.2s;
    `;

    button.addEventListener('click', () => {
      if (item.action) {
        item.action();
      }
    });

    // Hover 效果
    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = this.options.theme === 'dark' ? '#4d4d4d' : '#e8e8e8';
    });

    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = this.options.theme === 'dark' ? '#3d3d3d' : '#fff';
    });

    return button;
  }

  /**
   * 渲染下拉菜单
   */
  private renderDropdown(item: ToolbarItem): HTMLElement {
    const dropdown = document.createElement('div');
    dropdown.className = 'toolbar-dropdown';
    dropdown.style.position = 'relative';

    const button = this.renderButton(item);
    dropdown.appendChild(button);

    // 添加下拉菜单内容（如果有子项）
    if (item.children && item.children.length > 0) {
      const menu = document.createElement('div');
      menu.className = 'dropdown-menu';
      menu.style.cssText = `
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        background: ${this.options.theme === 'dark' ? '#2d2d2d' : '#fff'};
        border: 1px solid ${this.options.theme === 'dark' ? '#555' : '#ddd'};
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        z-index: 1000;
      `;

      item.children.forEach(child => {
        const childElement = this.renderItem(child);
        if (childElement) {
          menu.appendChild(childElement);
        }
      });

      dropdown.appendChild(menu);

      // 切换下拉菜单
      button.addEventListener('click', () => {
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
      });
    }

    return dropdown;
  }

  /**
   * 渲染分隔符
   */
  private renderSeparator(): HTMLElement {
    const separator = document.createElement('div');
    separator.className = 'toolbar-separator';
    separator.style.cssText = `
      width: 1px;
      height: 24px;
      background-color: ${this.options.theme === 'dark' ? '#555' : '#ddd'};
      margin: 0 4px;
    `;
    return separator;
  }

  /**
   * 渲染组
   */
  private renderGroup(item: ToolbarItem): HTMLElement {
    const group = document.createElement('div');
    group.className = 'toolbar-group';
    group.style.cssText = `
      display: flex;
      gap: 4px;
    `;

    item.children?.forEach(child => {
      const element = this.renderItem(child);
      if (element) {
        group.appendChild(element);
      }
    });

    return group;
  }

  /**
   * 处理保存
   */
  private handleSave(): void {
    logger.info('保存文档');
    // 实现保存逻辑
  }

  /**
   * 处理导出
   */
  private handleExport(): void {
    logger.info('导出文档');
    // 显示导出对话框
  }

  /**
   * 处理加粗
   */
  private handleBold(): void {
    this.viewer.applyFormat({ bold: true });
  }

  /**
   * 处理斜体
   */
  private handleItalic(): void {
    this.viewer.applyFormat({ italic: true });
  }

  /**
   * 处理下划线
   */
  private handleUnderline(): void {
    this.viewer.applyFormat({ underline: true });
  }

  /**
   * 处理插入图片
   */
  private handleInsertImage(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        this.viewer.insertImage(file);
      }
    });

    input.click();
  }

  /**
   * 处理插入表格
   */
  private handleInsertTable(): void {
    // 显示表格配置对话框
    const rows = prompt('行数:', '3');
    const cols = prompt('列数:', '3');

    if (rows && cols) {
      logger.info('插入表格', { rows, cols });
      // 实际插入表格
    }
  }

  /**
   * 处理插入链接
   */
  private handleInsertLink(): void {
    const url = prompt('URL:', 'https://');
    const text = prompt('显示文本:', '');

    if (url) {
      logger.info('插入链接', { url });
      // 实际插入链接
    }
  }

  /**
   * 处理放大
   */
  private handleZoomIn(): void {
    const currentZoom = this.viewer.getZoom();
    this.viewer.setZoom(currentZoom + 0.1);
  }

  /**
   * 处理缩小
   */
  private handleZoomOut(): void {
    const currentZoom = this.viewer.getZoom();
    this.viewer.setZoom(currentZoom - 0.1);
  }

  /**
   * 更新工具栏项状态
   */
  updateItemState(itemId: string, state: Partial<ToolbarItem>): void {
    const button = this.toolbarElement?.querySelector(`#toolbar-${itemId}`);
    if (!button) return;

    if (state.disabled !== undefined) {
      (button as HTMLButtonElement).disabled = state.disabled;
    }

    if (state.label) {
      button.textContent = state.label;
    }
  }

  /**
   * 显示工具栏
   */
  show(): void {
    if (this.toolbarElement) {
      this.toolbarElement.style.display = '';
    }
  }

  /**
   * 隐藏工具栏
   */
  hide(): void {
    if (this.toolbarElement) {
      this.toolbarElement.style.display = 'none';
    }
  }

  /**
   * 切换主题
   */
  setTheme(theme: 'light' | 'dark'): void {
    this.options.theme = theme;

    if (this.toolbarElement) {
      this.toolbarElement.classList.remove('theme-light', 'theme-dark');
      this.toolbarElement.classList.add(`theme-${theme}`);

      // 重新应用样式
      this.toolbarElement.style.cssText = this.getToolbarStyles();
    }

    logger.info('工具栏主题已切换', { theme });
  }

  /**
   * 销毁工具栏
   */
  destroy(): void {
    if (this.toolbarElement && this.toolbarElement.parentNode) {
      this.toolbarElement.parentNode.removeChild(this.toolbarElement);
      this.toolbarElement = null;
    }

    this.keyboardManager.destroy();
    logger.info('工具栏已销毁');
  }
}

