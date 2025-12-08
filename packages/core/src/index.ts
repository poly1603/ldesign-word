// 主类导出
export { WordViewer, type WordViewerOptions } from './WordViewer';

// 类型导出
export type {
  // 基础类型
  DocumentMetadata,
  PageSettings,
  FontStyle,
  ParagraphStyle,
  UnderlineStyle,
  BorderStyle,
  BorderType,
  Shading,
  ShadingPattern,
  TabStop,
  ParagraphBorders,

  // 元素类型
  DocumentElement,
  ElementType,
  ParagraphElement,
  RunElement,
  TextElement,
  BreakElement,
  TabElement,
  SymbolElement,
  FieldElement,
  FieldType,
  NumberingInfo,
  NumberFormat,
  BookmarkStart,

  // 表格类型
  TableElement,
  TableProperties,
  TableWidth,
  TableBorders,
  TableGridCol,
  TableCellMargin,
  TableLook,
  TableRowElement,
  TableRowProperties,
  TableCellElement,
  TableCellProperties,

  // 图片类型
  ImageElement,
  ImagePositioning,
  PositionInfo,
  ImageEffects,

  // 超链接类型
  HyperlinkElement,

  // 脚注尾注
  FootnoteElement,
  EndnoteElement,

  // 批注
  CommentElement,

  // 页眉页脚
  HeaderFooterType,
  HeaderElement,
  FooterElement,

  // 节
  SectionElement,
  SectionProperties,

  // 样式
  StyleDefinition,
  NumberingDefinition,
  NumberingLevel,

  // 文档
  WordDocument,
  ImageData,
  Relationship,
  DefaultStyles,

  // 渲染
  RenderOptions,
  ThemeConfig,

  // 事件
  EventType,
  EventData,
  LoadEvent,
  LoadErrorEvent,
  PageChangeEvent,
  ScaleChangeEvent,
  SearchResultEvent,
  SearchResult,
  LinkClickEvent,
  SelectionChangeEvent,

  // 目录
  TocItem,

  // 打印
  PrintOptions,

  // 导出
  ExportOptions
} from './types';

// 常量导出
export { THEMES } from './types';

// 解析器导出
export { DocxParser } from './parser/DocxParser';

// 渲染器导出
export { DocumentRenderer } from './renderer/DocumentRenderer';

// 事件发射器导出
export { EventEmitter } from './events/EventEmitter';

// 功能模块导出
export { SearchManager, type SearchOptions } from './features/SearchManager';
export { TocManager } from './features/TocManager';
export { PrintManager } from './features/PrintManager';

// 工具类导出
export { XmlUtils } from './utils/XmlUtils';
export { UnitConverter } from './utils/UnitConverter';

// 组件导出
export { Toolbar, type ToolbarOptions, type ToolbarCallbacks } from './components/Toolbar';

// 图标导出
export { Icons, createIconElement } from './utils/icons';
