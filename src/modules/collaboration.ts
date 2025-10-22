/**
 * 协作模块
 * 支持实时协作编辑、冲突解决和多用户光标
 */

import { Logger } from '../utils/logger';
import { OperationError } from '../core/errors';

const logger = new Logger({ prefix: '[Collaboration]' });

export interface User {
  id: string;
  name: string;
  color: string;
  cursor?: {
    position: number;
    selection?: { start: number; end: number };
  };
}

export interface Operation {
  id: string;
  type: 'insert' | 'delete' | 'replace';
  userId: string;
  timestamp: number;
  position: number;
  content?: string;
  length?: number;
}

export interface CollaborationOptions {
  userId: string;
  userName: string;
  serverUrl?: string;
  transport?: 'websocket' | 'webrtc';
}

/**
 * Operational Transform（OT）实现
 * 用于解决并发编辑冲突
 */
export class OperationalTransform {
  /**
   * 转换操作（OT 核心算法）
   */
  transform(op1: Operation, op2: Operation): [Operation, Operation] {
    // 简化的 OT 实现
    // 实际应用中需要更完整的实现

    const transformed1 = { ...op1 };
    const transformed2 = { ...op2 };

    // 如果两个操作在不同位置，不需要转换
    if (op1.position !== op2.position) {
      // 如果 op2 在 op1 之前，需要调整 op1 的位置
      if (op2.position < op1.position) {
        if (op2.type === 'insert') {
          transformed1.position += op2.content?.length || 0;
        } else if (op2.type === 'delete') {
          transformed1.position -= op2.length || 0;
        }
      }
      // 如果 op1 在 op2 之前，需要调整 op2 的位置
      else if (op1.position < op2.position) {
        if (op1.type === 'insert') {
          transformed2.position += op1.content?.length || 0;
        } else if (op1.type === 'delete') {
          transformed2.position -= op1.length || 0;
        }
      }
    }
    // 如果在同一位置，需要特殊处理
    else {
      if (op1.type === 'insert' && op2.type === 'insert') {
        // 两个插入操作：根据用户ID决定顺序
        if (op1.userId < op2.userId) {
          transformed2.position += op1.content?.length || 0;
        } else {
          transformed1.position += op2.content?.length || 0;
        }
      }
    }

    return [transformed1, transformed2];
  }

  /**
   * 应用操作
   */
  apply(content: string, operation: Operation): string {
    const { type, position, content: opContent, length } = operation;

    switch (type) {
      case 'insert':
        return (
          content.substring(0, position) +
          (opContent || '') +
          content.substring(position)
        );

      case 'delete':
        return (
          content.substring(0, position) +
          content.substring(position + (length || 0))
        );

      case 'replace':
        return (
          content.substring(0, position) +
          (opContent || '') +
          content.substring(position + (length || 0))
        );

      default:
        return content;
    }
  }
}

/**
 * 协作管理器
 */
export class CollaborationManager {
  private options: CollaborationOptions;
  private users: Map<string, User> = new Map();
  private localOperations: Operation[] = [];
  private remoteOperations: Operation[] = [];
  private ot: OperationalTransform;
  private connection: WebSocket | RTCDataChannel | null = null;
  private isConnected: boolean = false;

  constructor(options: CollaborationOptions) {
    this.options = options;
    this.ot = new OperationalTransform();

    // 添加本地用户
    this.addUser({
      id: options.userId,
      name: options.userName,
      color: this.generateColor(),
    });

    logger.info('协作管理器已初始化', { userId: options.userId });
  }

  /**
   * 连接到服务器
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      logger.warn('已经连接');
      return;
    }

    const transport = this.options.transport || 'websocket';

    if (transport === 'websocket') {
      await this.connectWebSocket();
    } else if (transport === 'webrtc') {
      await this.connectWebRTC();
    }

    this.isConnected = true;
    logger.info('已连接到协作服务器', { transport });
  }

  /**
   * WebSocket 连接
   */
  private async connectWebSocket(): Promise<void> {
    if (!this.options.serverUrl) {
      throw new OperationError('缺少服务器 URL');
    }

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.options.serverUrl!);

      ws.onopen = () => {
        logger.info('WebSocket 已连接');
        this.connection = ws;
        resolve();
      };

      ws.onerror = (error) => {
        logger.error('WebSocket 连接错误', error);
        reject(error);
      };

