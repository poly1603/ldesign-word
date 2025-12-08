import type { EventType, EventData } from '../types';

type EventHandler<T = EventData> = (event: T) => void;

/**
 * 事件发射器
 * 用于管理文档查看器的事件订阅和触发
 */
export class EventEmitter {
  private handlers: Map<EventType, Set<EventHandler>> = new Map();
  private onceHandlers: Map<EventType, Set<EventHandler>> = new Map();

  /**
   * 订阅事件
   */
  on<T extends EventData>(type: EventType, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }

    this.handlers.get(type)!.add(handler as EventHandler);

    // 返回取消订阅函数
    return () => this.off(type, handler);
  }

  /**
   * 订阅一次性事件
   */
  once<T extends EventData>(type: EventType, handler: EventHandler<T>): () => void {
    if (!this.onceHandlers.has(type)) {
      this.onceHandlers.set(type, new Set());
    }

    this.onceHandlers.get(type)!.add(handler as EventHandler);

    return () => {
      this.onceHandlers.get(type)?.delete(handler as EventHandler);
    };
  }

  /**
   * 取消订阅事件
   */
  off<T extends EventData>(type: EventType, handler?: EventHandler<T>): void {
    if (handler) {
      this.handlers.get(type)?.delete(handler as EventHandler);
      this.onceHandlers.get(type)?.delete(handler as EventHandler);
    } else {
      this.handlers.delete(type);
      this.onceHandlers.delete(type);
    }
  }

  /**
   * 触发事件
   */
  emit(type: EventType, data: EventData): void {
    // 触发普通处理器
    const handlers = this.handlers.get(type);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(data);
        } catch (error) {
          console.error(`Event handler error for ${type}:`, error);
        }
      }
    }

    // 触发一次性处理器
    const onceHandlers = this.onceHandlers.get(type);
    if (onceHandlers) {
      for (const handler of onceHandlers) {
        try {
          handler(data);
        } catch (error) {
          console.error(`Once event handler error for ${type}:`, error);
        }
      }
      this.onceHandlers.delete(type);
    }
  }

  /**
   * 移除所有事件监听器
   */
  removeAllListeners(type?: EventType): void {
    if (type) {
      this.handlers.delete(type);
      this.onceHandlers.delete(type);
    } else {
      this.handlers.clear();
      this.onceHandlers.clear();
    }
  }

  /**
   * 获取事件监听器数量
   */
  listenerCount(type: EventType): number {
    const handlersCount = this.handlers.get(type)?.size || 0;
    const onceHandlersCount = this.onceHandlers.get(type)?.size || 0;
    return handlersCount + onceHandlersCount;
  }

  /**
   * 检查是否有事件监听器
   */
  hasListeners(type: EventType): boolean {
    return this.listenerCount(type) > 0;
  }

  /**
   * 获取所有已注册的事件类型
   */
  eventNames(): EventType[] {
    const types = new Set<EventType>();

    for (const type of this.handlers.keys()) {
      types.add(type);
    }

    for (const type of this.onceHandlers.keys()) {
      types.add(type);
    }

    return Array.from(types);
  }
}
