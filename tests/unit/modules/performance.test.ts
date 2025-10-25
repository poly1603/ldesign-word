/**
 * 性能监控模块测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PerformanceMonitor } from '../../../src/modules/performance';

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor({ enabled: true });
  });

  afterEach(() => {
    monitor.clear();
  });

  describe('初始化', () => {
    it('应该创建监控器实例', () => {
      expect(monitor).toBeInstanceOf(PerformanceMonitor);
    });

    it('应该禁用监控', () => {
      const disabledMonitor = new PerformanceMonitor({ enabled: false });
      disabledMonitor.startTimer('test');
      disabledMonitor.endTimer('test');
      
      const metrics = disabledMonitor.getMetrics();
      expect(metrics.length).toBe(0);
    });
  });

  describe('计时器', () => {
    it('应该测量操作时间', () => {
      monitor.startTimer('testOperation');
      // 模拟操作
      const duration = monitor.endTimer('testOperation');
      
      expect(duration).toBeGreaterThanOrEqual(0);
      const metrics = monitor.getMetrics('testOperation');
      expect(metrics.length).toBe(1);
    });

    it('应该记录多个操作', () => {
      monitor.startTimer('op1');
      monitor.endTimer('op1');
      
      monitor.startTimer('op2');
      monitor.endTimer('op2');
      
      const allMetrics = monitor.getMetrics();
      expect(allMetrics.length).toBe(2);
    });
  });

  describe('同步测量', () => {
    it('应该测量同步操作', () => {
      const result = monitor.measureSync('syncOp', () => {
        return 42;
      });
      
      expect(result).toBe(42);
      const metrics = monitor.getMetrics('syncOp');
      expect(metrics.length).toBe(1);
    });

    it('应该捕获同步错误', () => {
      expect(() => {
        monitor.measureSync('errorOp', () => {
          throw new Error('test error');
        });
      }).toThrow('test error');
      
      const metrics = monitor.getMetrics('errorOp');
      expect(metrics.length).toBe(1);
      expect(metrics[0].metadata?.error).toBe(true);
    });
  });

  describe('异步测量', () => {
    it('应该测量异步操作', async () => {
      const result = await monitor.measure('asyncOp', async () => {
        return Promise.resolve(100);
      });
      
      expect(result).toBe(100);
      const metrics = monitor.getMetrics('asyncOp');
      expect(metrics.length).toBe(1);
    });

    it('应该捕获异步错误', async () => {
      await expect(async () => {
        await monitor.measure('asyncError', async () => {
          throw new Error('async error');
        });
      }).rejects.toThrow('async error');
      
      const metrics = monitor.getMetrics('asyncError');
      expect(metrics.length).toBe(1);
      expect(metrics[0].metadata?.error).toBe(true);
    });
  });

  describe('报告生成', () => {
    it('应该生成性能报告', () => {
      monitor.startTimer('op1');
      monitor.endTimer('op1');
      
      monitor.startTimer('op2');
      monitor.endTimer('op2');
      
      const report = monitor.generateReport();
      
      expect(report.metrics.length).toBeGreaterThan(0);
      expect(report.summary.totalTime).toBeGreaterThanOrEqual(0);
      expect(report.summary.averageTime).toBeGreaterThanOrEqual(0);
    });

    it('应该识别最慢和最快操作', () => {
      // 创建不同时长的操作
      monitor.measureSync('fast', () => {
        // 快速操作
      });
      
      monitor.measureSync('slow', () => {
        // 慢操作（模拟）
        let sum = 0;
        for (let i = 0; i < 10000; i++) {
          sum += i;
        }
      });
      
      const report = monitor.generateReport();
      
      expect(report.summary.slowestOperation).toBeDefined();
      expect(report.summary.fastestOperation).toBeDefined();
    });
  });

  describe('指标管理', () => {
    it('应该按名称过滤指标', () => {
      monitor.measureSync('op1', () => {});
      monitor.measureSync('op2', () => {});
      monitor.measureSync('op1', () => {});
      
      const op1Metrics = monitor.getMetrics('op1');
      expect(op1Metrics.length).toBe(2);
    });

    it('应该清除所有指标', () => {
      monitor.measureSync('test', () => {});
      expect(monitor.getMetrics().length).toBe(1);
      
      monitor.clear();
      expect(monitor.getMetrics().length).toBe(0);
    });

    it('应该限制指标数量', () => {
      const limitedMonitor = new PerformanceMonitor({ maxMetrics: 5 });
      
      for (let i = 0; i < 10; i++) {
        limitedMonitor.measureSync(`op${i}`, () => {});
      }
      
      const metrics = limitedMonitor.getMetrics();
      expect(metrics.length).toBeLessThanOrEqual(5);
    });
  });

  describe('导出', () => {
    it('应该导出为 JSON', () => {
      monitor.measureSync('test', () => {});
      
      const json = monitor.exportMetrics();
      expect(() => JSON.parse(json)).not.toThrow();
      
      const data = JSON.parse(json);
      expect(data).toHaveProperty('metrics');
      expect(data).toHaveProperty('summary');
    });
  });

  describe('启用/禁用', () => {
    it('应该动态启用/禁用', () => {
      monitor.setEnabled(false);
      monitor.measureSync('disabled', () => {});
      expect(monitor.getMetrics().length).toBe(0);
      
      monitor.setEnabled(true);
      monitor.measureSync('enabled', () => {});
      expect(monitor.getMetrics().length).toBe(1);
    });
  });
});