      ws.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data));
      };

      ws.onclose = () => {
        logger.info('WebSocket 已断开');
        this.isConnected = false;
      };
    });
  }

  /**
   * WebRTC 连接
   */
  private async connectWebRTC(): Promise<void> {
    // WebRTC 实现较复杂，这里提供框架
    logger.info('WebRTC 连接（待实现）');
    throw new Error('WebRTC 连接尚未实现');
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.connection) {
      if (this.connection instanceof WebSocket) {
        this.connection.close();
      }
      this.connection = null;
    }

    this.isConnected = false;
    logger.info('已断开连接');
  }

  /**
   * 发送操作
   */
  sendOperation(operation: Operation): void {
    if (!this.isConnected || !this.connection) {
      logger.warn('未连接到服务器');
      return;
    }

    this.localOperations.push(operation);

    const message = JSON.stringify({
      type: 'operation',
      operation,
    });

    if (this.connection instanceof WebSocket) {
      this.connection.send(message);
    }

    logger.debug('发送操作', { type: operation.type, position: operation.position });
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(data: any): void {
    const { type } = data;

    switch (type) {
      case 'operation':
        this.handleRemoteOperation(data.operation);
        break;

      case 'user-join':
        this.handleUserJoin(data.user);
        break;

      case 'user-leave':
        this.handleUserLeave(data.userId);
        break;

      case 'cursor-update':
        this.handleCursorUpdate(data.userId, data.cursor);
        break;

      default:
        logger.warn('未知消息类型', { type });
    }
  }

  /**
   * 处理远程操作
   */
  private handleRemoteOperation(operation: Operation): void {
    // 使用 OT 转换操作
    let transformedOp = operation;

    for (const localOp of this.localOperations) {
      const [newLocal, newRemote] = this.ot.transform(localOp, transformedOp);
      transformedOp = newRemote;
    }

    this.remoteOperations.push(transformedOp);
    logger.debug('接收远程操作', { type: operation.type });

    // 触发事件让外部应用操作
    this.onRemoteOperation?.(transformedOp);
  }

  /**
   * 处理用户加入
   */
  private handleUserJoin(user: User): void {
    this.addUser(user);
    logger.info('用户加入', { userId: user.id, name: user.name });
    this.onUserJoin?.(user);
  }

  /**
   * 处理用户离开
   */
  private handleUserLeave(userId: string): void {
    this.removeUser(userId);
    logger.info('用户离开', { userId });
    this.onUserLeave?.(userId);
  }

  /**
   * 处理光标更新
   */
  private handleCursorUpdate(userId: string, cursor: User['cursor']): void {
    const user = this.users.get(userId);
    if (user) {
      user.cursor = cursor;
      this.onCursorUpdate?.(userId, cursor);
    }
  }

  /**
   * 添加用户
   */
  addUser(user: User): void {
    this.users.set(user.id, user);
  }

  /**
   * 移除用户
   */
  removeUser(userId: string): void {
    this.users.delete(userId);
  }

  /**
   * 获取所有用户
   */
  getUsers(): User[] {
    return Array.from(this.users.values());
  }

  /**
   * 更新本地光标
   */
  updateCursor(position: number, selection?: { start: number; end: number }): void {
    const localUser = this.users.get(this.options.userId);
    if (localUser) {
      localUser.cursor = { position, selection };

      // 发送给其他用户
      if (this.isConnected && this.connection instanceof WebSocket) {
        this.connection.send(
          JSON.stringify({
            type: 'cursor-update',
            userId: this.options.userId,
            cursor: localUser.cursor,
          })
        );
      }
    }
  }

  /**
   * 生成颜色
   */
  private generateColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * 事件回调（由外部设置）
   */
  onRemoteOperation?: (operation: Operation) => void;
  onUserJoin?: (user: User) => void;
  onUserLeave?: (userId: string) => void;
  onCursorUpdate?: (userId: string, cursor: User['cursor']) => void;

  /**
   * 销毁
   */
  destroy(): void {
    this.disconnect();
    this.users.clear();
    this.localOperations = [];
    this.remoteOperations = [];
    logger.info('协作管理器已销毁');
  }
}

/**
 * 版本管理器
 */
export class VersionManager {
  private versions: Map<string, { content: string; timestamp: number; author: string }> =
    new Map();
  private currentVersion: string | null = null;
  private maxVersions: number = 50;

