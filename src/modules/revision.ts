/**
 * 修订追踪模块
 * 追踪文档变更历史和修订记录
 */

import { Logger } from '../utils/logger';

const logger = new Logger({ prefix: '[Revision]' });

export interface Revision {
  id: string;
  type: 'insert' | 'delete' | 'format' | 'replace';
  author: string;
  timestamp: number;
  content?: string;
  oldContent?: string;
  newContent?: string;
  position?: number;
  metadata?: Record<string, any>;
  accepted: boolean;
  rejected: boolean;
}

export interface RevisionOptions {
  author?: string;
  trackChanges?: boolean;
  showRevisions?: boolean;
}

/**
 * 修订管理器
 */
export class RevisionManager {
  private revisions: Map<string, Revision> = new Map();
  private trackChanges: boolean = true;
  private author: string;
  private observer: MutationObserver | null = null;
  private container: HTMLElement | null = null;

  constructor(container: HTMLElement, options: RevisionOptions = {}) {
    this.container = container;
    this.author = options.author || '匿名用户';
    this.trackChanges = options.trackChanges !== false;

    if (this.trackChanges) {
      this.initializeObserver();
    }
  }

  /**
   * 初始化变更观察器
   */
  private initializeObserver(): void {
    if (!this.container) return;

    this.observer = new MutationObserver((mutations) => {
      this.handleMutations(mutations);
    });

    this.observer.observe(this.container, {
      childList: true,
      subtree: true,
      characterData: true,
      characterDataOldValue: true,
      attributes: true,
      attributeOldValue: true,
    });

    logger.info('修订追踪已启用');
  }

  /**
   * 处理 DOM 变更
   */
  private handleMutations(mutations: MutationRecord[]): void {
    if (!this.trackChanges) return;

    mutations.forEach(mutation => {
      switch (mutation.type) {
        case 'characterData':
          this.trackTextChange(mutation);
          break;
        case 'childList':
          this.trackNodeChange(mutation);
          break;
        case 'attributes':
          this.trackAttributeChange(mutation);
          break;
      }
    });
  }

  /**
   * 追踪文本变更
   */
  private trackTextChange(mutation: MutationRecord): void {
    const oldValue = mutation.oldValue || '';
    const newValue = mutation.target.textContent || '';

    if (oldValue === newValue) return;

    const revision: Revision = {
      id: this.generateId(),
      type: oldValue.length < newValue.length ? 'insert' : 'delete',
      author: this.author,
      timestamp: Date.now(),
      oldContent: oldValue,
      newContent: newValue,
      accepted: false,
      rejected: false,
    };

    this.revisions.set(revision.id, revision);
    this.markRevision(mutation.target, revision.id);

    logger.debug('文本变更', { type: revision.type, length: newValue.length });
  }

  /**
   * 追踪节点变更
   */
  private trackNodeChange(mutation: MutationRecord): void {
    if (mutation.addedNodes.length > 0) {
      mutation.addedNodes.forEach(node => {
        const revision: Revision = {
          id: this.generateId(),
          type: 'insert',
          author: this.author,
          timestamp: Date.now(),
          content: node.textContent || '',
          accepted: false,
          rejected: false,
        };

        this.revisions.set(revision.id, revision);
        this.markRevision(node, revision.id);
      });
    }

    if (mutation.removedNodes.length > 0) {
      mutation.removedNodes.forEach(node => {
        const revision: Revision = {
          id: this.generateId(),
          type: 'delete',
          author: this.author,
          timestamp: Date.now(),
          content: node.textContent || '',
          accepted: false,
          rejected: false,
        };

        this.revisions.set(revision.id, revision);
      });
    }
  }

  /**
   * 追踪属性变更
   */
  private trackAttributeChange(mutation: MutationRecord): void {
    const revision: Revision = {
      id: this.generateId(),
      type: 'format',
      author: this.author,
      timestamp: Date.now(),
      metadata: {
        attribute: mutation.attributeName,
        oldValue: mutation.oldValue,
        newValue: (mutation.target as Element).getAttribute(mutation.attributeName || ''),
      },
      accepted: false,
      rejected: false,
    };

    this.revisions.set(revision.id, revision);
    this.markRevision(mutation.target, revision.id);
  }

