/**
 * 性能监控模块
 * 监控和分析文档操作的性能指标
 */

import { Logger } from '../utils/logger';

const logger = new Logger({ prefix: '[Performance]' });

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface PerformanceReport {
  metrics: PerformanceMetric[];
  summary: {
    totalTime: number;
    averageTime: number;
    slowestOperation: PerformanceMetric | null;
    fastestOperation: PerformanceMetric | null;
  };
}

/**
 * 性能监控器
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = new Map();
  private activeTimers: Map<string, number> = new Map();
  private maxMetrics: number = 1000;
  private enabled: boolean = true;

  constructor(options: { enabled?: boolean; maxMetrics?: number } = {}) {
    this.enabled = options.enabled !== false;
    this.maxMetrics = options.maxMetrics || 1000;

    logger.info('性能监控器已初始化', { enabled: this.enabled });
  }

  /**
   * 开始计时
   */
  startTimer(name: string, metadata?: Record<string, any>): void {
    if (!this.enabled) return;

    const timerId = `${name}_${Date.now()}`;
    this.activeTimers.set(timerId, performance.now());

    logger.debug('计时开始', { name, timerId });
  }

  /**
   * 结束计时
   */
  endTimer(name: string, metadata?: Record<string, any>): number {
    if (!this.enabled) return 0;

    // 查找对应的计时器
    const timerId = Array.from(this.activeTimers.keys()).find(id =>
      id.startsWith(`${name}_`)
    );

    if (!timerId) {
      logger.warn('未找到对应的计时器', { name });
      return 0;
    }

    const startTime = this.activeTimers.get(timerId)!;
    const endTime = performance.now();
    const duration = endTime - startTime;

    // 记录指标
    this.recordMetric({
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    });

    this.activeTimers.delete(timerId);

    logger.debug('计时结束', { name, duration: `${duration.toFixed(2)}ms` });

    return duration;
  }

  /**
   * 测量异步操作
   */
  async measure<T>(
    name: string,
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.startTimer(name, metadata);
    try {
      const result = await operation();
      this.endTimer(name, metadata);
      return result;
    } catch (error) {
      this.endTimer(name, { ...metadata, error: true });
      throw error;
    }
  }

  /**
   * 测量同步操作
   */
  measureSync<T>(
    name: string,
    operation: () => T,
    metadata?: Record<string, any>
  ): T {
    const startTime = performance.now();
    try {
      const result = operation();
      const duration = performance.now() - startTime;

      this.recordMetric({
        name,
        duration,
        timestamp: Date.now(),
        metadata,
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric({
        name,
        duration,
        timestamp: Date.now(),
        metadata: { ...metadata, error: true },
      });
      throw error;
    }
  }

  /**
   * 记录指标
   */
  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // 限制指标数量
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // 如果操作很慢，记录警告
    if (metric.duration > 1000) {
      logger.warn('操作耗时较长', {
        name: metric.name,
        duration: `${metric.duration.toFixed(2)}ms`,
      });
    }
  }

  /**
   * 获取所有指标
   */
  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter(m => m.name === name);
    }
    return [...this.metrics];
  }

  /**
   * 生成性能报告
   */
  generateReport(name?: string): PerformanceReport {
    const metrics = this.getMetrics(name);

    if (metrics.length === 0) {
      return {
        metrics: [],
        summary: {
          totalTime: 0,
          averageTime: 0,
          slowestOperation: null,
          fastestOperation: null,
        },
      };
    }

    const totalTime = metrics.reduce((sum, m) => sum + m.duration, 0);
    const averageTime = totalTime / metrics.length;
    const sortedByDuration = [...metrics].sort((a, b) => b.duration - a.duration);
    const slowestOperation = sortedByDuration[0];
    const fastestOperation = sortedByDuration[sortedByDuration.length - 1];

    return {
      metrics,
      summary: {
        totalTime,
        averageTime,
        slowestOperation,
        fastestOperation,
      },
    };
  }

  /**
   * 清除指标
   */
  clear(): void {
    this.metrics = [];
    this.activeTimers.clear();
    logger.info('性能指标已清除');
  }

  /**
   * 启用/禁用监控
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    logger.info(enabled ? '性能监控已启用' : '性能监控已禁用');
  }

  /**
   * 导出指标为 JSON
   */
  exportMetrics(): string {
    const report = this.generateReport();
    return JSON.stringify(report, null, 2);
  }

  /**
   * 获取内存使用情况
   */
  getMemoryUsage(): {
    jsHeapSizeLimit?: number;
    totalJSHeapSize?: number;
    usedJSHeapSize?: number;
  } {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        totalJSHeapSize: memory.totalJSHeapSize,
        usedJSHeapSize: memory.usedJSHeapSize,
      };
    }
    return {};
  }

  /**
   * 记录自定义事件
   */
  mark(name: string, metadata?: Record<string, any>): void {
    if (!this.enabled) return;

    if (typeof performance.mark === 'function') {
      performance.mark(name);
    }

    logger.debug('性能标记', { name, metadata });
  }

  /**
   * 测量两个标记之间的时间
   */
  measureMarks(name: string, startMark: string, endMark: string): number {
    if (!this.enabled) return 0;

    if (typeof performance.measure === 'function') {
      try {
        performance.measure(name, startMark, endMark);
        const entries = performance.getEntriesByName(name, 'measure');
        if (entries.length > 0) {
          const duration = entries[entries.length - 1].duration;
          this.recordMetric({
            name,
            duration,
            timestamp: Date.now(),
          });
          return duration;
        }
      } catch (error) {
        logger.warn('性能测量失败', { error });
      }
    }

    return 0;
  }
}

/**
 * 全局性能监控器实例
 */
export const globalPerformanceMonitor = new PerformanceMonitor();

/**
 * 性能装饰器
 */
export function measurePerformance(name?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const metricName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      return globalPerformanceMonitor.measure(
        metricName,
        () => originalMethod.apply(this, args)
      );
    };

    return descriptor;
  };
}
