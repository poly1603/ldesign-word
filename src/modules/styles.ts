/**
 * 样式管理模块
 * 管理段落样式和字符样式
 */

import { Logger } from '../utils/logger';
import { setAlignment } from '../utils/selection';

const logger = new Logger({ prefix: '[Styles]' });

export interface ParagraphStyle {
  name: string;
  fontSize?: number;
  fontFamily?: string;
  lineHeight?: number;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  marginTop?: number;
  marginBottom?: number;
  paddingLeft?: number;
  color?: string;
  backgroundColor?: string;
  fontWeight?: string;
  fontStyle?: string;
}

export interface CharacterStyle {
  name: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
}

/**
 * 样式管理器
 */
export class StyleManager {
  private paragraphStyles: Map<string, ParagraphStyle> = new Map();
  private characterStyles: Map<string, CharacterStyle> = new Map();

  constructor() {
    this.initializeDefaultStyles();
  }

  /**
   * 初始化默认样式
   */
  private initializeDefaultStyles(): void {
    // 默认段落样式
    this.registerParagraphStyle({
      name: 'Normal',
      fontSize: 12,
      fontFamily: 'Calibri, Arial, sans-serif',
      lineHeight: 1.5,
      textAlign: 'left',
      marginTop: 0,
      marginBottom: 10,
    });

    this.registerParagraphStyle({
      name: 'Heading 1',
      fontSize: 24,
      fontFamily: 'Calibri, Arial, sans-serif',
      fontWeight: 'bold',
      lineHeight: 1.3,
      marginTop: 20,
      marginBottom: 10,
    });

    this.registerParagraphStyle({
      name: 'Heading 2',
      fontSize: 20,
      fontFamily: 'Calibri, Arial, sans-serif',
      fontWeight: 'bold',
      lineHeight: 1.3,
      marginTop: 16,
      marginBottom: 8,
    });

    this.registerParagraphStyle({
      name: 'Heading 3',
      fontSize: 16,
      fontFamily: 'Calibri, Arial, sans-serif',
      fontWeight: 'bold',
      lineHeight: 1.3,
      marginTop: 14,
      marginBottom: 6,
    });

    this.registerParagraphStyle({
      name: 'Quote',
      fontSize: 12,
      fontFamily: 'Georgia, serif',
      fontStyle: 'italic',
      paddingLeft: 20,
      marginTop: 10,
      marginBottom: 10,
      color: '#666',
    });

    // 默认字符样式
    this.registerCharacterStyle({
      name: 'Strong',
      fontWeight: 'bold',
    });

    this.registerCharacterStyle({
      name: 'Emphasis',
      fontStyle: 'italic',
    });

    this.registerCharacterStyle({
      name: 'Code',
      fontFamily: 'Consolas, Monaco, monospace',
      fontSize: 11,
      backgroundColor: '#f5f5f5',
    });

    this.registerCharacterStyle({
      name: 'Highlight',
      backgroundColor: '#ffff00',
    });

    logger.info('默认样式已初始化');
  }

  /**
   * 注册段落样式
   */
  registerParagraphStyle(style: ParagraphStyle): void {
    this.paragraphStyles.set(style.name, style);
    logger.debug('注册段落样式', { name: style.name });
  }

  /**
   * 注册字符样式
   */
  registerCharacterStyle(style: CharacterStyle): void {
    this.characterStyles.set(style.name, style);
    logger.debug('注册字符样式', { name: style.name });
  }

  /**
   * 应用段落样式
   */
  applyParagraphStyle(styleName: string, element?: HTMLElement): void {
    const style = this.paragraphStyles.get(styleName);
    if (!style) {
      logger.warn('段落样式不存在', { styleName });
      return;
    }

    let target = element;

    // 如果没有指定元素，使用当前选区的段落
    if (!target) {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        logger.warn('没有选中的段落');
        return;
      }

      const range = selection.getRangeAt(0);
      let node = range.commonAncestorContainer;

      // 找到块级元素
      while (node && node.nodeType !== Node.ELEMENT_NODE) {
        node = node.parentNode!;
      }

      while (node && !this.isBlockElement(node as Element)) {
        node = node.parentNode!;
      }

      target = node as HTMLElement;
    }

