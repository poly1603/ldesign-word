/**
 * 文档解析 Worker
 * 在后台线程执行文档解析，避免阻塞主线程
 */

// Worker 消息类型
interface WorkerMessage {
  id: string;
  type: 'parse' | 'validate' | 'extract-info';
  data: ArrayBuffer | any;
}

interface WorkerResponse {
  id: string;
  result?: any;
  error?: string;
}

// 处理消息
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { id, type, data } = event.data;

  try {
    let result: any;

    switch (type) {
      case 'parse':
        result = await parseDocument(data);
        break;

      case 'validate':
        result = await validateDocument(data);
        break;

      case 'extract-info':
        result = await extractDocumentInfo(data);
        break;

      default:
        throw new Error(`未知的任务类型: ${type}`);
    }

    const response: WorkerResponse = { id, result };
    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      id,
      error: error instanceof Error ? error.message : '解析失败',
    };
    self.postMessage(response);
  }
};

/**
 * 解析文档
 */
async function parseDocument(buffer: ArrayBuffer): Promise<any> {
  // 这里实现文档解析逻辑
  // 实际应用中会使用 JSZip 等库解析 DOCX 文件

  // 验证文件签名
  const view = new Uint8Array(buffer.slice(0, 4));

  // DOCX 文件是 ZIP 格式，开头是 PK (0x50 0x4B)
  if (view[0] === 0x50 && view[1] === 0x4B) {
    return {
      type: 'docx',
      size: buffer.byteLength,
      valid: true,
    };
  }

  // DOC 文件开头是 0xD0 0xCF 0x11 0xE0
  if (
    view[0] === 0xD0 &&
    view[1] === 0xCF &&
    view[2] === 0x11 &&
    view[3] === 0xE0
  ) {
    return {
      type: 'doc',
      size: buffer.byteLength,
      valid: true,
    };
  }

  throw new Error('不支持的文件格式');
}

/**
 * 验证文档
 */
async function validateDocument(buffer: ArrayBuffer): Promise<boolean> {
  const view = new Uint8Array(buffer.slice(0, 4));

  // DOCX (ZIP)
  if (view[0] === 0x50 && view[1] === 0x4B) {
    return true;
  }

  // DOC
  if (
    view[0] === 0xD0 &&
    view[1] === 0xCF &&
    view[2] === 0x11 &&
    view[3] === 0xE0
  ) {
    return true;
  }

  return false;
}

/**
 * 提取文档信息
 */
async function extractDocumentInfo(buffer: ArrayBuffer): Promise<any> {
  // 简化实现，实际需要解析 DOCX 的 core.xml
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

// 导出类型（用于主线程的类型检查）
export type { WorkerMessage, WorkerResponse };