  /**
   * 创建版本快照
   */
  createSnapshot(content: string, author: string): string {
    const id = `version_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.versions.set(id, {
      content,
      timestamp: Date.now(),
      author,
    });

    this.currentVersion = id;

    // 限制版本数量
    if (this.versions.size > this.maxVersions) {
      const oldestKey = Array.from(this.versions.keys())[0];
      this.versions.delete(oldestKey);
    }

    logger.info('创建版本快照', { id, author });
    return id;
  }

  /**
   * 回滚到指定版本
   */
  rollback(versionId: string): string | null {
    const version = this.versions.get(versionId);
    if (!version) {
      logger.warn('版本不存在', { versionId });
      return null;
    }

    this.currentVersion = versionId;
    logger.info('回滚到版本', { versionId, timestamp: version.timestamp });
    return version.content;
  }

  /**
   * 获取版本历史
   */
  getHistory(): Array<{ id: string; timestamp: number; author: string }> {
    return Array.from(this.versions.entries())
      .map(([id, version]) => ({
        id,
        timestamp: version.timestamp,
        author: version.author,
      }))
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * 获取当前版本
   */
  getCurrentVersion(): string | null {
    return this.currentVersion;
  }

  /**
   * 比较两个版本
   */
  diff(versionId1: string, versionId2: string): Array<{
    type: 'add' | 'remove' | 'unchanged';
    content: string;
  }> {
    const v1 = this.versions.get(versionId1);
    const v2 = this.versions.get(versionId2);

    if (!v1 || !v2) {
      logger.warn('版本不存在');
      return [];
    }

    // 简单的行级 diff
    const lines1 = v1.content.split('\n');
    const lines2 = v2.content.split('\n');

    const diff: Array<{ type: 'add' | 'remove' | 'unchanged'; content: string }> = [];

    const maxLength = Math.max(lines1.length, lines2.length);

    for (let i = 0; i < maxLength; i++) {
      const line1 = lines1[i];
      const line2 = lines2[i];

      if (line1 === line2) {
        if (line1 !== undefined) {
          diff.push({ type: 'unchanged', content: line1 });
        }
      } else if (line1 === undefined) {
        diff.push({ type: 'add', content: line2 });
      } else if (line2 === undefined) {
        diff.push({ type: 'remove', content: line1 });
      } else {
        diff.push({ type: 'remove', content: line1 });
        diff.push({ type: 'add', content: line2 });
      }
    }

    return diff;
  }

  /**
   * 清理旧版本
   */
  cleanup(keepCount: number = 10): void {
    const history = this.getHistory();
    const toDelete = history.slice(keepCount);

    toDelete.forEach(item => {
      this.versions.delete(item.id);
    });

    logger.info('清理旧版本', { deleted: toDelete.length });
  }
}

/**
 * 多用户光标管理器
 */
export class CursorManager {
  private cursors: Map<string, HTMLElement> = new Map();
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /**
   * 显示用户光标
   */
  showCursor(user: User): void {
    let cursor = this.cursors.get(user.id);

    if (!cursor) {
      cursor = this.createCursorElement(user);
      this.cursors.set(user.id, cursor);
      this.container.appendChild(cursor);
    }

    this.updateCursorPosition(user);
  }

  /**
   * 创建光标元素
   */
  private createCursorElement(user: User): HTMLElement {
    const cursor = document.createElement('div');
    cursor.className = 'user-cursor';
    cursor.style.cssText = `
      position: absolute;
      width: 2px;
      height: 20px;
      background-color: ${user.color};
      pointer-events: none;
      z-index: 1000;
      transition: all 0.1s ease;
    `;

    // 添加用户名标签
    const label = document.createElement('div');
    label.className = 'user-cursor-label';
    label.textContent = user.name;
    label.style.cssText = `
      position: absolute;
      top: -24px;
      left: 0;
      background-color: ${user.color};
      color: white;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 12px;
      white-space: nowrap;
    `;

    cursor.appendChild(label);

    return cursor;
  }

  /**
   * 更新光标位置
   */
  private updateCursorPosition(user: User): void {
    const cursor = this.cursors.get(user.id);
    if (!cursor || !user.cursor) return;

    // 这里需要根据文档的实际位置计算光标坐标
    // 简化实现：假设已经有坐标
    const x = 0; // 实际需要计算
    const y = 0; // 实际需要计算

    cursor.style.left = `${x}px`;
    cursor.style.top = `${y}px`;

    // 如果有选区，显示选区高亮
    if (user.cursor.selection) {
      this.showSelection(user);
    }
  }

  /**
   * 显示用户选区
   */
  private showSelection(user: User): void {
    // 实现选区高亮
    logger.debug('显示用户选区', { userId: user.id });
  }

  /**
   * 隐藏用户光标
   */
  hideCursor(userId: string): void {
    const cursor = this.cursors.get(userId);
    if (cursor) {
      cursor.remove();
      this.cursors.delete(userId);
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.cursors.forEach(cursor => cursor.remove());
    this.cursors.clear();
    logger.info('光标管理器已销毁');
  }
}

