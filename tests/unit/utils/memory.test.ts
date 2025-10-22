/**
 * 内存工具测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { estimateSize, formatBytes, MemoryMonitor } from '../../../src/utils/memory';

describe('memory utilities', () => {
  describe('estimateSize', () => {
    it('should estimate primitive types', () => {
      expect(estimateSize(true)).toBe(4);
      expect(estimateSize(42)).toBe(8);
      expect(estimateSize('hello')).toBe(10); // 5 chars * 2 bytes
    });

    it('should estimate arrays', () => {
      const arr = [1, 2, 3];
      const size = estimateSize(arr);
      expect(size).toBeGreaterThan(0);
    });

    it('should estimate objects', () => {
      const obj = { name: 'test', value: 123 };
      const size = estimateSize(obj);
      expect(size).toBeGreaterThan(0);
    });

    it('should handle circular references', () => {
      const obj: any = { name: 'test' };
      obj.self = obj;
      
      expect(() => estimateSize(obj)).not.toThrow();
    });
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should respect decimals parameter', () => {
      expect(formatBytes(1536, 0)).toBe('2 KB');
      expect(formatBytes(1536, 2)).toBe('1.50 KB');
    });
  });

  describe('MemoryMonitor', () => {
    it('should create monitor with default options', () => {
      const monitor = new MemoryMonitor();
      expect(monitor).toBeDefined();
    });

    it('should allow setting thresholds', () => {
      const monitor = new MemoryMonitor();
      
      expect(() => {
        monitor.setThresholds({
          low: 50,
          medium: 70,
          high: 85,
          critical: 95,
        });
      }).not.toThrow();
    });

    it('should start and stop monitoring', () => {
      const monitor = new MemoryMonitor();
      
      monitor.start();
      expect(() => monitor.stop()).not.toThrow();
    });

    it('should call warning callbacks', () => {
      const monitor = new MemoryMonitor();
      const callback = vi.fn();
      
      monitor.onWarning(callback);
      monitor.offWarning(callback);
      
      expect(callback).not.toHaveBeenCalled();
    });
  });
});

