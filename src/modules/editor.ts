/**
 * 文档编辑模块
 * 使用现代 API 替代已废弃的 execCommand
 */

import { TextFormat, InsertImageOptions, EditState, SelectionRange } from '../core/types';
import type { WordViewer } from '../core/WordViewer';
import {
  insertText as insertTextModern,
  insertHTML,
  applyFormat as applyFormatModern,
  setAlignment,
  createLink,
  insertList,
  getSelectionInfo,
} from '../utils/selection';
import { onPaste, copySelection, cutSelection } from '../utils/clipboard';
import { Logger } from '../utils/logger';

const logger = new Logger({ prefix: '[Editor]' });

export class EditorModule {
  private viewer: WordViewer;
  private isEnabled: boolean = false;
  private isDirty: boolean = false;
  private undoStack: string[] = [];
  private redoStack: string[] = [];
  private maxUndoSize: number = 50;
  private cleanupPaste?: () => void;

  constructor(viewer: WordViewer) {
    this.viewer = viewer;
  }

  /**
   * 启用编辑模式
   */
  enable(): void {
    if (this.isEnabled) return;

    const container = this.viewer.getContainer();
    const contentElement = container.querySelector('.viewer-content');

    if (contentElement) {
      contentElement.setAttribute('contenteditable', 'true');
      contentElement.classList.add('editable');

      // 监听内容变化
      contentElement.addEventListener('input', this.handleInput.bind(this));

      // 使用现代 Clipboard API 处理粘贴
      this.cleanupPaste = onPaste(contentElement as HTMLElement, this.handlePasteModern.bind(this));
    }

    this.isEnabled = true;
    this.saveState();
    logger.info('编辑模式已启用');
  }

  /**
   * 禁用编辑模式
   */
  disable(): void {
    if (!this.isEnabled) return;

    const container = this.viewer.getContainer();
    const contentElement = container.querySelector('.viewer-content');

    if (contentElement) {
      contentElement.setAttribute('contenteditable', 'false');
      contentElement.classList.remove('editable');
    }

    // 清理粘贴事件监听
    if (this.cleanupPaste) {
      this.cleanupPaste();
      this.cleanupPaste = undefined;
    }

    this.isEnabled = false;
    logger.info('编辑模式已禁用');
  }

  /**
   * 处理输入事件
   */
  private handleInput(): void {
    this.isDirty = true;
    this.saveState();
  }

  /**
   * 处理粘贴事件（使用现代 API）
   */
  private handlePasteModern(data: { text?: string; html?: string; files?: File[] }): void {
    logger.debug('处理粘贴', { hasText: !!data.text, hasHtml: !!data.html, hasFiles: !!data.files });

    // 优先使用 HTML（保留格式）
    if (data.html) {
      // 清理可能的危险 HTML
      const cleanHtml = this.sanitizeHTML(data.html);
      insertHTML(cleanHtml);
    } else if (data.text) {
      // 降级到纯文本
      insertTextModern(data.text);
    }

    // 处理文件（图片）
    if (data.files && data.files.length > 0) {
      data.files.forEach(file => {
        if (file.type.startsWith('image/')) {
          this.insertImage(file);
        }
      });
    }

    this.isDirty = true;
    this.saveState();
  }

  /**
   * 清理 HTML（防止 XSS）
   */
  private sanitizeHTML(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;

    // 移除脚本标签
    const scripts = div.querySelectorAll('script');
    scripts.forEach(script => script.remove());

    // 移除事件处理器
    const all = div.querySelectorAll('*');
    all.forEach(element => {
      Array.from(element.attributes).forEach(attr => {
        if (attr.name.startsWith('on')) {
          element.removeAttribute(attr.name);
        }
      });
    });

    return div.innerHTML;
  }

  /**
   * 插入文本（使用现代 API）
   */
  insertText(text: string, position?: number): void {
    this.ensureEnabled();

    try {
      insertTextModern(text);
      this.isDirty = true;
      this.saveState();
      logger.debug('插入文本', { length: text.length });
    } catch (error) {
      logger.error('插入文本失败', error);
      throw error;
    }
  }

  /**
   * 插入图片
   */
  async insertImage(image: File | Blob, options?: InsertImageOptions): Promise<void> {
    this.ensureEnabled();

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.src = e.target?.result as string;

      if (options?.width) {
        img.width = options.width;
      }
      if (options?.height) {
        img.height = options.height;
      }
      if (options?.alignment) {
        img.style.display = 'block';
        img.style.marginLeft = options.alignment === 'center' ? 'auto' : '0';
        img.style.marginRight = options.alignment === 'center' ? 'auto' :
          options.alignment === 'right' ? '0' : 'auto';
      }

      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.insertNode(img);
        range.collapse(false);
      }

