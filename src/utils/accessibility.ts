/**
 * 无障碍工具
 * 提供 ARIA 属性、键盘导航等无障碍功能
 */

import { Logger } from './logger';

const logger = new Logger({ prefix: '[A11y]' });

export interface AriaAttributes {
  role?: string;
  label?: string;
  labelledby?: string;
  describedby?: string;
  live?: 'off' | 'polite' | 'assertive';
  atomic?: boolean;
  busy?: boolean;
  disabled?: boolean;
  expanded?: boolean;
  hidden?: boolean;
  pressed?: boolean;
  selected?: boolean;
}

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  handler: (event: KeyboardEvent) => void;
}

/**
 * 设置 ARIA 属性
 */
export function setAriaAttributes(element: HTMLElement, attrs: AriaAttributes): void {
  if (attrs.role) {
    element.setAttribute('role', attrs.role);
  }
  if (attrs.label) {
    element.setAttribute('aria-label', attrs.label);
  }
  if (attrs.labelledby) {
    element.setAttribute('aria-labelledby', attrs.labelledby);
  }
  if (attrs.describedby) {
    element.setAttribute('aria-describedby', attrs.describedby);
  }
  if (attrs.live) {
    element.setAttribute('aria-live', attrs.live);
  }
  if (attrs.atomic !== undefined) {
    element.setAttribute('aria-atomic', String(attrs.atomic));
  }
  if (attrs.busy !== undefined) {
    element.setAttribute('aria-busy', String(attrs.busy));
  }
  if (attrs.disabled !== undefined) {
    element.setAttribute('aria-disabled', String(attrs.disabled));
  }
  if (attrs.expanded !== undefined) {
    element.setAttribute('aria-expanded', String(attrs.expanded));
  }
  if (attrs.hidden !== undefined) {
    element.setAttribute('aria-hidden', String(attrs.hidden));
  }
  if (attrs.pressed !== undefined) {
    element.setAttribute('aria-pressed', String(attrs.pressed));
  }
  if (attrs.selected !== undefined) {
    element.setAttribute('aria-selected', String(attrs.selected));
  }
}

/**
 * 键盘快捷键管理器
 */
export class KeyboardManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private container: HTMLElement | Document;
  private enabled: boolean = true;

  constructor(container: HTMLElement | Document = document) {
    this.container = container;
    this.container.addEventListener('keydown', this.handleKeydown.bind(this));

    // 注册默认快捷键
    this.registerDefaultShortcuts();

    logger.info('键盘管理器已初始化');
  }

  /**
   * 注册默认快捷键
   */
  private registerDefaultShortcuts(): void {
    // 编辑快捷键
    this.register({
      key: 'b',
      ctrl: true,
      description: '加粗',
      handler: (e) => {
        e.preventDefault();
        logger.debug('快捷键: 加粗');
      },
    });

    this.register({
      key: 'i',
      ctrl: true,
      description: '斜体',
      handler: (e) => {
        e.preventDefault();
        logger.debug('快捷键: 斜体');
      },
    });

    this.register({
      key: 'u',
      ctrl: true,
      description: '下划线',
      handler: (e) => {
        e.preventDefault();
        logger.debug('快捷键: 下划线');
      },
    });

    // 撤销/重做
    this.register({
      key: 'z',
      ctrl: true,
      description: '撤销',
      handler: (e) => {
        e.preventDefault();
        logger.debug('快捷键: 撤销');
      },
    });

    this.register({
      key: 'y',
      ctrl: true,
      description: '重做',
      handler: (e) => {
        e.preventDefault();
        logger.debug('快捷键: 重做');
      },
    });

    // 查找
    this.register({
      key: 'f',
      ctrl: true,
      description: '查找',
      handler: (e) => {
        e.preventDefault();
        logger.debug('快捷键: 查找');
      },
    });

    // 保存
    this.register({
      key: 's',
      ctrl: true,
      description: '保存',
      handler: (e) => {
        e.preventDefault();
        logger.debug('快捷键: 保存');
      },
    });

    // 打印
    this.register({
      key: 'p',
      ctrl: true,
      description: '打印',
      handler: (e) => {
        e.preventDefault();
        logger.debug('快捷键: 打印');
      },
    });
  }

  /**
   * 注册快捷键
   */
  register(shortcut: KeyboardShortcut): void {
    const key = this.getShortcutKey(shortcut);
    this.shortcuts.set(key, shortcut);
    logger.debug('注册快捷键', { key, description: shortcut.description });
  }

  /**
   * 取消注册快捷键
   */
  unregister(shortcut: Partial<KeyboardShortcut>): void {
    const key = this.getShortcutKey(shortcut as KeyboardShortcut);
    this.shortcuts.delete(key);
    logger.debug('取消注册快捷键', { key });
  }

  /**
   * 处理键盘事件
   */
  private handleKeydown(event: Event): void {
    if (!this.enabled) return;

    const e = event as KeyboardEvent;
    const key = this.getEventKey(e);
    const shortcut = this.shortcuts.get(key);

    if (shortcut) {
      shortcut.handler(e);
    }
  }

  /**
   * 获取快捷键标识
   */
  private getShortcutKey(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];
    if (shortcut.ctrl) parts.push('ctrl');
    if (shortcut.shift) parts.push('shift');
    if (shortcut.alt) parts.push('alt');
    if (shortcut.meta) parts.push('meta');
    parts.push(shortcut.key.toLowerCase());
    return parts.join('+');
  }

  /**
   * 从事件获取键标识
   */
  private getEventKey(event: KeyboardEvent): string {
    const parts: string[] = [];
    if (event.ctrlKey) parts.push('ctrl');
    if (event.shiftKey) parts.push('shift');
    if (event.altKey) parts.push('alt');
    if (event.metaKey) parts.push('meta');
    parts.push(event.key.toLowerCase());
    return parts.join('+');
  }

  /**
   * 启用快捷键
   */
  enable(): void {
    this.enabled = true;
    logger.info('快捷键已启用');
  }

  /**
   * 禁用快捷键
   */
  disable(): void {
    this.enabled = false;
    logger.info('快捷键已禁用');
  }

  /**
   * 获取所有快捷键
   */
  getAllShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.container.removeEventListener('keydown', this.handleKeydown.bind(this));
    this.shortcuts.clear();
    logger.info('键盘管理器已销毁');
  }
}

