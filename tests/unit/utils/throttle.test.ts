/**
 * 防抖节流工具函数测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce, throttle, rafThrottle } from '../../../src/utils/throttle';

describe('throttle utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('debounce', () => {
    it('should delay function execution', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should reset timer on multiple calls', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      vi.advanceTimersByTime(50);
      
      debouncedFn();
      vi.advanceTimersByTime(50);
      
      expect(fn).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(50);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should call immediately when immediate is true', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100, true);

      debouncedFn();
      expect(fn).toHaveBeenCalledTimes(1);
      
      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    it('should limit function calls', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 100);

      throttledFn();
      expect(fn).toHaveBeenCalledTimes(1);

      throttledFn();
      throttledFn();
      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should respect leading option', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 100, { leading: false });

      throttledFn();
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should respect trailing option', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 100, { trailing: false });

      throttledFn();
      expect(fn).toHaveBeenCalledTimes(1);

      throttledFn();
      vi.advanceTimersByTime(100);
      
      // 不应该调用 trailing call
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
});

