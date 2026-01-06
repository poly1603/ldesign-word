import type { WordDocument, CommentDisplayConfig } from '../types';
import { EventEmitter } from '../events/EventEmitter';
import { Icons, createIconElement } from '../utils/icons';

/**
 * 批注项
 */
interface CommentItem {
  id: string;
  author: string;
  date?: Date;
  text: string;
  rangeStart?: string;
  rangeEnd?: string;
  replies?: CommentItem[];
  resolved?: boolean;
}

/**
 * 批注管理器
 * 提供文档批注显示、高亮、关联文本等功能
 */
export class CommentManager {
  private document: WordDocument | null = null;
  private container: HTMLElement | null = null;
  private eventEmitter: EventEmitter;
  private comments: CommentItem[] = [];
  private panelElement: HTMLElement | null = null;
  private showResolved = false;
  private highlightEnabled = true;
  private classPrefix = 'wv';
  private config: CommentDisplayConfig = {
    showAuthor: true,
    showDate: true,
    showResolved: false,
    highlightAssociated: true
  };

  constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter;
  }

  /**
   * 设置配置
   */
  setConfig(config: Partial<CommentDisplayConfig>): void {
    this.config = { ...this.config, ...config };
    this.showResolved = config.showResolved ?? this.showResolved;
    this.highlightEnabled = config.highlightAssociated ?? this.highlightEnabled;
    this.updatePanel();
  }

  /**
   * 设置文档
   */
  setDocument(document: WordDocument, container: HTMLElement): void {
    this.document = document;
    this.container = container;
    this.extractComments();
    this.renderCommentMarkers();
  }

  /**
   * 提取文档批注
   */
  private extractComments(): void {
    if (!this.document) return;

    this.comments = [];

    // 从文档中提取批注（通常在 settings 或专门的批注部分）
    // Word 文档的批注存储在 comments.xml 中
    // 这里通过遍历文档内容查找批注引用
    for (const section of this.document.sections) {
      for (const content of section.content) {
        if (content.type === 'paragraph') {
          const paragraph = content as any;
          
          // 检查段落中的批注
          if (paragraph.comments) {
            for (const comment of paragraph.comments) {
              this.comments.push({
                id: comment.id || `comment-${Date.now()}-${Math.random()}`,
                author: comment.author || '匿名',
                date: comment.date ? new Date(comment.date) : undefined,
                text: comment.text || '',
                rangeStart: comment.rangeStart,
                rangeEnd: comment.rangeEnd,
                replies: comment.replies || [],
                resolved: comment.resolved || false
              });
            }
          }
        }
      }
    }
  }

  /**
   * 渲染批注标记
   */
  private renderCommentMarkers(): void {
    if (!this.container || !this.highlightEnabled) return;

    // 移除旧标记
    this.container.querySelectorAll(`.${this.classPrefix}-comment-marker`).forEach((el) => {
      el.remove();
    });

    // 添加新标记
    for (const comment of this.comments) {
      if (!this.showResolved && comment.resolved) continue;
      
      this.addCommentMarker(comment);
    }
  }

  /**
   * 添加批注标记
   */
  private addCommentMarker(comment: CommentItem): void {
    if (!this.container) return;

    // 查找批注关联的元素
    const rangeElement = this.container.querySelector(
      `[data-comment-range-start="${comment.id}"]`
    );

    if (rangeElement) {
      // 高亮批注范围
      rangeElement.classList.add(`${this.classPrefix}-comment-highlighted`);
      
      // 添加内联样式
      const el = rangeElement as HTMLElement;
      el.style.backgroundColor = 'rgba(255, 235, 59, 0.3)';
      el.style.borderBottom = '2px solid #ffc107';
      el.style.cursor = 'pointer';
      el.title = `${comment.author}: ${comment.text.substring(0, 50)}...`;

      // 点击显示批注
      el.addEventListener('click', () => {
        this.scrollToComment(comment.id);
        this.eventEmitter.emit('comment', {
          type: 'comment',
          timestamp: Date.now(),
          action: 'click',
          commentId: comment.id
        });
      });
    }
  }

  /**
   * 获取所有批注
   */
  getAllComments(): CommentItem[] {
    return this.showResolved
      ? [...this.comments]
      : this.comments.filter((c) => !c.resolved);
  }

  /**
   * 获取批注数量
   */
  getCommentCount(): { total: number; resolved: number; unresolved: number } {
    const resolved = this.comments.filter((c) => c.resolved).length;
    return {
      total: this.comments.length,
      resolved,
      unresolved: this.comments.length - resolved
    };
  }

  /**
   * 切换显示已解决批注
   */
  toggleShowResolved(): boolean {
    this.showResolved = !this.showResolved;
    this.renderCommentMarkers();
    this.updatePanel();
    return this.showResolved;
  }

  /**
   * 切换高亮
   */
  toggleHighlight(): boolean {
    this.highlightEnabled = !this.highlightEnabled;
    this.renderCommentMarkers();
    return this.highlightEnabled;
  }

  /**
   * 滚动到批注
   */
  scrollToComment(commentId: string): void {
    if (!this.panelElement) return;

    const commentEl = this.panelElement.querySelector(
      `[data-comment-id="${commentId}"]`
    );
    
    if (commentEl) {
      commentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      this.highlightCommentItem(commentEl as HTMLElement);
    }
  }

  /**
   * 高亮批注项
   */
  private highlightCommentItem(element: HTMLElement): void {
    const originalBg = element.style.backgroundColor;
    element.style.backgroundColor = '#e3f2fd';
    element.style.transition = 'background-color 0.3s';

    setTimeout(() => {
      element.style.backgroundColor = originalBg;
    }, 2000);
  }

  /**
   * 导航到批注关联文本
   */
  navigateToCommentText(commentId: string): void {
    if (!this.container) return;

    const rangeElement = this.container.querySelector(
      `[data-comment-range-start="${commentId}"]`
    );

    if (rangeElement) {
      rangeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // 闪烁高亮
      const el = rangeElement as HTMLElement;
      const originalBg = el.style.backgroundColor;
      el.style.backgroundColor = '#fff176';
      
      setTimeout(() => {
        el.style.backgroundColor = originalBg;
      }, 2000);

      this.eventEmitter.emit('comment', {
        type: 'comment',
        timestamp: Date.now(),
        action: 'navigate',
        commentId
      });
    }
  }

  /**
   * 渲染批注面板
   */
  renderPanel(targetContainer: HTMLElement): HTMLElement {
    const panel = document.createElement('div');
    panel.className = `${this.classPrefix}-comment-panel`;

    Object.assign(panel.style, {
      width: '100%',
      height: '100%',
      overflow: 'auto',
      padding: '12px',
      boxSizing: 'border-box',
      backgroundColor: '#fafafa'
    });

    // 标题栏
    const header = document.createElement('div');
    header.className = `${this.classPrefix}-comment-header`;
    Object.assign(header.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '12px'
    });

    const titleWrapper = document.createElement('div');
    titleWrapper.style.display = 'flex';
    titleWrapper.style.alignItems = 'center';
    titleWrapper.style.gap = '8px';

    const title = document.createElement('h3');
    title.textContent = '批注';
    Object.assign(title.style, {
      margin: '0',
      fontSize: '14px',
      fontWeight: '600',
      color: '#333'
    });

    const count = this.getCommentCount();
    const badge = document.createElement('span');
    badge.textContent = count.unresolved.toString();
    Object.assign(badge.style, {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '20px',
      height: '20px',
      borderRadius: '10px',
      backgroundColor: count.unresolved > 0 ? '#1976d2' : '#9e9e9e',
      color: 'white',
      fontSize: '12px',
      fontWeight: '500'
    });

    titleWrapper.appendChild(title);
    titleWrapper.appendChild(badge);

    // 工具栏
    const toolbar = document.createElement('div');
    toolbar.style.display = 'flex';
    toolbar.style.gap = '4px';

    // 切换已解决
    const toggleResolvedBtn = this.createToolbarButton(
      this.showResolved ? Icons.eyeOff : Icons.eye,
      this.showResolved ? '隐藏已解决' : '显示已解决',
      () => {
        this.toggleShowResolved();
        const icon = toggleResolvedBtn.querySelector('svg');
        if (icon) {
          icon.outerHTML = createIconElement(
            this.showResolved ? Icons.eyeOff : Icons.eye,
            { size: 16 }
          ).outerHTML;
        }
        toggleResolvedBtn.title = this.showResolved ? '隐藏已解决' : '显示已解决';
      }
    );

    // 切换高亮
    const toggleHighlightBtn = this.createToolbarButton(
      this.highlightEnabled ? Icons.highlighter : Icons.highlighter,
      this.highlightEnabled ? '关闭高亮' : '开启高亮',
      () => {
        this.toggleHighlight();
        toggleHighlightBtn.style.color = this.highlightEnabled ? '#1976d2' : '#666';
        toggleHighlightBtn.title = this.highlightEnabled ? '关闭高亮' : '开启高亮';
      }
    );
    if (this.highlightEnabled) {
      toggleHighlightBtn.style.color = '#1976d2';
    }

    toolbar.appendChild(toggleResolvedBtn);
    toolbar.appendChild(toggleHighlightBtn);

    header.appendChild(titleWrapper);
    header.appendChild(toolbar);
    panel.appendChild(header);

    // 批注列表
    const list = document.createElement('div');
    list.className = `${this.classPrefix}-comment-list`;
    
    this.renderCommentList(list);
    panel.appendChild(list);

    this.panelElement = panel;
    targetContainer.appendChild(panel);

    return panel;
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
      width: '28px',
      height: '28px',
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
   * 渲染批注列表
   */
  private renderCommentList(container: HTMLElement): void {
    container.innerHTML = '';

    const comments = this.getAllComments();

    if (comments.length === 0) {
      const empty = document.createElement('div');
      empty.className = `${this.classPrefix}-comment-empty`;
      empty.textContent = '暂无批注';
      Object.assign(empty.style, {
        textAlign: 'center',
        color: '#999',
        padding: '20px',
        fontSize: '14px'
      });
      container.appendChild(empty);
      return;
    }

    for (const comment of comments) {
      const item = this.createCommentItem(comment);
      container.appendChild(item);
    }
  }

  /**
   * 创建批注项
   */
  private createCommentItem(comment: CommentItem, isReply = false): HTMLElement {
    const item = document.createElement('div');
    item.className = `${this.classPrefix}-comment-item`;
    item.dataset.commentId = comment.id;

    Object.assign(item.style, {
      padding: isReply ? '8px 10px 8px 20px' : '12px',
      borderRadius: isReply ? '0' : '8px',
      backgroundColor: comment.resolved ? '#f5f5f5' : 'white',
      marginBottom: isReply ? '0' : '8px',
      boxShadow: isReply ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.1)',
      opacity: comment.resolved ? '0.7' : '1',
      borderLeft: isReply ? '2px solid #ddd' : 'none'
    });

    // 头部：作者和时间
    const header = document.createElement('div');
    Object.assign(header.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '6px'
    });

    const authorWrapper = document.createElement('div');
    authorWrapper.style.display = 'flex';
    authorWrapper.style.alignItems = 'center';
    authorWrapper.style.gap = '6px';

    if (this.config.showAuthor) {
      // 头像
      const avatar = document.createElement('div');
      avatar.textContent = comment.author.charAt(0).toUpperCase();
      Object.assign(avatar.style, {
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        backgroundColor: this.getAvatarColor(comment.author),
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: '600'
      });
      authorWrapper.appendChild(avatar);

      // 作者名
      const author = document.createElement('span');
      author.textContent = comment.author;
      Object.assign(author.style, {
        fontSize: '13px',
        fontWeight: '500',
        color: '#333'
      });
      authorWrapper.appendChild(author);
    }

    if (this.config.showDate && comment.date) {
      const date = document.createElement('span');
      date.textContent = this.formatDate(comment.date);
      Object.assign(date.style, {
        fontSize: '12px',
        color: '#999'
      });
      authorWrapper.appendChild(date);
    }

    header.appendChild(authorWrapper);

    // 已解决标记
    if (comment.resolved) {
      const resolvedBadge = document.createElement('span');
      resolvedBadge.textContent = '已解决';
      Object.assign(resolvedBadge.style, {
        fontSize: '11px',
        color: '#4caf50',
        backgroundColor: '#e8f5e9',
        padding: '2px 6px',
        borderRadius: '4px'
      });
      header.appendChild(resolvedBadge);
    }

    item.appendChild(header);

    // 内容
    const content = document.createElement('div');
    content.textContent = comment.text;
    Object.assign(content.style, {
      fontSize: '14px',
      color: '#444',
      lineHeight: '1.5',
      wordBreak: 'break-word'
    });
    item.appendChild(content);

    // 操作按钮
    if (!isReply) {
      const actions = document.createElement('div');
      Object.assign(actions.style, {
        display: 'flex',
        gap: '8px',
        marginTop: '8px'
      });

      const gotoBtn = document.createElement('button');
      gotoBtn.textContent = '定位';
      Object.assign(gotoBtn.style, {
        padding: '4px 8px',
        border: 'none',
        borderRadius: '4px',
        backgroundColor: '#e3f2fd',
        color: '#1976d2',
        fontSize: '12px',
        cursor: 'pointer'
      });
      gotoBtn.addEventListener('click', () => {
        this.navigateToCommentText(comment.id);
      });
      actions.appendChild(gotoBtn);

      item.appendChild(actions);
    }

    // 回复
    if (comment.replies && comment.replies.length > 0) {
      const repliesContainer = document.createElement('div');
      repliesContainer.style.marginTop = '8px';

      for (const reply of comment.replies) {
        const replyItem = this.createCommentItem(reply, true);
        repliesContainer.appendChild(replyItem);
      }

      item.appendChild(repliesContainer);
    }

    // 点击高亮关联文本
    item.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).tagName !== 'BUTTON') {
        this.highlightAssociatedText(comment.id);
      }
    });

    return item;
  }

  /**
   * 高亮关联文本
   */
  private highlightAssociatedText(commentId: string): void {
    if (!this.container) return;

    // 移除其他高亮
    this.container.querySelectorAll(`.${this.classPrefix}-comment-active`).forEach((el) => {
      (el as HTMLElement).style.boxShadow = '';
      el.classList.remove(`${this.classPrefix}-comment-active`);
    });

    // 高亮当前
    const rangeElement = this.container.querySelector(
      `[data-comment-range-start="${commentId}"]`
    );

    if (rangeElement) {
      rangeElement.classList.add(`${this.classPrefix}-comment-active`);
      (rangeElement as HTMLElement).style.boxShadow = '0 0 0 2px #1976d2';
    }
  }

  /**
   * 获取头像颜色
   */
  private getAvatarColor(name: string): string {
    const colors = [
      '#1976d2', '#388e3c', '#d32f2f', '#7b1fa2',
      '#c2185b', '#0097a7', '#f57c00', '#5d4037'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  /**
   * 格式化日期
   */
  private formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return minutes <= 1 ? '刚刚' : `${minutes}分钟前`;
      }
      return `${hours}小时前`;
    }
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * 更新面板
   */
  private updatePanel(): void {
    if (!this.panelElement) return;

    const list = this.panelElement.querySelector(`.${this.classPrefix}-comment-list`);
    if (list) {
      this.renderCommentList(list as HTMLElement);
    }

    // 更新数量徽章
    const badge = this.panelElement.querySelector('span[style*="border-radius: 10px"]');
    if (badge) {
      const count = this.getCommentCount();
      badge.textContent = count.unresolved.toString();
      (badge as HTMLElement).style.backgroundColor = count.unresolved > 0 ? '#1976d2' : '#9e9e9e';
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    if (this.panelElement && this.panelElement.parentNode) {
      this.panelElement.parentNode.removeChild(this.panelElement);
    }

    // 移除高亮
    if (this.container) {
      this.container.querySelectorAll(`.${this.classPrefix}-comment-highlighted`).forEach((el) => {
        (el as HTMLElement).style.backgroundColor = '';
        (el as HTMLElement).style.borderBottom = '';
        el.classList.remove(`${this.classPrefix}-comment-highlighted`);
      });
    }

    this.comments = [];
    this.document = null;
    this.container = null;
    this.panelElement = null;
  }
}
