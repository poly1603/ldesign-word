/**
 * 内存管理和监控工具
 */

export interface MemoryInfo {
  /** 总内存（字节） */
  totalJSHeapSize?: number;
  /** 已使用内存（字节） */
  usedJSHeapSize?: number;
  /** 内存限制（字节） */
  jsHeapSizeLimit?: number;
  /** 使用率（百分比） */
  usagePercent?: number;
}

export interface MemoryWarning {
  level: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  usage: number;
  timestamp: number;
}

export type MemoryWarningCallback = (warning: MemoryWarning) => void;

/**
 * 内存监控器
 */
export class MemoryMonitor {
  private checkInterval: number;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private warningCallbacks: Set<MemoryWarningCallback> = new Set();
  private lastWarningLevel: string | null = null;

  // 内存使用阈值（百分比）
  private thresholds = {
    low: 60,
    medium: 75,
    high: 85,
    critical: 95,
  };

  constructor(checkInterval = 5000) {
    this.checkInterval = checkInterval;
  }

  /**
   * 获取当前内存信息
   */
  getMemoryInfo(): MemoryInfo {
    const performance = window.performance as any;

    if (performance && performance.memory) {
      const memory = performance.memory;
      const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

      return {
        totalJSHeapSize: memory.totalJSHeapSize,
        usedJSHeapSize: memory.usedJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usagePercent: Math.round(usagePercent * 100) / 100,
      };
    }

    return {};
  }

  /**
   * 开始监控
   */
  start(): void {
    if (this.intervalId) {
      return;
    }

    this.intervalId = setInterval(() => {
      this.check();
    }, this.checkInterval);
  }

  /**
   * 停止监控
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * 检查内存使用情况
   */
  private check(): void {
    const info = this.getMemoryInfo();

    if (!info.usagePercent) {
      return;
    }

    const usage = info.usagePercent;
    let level: MemoryWarning['level'] | null = null;
    let message = '';

    if (usage >= this.thresholds.critical) {
      level = 'critical';
      message = `严重警告：内存使用率达到 ${usage.toFixed(1)}%，系统可能崩溃`;
    } else if (usage >= this.thresholds.high) {
      level = 'high';
      message = `高度警告：内存使用率达到 ${usage.toFixed(1)}%`;
    } else if (usage >= this.thresholds.medium) {
      level = 'medium';
      message = `中度警告：内存使用率达到 ${usage.toFixed(1)}%`;
    } else if (usage >= this.thresholds.low) {
      level = 'low';
      message = `低度警告：内存使用率达到 ${usage.toFixed(1)}%`;
    }

    // 只在警告级别变化时通知
    if (level && level !== this.lastWarningLevel) {
      this.lastWarningLevel = level;
      this.notifyWarning({
        level,
        message,
        usage,
        timestamp: Date.now(),
      });
    }

    // 如果内存使用率降低，重置警告级别
    if (usage < this.thresholds.low && this.lastWarningLevel) {
      this.lastWarningLevel = null;
    }
  }

  /**
   * 通知警告
   */
  private notifyWarning(warning: MemoryWarning): void {
    this.warningCallbacks.forEach(callback => {
      try {
        callback(warning);
      } catch (error) {
        console.error('内存警告回调错误:', error);
      }
    });
  }

  /**
   * 添加警告回调
   */
  onWarning(callback: MemoryWarningCallback): void {
    this.warningCallbacks.add(callback);
  }

  /**
   * 移除警告回调
   */
  offWarning(callback: MemoryWarningCallback): void {
    this.warningCallbacks.delete(callback);
  }

  /**
   * 设置阈值
   */
  setThresholds(thresholds: Partial<typeof this.thresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }
}

/**
 * 估算对象大小（近似值）
 */
export function estimateSize(obj: any): number {
  const seen = new WeakSet();

  function sizeOf(obj: any): number {
    if (obj === null || obj === undefined) {
      return 0;
    }

    const type = typeof obj;

    // 基本类型
    if (type === 'boolean') return 4;
    if (type === 'number') return 8;
    if (type === 'string') return obj.length * 2;

    // 避免循环引用
    if (type === 'object') {
      if (seen.has(obj)) {
        return 0;
      }
      seen.add(obj);

      let size = 0;

      if (Array.isArray(obj)) {
        size = obj.reduce((acc, item) => acc + sizeOf(item), 0);
      } else if (obj instanceof ArrayBuffer) {
        size = obj.byteLength;
      } else if (obj instanceof Blob) {
        size = obj.size;
      } else {
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            size += key.length * 2; // 键的大小
            size += sizeOf(obj[key]); // 值的大小
          }
        }
      }

      return size;
    }

    return 0;
  }

  return sizeOf(obj);
}

/**
 * 清理大对象
 */
export function clearLargeObject(obj: any): void {
  if (!obj || typeof obj !== 'object') {
    return;
  }

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      delete obj[key];
    }
  }
}

/**
 * 建议垃圾回收（仅在某些环境有效）
 */
export function suggestGC(): void {
  if (typeof (window as any).gc === 'function') {
    (window as any).gc();
  }
}

/**
 * 格式化字节大小
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}




