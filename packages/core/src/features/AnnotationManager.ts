import type { WordDocument, AnnotationType, AnnotationItem, AnnotationStore } from '../types';
import { EventEmitter } from '../events/EventEmitter';
import { Icons, createIconElement } from '../utils/icons';

/**
 * 高亮颜色预设
 */
const HIGHLIGHT_COLORS = [
  { name: '黄色', value: '#fff176', background: 'rgba(255, 241, 118, 0.5)' },
  { name: '绿色', value: '#a5d6a7', background: 'rgba(165, 214, 167, 0.5)' },
  { name: '蓝色', value: '#90caf9', background: 'rgba(144, 202, 249, 0.5)' },
  { name: '粉色', value: '#f48fb1', background: 'rgba(244, 143, 177, 0.5)' },
  { name: '紫色', value: '#ce93d8', background: 'rgba(206, 147, 216, 0.5)' },
  { name: '橙色', value: '#ffcc80', background: 'rgba(255, 204, 128, 0.5)' }
];

/**
 * 批注管理器
 * 提供文本高亮、批注创建、颜色选择、持久化等功能
 */
export class AnnotationManager {
  private document: WordDocument | null = null;
  private container: HTMLElement | null = null;
  private eventEmitter: EventEmitter;
  private annotations: AnnotationItem[] = [];
  private panelElement: HTMLElement | null = null;
  private currentColor = HIGHLIGHT_COLORS[0];
  private classPrefix = 'wv';
  private storageKey = 'wv-annotations';
  private isEnabled = true;
  private toolbarElement: HTMLElement | null = null;

  constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter;
  }

  /**
   * 设置文档
   */
  setDocument(document: WordDocument, container: HTMLElement): void {
    this.document = document;
    this.container = container;
    this.loadAnnotations();
    this.renderAnnotations();
    this.setupSelectionListener();
  }

  /**
   * 加载标注
   */
  private loadAnnotations(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data: AnnotationStore = JSON.parse(stored);
        const documentId = this.getDocumentId();
        this.annotations = (data[documentId] || []).map((a) => ({
          ...a,
          createdAt: a.createdAt ? new Date(a.createdAt as any) : new Date(),
          updatedAt: a.updatedAt ? new Date(a.updatedAt as any) : undefined
        }));
      }
    } catch (error) {
      console.warn('加载标注失败:', error);
      this.annotations = [];
    }
  }

  /**
   * 保存标注
   */
  private saveAnnotations(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      const data: AnnotationStore = stored ? JSON.parse(stored) : {};
      const documentId = this.getDocumentId();
      data[documentId] = this.annotations;
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('保存标注失败:', error);
    }
  }

  /**
   * 获取文档 ID
   */
  private getDocumentId(): string {
    if (this.document?.metadata?.title) {
      return this.document.metadata.title;
    }
    return 'default';
  }

  /**
   * 设置选区监听
   */
  private setupSelectionListener(): void {
    if (!this.container) return;

    this.container.addEventListener('mouseup', () => {
      if (!this.isEnabled) return;
      
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed && selection.toString().trim()) {
        this.showToolbar(selection);
      } else {
        this.hideToolbar();
      }
    });

    // 点击其他区域隐藏工具栏
    document.addEventListener('mousedown', (e) => {
      if (this.toolbarElement && !this.toolbarElement.contains(e.target as Node)) {
        this.hideToolbar();
      }
    });
  }

  /**
   * 显示工具栏
   */
  private showToolbar(selection: Selection): void {
    this.hideToolbar();

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    const toolbar = document.createElement('div');
    toolbar.className = `${this.classPrefix}-annotation-toolbar`;

    Object.assign(toolbar.style, {
      position: 'fixed',
      zIndex: '10002',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '6px 8px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      border: '1px solid #e0e0e0'
    });

    // 高亮颜色按钮
    for (const color of HIGHLIGHT_COLORS) {
      const btn = document.createElement('button');
      btn.title = color.name;
      
      Object.assign(btn.style, {
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        border: color === this.currentColor ? '2px solid #333' : '1px solid #ddd',
        backgroundColor: color.value,
        cursor: 'pointer',
        padding: '0'
      });

      btn.addEventListener('click', () => {
        this.currentColor = color;
        this.addHighlight(selection, 'highlight');
        this.hideToolbar();
      });

      toolbar.appendChild(btn);
    }

    // 分隔线
    const separator = document.createElement('div');
    Object.assign(separator.style, {
      width: '1px',
      height: '20px',
      backgroundColor: '#ddd',
      margin: '0 4px'
    });
    toolbar.appendChild(separator);

    // 添加批注按钮
    const noteBtn = document.createElement('button');
    noteBtn.title = '添加批注';
    noteBtn.appendChild(createIconElement(Icons.edit, { size: 16 }));
    
    Object.assign(noteBtn.style, {
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

    noteBtn.addEventListener('mouseenter', () => {
      noteBtn.style.backgroundColor = '#f0f0f0';
    });
    noteBtn.addEventListener('mouseleave', () => {
      noteBtn.style.backgroundColor = 'transparent';
    });
    noteBtn.addEventListener('click', () => {
      this.showNoteDialog(selection);
      this.hideToolbar();
    });

    toolbar.appendChild(noteBtn);

    // 定位
    let left = rect.left + rect.width / 2 - 100;
    let top = rect.top - 50;

    if (left < 8) left = 8;
    if (left + 200 > window.innerWidth - 8) {
      left = window.innerWidth - 208;
    }
    if (top < 8) {
      top = rect.bottom + 8;
    }

    toolbar.style.left = `${left}px`;
    toolbar.style.top = `${top}px`;

    document.body.appendChild(toolbar);
    this.toolbarElement = toolbar;
  }

  /**
   * 隐藏工具栏
   */
  private hideToolbar(): void {
    if (this.toolbarElement) {
      this.toolbarElement.remove();
      this.toolbarElement = null;
    }
  }

  /**
   * 添加高亮
   */
  private addHighlight(selection: Selection, type: AnnotationType): void {
    const range = selection.getRangeAt(0);
    const text = selection.toString().trim();
    
    if (!text) return;

    // 创建高亮元素
    const highlight = document.createElement('span');
    highlight.className = `${this.classPrefix}-annotation ${this.classPrefix}-annotation-${type}`;
    highlight.style.backgroundColor = this.currentColor.background;
    highlight.style.borderRadius = '2px';
    highlight.style.cursor = 'pointer';

    const id = `ann-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    highlight.dataset.annotationId = id;

    try {
      range.surroundContents(highlight);
    } catch {
      // 如果选区跨越多个元素，使用替代方案
      const fragment = range.extractContents();
      highlight.appendChild(fragment);
      range.insertNode(highlight);
    }

    // 保存标注
    const annotation: AnnotationItem = {
      id,
      type,
      text,
      color: this.currentColor.value,
      pageIndex: this.getCurrentPageIndex(),
      createdAt: new Date()
    };

    this.annotations.push(annotation);
    this.saveAnnotations();
    this.updatePanel();

    // 添加交互
    this.setupAnnotationInteraction(highlight, annotation);

    // 清除选区
    selection.removeAllRanges();

    // 触发事件
    this.eventEmitter.emit('annotation', {
      type: 'annotation',
      timestamp: Date.now(),
      action: 'add',
      annotationId: id,
      annotationType: type
    });
  }

  /**
   * 获取当前页面索引
   */
  private getCurrentPageIndex(): number {
    if (!this.container) return 0;

    const pages = this.container.querySelectorAll(`.${this.classPrefix}-page`);
    const containerRect = this.container.getBoundingClientRect();
    const centerY = containerRect.top + containerRect.height / 2;

    let currentIndex = 0;
    pages.forEach((page, index) => {
      const pageRect = page.getBoundingClientRect();
      if (pageRect.top <= centerY && pageRect.bottom >= centerY) {
        currentIndex = index;
      }
    });

    return currentIndex;
  }

  /**
   * 设置标注交互
   */
  private setupAnnotationInteraction(
    element: HTMLElement,
    annotation: AnnotationItem
  ): void {
    // 悬停效果
    element.addEventListener('mouseenter', () => {
      element.style.backgroundColor = this.currentColor.value;
    });

    element.addEventListener('mouseleave', () => {
      const color = HIGHLIGHT_COLORS.find((c) => c.value === annotation.color);
      element.style.backgroundColor = color?.background || this.currentColor.background;
    });

    // 右键菜单
    element.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.showContextMenu(e, annotation);
    });
  }

  /**
   * 显示右键菜单
   */
  private showContextMenu(event: MouseEvent, annotation: AnnotationItem): void {
    // 移除已有菜单
    document.querySelectorAll(`.${this.classPrefix}-annotation-menu`).forEach((el) => {
      el.remove();
    });

    const menu = document.createElement('div');
    menu.className = `${this.classPrefix}-annotation-menu`;

    Object.assign(menu.style, {
      position: 'fixed',
      zIndex: '10003',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      border: '1px solid #e0e0e0',
      padding: '4px 0',
      minWidth: '120px'
    });

    // 更改颜色
    const colorItem = this.createMenuItem('更改颜色', Icons.palette, () => {
      this.showColorPicker(event, annotation);
    });
    menu.appendChild(colorItem);

    // 添加批注
    if (!annotation.note) {
      const noteItem = this.createMenuItem('添加批注', Icons.edit, () => {
        this.editNote(annotation);
      });
      menu.appendChild(noteItem);
    } else {
      const editNoteItem = this.createMenuItem('编辑批注', Icons.edit, () => {
        this.editNote(annotation);
      });
      menu.appendChild(editNoteItem);
    }

    // 删除
    const deleteItem = this.createMenuItem('删除', Icons.trash2, () => {
      this.removeAnnotation(annotation.id);
    });
    deleteItem.style.color = '#d32f2f';
    menu.appendChild(deleteItem);

    // 定位
    menu.style.left = `${event.clientX}px`;
    menu.style.top = `${event.clientY}px`;

    document.body.appendChild(menu);

    // 点击其他区域关闭
    const closeMenu = (e: MouseEvent) => {
      if (!menu.contains(e.target as Node)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    };
    setTimeout(() => {
      document.addEventListener('click', closeMenu);
    }, 0);
  }

  /**
   * 创建菜单项
   */
  private createMenuItem(
    label: string,
    icon: string,
    onClick: () => void
  ): HTMLElement {
    const item = document.createElement('div');
    item.className = `${this.classPrefix}-menu-item`;

    Object.assign(item.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      cursor: 'pointer',
      fontSize: '14px',
      color: '#333'
    });

    const iconEl = createIconElement(icon, { size: 16 });
    iconEl.style.color = '#666';
    item.appendChild(iconEl);

    const text = document.createElement('span');
    text.textContent = label;
    item.appendChild(text);

    item.addEventListener('mouseenter', () => {
      item.style.backgroundColor = '#f5f5f5';
    });
    item.addEventListener('mouseleave', () => {
      item.style.backgroundColor = 'transparent';
    });
    item.addEventListener('click', () => {
      onClick();
      // 关闭菜单
      item.closest(`.${this.classPrefix}-annotation-menu`)?.remove();
    });

    return item;
  }

  /**
   * 显示颜色选择器
   */
  private showColorPicker(event: MouseEvent, annotation: AnnotationItem): void {
    const picker = document.createElement('div');
    picker.className = `${this.classPrefix}-color-picker`;

    Object.assign(picker.style, {
      position: 'fixed',
      zIndex: '10004',
      display: 'flex',
      gap: '4px',
      padding: '8px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      border: '1px solid #e0e0e0'
    });

    for (const color of HIGHLIGHT_COLORS) {
      const btn = document.createElement('button');
      btn.title = color.name;

      Object.assign(btn.style, {
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        border: color.value === annotation.color ? '2px solid #333' : '1px solid #ddd',
        backgroundColor: color.value,
        cursor: 'pointer',
        padding: '0'
      });

      btn.addEventListener('click', () => {
        this.changeAnnotationColor(annotation.id, color.value);
        picker.remove();
      });

      picker.appendChild(btn);
    }

    picker.style.left = `${event.clientX}px`;
    picker.style.top = `${event.clientY}px`;

    document.body.appendChild(picker);

    // 点击其他区域关闭
    const closePicker = (e: MouseEvent) => {
      if (!picker.contains(e.target as Node)) {
        picker.remove();
        document.removeEventListener('click', closePicker);
      }
    };
    setTimeout(() => {
      document.addEventListener('click', closePicker);
    }, 0);
  }

  /**
   * 更改标注颜色
   */
  private changeAnnotationColor(id: string, color: string): void {
    const annotation = this.annotations.find((a) => a.id === id);
    if (!annotation) return;

    annotation.color = color;
    annotation.updatedAt = new Date();
    this.saveAnnotations();

    // 更新 DOM
    const element = this.container?.querySelector(
      `[data-annotation-id="${id}"]`
    ) as HTMLElement;
    
    if (element) {
      const colorObj = HIGHLIGHT_COLORS.find((c) => c.value === color);
      if (colorObj) {
        element.style.backgroundColor = colorObj.background;
      }
    }

    this.updatePanel();
  }

  /**
   * 显示批注对话框
   */
  private showNoteDialog(selection: Selection): void {
    const range = selection.getRangeAt(0);
    const text = selection.toString().trim();

    if (!text) return;

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
      zIndex: '10005'
    });

    const dialog = document.createElement('div');
    dialog.className = `${this.classPrefix}-dialog`;
    Object.assign(dialog.style, {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      width: '400px',
      maxWidth: '90vw',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
    });

    const title = document.createElement('h3');
    title.textContent = '添加批注';
    Object.assign(title.style, {
      margin: '0 0 16px 0',
      fontSize: '16px',
      fontWeight: '600'
    });
    dialog.appendChild(title);

    // 选中文本预览
    const preview = document.createElement('div');
    preview.textContent = `"${text.length > 100 ? text.substring(0, 100) + '...' : text}"`;
    Object.assign(preview.style, {
      backgroundColor: '#f5f5f5',
      padding: '10px',
      borderRadius: '6px',
      fontSize: '13px',
      color: '#666',
      marginBottom: '16px',
      fontStyle: 'italic',
      lineHeight: '1.5'
    });
    dialog.appendChild(preview);

    // 批注输入
    const textarea = document.createElement('textarea');
    textarea.placeholder = '输入批注内容...';
    Object.assign(textarea.style, {
      width: '100%',
      height: '100px',
      padding: '10px',
      border: '1px solid #ddd',
      borderRadius: '6px',
      fontSize: '14px',
      resize: 'vertical',
      boxSizing: 'border-box',
      marginBottom: '16px'
    });
    dialog.appendChild(textarea);

    // 颜色选择
    const colorSection = document.createElement('div');
    colorSection.style.marginBottom = '16px';

    const colorLabel = document.createElement('div');
    colorLabel.textContent = '高亮颜色';
    Object.assign(colorLabel.style, {
      fontSize: '13px',
      color: '#666',
      marginBottom: '8px'
    });
    colorSection.appendChild(colorLabel);

    const colorPicker = document.createElement('div');
    colorPicker.style.display = 'flex';
    colorPicker.style.gap = '6px';

    let selectedColor = this.currentColor;

    for (const color of HIGHLIGHT_COLORS) {
      const btn = document.createElement('button');
      btn.title = color.name;

      Object.assign(btn.style, {
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        border: color === selectedColor ? '2px solid #333' : '1px solid #ddd',
        backgroundColor: color.value,
        cursor: 'pointer',
        padding: '0'
      });

      btn.addEventListener('click', () => {
        selectedColor = color;
        colorPicker.querySelectorAll('button').forEach((b) => {
          (b as HTMLElement).style.border = '1px solid #ddd';
        });
        btn.style.border = '2px solid #333';
      });

      colorPicker.appendChild(btn);
    }

    colorSection.appendChild(colorPicker);
    dialog.appendChild(colorSection);

    // 按钮
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
      borderRadius: '6px',
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
      borderRadius: '6px',
      backgroundColor: '#1976d2',
      color: 'white',
      cursor: 'pointer',
      fontSize: '14px'
    });
    confirmBtn.addEventListener('click', () => {
      this.currentColor = selectedColor;
      
      // 重新创建选区
      const newSelection = window.getSelection();
      newSelection?.removeAllRanges();
      newSelection?.addRange(range);
      
      this.addHighlight(newSelection!, 'note');
      
      // 添加批注内容
      const note = textarea.value.trim();
      if (note) {
        const annotation = this.annotations[this.annotations.length - 1];
        if (annotation) {
          annotation.note = note;
          this.saveAnnotations();
          this.updatePanel();
        }
      }
      
      overlay.remove();
    });

    buttons.appendChild(cancelBtn);
    buttons.appendChild(confirmBtn);
    dialog.appendChild(buttons);

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    textarea.focus();

    // ESC 关闭
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        overlay.remove();
        document.removeEventListener('keydown', handleKeydown);
      }
    };
    document.addEventListener('keydown', handleKeydown);

    // 点击遮罩关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });
  }

  /**
   * 编辑批注
   */
  private editNote(annotation: AnnotationItem): void {
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
      zIndex: '10005'
    });

    const dialog = document.createElement('div');
    Object.assign(dialog.style, {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      width: '400px',
      maxWidth: '90vw',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
    });

    const title = document.createElement('h3');
    title.textContent = annotation.note ? '编辑批注' : '添加批注';
    Object.assign(title.style, {
      margin: '0 0 16px 0',
      fontSize: '16px',
      fontWeight: '600'
    });
    dialog.appendChild(title);

    const textarea = document.createElement('textarea');
    textarea.value = annotation.note || '';
    textarea.placeholder = '输入批注内容...';
    Object.assign(textarea.style, {
      width: '100%',
      height: '120px',
      padding: '10px',
      border: '1px solid #ddd',
      borderRadius: '6px',
      fontSize: '14px',
      resize: 'vertical',
      boxSizing: 'border-box',
      marginBottom: '16px'
    });
    dialog.appendChild(textarea);

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
      borderRadius: '6px',
      backgroundColor: 'white',
      cursor: 'pointer',
      fontSize: '14px'
    });
    cancelBtn.addEventListener('click', () => overlay.remove());

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = '保存';
    Object.assign(confirmBtn.style, {
      padding: '8px 16px',
      border: 'none',
      borderRadius: '6px',
      backgroundColor: '#1976d2',
      color: 'white',
      cursor: 'pointer',
      fontSize: '14px'
    });
    confirmBtn.addEventListener('click', () => {
      annotation.note = textarea.value.trim() || undefined;
      annotation.updatedAt = new Date();
      this.saveAnnotations();
      this.updatePanel();
      overlay.remove();
    });

    buttons.appendChild(cancelBtn);
    buttons.appendChild(confirmBtn);
    dialog.appendChild(buttons);

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    textarea.focus();
  }

  /**
   * 删除标注
   */
  removeAnnotation(id: string): void {
    const index = this.annotations.findIndex((a) => a.id === id);
    if (index === -1) return;

    // 移除 DOM 元素
    const element = this.container?.querySelector(`[data-annotation-id="${id}"]`);
    if (element) {
      const parent = element.parentNode;
      while (element.firstChild) {
        parent?.insertBefore(element.firstChild, element);
      }
      element.remove();
    }

    this.annotations.splice(index, 1);
    this.saveAnnotations();
    this.updatePanel();

    this.eventEmitter.emit('annotation', {
      type: 'annotation',
      timestamp: Date.now(),
      action: 'remove',
      annotationId: id
    });
  }

  /**
   * 渲染现有标注
   */
  private renderAnnotations(): void {
    // 标注从 DOM 中保存时已经有了，这里主要是设置交互
    if (!this.container) return;

    for (const annotation of this.annotations) {
      const element = this.container.querySelector(
        `[data-annotation-id="${annotation.id}"]`
      ) as HTMLElement;
      
      if (element) {
        this.setupAnnotationInteraction(element, annotation);
      }
    }
  }

  /**
   * 获取所有标注
   */
  getAllAnnotations(): AnnotationItem[] {
    return [...this.annotations];
  }

  /**
   * 导出标注
   */
  exportAnnotations(): string {
    return JSON.stringify(this.annotations, null, 2);
  }

  /**
   * 导入标注
   */
  importAnnotations(json: string): void {
    try {
      const imported = JSON.parse(json) as AnnotationItem[];
      this.annotations = [...this.annotations, ...imported];
      this.saveAnnotations();
      this.updatePanel();
    } catch (error) {
      console.error('导入标注失败:', error);
    }
  }

  /**
   * 渲染面板
   */
  renderPanel(targetContainer: HTMLElement): HTMLElement {
    const panel = document.createElement('div');
    panel.className = `${this.classPrefix}-annotation-panel`;

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
    Object.assign(header.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '12px'
    });

    const title = document.createElement('h3');
    title.textContent = '标注';
    Object.assign(title.style, {
      margin: '0',
      fontSize: '14px',
      fontWeight: '600',
      color: '#333'
    });

    header.appendChild(title);
    panel.appendChild(header);

    // 列表
    const list = document.createElement('div');
    list.className = `${this.classPrefix}-annotation-list`;
    this.renderAnnotationList(list);
    panel.appendChild(list);

    this.panelElement = panel;
    targetContainer.appendChild(panel);

    return panel;
  }

  /**
   * 渲染标注列表
   */
  private renderAnnotationList(container: HTMLElement): void {
    container.innerHTML = '';

    if (this.annotations.length === 0) {
      const empty = document.createElement('div');
      empty.textContent = '暂无标注';
      Object.assign(empty.style, {
        textAlign: 'center',
        color: '#999',
        padding: '20px',
        fontSize: '14px'
      });
      container.appendChild(empty);
      return;
    }

    for (const annotation of this.annotations) {
      const item = this.createAnnotationListItem(annotation);
      container.appendChild(item);
    }
  }

  /**
   * 创建标注列表项
   */
  private createAnnotationListItem(annotation: AnnotationItem): HTMLElement {
    const item = document.createElement('div');
    item.className = `${this.classPrefix}-annotation-list-item`;

    Object.assign(item.style, {
      padding: '12px',
      backgroundColor: 'white',
      borderRadius: '8px',
      marginBottom: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
      cursor: 'pointer'
    });

    // 颜色指示器
    const colorBar = document.createElement('div');
    Object.assign(colorBar.style, {
      width: '4px',
      height: '100%',
      backgroundColor: annotation.color,
      borderRadius: '2px',
      position: 'absolute',
      left: '0',
      top: '0'
    });
    item.style.position = 'relative';
    item.style.paddingLeft = '16px';
    item.appendChild(colorBar);

    // 文本
    const text = document.createElement('div');
    text.textContent = annotation.text.length > 80
      ? annotation.text.substring(0, 80) + '...'
      : annotation.text;
    Object.assign(text.style, {
      fontSize: '14px',
      color: '#333',
      marginBottom: annotation.note ? '8px' : '0'
    });
    item.appendChild(text);

    // 批注
    if (annotation.note) {
      const note = document.createElement('div');
      note.textContent = annotation.note;
      Object.assign(note.style, {
        fontSize: '13px',
        color: '#666',
        backgroundColor: '#f5f5f5',
        padding: '8px',
        borderRadius: '4px'
      });
      item.appendChild(note);
    }

    // 点击定位
    item.addEventListener('click', () => {
      const element = this.container?.querySelector(
        `[data-annotation-id="${annotation.id}"]`
      );
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        (element as HTMLElement).style.backgroundColor = annotation.color;
        setTimeout(() => {
          const color = HIGHLIGHT_COLORS.find((c) => c.value === annotation.color);
          (element as HTMLElement).style.backgroundColor = color?.background || '';
        }, 1000);
      }
    });

    return item;
  }

  /**
   * 更新面板
   */
  private updatePanel(): void {
    if (!this.panelElement) return;

    const list = this.panelElement.querySelector(`.${this.classPrefix}-annotation-list`);
    if (list) {
      this.renderAnnotationList(list as HTMLElement);
    }
  }

  /**
   * 切换启用状态
   */
  toggle(): boolean {
    this.isEnabled = !this.isEnabled;
    return this.isEnabled;
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.hideToolbar();

    if (this.panelElement && this.panelElement.parentNode) {
      this.panelElement.parentNode.removeChild(this.panelElement);
    }

    this.annotations = [];
    this.document = null;
    this.container = null;
    this.panelElement = null;
  }
}
