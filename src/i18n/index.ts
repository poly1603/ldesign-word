/**
 * 国际化（i18n）模块
 * 支持多语言和本地化
 */

import { Logger } from '../utils/logger';

const logger = new Logger({ prefix: '[i18n]' });

export type Locale = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR' | 'fr-FR' | 'de-DE' | 'es-ES';

export type TranslationKey = keyof typeof translations['zh-CN'];

export interface I18nOptions {
  locale?: Locale;
  fallbackLocale?: Locale;
}

/**
 * 翻译字典
 */
const translations = {
  'zh-CN': {
    // 通用
    'common.loading': '加载中...',
    'common.error': '错误',
    'common.success': '成功',
    'common.cancel': '取消',
    'common.confirm': '确认',
    'common.save': '保存',
    'common.close': '关闭',

    // 查看器
    'viewer.zoom': '缩放',
    'viewer.zoomIn': '放大',
    'viewer.zoomOut': '缩小',
    'viewer.fitWidth': '适应宽度',
    'viewer.fitPage': '适应页面',
    'viewer.actualSize': '实际大小',
    'viewer.page': '页',
    'viewer.of': '共',
    'viewer.previousPage': '上一页',
    'viewer.nextPage': '下一页',
    'viewer.goToPage': '跳转到页',

    // 编辑
    'editor.bold': '加粗',
    'editor.italic': '斜体',
    'editor.underline': '下划线',
    'editor.strikethrough': '删除线',
    'editor.fontSize': '字号',
    'editor.fontFamily': '字体',
    'editor.color': '颜色',
    'editor.backgroundColor': '背景色',
    'editor.align': '对齐',
    'editor.alignLeft': '左对齐',
    'editor.alignCenter': '居中',
    'editor.alignRight': '右对齐',
    'editor.alignJustify': '两端对齐',
    'editor.insertImage': '插入图片',
    'editor.insertTable': '插入表格',
    'editor.insertLink': '插入链接',
    'editor.undo': '撤销',
    'editor.redo': '重做',

    // 搜索
    'search.placeholder': '查找文本...',
    'search.findNext': '查找下一个',
    'search.findPrevious': '查找上一个',
    'search.replace': '替换',
    'search.replaceAll': '全部替换',
    'search.matchCase': '区分大小写',
    'search.wholeWord': '全字匹配',
    'search.noResults': '未找到结果',
    'search.results': '个结果',

    // 导出
    'export.title': '导出文档',
    'export.pdf': '导出为 PDF',
    'export.html': '导出为 HTML',
    'export.markdown': '导出为 Markdown',
    'export.rtf': '导出为 RTF',
    'export.text': '导出为纯文本',
    'export.downloading': '正在下载...',

    // 错误信息
    'error.loadFailed': '文档加载失败',
    'error.parseFailed': '文档解析失败',
    'error.renderFailed': '文档渲染失败',
    'error.exportFailed': '导出失败',
    'error.unsupportedFormat': '不支持的文件格式',
    'error.networkError': '网络错误',
    'error.noDocument': '没有加载的文档',

    // 批注
    'comment.add': '添加批注',
    'comment.reply': '回复',
    'comment.resolve': '解决',
    'comment.delete': '删除',
    'comment.resolved': '已解决',
    'comment.author': '作者',

    // 修订
    'revision.accept': '接受',
    'revision.reject': '拒绝',
    'revision.acceptAll': '接受全部',
    'revision.rejectAll': '拒绝全部',
    'revision.showRevisions': '显示修订',
    'revision.hideRevisions': '隐藏修订',
  },

  'en-US': {
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.save': 'Save',
    'common.close': 'Close',

    // Viewer
    'viewer.zoom': 'Zoom',
    'viewer.zoomIn': 'Zoom In',
    'viewer.zoomOut': 'Zoom Out',
    'viewer.fitWidth': 'Fit Width',
    'viewer.fitPage': 'Fit Page',
    'viewer.actualSize': 'Actual Size',
    'viewer.page': 'Page',
    'viewer.of': 'of',
    'viewer.previousPage': 'Previous Page',
    'viewer.nextPage': 'Next Page',
    'viewer.goToPage': 'Go to Page',

    // Editor
    'editor.bold': 'Bold',
    'editor.italic': 'Italic',
    'editor.underline': 'Underline',
    'editor.strikethrough': 'Strikethrough',
    'editor.fontSize': 'Font Size',
    'editor.fontFamily': 'Font Family',
    'editor.color': 'Color',
    'editor.backgroundColor': 'Background Color',
    'editor.align': 'Align',
    'editor.alignLeft': 'Align Left',
    'editor.alignCenter': 'Center',
    'editor.alignRight': 'Align Right',
    'editor.alignJustify': 'Justify',
    'editor.insertImage': 'Insert Image',
    'editor.insertTable': 'Insert Table',
    'editor.insertLink': 'Insert Link',
    'editor.undo': 'Undo',
    'editor.redo': 'Redo',

    // Search
    'search.placeholder': 'Find text...',
    'search.findNext': 'Find Next',
    'search.findPrevious': 'Find Previous',
    'search.replace': 'Replace',
    'search.replaceAll': 'Replace All',
    'search.matchCase': 'Match Case',
    'search.wholeWord': 'Whole Word',
    'search.noResults': 'No results found',
    'search.results': 'results',

    // Export
    'export.title': 'Export Document',
    'export.pdf': 'Export as PDF',
    'export.html': 'Export as HTML',
    'export.markdown': 'Export as Markdown',
    'export.rtf': 'Export as RTF',
    'export.text': 'Export as Text',
    'export.downloading': 'Downloading...',

    // Errors
    'error.loadFailed': 'Failed to load document',
    'error.parseFailed': 'Failed to parse document',
    'error.renderFailed': 'Failed to render document',
    'error.exportFailed': 'Export failed',
    'error.unsupportedFormat': 'Unsupported file format',
    'error.networkError': 'Network error',
    'error.noDocument': 'No document loaded',

    // Comments
    'comment.add': 'Add Comment',
    'comment.reply': 'Reply',
    'comment.resolve': 'Resolve',
    'comment.delete': 'Delete',
    'comment.resolved': 'Resolved',
    'comment.author': 'Author',

    // Revisions
    'revision.accept': 'Accept',
    'revision.reject': 'Reject',
    'revision.acceptAll': 'Accept All',
    'revision.rejectAll': 'Reject All',
    'revision.showRevisions': 'Show Revisions',
    'revision.hideRevisions': 'Hide Revisions',
  },
};