      this.isDirty = true;
      this.saveState();
    };

    reader.readAsDataURL(image);
  }

  /**
   * 应用文本格式（使用现代 API）
   */
  applyFormat(format: TextFormat): void {
    this.ensureEnabled();

    try {
      // 使用现代 Selection API
      applyFormatModern({
        bold: format.bold,
        italic: format.italic,
        underline: format.underline,
        strikethrough: format.strikethrough,
        fontSize: format.fontSize,
        fontFamily: format.fontFamily,
        color: format.color,
        backgroundColor: format.backgroundColor,
      });

      // 处理对齐
      if (format.alignment) {
        setAlignment(format.alignment);
      }

      this.isDirty = true;
      this.saveState();
      logger.debug('应用格式', format);
    } catch (error) {
      logger.error('应用格式失败', error);
      throw error;
    }
  }

  /**
   * 获取选中文本（使用现代 API）
   */
  getSelection(): SelectionRange | null {
    const info = getSelectionInfo();
    if (!info) {
      return null;
    }

    return {
      start: info.startOffset,
      end: info.endOffset,
      text: info.text,
    };
  }

  /**
   * 复制选中内容
   */
  async copy(): Promise<void> {
    this.ensureEnabled();

    try {
      await copySelection();
      logger.info('已复制选中内容');
    } catch (error) {
      logger.error('复制失败', error);
      throw error;
    }
  }

  /**
   * 剪切选中内容
   */
  async cut(): Promise<void> {
    this.ensureEnabled();

    try {
      await cutSelection();
      this.isDirty = true;
      this.saveState();
      logger.info('已剪切选中内容');
    } catch (error) {
      logger.error('剪切失败', error);
      throw error;
    }
  }

  /**
   * 创建链接
   */
  createLink(url: string, text?: string): void {
    this.ensureEnabled();

    try {
      createLink(url, text);
      this.isDirty = true;
      this.saveState();
      logger.debug('创建链接', { url });
    } catch (error) {
      logger.error('创建链接失败', error);
      throw error;
    }
  }

  /**
   * 插入列表
   */
  insertList(type: 'ul' | 'ol'): void {
    this.ensureEnabled();

    try {
      insertList(type);
      this.isDirty = true;
      this.saveState();
      logger.debug('插入列表', { type });
    } catch (error) {
      logger.error('插入列表失败', error);
      throw error;
    }
  }

  /**
   * 撤销
   */
  undo(): void {
    this.ensureEnabled();

    if (this.undoStack.length > 1) {
      const currentState = this.undoStack.pop()!;
      this.redoStack.push(currentState);
      const previousState = this.undoStack[this.undoStack.length - 1];
      this.restoreState(previousState);
    }
  }

  /**
   * 重做
   */
  redo(): void {
    this.ensureEnabled();

    if (this.redoStack.length > 0) {
      const state = this.redoStack.pop()!;
      this.undoStack.push(state);
      this.restoreState(state);
    }
  }

  /**
   * 保存状态
   */
  private saveState(): void {
    const container = this.viewer.getContainer();
    const contentElement = container.querySelector('.viewer-content');

    if (contentElement) {
      const state = contentElement.innerHTML;

      // 避免重复保存相同状态
      if (this.undoStack[this.undoStack.length - 1] !== state) {
        this.undoStack.push(state);

        // 限制栈大小
        if (this.undoStack.length > this.maxUndoSize) {
          this.undoStack.shift();
        }

        // 清空重做栈
        this.redoStack = [];
      }
    }
  }

  /**
   * 恢复状态
   */
  private restoreState(state: string): void {
    const container = this.viewer.getContainer();
    const contentElement = container.querySelector('.viewer-content');

    if (contentElement) {
      contentElement.innerHTML = state;
    }
  }

  /**
   * 获取编辑状态
   */
  getState(): EditState {
    return {
      isEditing: this.isEnabled,
      isDirty: this.isDirty,
      canUndo: this.undoStack.length > 1,
      canRedo: this.redoStack.length > 0,
    };
  }

  /**
   * 确保编辑器已启用
   */
  private ensureEnabled(): void {
    if (!this.isEnabled) {
      throw new Error('编辑器未启用');
    }
  }

  /**
   * 销毁编辑器
   */
  destroy(): void {
    this.disable();
    this.undoStack = [];
    this.redoStack = [];
    this.isDirty = false;
    logger.info('编辑器已销毁');
  }
}



