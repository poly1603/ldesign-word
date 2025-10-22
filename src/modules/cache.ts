/**
 * 文档缓存模块
 * 使用 IndexedDB 缓存已解析的文档
 */

export interface CacheEntry {
  key: string;
  buffer: ArrayBuffer;
  parsedData?: any;
  metadata: {
    size: number;
    type: string;
    timestamp: number;
    hits: number;
    lastAccess: number;
  };
}

export interface CacheOptions {
  /** 数据库名称 */
  dbName?: string;
  /** 存储名称 */
  storeName?: string;
  /** 最大缓存大小（字节） */
  maxSize?: number;
  /** 缓存过期时间（毫秒） */
  maxAge?: number;
}

/**
 * IndexedDB 缓存管理器
 */
export class DocumentCache {
  private dbName: string;
  private storeName: string;
  private maxSize: number;
  private maxAge: number;
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  constructor(options: CacheOptions = {}) {
    this.dbName = options.dbName || 'word-viewer-cache';
    this.storeName = options.storeName || 'documents';
    this.maxSize = options.maxSize || 100 * 1024 * 1024; // 默认 100MB
    this.maxAge = options.maxAge || 7 * 24 * 60 * 60 * 1000; // 默认 7 天
  }

  /**
   * 初始化数据库
   */
  private async init(): Promise<void> {
    if (this.db) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => {
        reject(new Error('无法打开 IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(this.storeName)) {
          const objectStore = db.createObjectStore(this.storeName, { keyPath: 'key' });
          objectStore.createIndex('timestamp', 'metadata.timestamp', { unique: false });
          objectStore.createIndex('lastAccess', 'metadata.lastAccess', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * 生成缓存键
   */
  private generateKey(buffer: ArrayBuffer): string {
    // 使用文件的前几个字节和大小生成简单的哈希
    const bytes = new Uint8Array(buffer.slice(0, Math.min(1024, buffer.byteLength)));
    let hash = buffer.byteLength.toString(36);

    for (let i = 0; i < bytes.length; i += 32) {
      hash += bytes[i].toString(36);
    }

    return hash;
  }

  /**
   * 获取缓存
   */
  async get(key: string): Promise<CacheEntry | null> {
    await this.init();

    if (!this.db) {
      return null;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.get(key);

      request.onsuccess = () => {
        const entry = request.result as CacheEntry | undefined;

        if (!entry) {
          resolve(null);
          return;
        }

        // 检查是否过期
        const age = Date.now() - entry.metadata.timestamp;
        if (age > this.maxAge) {
          // 删除过期缓存
          objectStore.delete(key);
          resolve(null);
          return;
        }

        // 更新访问信息
        entry.metadata.hits++;
        entry.metadata.lastAccess = Date.now();
        objectStore.put(entry);

        resolve(entry);
      };

      request.onerror = () => {
        reject(new Error('获取缓存失败'));
      };
    });
  }

  /**
   * 设置缓存
   */
  async set(buffer: ArrayBuffer, parsedData?: any): Promise<string> {
    await this.init();

    if (!this.db) {
      throw new Error('数据库未初始化');
    }

    const key = this.generateKey(buffer);
    const entry: CacheEntry = {
      key,
      buffer,
      parsedData,
      metadata: {
        size: buffer.byteLength,
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        timestamp: Date.now(),
        hits: 0,
        lastAccess: Date.now(),
      },
    };

    // 检查是否需要清理空间
    await this.ensureSpace(entry.metadata.size);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.put(entry);

      request.onsuccess = () => {
        resolve(key);
      };

      request.onerror = () => {
        reject(new Error('设置缓存失败'));
      };
    });
  }

  /**
   * 确保有足够空间
   */
  private async ensureSpace(requiredSize: number): Promise<void> {
    const totalSize = await this.getTotalSize();

    if (totalSize + requiredSize <= this.maxSize) {
      return;
    }

    // 删除最少使用的缓存
    await this.evictLRU(requiredSize);
  }

  /**
   * 获取总缓存大小
   */
  private async getTotalSize(): Promise<number> {
    if (!this.db) {
      return 0;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.getAll();

      request.onsuccess = () => {
        const entries = request.result as CacheEntry[];
        const totalSize = entries.reduce((sum, entry) => sum + entry.metadata.size, 0);
        resolve(totalSize);
      };

      request.onerror = () => {
        reject(new Error('获取缓存大小失败'));
      };
    });
  }

  /**
   * LRU 淘汰策略
   */
  private async evictLRU(requiredSize: number): Promise<void> {
    if (!this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);
      const index = objectStore.index('lastAccess');
      const request = index.openCursor();

      let freedSize = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;

        if (!cursor) {
          resolve();
          return;
        }

        const entry = cursor.value as CacheEntry;

        // 删除该条目
        objectStore.delete(entry.key);
        freedSize += entry.metadata.size;

        // 如果释放了足够空间，停止
        if (freedSize >= requiredSize) {
          resolve();
          return;
        }

        cursor.continue();
      };

      request.onerror = () => {
        reject(new Error('淘汰缓存失败'));
      };
    });
  }

  /**
   * 删除缓存
   */
  async delete(key: string): Promise<void> {
    await this.init();

    if (!this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.delete(key);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('删除缓存失败'));
      };
    });
  }

  /**
   * 清空所有缓存
   */
  async clear(): Promise<void> {
    await this.init();

    if (!this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('清空缓存失败'));
      };
    });
  }

  /**
   * 获取缓存统计信息
   */
  async getStats(): Promise<{
    count: number;
    totalSize: number;
    oldestEntry: number;
    newestEntry: number;
  }> {
    await this.init();

    if (!this.db) {
      return { count: 0, totalSize: 0, oldestEntry: 0, newestEntry: 0 };
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.getAll();

      request.onsuccess = () => {
        const entries = request.result as CacheEntry[];

        if (entries.length === 0) {
          resolve({ count: 0, totalSize: 0, oldestEntry: 0, newestEntry: 0 });
          return;
        }

        const totalSize = entries.reduce((sum, entry) => sum + entry.metadata.size, 0);
        const timestamps = entries.map(entry => entry.metadata.timestamp);

        resolve({
          count: entries.length,
          totalSize,
          oldestEntry: Math.min(...timestamps),
          newestEntry: Math.max(...timestamps),
        });
      };

      request.onerror = () => {
        reject(new Error('获取统计信息失败'));
      };
    });
  }

  /**
   * 关闭数据库
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }
}