/**
 * i18n 管理器
 */
export class I18n {
  private locale: Locale;
  private fallbackLocale: Locale;
  private customTranslations: Map<Locale, Record<string, string>> = new Map();

  constructor(options: I18nOptions = {}) {
    this.locale = options.locale || this.detectLocale();
    this.fallbackLocale = options.fallbackLocale || 'en-US';

    logger.info('i18n 已初始化', { locale: this.locale });
  }

  /**
   * 自动检测语言
   */
  private detectLocale(): Locale {
    const browserLang = navigator.language || (navigator as any).userLanguage;

    // 匹配支持的语言
    if (browserLang.startsWith('zh')) return 'zh-CN';
    if (browserLang.startsWith('ja')) return 'ja-JP';
    if (browserLang.startsWith('ko')) return 'ko-KR';
    if (browserLang.startsWith('fr')) return 'fr-FR';
    if (browserLang.startsWith('de')) return 'de-DE';
    if (browserLang.startsWith('es')) return 'es-ES';

    return 'en-US';
  }

  /**
   * 获取翻译
   */
  t(key: TranslationKey, params?: Record<string, string | number>): string {
    // 优先从自定义翻译获取
    const custom = this.customTranslations.get(this.locale);
    if (custom && custom[key]) {
      return this.interpolate(custom[key], params);
    }

    // 从内置翻译获取
    const localeTranslations = translations[this.locale as keyof typeof translations];
    if (localeTranslations && localeTranslations[key]) {
      return this.interpolate(localeTranslations[key], params);
    }

    // 降级到备用语言
    const fallbackTranslations = translations[this.fallbackLocale as keyof typeof translations];
    if (fallbackTranslations && fallbackTranslations[key]) {
      return this.interpolate(fallbackTranslations[key], params);
    }

    // 返回键名（开发时便于发现缺失的翻译）
    logger.warn('翻译缺失', { key, locale: this.locale });
    return key;
  }

  /**
   * 插值（替换变量）
   */
  private interpolate(text: string, params?: Record<string, string | number>): string {
    if (!params) return text;

    let result = text;
    Object.entries(params).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    });

    return result;
  }

  /**
   * 设置语言
   */
  setLocale(locale: Locale): void {
    this.locale = locale;
    logger.info('语言已切换', { locale });
  }

  /**
   * 获取当前语言
   */
  getLocale(): Locale {
    return this.locale;
  }

  /**
   * 添加自定义翻译
   */
  addTranslations(locale: Locale, translations: Record<string, string>): void {
    const existing = this.customTranslations.get(locale) || {};
    this.customTranslations.set(locale, { ...existing, ...translations });
    logger.debug('添加自定义翻译', { locale, count: Object.keys(translations).length });
  }

  /**
   * 获取所有支持的语言
   */
  getSupportedLocales(): Locale[] {
    return Object.keys(translations) as Locale[];
  }

  /**
   * 检查是否支持某语言
   */
  isLocaleSupported(locale: string): locale is Locale {
    return this.getSupportedLocales().includes(locale as Locale);
  }
}

// 全局 i18n 实例
export const globalI18n = new I18n();

// 便捷函数
export const t = (key: TranslationKey, params?: Record<string, string | number>) =>
  globalI18n.t(key, params);