/**
 * 实时区域（Live Region）管理器
 * 用于屏幕阅读器通知
 */
export class LiveRegionManager {
  private liveRegion: HTMLElement | null = null;

  constructor(container: HTMLElement) {
    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.style.position = 'absolute';
    this.liveRegion.style.left = '-10000px';
    this.liveRegion.style.width = '1px';
    this.liveRegion.style.height = '1px';
    this.liveRegion.style.overflow = 'hidden';

    container.appendChild(this.liveRegion);
  }

  /**
   * 通知消息（礼貌模式）
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.liveRegion) return;

    this.liveRegion.setAttribute('aria-live', priority);
    this.liveRegion.textContent = message;

    logger.debug('无障碍通知', { message, priority });

    // 清空消息（让屏幕阅读器能再次读取相同消息）
    setTimeout(() => {
      if (this.liveRegion) {
        this.liveRegion.textContent = '';
      }
    }, 100);
  }

  /**
   * 销毁
   */
  destroy(): void {
    if (this.liveRegion && this.liveRegion.parentNode) {
      this.liveRegion.parentNode.removeChild(this.liveRegion);
      this.liveRegion = null;
    }
  }
}

/**
 * 焦点管理器
 * 管理焦点陷阱和焦点导航
 */
export class FocusManager {
  private container: HTMLElement;
  private focusableElements: HTMLElement[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /**
   * 获取可聚焦元素
   */
  getFocusableElements(): HTMLElement[] {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(',');

    return Array.from(this.container.querySelectorAll<HTMLElement>(selector));
  }

  /**
   * 聚焦第一个元素
   */
  focusFirst(): void {
    const elements = this.getFocusableElements();
    if (elements.length > 0) {
      elements[0].focus();
    }
  }

  /**
   * 聚焦最后一个元素
   */
  focusLast(): void {
    const elements = this.getFocusableElements();
    if (elements.length > 0) {
      elements[elements.length - 1].focus();
    }
  }

  /**
   * 焦点陷阱（用于模态框等）
   */
  trapFocus(): () => void {
    const elements = this.getFocusableElements();
    if (elements.length === 0) return () => { };

    const firstElement = elements[0];
    const lastElement = elements[elements.length - 1];

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    this.container.addEventListener('keydown', handleKeydown);

    // 返回清理函数
    return () => {
      this.container.removeEventListener('keydown', handleKeydown);
    };
  }
}

/**
 * 跳过导航链接
 * 允许键盘用户快速跳过导航
 */
export function createSkipLink(targetId: string, text: string = '跳到主要内容'): HTMLElement {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.className = 'skip-link';
  skipLink.textContent = text;

  // 只在获得焦点时显示
  skipLink.style.cssText = `
    position: absolute;
    left: -10000px;
    top: auto;
    width: 1px;
    height: 1px;
    overflow: hidden;
  `;

  skipLink.addEventListener('focus', () => {
    skipLink.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      z-index: 10000;
      background: white;
      padding: 8px 16px;
      border: 2px solid #000;
    `;
  });

  skipLink.addEventListener('blur', () => {
    skipLink.style.cssText = `
      position: absolute;
      left: -10000px;
      top: auto;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
  });

  return skipLink;
}

/**
 * 检查元素是否可访问
 */
export function checkAccessibility(element: HTMLElement): {
  issues: string[];
  warnings: string[];
  passed: boolean;
} {
  const issues: string[] = [];
  const warnings: string[] = [];

  // 检查图片 alt 属性
  const images = element.querySelectorAll('img');
  images.forEach((img, index) => {
    if (!img.hasAttribute('alt')) {
      issues.push(`图片 ${index + 1} 缺少 alt 属性`);
    }
  });

  // 检查按钮标签
  const buttons = element.querySelectorAll('button');
  buttons.forEach((button, index) => {
    if (!button.textContent && !button.hasAttribute('aria-label')) {
      issues.push(`按钮 ${index + 1} 缺少文本或 aria-label`);
    }
  });

  // 检查表单标签
  const inputs = element.querySelectorAll('input, textarea, select');
  inputs.forEach((input, index) => {
    const id = input.id;
    if (id) {
      const label = element.querySelector(`label[for="${id}"]`);
      if (!label && !input.hasAttribute('aria-label')) {
        warnings.push(`表单元素 ${index + 1} 缺少关联的 label 或 aria-label`);
      }
    }
  });

  // 检查标题层次
  const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let lastLevel = 0;
  headings.forEach((heading) => {
    const level = parseInt(heading.tagName.charAt(1));
    if (level - lastLevel > 1) {
      warnings.push(`标题层次跳跃: ${lastLevel} -> ${level}`);
    }
    lastLevel = level;
  });

  // 检查链接文本
  const links = element.querySelectorAll('a');
  links.forEach((link, index) => {
    if (!link.textContent?.trim() && !link.hasAttribute('aria-label')) {
      issues.push(`链接 ${index + 1} 缺少文本或 aria-label`);
    }
  });

  return {
    issues,
    warnings,
    passed: issues.length === 0,
  };
}

/**
 * 自动添加 ARIA 属性
 */
export function enhanceAccessibility(container: HTMLElement): void {
  // 为所有按钮添加 role
  const buttons = container.querySelectorAll('button');
  buttons.forEach(button => {
    if (!button.hasAttribute('role')) {
      button.setAttribute('role', 'button');
    }
  });

  // 为所有导航添加 role
  const navs = container.querySelectorAll('nav');
  navs.forEach(nav => {
    if (!nav.hasAttribute('role')) {
      nav.setAttribute('role', 'navigation');
    }
  });

  // 为 main 内容添加 role
  const mains = container.querySelectorAll('main');
  mains.forEach(main => {
    if (!main.hasAttribute('role')) {
      main.setAttribute('role', 'main');
    }
  });

  logger.info('无障碍增强完成');
}

/**
 * RTL（从右到左）支持
 */
export function setTextDirection(element: HTMLElement, direction: 'ltr' | 'rtl' | 'auto'): void {
  element.dir = direction;
  logger.debug('设置文本方向', { direction });
}

/**
 * 检测文本方向
 */
export function detectTextDirection(text: string): 'ltr' | 'rtl' {
  // RTL 语言的 Unicode 范围
  const rtlChars = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;

  return rtlChars.test(text) ? 'rtl' : 'ltr';
}

/**
 * 创建屏幕阅读器专用文本
 */
export function createScreenReaderOnly(text: string): HTMLElement {
  const span = document.createElement('span');
  span.className = 'sr-only';
  span.textContent = text;
  span.style.cssText = `
    position: absolute;
    left: -10000px;
    top: auto;
    width: 1px;
    height: 1px;
    overflow: hidden;
  `;
  return span;
}

