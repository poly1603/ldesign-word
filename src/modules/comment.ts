/**
 * 批注模块
 * 支持文档批注的添加、回复和管理
 */

import { Logger } from '../utils/logger';
import { OperationError } from '../core/errors';

const logger = new Logger({ prefix: '[Comment]' });

export interface Comment {
  id: string;
  text: string;
  author: string;
  timestamp: number;
  range?: {
    startOffset: number;
    endOffset: number;
    selectedText: string;
  };
  replies: CommentReply[];
  resolved: boolean;
  position?: {
    x: number;
    y: number;
  };
}

export interface CommentReply {
  id: string;
  text: string;
  author: string;
  timestamp: number;
}

export interface CommentOptions {
  author?: string;
  autoPosition?: boolean;
}

/**
 * 批注管理器
 */
export class CommentManager {
  private comments: Map<string, Comment> = new Map();
  private commentElements: Map<string, HTMLElement> = new Map();
  private container: HTMLElement | null = null;
  private options: CommentOptions;

  constructor(container: HTMLElement, options: CommentOptions = {}) {
    this.container = container;
    this.options = {
      author: options.author || '匿名用户',
      autoPosition: options.autoPosition !== false,
    };
  }

  /**
   * 添加批注
   */
  addComment(text: string, range?: Range): Comment {
    const id = this.generateId();

    const comment: Comment = {
      id,
      text,
      author: this.options.author || '匿名用户',
      timestamp: Date.now(),
      replies: [],
      resolved: false,
    };

    // 如果有选区，保存选区信息
    if (range) {
      const selectedText = range.toString();
      comment.range = {
        startOffset: range.startOffset,
        endOffset: range.endOffset,
        selectedText,
      };

      // 高亮选区
      this.highlightRange(range, id);

      // 计算批注位置
      if (this.options.autoPosition) {
        const rect = range.getBoundingClientRect();
        comment.position = {
          x: rect.right + 10,
          y: rect.top,
        };
      }
    }

    this.comments.set(id, comment);
    this.renderComment(comment);

    logger.info('添加批注', { id, text });
    return comment;
  }

  /**
   * 回复批注
   */
  replyComment(commentId: string, text: string): CommentReply {
    const comment = this.comments.get(commentId);
    if (!comment) {
      throw new OperationError('批注不存在', 'replyComment', { commentId });
    }

    const reply: CommentReply = {
      id: this.generateId(),
      text,
      author: this.options.author || '匿名用户',
      timestamp: Date.now(),
    };

    comment.replies.push(reply);
    this.updateCommentElement(comment);

    logger.info('回复批注', { commentId, replyId: reply.id });
    return reply;
  }

  /**
   * 解决批注
   */
  resolveComment(commentId: string): void {
    const comment = this.comments.get(commentId);
    if (!comment) {
      throw new OperationError('批注不存在', 'resolveComment', { commentId });
    }

    comment.resolved = true;
    this.updateCommentElement(comment);

    // 移除高亮
    this.removeHighlight(commentId);

    logger.info('批注已解决', { commentId });
  }

  /**
   * 删除批注
   */
  deleteComment(commentId: string): void {
    const comment = this.comments.get(commentId);
    if (!comment) {
      throw new OperationError('批注不存在', 'deleteComment', { commentId });
    }

    // 移除 DOM 元素
    const element = this.commentElements.get(commentId);
    if (element) {
      element.remove();
      this.commentElements.delete(commentId);
    }

    // 移除高亮
    this.removeHighlight(commentId);

    // 移除数据
    this.comments.delete(commentId);

    logger.info('批注已删除', { commentId });
  }

  /**
   * 获取所有批注
   */
  getAllComments(): Comment[] {
    return Array.from(this.comments.values());
  }

  /**
   * 获取未解决的批注
   */
  getUnresolvedComments(): Comment[] {
    return this.getAllComments().filter(c => !c.resolved);
  }

  /**
   * 高亮选区
   */
  private highlightRange(range: Range, commentId: string): void {
    try {
      const span = document.createElement('span');
      span.className = 'comment-highlight';
      span.dataset.commentId = commentId;
      span.style.backgroundColor = 'rgba(255, 255, 0, 0.3)';
      span.style.cursor = 'pointer';

      range.surroundContents(span);

      // 点击高亮区域显示批注
      span.addEventListener('click', () => {
        this.showComment(commentId);
      });
    } catch (error) {
      logger.warn('无法高亮选区', error);
    }
  }

