/**
 * TypeScript 类型工具
 * 提供高级类型工具和类型守卫
 */

/**
 * 深度只读类型
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * 深度部分类型
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * 必需类型
 */
export type RequiredKeys<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * 可选类型
 */
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * 类型守卫：检查是否为字符串
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * 类型守卫：检查是否为数字
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * 类型守卫：检查是否为布尔值
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * 类型守卫：检查是否为函数
 */
export function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}

/**
 * 类型守卫：检查是否为对象
 */
export function isObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 类型守卫：检查是否为数组
 */
export function isArray<T = any>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * 类型守卫：检查是否为 null
 */
export function isNull(value: unknown): value is null {
  return value === null;
}

/**
 * 类型守卫：检查是否为 undefined
 */
export function isUndefined(value: unknown): value is undefined {
  return value === undefined;
}

/**
 * 类型守卫：检查是否为 null 或 undefined
 */
export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * 类型守卫：检查是否为 Promise
 */
export function isPromise<T = any>(value: unknown): value is Promise<T> {
  return value instanceof Promise;
}

/**
 * 类型守卫：检查是否为 File
 */
export function isFile(value: unknown): value is File {
  return value instanceof File;
}

/**
 * 类型守卫：检查是否为 Blob
 */
export function isBlob(value: unknown): value is Blob {
  return value instanceof Blob;
}

/**
 * 类型守卫：检查是否为 ArrayBuffer
 */
export function isArrayBuffer(value: unknown): value is ArrayBuffer {
  return value instanceof ArrayBuffer;
}

/**
 * 类型守卫：检查是否为 HTMLElement
 */
export function isHTMLElement(value: unknown): value is HTMLElement {
  return value instanceof HTMLElement;
}

/**
 * 类型守卫：检查是否为 Error
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * 类型守卫：检查是否为空对象
 */
export function isEmptyObject(value: unknown): boolean {
  return isObject(value) && Object.keys(value).length === 0;
}

/**
 * 类型守卫：检查是否为空数组
 */
export function isEmptyArray(value: unknown): boolean {
  return isArray(value) && value.length === 0;
}

/**
 * 断言函数：断言值为真
 */
export function assert(condition: unknown, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

/**
 * 断言函数：断言值为字符串
 */
export function assertString(value: unknown, message?: string): asserts value is string {
  if (!isString(value)) {
    throw new Error(message || 'Value must be a string');
  }
}

/**
 * 断言函数：断言值为数字
 */
export function assertNumber(value: unknown, message?: string): asserts value is number {
  if (!isNumber(value)) {
    throw new Error(message || 'Value must be a number');
  }
}

/**
 * 断言函数：断言值为对象
 */
export function assertObject(
  value: unknown,
  message?: string
): asserts value is Record<string, any> {
  if (!isObject(value)) {
    throw new Error(message || 'Value must be an object');
  }
}

/**
 * 断言函数：断言值不为 null 或 undefined
 */
export function assertNotNullish<T>(
  value: T,
  message?: string
): asserts value is NonNullable<T> {
  if (isNullish(value)) {
    throw new Error(message || 'Value must not be null or undefined');
  }
}

/**
 * 类型收窄：排除 null 和 undefined
 */
export function nonNullable<T>(value: T | null | undefined): value is T {
  return !isNullish(value);
}

/**
 * 安全的 JSON 解析
 */
export function safeJsonParse<T = any>(
  json: string,
  defaultValue?: T
): T | undefined {
  try {
    return JSON.parse(json) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * 安全的 JSON 序列化
 */
export function safeJsonStringify(value: any, defaultValue: string = '{}'): string {
  try {
    return JSON.stringify(value);
  } catch {
    return defaultValue;
  }
}

/**
 * 深度克隆
 */
export function deepClone<T>(value: T): T {
  if (isNullish(value)) {
    return value;
  }

  if (isArray(value)) {
    return value.map((item) => deepClone(item)) as any;
  }

  if (isObject(value)) {
    const cloned: any = {};
    for (const key in value) {
      if (value.hasOwnProperty(key)) {
        cloned[key] = deepClone(value[key]);
      }
    }
    return cloned;
  }

  return value;
}

/**
 * 深度合并
 */
export function deepMerge<T extends Record<string, any>>(
  target: T,
  ...sources: Partial<T>[]
): T {
  if (!sources.length) {
    return target;
  }

  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        const sourceValue = source[key];
        const targetValue = target[key];

        if (isObject(sourceValue) && isObject(targetValue)) {
          target[key] = deepMerge(Object.assign({}, targetValue), sourceValue);
        } else {
          target[key] = sourceValue as any;
        }
      }
    }
  }

  return deepMerge(target, ...sources);
}

/**
 * Pick 类型的运行时实现
 */
export function pick<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach((key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
}

/**
 * Omit 类型的运行时实现
 */
export function omit<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((key) => {
    delete result[key];
  });
  return result;
}

/**
 * 类型安全的对象键获取
 */
export function keys<T extends Record<string, any>>(obj: T): Array<keyof T> {
  return Object.keys(obj) as Array<keyof T>;
}

/**
 * 类型安全的对象值获取
 */
export function values<T extends Record<string, any>>(obj: T): Array<T[keyof T]> {
  return Object.values(obj);
}

/**
 * 类型安全的对象条目获取
 */
export function entries<T extends Record<string, any>>(
  obj: T
): Array<[keyof T, T[keyof T]]> {
  return Object.entries(obj) as Array<[keyof T, T[keyof T]]>;
}