    if (!target) {
      logger.warn('找不到目标段落');
      return;
    }

    // 应用样式
    this.applyStyleToElement(target, style);

    logger.info('应用段落样式', { styleName, element: target.tagName });
  }

  /**
   * 应用字符样式
   */
  applyCharacterStyle(styleName: string): void {
    const style = this.characterStyles.get(styleName);
    if (!style) {
      logger.warn('字符样式不存在', { styleName });
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      logger.warn('没有选中的文本');
      return;
    }

    const range = selection.getRangeAt(0);
    if (range.collapsed) {
      logger.warn('没有选中文本');
      return;
    }

    // 创建包装元素
    const span = document.createElement('span');
    this.applyStyleToElement(span, style);

    try {
      range.surroundContents(span);
      logger.info('应用字符样式', { styleName });
    } catch (error) {
      logger.error('应用字符样式失败', error);
    }
  }

  /**
   * 应用样式到元素
   */
  private applyStyleToElement(element: HTMLElement, style: ParagraphStyle | CharacterStyle): void {
    if (style.fontSize) {
      element.style.fontSize = `${style.fontSize}pt`;
    }
    if (style.fontFamily) {
      element.style.fontFamily = style.fontFamily;
    }
    if (style.color) {
      element.style.color = style.color;
    }
    if (style.backgroundColor) {
      element.style.backgroundColor = style.backgroundColor;
    }
    if (style.fontWeight) {
      element.style.fontWeight = style.fontWeight;
    }
    if (style.fontStyle) {
      element.style.fontStyle = style.fontStyle;
    }

    // 段落特有样式
    if ('lineHeight' in style && style.lineHeight) {
      element.style.lineHeight = style.lineHeight.toString();
    }
    if ('textAlign' in style && style.textAlign) {
      element.style.textAlign = style.textAlign;
    }
    if ('marginTop' in style && style.marginTop !== undefined) {
      element.style.marginTop = `${style.marginTop}px`;
    }
    if ('marginBottom' in style && style.marginBottom !== undefined) {
      element.style.marginBottom = `${style.marginBottom}px`;
    }
    if ('paddingLeft' in style && style.paddingLeft !== undefined) {
      element.style.paddingLeft = `${style.paddingLeft}px`;
    }

    // 字符特有样式
    if ('textDecoration' in style && style.textDecoration) {
      element.style.textDecoration = style.textDecoration;
    }
  }

  /**
   * 判断是否为块级元素
   */
  private isBlockElement(element: Element): boolean {
    const blockElements = [
      'P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
      'BLOCKQUOTE', 'PRE', 'UL', 'OL', 'LI', 'TABLE', 'SECTION'
    ];
    return blockElements.includes(element.tagName);
  }

  /**
   * 获取段落样式列表
   */
  getParagraphStyles(): ParagraphStyle[] {
    return Array.from(this.paragraphStyles.values());
  }

  /**
   * 获取字符样式列表
   */
  getCharacterStyles(): CharacterStyle[] {
    return Array.from(this.characterStyles.values());
  }

  /**
   * 导出样式定义
   */
  exportStyles(): string {
    return JSON.stringify({
      paragraphStyles: Array.from(this.paragraphStyles.entries()),
      characterStyles: Array.from(this.characterStyles.entries()),
    }, null, 2);
  }

  /**
   * 导入样式定义
   */
  importStyles(json: string): void {
    try {
      const data = JSON.parse(json);

      if (data.paragraphStyles) {
        data.paragraphStyles.forEach(([name, style]: [string, ParagraphStyle]) => {
          this.registerParagraphStyle({ ...style, name });
        });
      }

      if (data.characterStyles) {
        data.characterStyles.forEach(([name, style]: [string, CharacterStyle]) => {
          this.registerCharacterStyle({ ...style, name });
        });
      }

      logger.info('样式已导入');
    } catch (error) {
      logger.error('导入样式失败', error);
      throw error;
    }
  }
}

