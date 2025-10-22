/**
 * 自定义错误类
 * 为不同类型的错误提供具体的错误类
 */

export class WordViewerError extends Error {
  public code: string;
  public details?: any;
  public timestamp: number;

  constructor(message: string, code: string, details?: any) {
    super(message);
    this.name = 'WordViewerError';
    this.code = code;
    this.details = details;
    this.timestamp = Date.now();

    // 维护正确的原型链
    Object.setPrototypeOf(this, WordViewerError.prototype);
  }

  toString(): string {
    return `[${this.code}] ${this.message}`;
  }

  toJSON(): Record<string, any> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

/**
 * 文件加载错误
 */
export class LoadError extends WordViewerError {
  constructor(message: string, details?: any) {
    super(message, 'LOAD_ERROR', details);
    this.name = 'LoadError';
    Object.setPrototypeOf(this, LoadError.prototype);
  }
}

/**
 * 文件解析错误
 */
export class ParseError extends WordViewerError {
  constructor(message: string, details?: any) {
    super(message, 'PARSE_ERROR', details);
    this.name = 'ParseError';
    Object.setPrototypeOf(this, ParseError.prototype);
  }
}

/**
 * 渲染错误
 */
export class RenderError extends WordViewerError {
  constructor(message: string, details?: any) {
    super(message, 'RENDER_ERROR', details);
    this.name = 'RenderError';
    Object.setPrototypeOf(this, RenderError.prototype);
  }
}

/**
 * 导出错误
 */
export class ExportError extends WordViewerError {
  constructor(message: string, details?: any) {
    super(message, 'EXPORT_ERROR', details);
    this.name = 'ExportError';
    Object.setPrototypeOf(this, ExportError.prototype);
  }
}

/**
 * 网络错误
 */
export class NetworkError extends WordViewerError {
  public status?: number;
  public statusText?: string;

  constructor(message: string, status?: number, statusText?: string, details?: any) {
    super(message, 'NETWORK_ERROR', details);
    this.name = 'NetworkError';
    this.status = status;
    this.statusText = statusText;
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * 验证错误
 */
export class ValidationError extends WordViewerError {
  public field?: string;

  constructor(message: string, field?: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
    this.field = field;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * 不支持的格式错误
 */
export class UnsupportedFormatError extends WordViewerError {
  public format?: string;

  constructor(message: string, format?: string, details?: any) {
    super(message, 'UNSUPPORTED_FORMAT', details);
    this.name = 'UnsupportedFormatError';
    this.format = format;
    Object.setPrototypeOf(this, UnsupportedFormatError.prototype);
  }
}

/**
 * 配置错误
 */
export class ConfigError extends WordViewerError {
  constructor(message: string, details?: any) {
    super(message, 'CONFIG_ERROR', details);
    this.name = 'ConfigError';
    Object.setPrototypeOf(this, ConfigError.prototype);
  }
}

/**
 * 操作错误（用户操作相关）
 */
export class OperationError extends WordViewerError {
  public operation?: string;

  constructor(message: string, operation?: string, details?: any) {
    super(message, 'OPERATION_ERROR', details);
    this.name = 'OperationError';
    this.operation = operation;
    Object.setPrototypeOf(this, OperationError.prototype);
  }
}

/**
 * 错误工厂函数
 */
export function createError(
  type: string,
  message: string,
  details?: any
): WordViewerError {
  switch (type) {
    case 'load':
      return new LoadError(message, details);
    case 'parse':
      return new ParseError(message, details);
    case 'render':
      return new RenderError(message, details);
    case 'export':
      return new ExportError(message, details);
    case 'network':
      return new NetworkError(message, undefined, undefined, details);
    case 'validation':
      return new ValidationError(message, undefined, details);
    case 'unsupported':
      return new UnsupportedFormatError(message, undefined, details);
    case 'config':
      return new ConfigError(message, details);
    case 'operation':
      return new OperationError(message, undefined, details);
    default:
      return new WordViewerError(message, 'UNKNOWN_ERROR', details);
  }
}

/**
 * 错误处理器
 */
export type ErrorHandler = (error: WordViewerError) => void | Promise<void>;

export class ErrorBoundary {
  private handlers: Set<ErrorHandler> = new Set();
  private recoveryStrategies: Map<string, () => void> = new Map();

  /**
   * 添加错误处理器
   */
  addHandler(handler: ErrorHandler): void {
    this.handlers.add(handler);
  }

  /**
   * 移除错误处理器
   */
  removeHandler(handler: ErrorHandler): void {
    this.handlers.delete(handler);
  }

  /**
   * 处理错误
   */
  async handleError(error: Error): Promise<void> {
    const wordError =
      error instanceof WordViewerError
        ? error
        : new WordViewerError(error.message, 'UNKNOWN_ERROR', { originalError: error });

    // 执行所有错误处理器
    for (const handler of this.handlers) {
      try {
        await handler(wordError);
      } catch (handlerError) {
        console.error('错误处理器执行失败:', handlerError);
      }
    }

    // 尝试恢复
    const recovery = this.recoveryStrategies.get(wordError.code);
    if (recovery) {
      try {
        recovery();
      } catch (recoveryError) {
        console.error('错误恢复失败:', recoveryError);
      }
    }
  }

  /**
   * 注册恢复策略
   */
  registerRecovery(code: string, recovery: () => void): void {
    this.recoveryStrategies.set(code, recovery);
  }

  /**
   * 清理
   */
  clear(): void {
    this.handlers.clear();
    this.recoveryStrategies.clear();
  }
}

/**
 * 包装函数以捕获错误
 */
export function wrapWithErrorHandler<T extends (...args: any[]) => any>(
  fn: T,
  errorHandler: (error: Error) => void
): T {
  return ((...args: Parameters<T>) => {
    try {
      const result = fn(...args);

      // 处理 Promise
      if (result instanceof Promise) {
        return result.catch((error) => {
          errorHandler(error);
          throw error;
        });
      }

      return result;
    } catch (error) {
      errorHandler(error as Error);
      throw error;
    }
  }) as T;
}




