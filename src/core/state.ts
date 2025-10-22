/**
 * 状态管理模块
 * 提供响应式状态管理和持久化
 */

import { Logger } from '../utils/logger';
import { deepClone } from './type-utils';

const logger = new Logger({ prefix: '[State]' });

export type StateChangeCallback<T = any> = (newValue: T, oldValue: T) => void;

export interface StateOptions {
  persist?: boolean;
  storageKey?: string;
  deep?: boolean;
}

/**
 * 响应式状态
 */
export class ReactiveState<T = any> {
  private value: T;
  private callbacks: Set<StateChangeCallback<T>> = new Set();
  private options: StateOptions;

  constructor(initialValue: T, options: StateOptions = {}) {
    this.value = options.deep ? deepClone(initialValue) : initialValue;
    this.options = {
      persist: options.persist || false,
      storageKey: options.storageKey,
      deep: options.deep || false,
    };

    // 从存储恢复
    if (this.options.persist && this.options.storageKey) {
      const stored = this.loadFromStorage();
      if (stored !== null) {
        this.value = stored;
      }
    }
  }

  /**
   * 获取值
   */
  get(): T {
    return this.options.deep ? deepClone(this.value) : this.value;
  }

  /**
   * 设置值
   */
  set(newValue: T): void {
    const oldValue = this.value;
    this.value = this.options.deep ? deepClone(newValue) : newValue;

    // 持久化
    if (this.options.persist && this.options.storageKey) {
      this.saveToStorage();
    }

    // 通知订阅者
    this.callbacks.forEach(callback => {
      try {
        callback(this.value, oldValue);
      } catch (error) {
        logger.error('状态变更回调错误', error);
      }
    });
  }

  /**
   * 订阅变更
   */
  subscribe(callback: StateChangeCallback<T>): () => void {
    this.callbacks.add(callback);

    // 返回取消订阅函数
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * 保存到存储
   */
  private saveToStorage(): void {
    if (!this.options.storageKey) return;

    try {
      const json = JSON.stringify(this.value);
      localStorage.setItem(this.options.storageKey, json);
    } catch (error) {
      logger.error('保存状态失败', error);
    }
  }

  /**
   * 从存储加载
   */
  private loadFromStorage(): T | null {
    if (!this.options.storageKey) return null;

    try {
      const json = localStorage.getItem(this.options.storageKey);
      if (json) {
        return JSON.parse(json);
      }
    } catch (error) {
      logger.error('加载状态失败', error);
    }

    return null;
  }

  /**
   * 清除存储
   */
  clearStorage(): void {
    if (this.options.storageKey) {
      localStorage.removeItem(this.options.storageKey);
    }
  }
}

/**
 * 状态管理器
 */
export class StateManager {
  private states: Map<string, ReactiveState> = new Map();

  /**
   * 创建状态
   */
  createState<T>(key: string, initialValue: T, options?: StateOptions): ReactiveState<T> {
    if (this.states.has(key)) {
      logger.warn('状态已存在', { key });
      return this.states.get(key) as ReactiveState<T>;
    }

    const state = new ReactiveState<T>(initialValue, options);
    this.states.set(key, state);

    logger.debug('创建状态', { key });
    return state;
  }

  /**
   * 获取状态
   */
  getState<T>(key: string): ReactiveState<T> | undefined {
    return this.states.get(key) as ReactiveState<T> | undefined;
  }

  /**
   * 删除状态
   */
  deleteState(key: string): void {
    const state = this.states.get(key);
    if (state) {
      state.clearStorage();
      this.states.delete(key);
      logger.debug('删除状态', { key });
    }
  }

  /**
   * 获取所有状态键
   */
  getKeys(): string[] {
    return Array.from(this.states.keys());
  }

  /**
   * 清空所有状态
   */
  clear(): void {
    this.states.forEach((state, key) => {
      state.clearStorage();
    });
    this.states.clear();
    logger.info('所有状态已清空');
  }

  /**
   * 导出状态快照
   */
  exportSnapshot(): Record<string, any> {
    const snapshot: Record<string, any> = {};
    this.states.forEach((state, key) => {
      snapshot[key] = state.get();
    });
    return snapshot;
  }

  /**
   * 导入状态快照
   */
  importSnapshot(snapshot: Record<string, any>): void {
    Object.entries(snapshot).forEach(([key, value]) => {
      const state = this.states.get(key);
      if (state) {
        state.set(value);
      }
    });
    logger.info('状态快照已导入');
  }
}

/**
 * 计算属性
 * 基于其他状态自动计算的值
 */
export class ComputedState<T> {
  private getter: () => T;
  private dependencies: ReactiveState[];
  private callbacks: Set<StateChangeCallback<T>> = new Set();
  private cachedValue: T | undefined;
  private dirty: boolean = true;

  constructor(getter: () => T, dependencies: ReactiveState[]) {
    this.getter = getter;
    this.dependencies = dependencies;

    // 订阅所有依赖
    dependencies.forEach(dep => {
      dep.subscribe(() => {
        this.dirty = true;
        this.notify();
      });
    });
  }

  /**
   * 获取值
   */
  get(): T {
    if (this.dirty) {
      this.cachedValue = this.getter();
      this.dirty = false;
    }
    return this.cachedValue!;
  }

  /**
   * 订阅变更
   */
  subscribe(callback: StateChangeCallback<T>): () => void {
    this.callbacks.add(callback);

    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * 通知订阅者
   */
  private notify(): void {
    const newValue = this.get();
    this.callbacks.forEach(callback => {
      try {
        callback(newValue, newValue);
      } catch (error) {
        logger.error('计算状态回调错误', error);
      }
    });
  }
}

/**
 * 创建计算状态
 */
export function computed<T>(getter: () => T, dependencies: ReactiveState[]): ComputedState<T> {
  return new ComputedState(getter, dependencies);
}

