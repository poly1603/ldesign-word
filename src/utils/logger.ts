/**
 * 日志系统
 * 提供分级日志记录和日志管理功能
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  data?: any;
  stack?: string;
}

export type LogHandler = (entry: LogEntry) => void;

export interface LoggerOptions {
  level?: LogLevel;
  prefix?: string;
  enableTimestamp?: boolean;
  enableStackTrace?: boolean;
  maxEntries?: number;
}

/**
 * 日志记录器
 */
export class Logger {
  private level: LogLevel;
  private prefix: string;
  private enableTimestamp: boolean;
  private enableStackTrace: boolean;
  private maxEntries: number;
  private entries: LogEntry[] = [];
  private handlers: Set<LogHandler> = new Set();

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? LogLevel.INFO;
    this.prefix = options.prefix || '[WordViewer]';
    this.enableTimestamp = options.enableTimestamp ?? true;
    this.enableStackTrace = options.enableStackTrace ?? false;
    this.maxEntries = options.maxEntries || 1000;
  }

  /**
   * 设置日志级别
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * 获取日志级别
   */
  getLevel(): LogLevel {
    return this.level;
  }

  /**
   * 添加日志处理器
   */
  addHandler(handler: LogHandler): void {
    this.handlers.add(handler);
  }

  /**
   * 移除日志处理器
   */
  removeHandler(handler: LogHandler): void {
    this.handlers.delete(handler);
  }

  /**
   * 记录日志
   */
  private log(level: LogLevel, message: string, data?: any): void {
    if (level < this.level) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      data,
    };

    // 添加堆栈跟踪
    if (this.enableStackTrace && level >= LogLevel.ERROR) {
      entry.stack = new Error().stack;
    }

    // 添加到历史
    this.entries.push(entry);

    // 限制历史记录数量
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }

    // 调用处理器
    this.handlers.forEach((handler) => {
      try {
        handler(entry);
      } catch (error) {
        console.error('日志处理器错误:', error);
      }
    });

    // 输出到控制台
    this.consoleOutput(entry);
  }

  /**
   * 输出到控制台
   */
  private consoleOutput(entry: LogEntry): void {
    const timestamp = this.enableTimestamp
      ? `[${new Date(entry.timestamp).toISOString()}]`
      : '';

    const prefix = `${timestamp} ${this.prefix}`;
    const message = `${prefix} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.data || '');
        break;
      case LogLevel.INFO:
        console.info(message, entry.data || '');
        break;
      case LogLevel.WARN:
        console.warn(message, entry.data || '');
        break;
      case LogLevel.ERROR:
        console.error(message, entry.data || '', entry.stack || '');
        break;
      case LogLevel.FATAL:
        console.error('FATAL:', message, entry.data || '', entry.stack || '');
        break;
    }
  }

  /**
   * Debug 级别日志
   */
  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Info 级别日志
   */
  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Warn 级别日志
   */
  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Error 级别日志
   */
  error(message: string, data?: any): void {
    this.log(LogLevel.ERROR, message, data);
  }

  /**
   * Fatal 级别日志
   */
  fatal(message: string, data?: any): void {
    this.log(LogLevel.FATAL, message, data);
  }

  /**
   * 获取所有日志
   */
  getEntries(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.entries.filter((entry) => entry.level === level);
    }
    return [...this.entries];
  }

  /**
   * 清空日志
   */
  clear(): void {
    this.entries = [];
  }

  /**
   * 导出日志
   */
  export(format: 'json' | 'text' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.entries, null, 2);
    }

    // 文本格式
    return this.entries
      .map((entry) => {
        const timestamp = new Date(entry.timestamp).toISOString();
        const level = LogLevel[entry.level];
        const data = entry.data ? ` - ${JSON.stringify(entry.data)}` : '';
        const stack = entry.stack ? `\n${entry.stack}` : '';
        return `[${timestamp}] [${level}] ${entry.message}${data}${stack}`;
      })
      .join('\n');
  }

  /**
   * 创建子日志记录器
   */
  createChild(prefix: string): Logger {
    return new Logger({
      level: this.level,
      prefix: `${this.prefix}:${prefix}`,
      enableTimestamp: this.enableTimestamp,
      enableStackTrace: this.enableStackTrace,
      maxEntries: this.maxEntries,
    });
  }
}

/**
 * 全局日志记录器实例
 */
export const globalLogger = new Logger({
  level: LogLevel.INFO,
  prefix: '[WordViewer]',
});

/**
 * 便捷函数
 */
export const debug = (message: string, data?: any) => globalLogger.debug(message, data);
export const info = (message: string, data?: any) => globalLogger.info(message, data);
export const warn = (message: string, data?: any) => globalLogger.warn(message, data);
export const error = (message: string, data?: any) => globalLogger.error(message, data);
export const fatal = (message: string, data?: any) => globalLogger.fatal(message, data);