  /**
   * 移除高亮
   */
  private removeHighlight(commentId: string): void {
    if (!this.container) return;

    const highlights = this.container.querySelectorAll(
      `[data-comment-id="${commentId}"]`
    );

    highlights.forEach(highlight => {
      const parent = highlight.parentNode;
      if (parent) {
        const text = highlight.textContent || '';
        parent.replaceChild(document.createTextNode(text), highlight);
      }
    });
  }

  /**
   * 渲染批注元素
   */
  private renderComment(comment: Comment): void {
    if (!this.container) return;

    const element = document.createElement('div');
    element.className = 'word-comment';
    element.dataset.commentId = comment.id;
    element.style.cssText = `
      position: absolute;
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      max-width: 300px;
      z-index: 1000;
    `;

    if (comment.position) {
      element.style.left = `${comment.position.x}px`;
      element.style.top = `${comment.position.y}px`;
    }

    element.innerHTML = this.getCommentHTML(comment);

    this.container.appendChild(element);
    this.commentElements.set(comment.id, element);
  }

  /**
   * 更新批注元素
   */
  private updateCommentElement(comment: Comment): void {
    const element = this.commentElements.get(comment.id);
    if (element) {
      element.innerHTML = this.getCommentHTML(comment);
    }
  }

  /**
   * 获取批注 HTML
   */
  private getCommentHTML(comment: Comment): string {
    const resolvedClass = comment.resolved ? 'resolved' : '';
    const repliesHTML = comment.replies
      .map(
        reply => `
        <div class="comment-reply" style="margin-left: 16px; margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
          <div style="font-size: 12px; color: #666;">
            <strong>${this.escapeHTML(reply.author)}</strong>
            <span>${new Date(reply.timestamp).toLocaleString()}</span>
          </div>
          <div style="margin-top: 4px;">${this.escapeHTML(reply.text)}</div>
        </div>
      `
      )
      .join('');

    return `
      <div class="comment-header" style="margin-bottom: 8px;">
        <div style="font-size: 12px; color: #666;">
          <strong>${this.escapeHTML(comment.author)}</strong>
          <span>${new Date(comment.timestamp).toLocaleString()}</span>
        </div>
        ${comment.resolved ? '<span style="color: green; font-size: 12px;">✓ 已解决</span>' : ''}
      </div>
      <div class="comment-body" style="margin-bottom: 8px;">
        ${this.escapeHTML(comment.text)}
      </div>
      ${repliesHTML}
      <div class="comment-actions" style="margin-top: 8px; display: flex; gap: 8px;">
        ${!comment.resolved ? `<button onclick="window.replyComment('${comment.id}')" style="font-size: 12px;">回复</button>` : ''}
        ${!comment.resolved ? `<button onclick="window.resolveComment('${comment.id}')" style="font-size: 12px;">解决</button>` : ''}
        <button onclick="window.deleteComment('${comment.id}')" style="font-size: 12px;">删除</button>
      </div>
    `;
  }

  /**
   * 显示批注
   */
  private showComment(commentId: string): void {
    const element = this.commentElements.get(commentId);
    if (element) {
      element.style.display = 'block';
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  /**
   * 隐藏批注
   */
  hideComment(commentId: string): void {
    const element = this.commentElements.get(commentId);
    if (element) {
      element.style.display = 'none';
    }
  }

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 转义 HTML
   */
  private escapeHTML(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 清理所有批注
   */
  clear(): void {
    this.comments.clear();
    this.commentElements.forEach(element => element.remove());
    this.commentElements.clear();

    // 移除所有高亮
    if (this.container) {
      const highlights = this.container.querySelectorAll('.comment-highlight');
      highlights.forEach(highlight => {
        const parent = highlight.parentNode;
        if (parent) {
          const text = highlight.textContent || '';
          parent.replaceChild(document.createTextNode(text), highlight);
        }
      });
    }

    logger.info('所有批注已清理');
  }
}

