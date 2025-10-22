/**
 * Vitest 测试设置文件
 */

import { afterEach, beforeEach, vi } from 'vitest';

// 全局测试设置
beforeEach(() => {
  // 清理 DOM
  document.body.innerHTML = '';

  // 清理 localStorage
  localStorage.clear();

  // 清理 sessionStorage
  sessionStorage.clear();
});

afterEach(() => {
  // 清理所有 mock
  vi.clearAllMocks();

  // 清理所有定时器
  vi.clearAllTimers();
});

// Mock IndexedDB（如果需要）
if (typeof indexedDB === 'undefined') {
  (global as any).indexedDB = {
    open: vi.fn(),
    deleteDatabase: vi.fn(),
  };
}

// Mock Worker（如果需要）
if (typeof Worker === 'undefined') {
  (global as any).Worker = class MockWorker {
    onmessage: ((event: MessageEvent) => void) | null = null;
    onerror: ((event: ErrorEvent) => void) | null = null;

    constructor(public scriptURL: string) { }

    postMessage(data: any): void {
      // Mock implementation
    }

    terminate(): void {
      // Mock implementation
    }

    addEventListener(type: string, listener: EventListener): void {
      // Mock implementation
    }

    removeEventListener(type: string, listener: EventListener): void {
      // Mock implementation
    }
  };
}

