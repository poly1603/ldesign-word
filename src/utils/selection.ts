/**
 * 现代 Selection API 工具
 * 替代已废弃的 document.execCommand
 */

import { Logger } from './logger';

const logger = new Logger({ prefix: '[Selection]' });

export interface SelectionInfo {
  text: string;
  range: Range | null;
  rect: DOMRect | null;
  startOffset: number;
  endOffset: number;
}

export interface FormatOptions {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
}

/**
 * 获取当前选区信息
 */
export function getSelectionInfo(): SelectionInfo | null {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  return {
    text: selection.toString(),
    range,
    rect,
    startOffset: range.startOffset,
    endOffset: range.endOffset,
  };
}

/**
 * 设置选区
 */
export function setSelection(startNode: Node, startOffset: number, endNode: Node, endOffset: number): void {
  const selection = window.getSelection();
  if (!selection) return;

  const range = document.createRange();
  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);

  selection.removeAllRanges();
  selection.addRange(range);
}

/**
 * 清除选区
 */
export function clearSelection(): void {
  const selection = window.getSelection();
  if (selection) {
    selection.removeAllRanges();
  }
}

/**
 * 保存选区
 */
export function saveSelection(): Range | null {
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    return selection.getRangeAt(0).cloneRange();
  }
  return null;
}

/**
 * 恢复选区
 */
export function restoreSelection(range: Range): void {
  const selection = window.getSelection();
  if (!selection) return;

  selection.removeAllRanges();
  selection.addRange(range);
}

/**
 * 在当前位置插入文本（使用现代 API）
 */
export function insertText(text: string): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    logger.warn('没有可用的选区');
    return;
  }

  const range = selection.getRangeAt(0);
  range.deleteContents();

  const textNode = document.createTextNode(text);
  range.insertNode(textNode);

  // 将光标移到插入文本之后
  range.setStartAfter(textNode);
  range.setEndAfter(textNode);
  selection.removeAllRanges();
  selection.addRange(range);
}

/**
 * 在当前位置插入 HTML
 */
export function insertHTML(html: string): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    logger.warn('没有可用的选区');
    return;
  }

  const range = selection.getRangeAt(0);
  range.deleteContents();

  const fragment = range.createContextualFragment(html);
  range.insertNode(fragment);

  // 移动光标到插入内容之后
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

/**
 * 应用格式（使用现代 API 替代 execCommand）
 */
export function applyFormat(format: FormatOptions): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    logger.warn('没有可用的选区');
    return;
  }

  const range = selection.getRangeAt(0);

  if (range.collapsed) {
    logger.warn('没有选中文本');
    return;
  }

  // 创建包装元素
  const span = document.createElement('span');

  // 应用样式
  if (format.bold) {
    span.style.fontWeight = 'bold';
  }
  if (format.italic) {
    span.style.fontStyle = 'italic';
  }
  if (format.underline) {
    span.style.textDecoration = 'underline';
  }
  if (format.strikethrough) {
    span.style.textDecoration = 'line-through';
  }
  if (format.fontSize) {
    span.style.fontSize = `${format.fontSize}px`;
  }
  if (format.fontFamily) {
    span.style.fontFamily = format.fontFamily;
  }
  if (format.color) {
    span.style.color = format.color;
  }
  if (format.backgroundColor) {
    span.style.backgroundColor = format.backgroundColor;
  }

  // 包装选中的内容
  try {
    range.surroundContents(span);
  } catch (error) {
    // 如果不能直接包装（比如跨元素选择），使用另一种方法
    const contents = range.extractContents();
    span.appendChild(contents);
    range.insertNode(span);
  }

  // 恢复选区
  selection.removeAllRanges();
  selection.addRange(range);
}

/**
 * 移除格式
 */
export function removeFormat(): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return;
  }

  const range = selection.getRangeAt(0);
  const contents = range.cloneContents();

  // 提取纯文本
  const text = contents.textContent || '';

  // 删除当前内容
  range.deleteContents();

  // 插入纯文本
  const textNode = document.createTextNode(text);
  range.insertNode(textNode);
}

/**
 * 设置对齐方式
 */
export function setAlignment(alignment: 'left' | 'center' | 'right' | 'justify'): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return;
  }

  const range = selection.getRangeAt(0);
  let element = range.commonAncestorContainer as HTMLElement;

  // 找到块级元素
  while (element && element.nodeType !== Node.ELEMENT_NODE) {
    element = element.parentElement!;
  }

  while (element && !isBlockElement(element)) {
    element = element.parentElement!;
  }

  if (element) {
    element.style.textAlign = alignment;
  }
}

/**
 * 判断是否为块级元素
 */
function isBlockElement(element: Element): boolean {
  const blockElements = [
    'P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
    'BLOCKQUOTE', 'PRE', 'UL', 'OL', 'LI', 'TABLE'
  ];
  return blockElements.includes(element.tagName);
}

/**
 * 创建链接
 */
export function createLink(url: string, text?: string): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return;
  }

  const range = selection.getRangeAt(0);
  const selectedText = range.toString();

  const link = document.createElement('a');
  link.href = url;
  link.textContent = text || selectedText || url;

  range.deleteContents();
  range.insertNode(link);

  // 将光标移到链接之后
  range.setStartAfter(link);
  range.setEndAfter(link);
  selection.removeAllRanges();
  selection.addRange(range);
}

/**
 * 移除链接
 */
export function removeLink(): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return;
  }

  const range = selection.getRangeAt(0);
  let element = range.commonAncestorContainer as HTMLElement;

  // 找到链接元素
  while (element && element.tagName !== 'A') {
    if (!element.parentElement) break;
    element = element.parentElement;
  }

  if (element && element.tagName === 'A') {
    const text = element.textContent || '';
    const textNode = document.createTextNode(text);
    element.parentNode?.replaceChild(textNode, element);
  }
}

/**
 * 插入列表
 */
export function insertList(type: 'ul' | 'ol'): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return;
  }

  const range = selection.getRangeAt(0);
  const list = document.createElement(type);
  const li = document.createElement('li');

  const contents = range.extractContents();
  li.appendChild(contents);
  list.appendChild(li);

  range.insertNode(list);

  // 将光标移到列表项内
  range.setStart(li, 0);
  range.setEnd(li, li.childNodes.length);
  selection.removeAllRanges();
  selection.addRange(range);
}

/**
 * 获取选区的祖先元素
 */
export function getSelectionAncestor(): HTMLElement | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  let ancestor = range.commonAncestorContainer;

  if (ancestor.nodeType === Node.TEXT_NODE) {
    ancestor = ancestor.parentNode!;
  }

  return ancestor as HTMLElement;
}

/**
 * 检查选区是否包含特定格式
 */
export function hasFormat(format: keyof FormatOptions): boolean {
  const ancestor = getSelectionAncestor();
  if (!ancestor) return false;

  const computedStyle = window.getComputedStyle(ancestor);

  switch (format) {
    case 'bold':
      return computedStyle.fontWeight === 'bold' || parseInt(computedStyle.fontWeight) >= 600;
    case 'italic':
      return computedStyle.fontStyle === 'italic';
    case 'underline':
      return computedStyle.textDecoration.includes('underline');
    case 'strikethrough':
      return computedStyle.textDecoration.includes('line-through');
    default:
      return false;
  }
}




