/**
 * 文档解析模块
 * 支持 Web Worker 后台解析和流式加载
 */

import { DocumentInfo } from '../core/types';
import { isSupportedFile, readFileAsArrayBuffer, loadFileFromUrl } from '../utils/file';
import { ERROR_CODES } from '../core/constants';
import { DocumentCache } from './cache';
import type { WordViewer } from '../core/WordViewer';

export class ParserModule {
  private viewer: WordViewer;
  private cache: DocumentCache;
  private worker: Worker | null = null;
  private useWorker: boolean = true;

  constructor(viewer: WordViewer) {
    this.viewer = viewer;
    this.cache = new DocumentCache();

    // 检测 Worker 支持
    if (typeof Worker !== 'undefined') {
      try {
        // 动态创建 Worker（避免构建时的路径问题）
        this.worker = this.createParserWorker();
      } catch (error) {
        console.warn('无法创建 Parser Worker，降级到主线程解析:', error);
        this.useWorker = false;
      }
    } else {
      this.useWorker = false;
    }
  }

  /**
   * 创建解析器 Worker
   */
  private createParserWorker(): Worker {
    // 创建内联 Worker
    const workerCode = `
      self.onmessage = async (event) => {
        const { id, type, data } = event.data;
        try {
          let result;
          switch (type) {
            case 'validate':
              result = validateDocument(data);
              break;
            case 'extract-info':
              result = extractDocumentInfo(data);
              break;
            default:
              throw new Error('未知任务类型');
          }
          self.postMessage({ id, result });
        } catch (error) {
          self.postMessage({ id, error: error.message });
        }
      };

      function validateDocument(buffer) {
        const view = new Uint8Array(buffer.slice(0, 4));
        // DOCX (ZIP)
        if (view[0] === 0x50 && view[1] === 0x4B) return true;
        // DOC
        if (view[0] === 0xD0 && view[1] === 0xCF && view[2] === 0x11 && view[3] === 0xE0) return true;
        return false;
      }

      function extractDocumentInfo(buffer) {
        return {
          title: '未命名文档',
          author: '',
          created: new Date(),
          modified: new Date(),
          pageCount: 1,
          wordCount: 0,
          size: buffer.byteLength,
        };
      }
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);

    // 延迟清理 URL
    setTimeout(() => URL.revokeObjectURL(url), 100);

    return worker;
  }

  /**
   * 在 Worker 中执行任务
   */
  private executeInWorker<T = any>(type: string, data: any): Promise<T> {
    if (!this.worker) {
      throw new Error('Worker 不可用');
    }

    return new Promise((resolve, reject) => {
      const id = `task_${Date.now()}_${Math.random()}`;

      const handler = (event: MessageEvent) => {
        if (event.data.id === id) {
          this.worker!.removeEventListener('message', handler);

          if (event.data.error) {
            reject(new Error(event.data.error));
          } else {
            resolve(event.data.result);
          }
        }
      };

      this.worker.addEventListener('message', handler);
      this.worker.postMessage({ id, type, data });

      // 超时处理
      setTimeout(() => {
        this.worker!.removeEventListener('message', handler);
        reject(new Error('Worker 任务超时'));
      }, 30000); // 30秒超时
    });
  }

  /**
   * 解析文件
   */
  async parseFile(file: File): Promise<ArrayBuffer> {
    if (!isSupportedFile(file)) {
      throw new Error(
        `${ERROR_CODES.UNSUPPORTED_FORMAT}: 不支持的文件格式 ${file.type || file.name}`
      );
    }

    try {
      const buffer = await readFileAsArrayBuffer(file);

      // 尝试从缓存获取
      const cacheKey = await this.getCacheKey(buffer);
      const cached = await this.cache.get(cacheKey);

      if (cached) {
        console.log('从缓存加载文档');
        return cached.buffer;
      }

      // 保存到缓存
      await this.cache.set(buffer);

      return buffer;
    } catch (error) {
      throw new Error(
        `${ERROR_CODES.PARSE_FAILED}: ${error instanceof Error ? error.message : '解析文件失败'}`
      );
    }
  }

  /**
   * 获取缓存键
   */
  private async getCacheKey(buffer: ArrayBuffer): Promise<string> {
    // 使用文件的前几个字节和大小生成简单的哈希
    const bytes = new Uint8Array(buffer.slice(0, Math.min(1024, buffer.byteLength)));
    let hash = buffer.byteLength.toString(36);

    for (let i = 0; i < bytes.length; i += 32) {
      hash += bytes[i].toString(36);
    }

    return hash;
  }

  /**
   * 分块解析文件（用于大文件）
   */
  async parseFileChunked(
    file: File,
    onProgress?: (loaded: number, total: number) => void
  ): Promise<ArrayBuffer> {
    if (!isSupportedFile(file)) {
      throw new Error(
        `${ERROR_CODES.UNSUPPORTED_FORMAT}: 不支持的文件格式 ${file.type || file.name}`
      );
    }

    const chunkSize = 1024 * 1024; // 1MB chunks
    const chunks: Uint8Array[] = [];
    let offset = 0;

    while (offset < file.size) {
      const chunk = file.slice(offset, offset + chunkSize);
      const arrayBuffer = await readFileAsArrayBuffer(chunk as File);
      chunks.push(new Uint8Array(arrayBuffer));

      offset += chunkSize;

      if (onProgress) {
        onProgress(offset, file.size);
      }
    }

    // 合并所有 chunks
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let position = 0;

    for (const chunk of chunks) {
      result.set(chunk, position);
      position += chunk.length;
    }

    return result.buffer;
  }

  /**
   * 从 URL 解析文件
   */
  async parseUrl(url: string): Promise<ArrayBuffer> {
    try {
      return await loadFileFromUrl(url);
    } catch (error) {
      throw new Error(
        `${ERROR_CODES.NETWORK_ERROR}: ${error instanceof Error ? error.message : '加载文件失败'}`
      );
    }
  }

  /**
   * 提取文档信息
   */
  async extractDocumentInfo(buffer: ArrayBuffer): Promise<DocumentInfo> {
    try {
      // 这里简化处理，实际应该使用 JSZip 解析 docx 的 core.xml
      // 获取基本信息
      const info: DocumentInfo = {
        title: '未命名文档',
        author: '',
        subject: '',
        keywords: '',
        description: '',
        created: new Date(),
        modified: new Date(),
        pageCount: 1,
        wordCount: 0,
      };

      // 尝试从 buffer 中提取更多信息
      // 这里需要使用 jszip 和 xml 解析器来读取 docx 的元数据
      // 简化实现，实际项目中应该完整解析

      return info;
    } catch (error) {
      console.warn('提取文档信息失败:', error);
      return {
        title: '未命名文档',
        pageCount: 1,
        wordCount: 0,
      };
    }
  }

  /**
   * 验证文档格式
   */
  async validateDocument(buffer: ArrayBuffer): Promise<boolean> {
    try {
      // 如果支持 Worker，使用 Worker 验证
      if (this.useWorker && this.worker) {
        return await this.executeInWorker('validate', buffer);
      }

      // 降级到主线程
      const view = new Uint8Array(buffer.slice(0, 4));

      // DOCX 文件是 ZIP 格式，开头是 PK (0x50 0x4B)
      if (view[0] === 0x50 && view[1] === 0x4B) {
        return true;
      }

      // DOC 文件开头是 0xD0 0xCF 0x11 0xE0
      if (
        view[0] === 0xD0 &&
        view[1] === 0xCF &&
        view[2] === 0x11 &&
        view[3] === 0xE0
      ) {
        return true;
      }

      return false;
    } catch (error) {
      console.warn('验证文档格式失败:', error);
      return false;
    }
  }

  /**
   * 销毁模块
   */
  destroy(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.cache.close();
  }
}



