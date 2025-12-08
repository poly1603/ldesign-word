/**
 * XML 解析工具类
 */
export class XmlUtils {
  private static parser: DOMParser | null = null;

  /**
   * 获取 DOM 解析器实例
   */
  private static getParser(): DOMParser {
    if (!this.parser) {
      this.parser = new DOMParser();
    }
    return this.parser;
  }

  /**
   * 解析 XML 字符串为 Document
   */
  static parseXml(xmlString: string): Document {
    const parser = this.getParser();
    const doc = parser.parseFromString(xmlString, 'application/xml');

    // 检查解析错误
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      throw new Error(`XML 解析错误: ${parserError.textContent}`);
    }

    return doc;
  }

  /**
   * 获取元素（支持多级路径）
   */
  static getElement(parent: Element | Document, ...tagNames: string[]): Element | null {
    let current: Element | Document | null = parent;

    for (const tagName of tagNames) {
      if (!current) return null;

      // 尝试直接获取
      const elements = current instanceof Document
        ? current.getElementsByTagName(tagName)
        : current.getElementsByTagName(tagName);

      if (elements.length === 0) return null;

      // 查找直接子元素
      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        if (el && el.parentNode === current) {
          current = el;
          break;
        } else if (i === elements.length - 1) {
          // 如果没有找到直接子元素，使用第一个匹配
          current = elements[0] || null;
        }
      }
    }

    return current instanceof Document ? null : current;
  }

  /**
   * 获取所有匹配的元素
   */
  static getElements(parent: Element | Document, tagName: string): Element[] {
    const elements = parent.getElementsByTagName(tagName);
    return Array.from(elements);
  }

  /**
   * 获取元素的文本内容
   */
  static getTextContent(parent: Element | Document, tagName: string): string | null {
    const element = this.getElement(parent, tagName);
    return element?.textContent || null;
  }

  /**
   * 获取属性值
   */
  static getAttribute(element: Element | null, attrName: string): string | null {
    return element?.getAttribute(attrName) || null;
  }

  /**
   * 获取带命名空间的属性值
   */
  static getAttributeNS(
    element: Element | null,
    namespaceURI: string,
    localName: string
  ): string | null {
    return element?.getAttributeNS(namespaceURI, localName) || null;
  }

  /**
   * 检查元素是否存在
   */
  static hasElement(parent: Element | Document, tagName: string): boolean {
    return this.getElement(parent, tagName) !== null;
  }

  /**
   * 获取子元素列表
   */
  static getChildren(parent: Element): Element[] {
    return Array.from(parent.children);
  }

  /**
   * 根据属性值查找元素
   */
  static findByAttribute(
    parent: Element | Document,
    tagName: string,
    attrName: string,
    attrValue: string
  ): Element | null {
    const elements = parent.getElementsByTagName(tagName);

    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      if (el?.getAttribute(attrName) === attrValue) {
        return el;
      }
    }

    return null;
  }

  /**
   * 序列化 Document 为字符串
   */
  static serialize(doc: Document | Element): string {
    const serializer = new XMLSerializer();
    return serializer.serializeToString(doc);
  }

  /**
   * 创建元素
   */
  static createElement(
    doc: Document,
    tagName: string,
    attributes?: Record<string, string>,
    textContent?: string
  ): Element {
    const element = doc.createElement(tagName);

    if (attributes) {
      for (const [key, value] of Object.entries(attributes)) {
        element.setAttribute(key, value);
      }
    }

    if (textContent) {
      element.textContent = textContent;
    }

    return element;
  }

  /**
   * 遍历元素树
   */
  static traverse(
    element: Element,
    callback: (el: Element, depth: number) => boolean | void,
    depth = 0
  ): void {
    const shouldContinue = callback(element, depth);

    if (shouldContinue === false) return;

    for (const child of Array.from(element.children)) {
      this.traverse(child, callback, depth + 1);
    }
  }

  /**
   * 查找所有匹配条件的元素
   */
  static findAll(
    parent: Element | Document,
    predicate: (el: Element) => boolean
  ): Element[] {
    const results: Element[] = [];
    const root = parent instanceof Document ? parent.documentElement : parent;

    if (!root) return results;

    this.traverse(root, (el) => {
      if (predicate(el)) {
        results.push(el);
      }
    });

    return results;
  }
}
