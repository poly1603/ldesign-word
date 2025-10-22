/**
 * 现代 Clipboard API 工具
 * 使用异步 Clipboard API 替代传统方法
 */

import { Logger } from './logger';

const logger = new Logger({ prefix: '[Clipboard]' });

export interface ClipboardOptions {
  /** 是否包含格式 */
  includeFormat?: boolean;
  /** MIME 类型 */
  mimeType?: string;
}

/**
 * 复制文本到剪贴板（使用现代 API）
 */
export async function copyText(text: string): Promise<void> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      logger.info('文本已复制到剪贴板');
    } else {
      // 降级方案
      fallbackCopyText(text);
    }
  } catch (error) {
    logger.error('复制文本失败', error);
    // 尝试降级方案
    fallbackCopyText(text);
  }
}

/**
 * 降级复制方法（兼容旧浏览器）
 */
function fallbackCopyText(text: string): void {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();

  try {
    document.execCommand('copy');
    logger.info('文本已复制（降级方法）');
  } catch (error) {
    logger.error('降级复制失败', error);
    throw new Error('复制文本失败');
  } finally {
    document.body.removeChild(textarea);
  }
}

/**
 * 复制 HTML 到剪贴板
 */
export async function copyHTML(html: string, plainText?: string): Promise<void> {
  try {
    if (navigator.clipboard && navigator.clipboard.write) {
      const htmlBlob = new Blob([html], { type: 'text/html' });
      const textBlob = new Blob([plainText || stripHTML(html)], { type: 'text/plain' });

      const clipboardItem = new ClipboardItem({
        'text/html': htmlBlob,
        'text/plain': textBlob,
      });

      await navigator.clipboard.write([clipboardItem]);
      logger.info('HTML 已复制到剪贴板');
    } else {
      // 降级：只复制纯文本
      await copyText(plainText || stripHTML(html));
    }
  } catch (error) {
    logger.error('复制 HTML 失败', error);
    throw error;
  }
}

/**
 * 从剪贴板读取文本
 */
export async function pasteText(): Promise<string> {
  try {
    if (navigator.clipboard && navigator.clipboard.readText) {
      const text = await navigator.clipboard.readText();
      logger.info('从剪贴板读取文本');
      return text;
    } else {
      throw new Error('浏览器不支持读取剪贴板');
    }
  } catch (error) {
    logger.error('读取剪贴板失败', error);
    throw error;
  }
}

/**
 * 从剪贴板读取多种格式
 */
export async function paste(): Promise<{
  text?: string;
  html?: string;
  image?: Blob;
}> {
  try {
    if (!navigator.clipboard || !navigator.clipboard.read) {
      throw new Error('浏览器不支持读取剪贴板');
    }

    const clipboardItems = await navigator.clipboard.read();
    const result: { text?: string; html?: string; image?: Blob } = {};

    for (const item of clipboardItems) {
      // 读取文本
      if (item.types.includes('text/plain')) {
        const blob = await item.getType('text/plain');
        result.text = await blob.text();
      }

      // 读取 HTML
      if (item.types.includes('text/html')) {
        const blob = await item.getType('text/html');
        result.html = await blob.text();
      }

      // 读取图片
      const imageType = item.types.find(type => type.startsWith('image/'));
      if (imageType) {
        result.image = await item.getType(imageType);
      }
    }

    logger.info('从剪贴板读取内容', { types: Object.keys(result) });
    return result;
  } catch (error) {
    logger.error('读取剪贴板失败', error);
    throw error;
  }
}

/**
 * 复制图片到剪贴板
 */
export async function copyImage(blob: Blob): Promise<void> {
  try {
    if (!navigator.clipboard || !navigator.clipboard.write) {
      throw new Error('浏览器不支持复制图片');
    }

    const clipboardItem = new ClipboardItem({
      [blob.type]: blob,
    });

    await navigator.clipboard.write([clipboardItem]);
    logger.info('图片已复制到剪贴板');
  } catch (error) {
    logger.error('复制图片失败', error);
    throw error;
  }
}

/**
 * 检查剪贴板权限
 */
export async function checkClipboardPermission(): Promise<{
  read: PermissionState;
  write: PermissionState;
}> {
  try {
    const readPermission = await navigator.permissions.query({
      name: 'clipboard-read' as PermissionName,
    });
    const writePermission = await navigator.permissions.query({
      name: 'clipboard-write' as PermissionName,
    });

    return {
      read: readPermission.state,
      write: writePermission.state,
    };
  } catch (error) {
    logger.warn('无法检查剪贴板权限', error);
    return {
      read: 'prompt',
      write: 'prompt',
    };
  }
}

/**
 * 剥离 HTML 标签，获取纯文本
 */
function stripHTML(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

/**
 * 监听剪贴板事件（粘贴）
 */
export function onPaste(
  element: HTMLElement,
  handler: (data: { text?: string; html?: string; files?: File[] }) => void
): () => void {
  const pasteHandler = async (event: ClipboardEvent) => {
    event.preventDefault();

    const data: { text?: string; html?: string; files?: File[] } = {};

    // 获取文本
    data.text = event.clipboardData?.getData('text/plain');

    // 获取 HTML
    data.html = event.clipboardData?.getData('text/html');

    // 获取文件
    if (event.clipboardData?.files && event.clipboardData.files.length > 0) {
      data.files = Array.from(event.clipboardData.files);
    }

    handler(data);
  };

  element.addEventListener('paste', pasteHandler as EventListener);

  // 返回清理函数
  return () => {
    element.removeEventListener('paste', pasteHandler as EventListener);
  };
}

/**
 * 监听剪贴板事件（复制）
 */
export function onCopy(
  element: HTMLElement,
  handler: (event: ClipboardEvent) => void
): () => void {
  element.addEventListener('copy', handler);

  return () => {
    element.removeEventListener('copy', handler);
  };
}

/**
 * 监听剪贴板事件（剪切）
 */
export function onCut(
  element: HTMLElement,
  handler: (event: ClipboardEvent) => void
): () => void {
  element.addEventListener('cut', handler);

  return () => {
    element.removeEventListener('cut', handler);
  };
}

/**
 * 复制选中的内容
 */
export async function copySelection(): Promise<void> {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    throw new Error('没有选中的内容');
  }

  const range = selection.getRangeAt(0);
  const container = document.createElement('div');
  container.appendChild(range.cloneContents());

  const html = container.innerHTML;
  const text = container.textContent || '';

  await copyHTML(html, text);
}

/**
 * 剪切选中的内容
 */
export async function cutSelection(): Promise<void> {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    throw new Error('没有选中的内容');
  }

  const range = selection.getRangeAt(0);
  const container = document.createElement('div');
  container.appendChild(range.cloneContents());

  const html = container.innerHTML;
  const text = container.textContent || '';

  // 删除选中内容
  range.deleteContents();

  await copyHTML(html, text);
}




