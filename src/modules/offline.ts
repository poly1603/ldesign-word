/**
 * 离线支持模块
 * 管理 Service Worker 和 IndexedDB 缓存
 */

import { Logger } from '../utils/logger';

const logger = new Logger({ prefix: '[Offline]' });

export interface OfflineOptions {
  enableServiceWorker?: boolean;
  enableIndexedDB?: boolean;
  dbName?: string;
  dbVersion?: number;
}

/**
 * IndexedDB 管理器
 */
export class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private dbName: string;
  private dbVersion: number;
  private storeName: string = 'documents';

  constructor(dbName: string = 'WordViewerDB', dbVersion: number = 1) {
    this.dbName = dbName;
    this.dbVersion = dbVersion;
  }

  /**
   * 初始化数据库
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        logger.error('IndexedDB 初始化失败', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        logger.info('IndexedDB 已初始化');
        resolve();
      };

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result as IDBDatabase;

        // 创建对象存储
        if (!db.objectStoreNames.contains(this.storeName)) {
          const objectStore = db.createObjectStore(this.storeName, {
            keyPath: 'id',
            autoIncrement: true,
          });

          // 创建索引
          objectStore.createIndex('name', 'name', { unique: false });
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });

          logger.info('对象存储已创建', { storeName: this.storeName });
        }
      };
    });
  }

  /**
   * 保存文档
   */
  async saveDocument(name: string, data: ArrayBuffer): Promise<number> {
    if (!this.db) {
      throw new Error('IndexedDB 未初始化');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);

      const document = {
        name,
        data,
        timestamp: Date.now(),
        size: data.byteLength,
      };

      const request = objectStore.add(document);

      request.onsuccess = () => {
        logger.info('文档已保存', { id: request.result, name });
        resolve(request.result as number);
      };

      request.onerror = () => {
        logger.error('保存文档失败', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 获取文档
   */
  async getDocument(id: number): Promise<{ name: string; data: ArrayBuffer } | null> {
    if (!this.db) {
      throw new Error('IndexedDB 未初始化');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        logger.error('获取文档失败', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 获取所有文档
   */
  async getAllDocuments(): Promise<Array<{ id: number; name: string; timestamp: number; size: number }>> {
    if (!this.db) {
      throw new Error('IndexedDB 未初始化');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.getAll();

      request.onsuccess = () => {
        const documents = request.result.map((doc: any) => ({
          id: doc.id,
          name: doc.name,
          timestamp: doc.timestamp,
          size: doc.size,
        }));
        resolve(documents);
      };

      request.onerror = () => {
        logger.error('获取文档列表失败', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 删除文档
   */
  async deleteDocument(id: number): Promise<void> {
    if (!this.db) {
      throw new Error('IndexedDB 未初始化');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.delete(id);

      request.onsuccess = () => {
        logger.info('文档已删除', { id });
        resolve();
      };

      request.onerror = () => {
        logger.error('删除文档失败', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 清空所有文档
   */
  async clearAll(): Promise<void> {
    if (!this.db) {
      throw new Error('IndexedDB 未初始化');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.clear();

      request.onsuccess = () => {
        logger.info('所有文档已清空');
        resolve();
      };

      request.onerror = () => {
        logger.error('清空文档失败', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 获取存储大小
   */
  async getStorageSize(): Promise<number> {
    if (!this.db) {
      throw new Error('IndexedDB 未初始化');
    }

    const documents = await this.getAllDocuments();
    return documents.reduce((total, doc) => total + doc.size, 0);
  }

  /**
   * 关闭数据库
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      logger.info('IndexedDB 已关闭');
    }
  }
}

/**
 * 离线管理器
 */
export class OfflineManager {
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private indexedDB: IndexedDBManager | null = null;
  private options: OfflineOptions;

  constructor(options: OfflineOptions = {}) {
    this.options = {
      enableServiceWorker: options.enableServiceWorker !== false,
      enableIndexedDB: options.enableIndexedDB !== false,
      dbName: options.dbName || 'WordViewerDB',
      dbVersion: options.dbVersion || 1,
    };
  }

  /**
   * 初始化离线支持
   */
  async initialize(): Promise<void> {
    if (this.options.enableServiceWorker) {
      await this.registerServiceWorker();
    }

    if (this.options.enableIndexedDB) {
      await this.initializeIndexedDB();
    }

    logger.info('离线支持已初始化', this.options);
  }

  /**
   * 注册 Service Worker
   */
  private async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      logger.warn('浏览器不支持 Service Worker');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
      });

      this.serviceWorkerRegistration = registration;
      logger.info('Service Worker 已注册');

      // 监听更新
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              logger.info('新的 Service Worker 可用');
            }
          });
        }
      });
    } catch (error) {
      logger.error('Service Worker 注册失败', error);
    }
  }

  /**
   * 初始化 IndexedDB
   */
  private async initializeIndexedDB(): Promise<void> {
    this.indexedDB = new IndexedDBManager(this.options.dbName!, this.options.dbVersion!);
    await this.indexedDB.initialize();
  }

  /**
   * 获取 IndexedDB 管理器
   */
  getIndexedDB(): IndexedDBManager | null {
    return this.indexedDB;
  }

  /**
   * 检查是否在线
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * 监听网络状态变化
   */
  onNetworkChange(callback: (online: boolean) => void): () => void {
    const handleOnline = () => {
      logger.info('网络已连接');
      callback(true);
    };

    const handleOffline = () => {
      logger.info('网络已断开');
      callback(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 返回清理函数
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }

  /**
   * 清除缓存
   */
  async clearCache(): Promise<void> {
    // 清除 Service Worker 缓存
    if (this.serviceWorkerRegistration) {
      const channel = new MessageChannel();
      this.serviceWorkerRegistration.active?.postMessage(
        { action: 'clearCache' },
        [channel.port2]
      );

      await new Promise((resolve) => {
        channel.port1.onmessage = (event) => {
          if (event.data.success) {
            logger.info('Service Worker 缓存已清除');
            resolve(undefined);
          }
        };
      });
    }

    // 清除 IndexedDB
    if (this.indexedDB) {
      await this.indexedDB.clearAll();
    }
  }

  /**
   * 销毁
   */
  async destroy(): Promise<void> {
    if (this.serviceWorkerRegistration) {
      await this.serviceWorkerRegistration.unregister();
      this.serviceWorkerRegistration = null;
      logger.info('Service Worker 已注销');
    }

    if (this.indexedDB) {
      this.indexedDB.close();
      this.indexedDB = null;
    }
  }
}