  /**
   * 标记修订
   */
  private markRevision(node: Node, revisionId: string): void {
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const element = node as HTMLElement;
    element.dataset.revisionId = revisionId;
    element.classList.add('revision-mark');

    // 根据修订类型应用不同样式
    const revision = this.revisions.get(revisionId);
    if (!revision) return;

    switch (revision.type) {
      case 'insert':
        element.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
        break;
      case 'delete':
        element.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
        element.style.textDecoration = 'line-through';
        break;
      case 'format':
        element.style.backgroundColor = 'rgba(0, 0, 255, 0.1)';
        break;
    }
  }

  /**
   * 接受修订
   */
  acceptRevision(revisionId: string): void {
    const revision = this.revisions.get(revisionId);
    if (!revision) return;

    revision.accepted = true;
    this.removeRevisionMark(revisionId);

    logger.info('接受修订', { revisionId });
  }

  /**
   * 拒绝修订
   */
  rejectRevision(revisionId: string): void {
    const revision = this.revisions.get(revisionId);
    if (!revision) return;

    revision.rejected = true;

    // 恢复到原始内容
    if (revision.type === 'delete' || revision.type === 'replace') {
      // 恢复删除的内容
    } else if (revision.type === 'insert') {
      // 移除插入的内容
      this.removeRevisionNode(revisionId);
    }

    this.removeRevisionMark(revisionId);

    logger.info('拒绝修订', { revisionId });
  }

  /**
   * 接受所有修订
   */
  acceptAllRevisions(): void {
    this.revisions.forEach((revision, id) => {
      if (!revision.accepted && !revision.rejected) {
        this.acceptRevision(id);
      }
    });

    logger.info('接受所有修订');
  }

  /**
   * 拒绝所有修订
   */
  rejectAllRevisions(): void {
    this.revisions.forEach((revision, id) => {
      if (!revision.accepted && !revision.rejected) {
        this.rejectRevision(id);
      }
    });

    logger.info('拒绝所有修订');
  }

  /**
   * 移除修订标记
   */
  private removeRevisionMark(revisionId: string): void {
    if (!this.container) return;

    const elements = this.container.querySelectorAll(`[data-revision-id="${revisionId}"]`);
    elements.forEach(element => {
      (element as HTMLElement).style.backgroundColor = '';
      (element as HTMLElement).style.textDecoration = '';
      element.classList.remove('revision-mark');
      delete (element as HTMLElement).dataset.revisionId;
    });
  }

  /**
   * 移除修订节点
   */
  private removeRevisionNode(revisionId: string): void {
    if (!this.container) return;

    const elements = this.container.querySelectorAll(`[data-revision-id="${revisionId}"]`);
    elements.forEach(element => element.remove());
  }

  /**
   * 获取所有修订
   */
  getAllRevisions(): Revision[] {
    return Array.from(this.revisions.values());
  }

  /**
   * 获取待处理的修订
   */
  getPendingRevisions(): Revision[] {
    return this.getAllRevisions().filter(r => !r.accepted && !r.rejected);
  }

  /**
   * 启用修订追踪
   */
  enableTracking(): void {
    this.trackChanges = true;
    if (!this.observer) {
      this.initializeObserver();
    }
    logger.info('修订追踪已启用');
  }

  /**
   * 禁用修订追踪
   */
  disableTracking(): void {
    this.trackChanges = false;
    if (this.observer) {
      this.observer.disconnect();
    }
    logger.info('修订追踪已禁用');
  }

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return `rev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 导出修订历史
   */
  exportRevisions(): string {
    const revisions = this.getAllRevisions();
    return JSON.stringify(revisions, null, 2);
  }

  /**
   * 清理
   */
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.revisions.clear();
    logger.info('修订管理器已销毁');
  }
}

