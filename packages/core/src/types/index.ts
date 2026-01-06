/**
 * Word 文档查看器核心类型定义
 */

// ============ 基础类型 ============

/** 文档元数据 */
export interface DocumentMetadata {
  title?: string;
  subject?: string;
  creator?: string;
  keywords?: string;
  description?: string;
  lastModifiedBy?: string;
  revision?: string;
  created?: Date;
  modified?: Date;
  category?: string;
  version?: string;
}

/** 页面设置 */
export interface PageSettings {
  width: number;
  height: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  headerDistance: number;
  footerDistance: number;
  orientation: 'portrait' | 'landscape';
  columns: number;
  columnSpace: number;
}

/** 字体样式 */
export interface FontStyle {
  name?: string;
  size?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: UnderlineStyle;
  strike?: boolean;
  doubleStrike?: boolean;
  color?: string;
  highlight?: string;
  vertAlign?: 'baseline' | 'superscript' | 'subscript';
  spacing?: number;
  kern?: number;
  position?: number;
  smallCaps?: boolean;
  allCaps?: boolean;
  emboss?: boolean;
  imprint?: boolean;
  outline?: boolean;
  shadow?: boolean;
}

/** 下划线样式 */
export type UnderlineStyle =
  | 'single'
  | 'double'
  | 'thick'
  | 'dotted'
  | 'dottedHeavy'
  | 'dash'
  | 'dashLong'
  | 'dashDotDotHeavy'
  | 'dashDotHeavy'
  | 'dashLongHeavy'
  | 'dotDash'
  | 'dotDotDash'
  | 'wave'
  | 'wavyDouble'
  | 'wavyHeavy'
  | 'words'
  | 'none';

/** 段落样式 */
export interface ParagraphStyle {
  alignment?: 'left' | 'center' | 'right' | 'justify' | 'distribute';
  indentLeft?: number;
  indentRight?: number;
  indentFirstLine?: number;
  indentHanging?: number;
  spaceBefore?: number;
  spaceAfter?: number;
  lineSpacing?: number;
  lineSpacingType?: 'auto' | 'atLeast' | 'exact';
  keepNext?: boolean;
  keepLines?: boolean;
  pageBreakBefore?: boolean;
  widowControl?: boolean;
  outlineLevel?: number;
  tabStops?: TabStop[];
  borders?: ParagraphBorders;
  shading?: Shading;
  direction?: 'ltr' | 'rtl';
}

/** 制表位 */
export interface TabStop {
  position: number;
  alignment: 'left' | 'center' | 'right' | 'decimal' | 'bar';
  leader?: 'none' | 'dot' | 'hyphen' | 'underscore' | 'middleDot';
}

/** 段落边框 */
export interface ParagraphBorders {
  top?: BorderStyle;
  bottom?: BorderStyle;
  left?: BorderStyle;
  right?: BorderStyle;
  between?: BorderStyle;
  bar?: BorderStyle;
}

/** 边框样式 */
export interface BorderStyle {
  style: BorderType;
  width: number;
  color: string;
  space?: number;
  shadow?: boolean;
}

/** 边框类型 */
export type BorderType =
  | 'nil'
  | 'none'
  | 'single'
  | 'thick'
  | 'double'
  | 'dotted'
  | 'dashed'
  | 'dotDash'
  | 'dotDotDash'
  | 'triple'
  | 'thinThickSmallGap'
  | 'thickThinSmallGap'
  | 'thinThickThinSmallGap'
  | 'thinThickMediumGap'
  | 'thickThinMediumGap'
  | 'thinThickThinMediumGap'
  | 'thinThickLargeGap'
  | 'thickThinLargeGap'
  | 'thinThickThinLargeGap'
  | 'wave'
  | 'doubleWave'
  | 'dashSmallGap'
  | 'dashDotStroked'
  | 'threeDEmboss'
  | 'threeDEngrave'
  | 'outset'
  | 'inset';

/** 底纹 */
export interface Shading {
  fill?: string;
  color?: string;
  pattern?: ShadingPattern;
}

/** 底纹图案 */
export type ShadingPattern =
  | 'clear'
  | 'solid'
  | 'horzStripe'
  | 'vertStripe'
  | 'reverseDiagStripe'
  | 'diagStripe'
  | 'horzCross'
  | 'diagCross'
  | 'thinHorzStripe'
  | 'thinVertStripe'
  | 'thinReverseDiagStripe'
  | 'thinDiagStripe'
  | 'thinHorzCross'
  | 'thinDiagCross'
  | 'pct5'
  | 'pct10'
  | 'pct12'
  | 'pct15'
  | 'pct20'
  | 'pct25'
  | 'pct30'
  | 'pct35'
  | 'pct37'
  | 'pct40'
  | 'pct45'
  | 'pct50'
  | 'pct55'
  | 'pct60'
  | 'pct62'
  | 'pct65'
  | 'pct70'
  | 'pct75'
  | 'pct80'
  | 'pct85'
  | 'pct87'
  | 'pct90'
  | 'pct95';

// ============ 文档元素 ============

/** 文档元素基类 */
export interface DocumentElement {
  type: ElementType;
  id?: string;
}

/** 元素类型 */
export type ElementType =
  | 'document'
  | 'body'
  | 'section'
  | 'paragraph'
  | 'run'
  | 'text'
  | 'break'
  | 'tab'
  | 'symbol'
  | 'table'
  | 'tableRow'
  | 'tableCell'
  | 'image'
  | 'drawing'
  | 'shape'
  | 'hyperlink'
  | 'bookmark'
  | 'bookmarkStart'
  | 'bookmarkEnd'
  | 'field'
  | 'footnote'
  | 'endnote'
  | 'comment'
  | 'header'
  | 'footer'
  | 'numbering'
  | 'sdt'
  | 'equation'
  | 'chart';

/** 段落元素 */
export interface ParagraphElement extends DocumentElement {
  type: 'paragraph';
  style?: ParagraphStyle;
  numbering?: NumberingInfo;
  runs: RunElement[];
  bookmarkStart?: BookmarkStart[];
  bookmarkEnd?: string[];
}

/** 文字运行元素 */
export interface RunElement extends DocumentElement {
  type: 'run';
  style?: FontStyle;
  children: (TextElement | BreakElement | TabElement | ImageElement | SymbolElement | FieldElement)[];
}

/** 文本元素 */
export interface TextElement extends DocumentElement {
  type: 'text';
  text: string;
}

/** 换行元素 */
export interface BreakElement extends DocumentElement {
  type: 'break';
  breakType: 'line' | 'page' | 'column' | 'textWrapping';
  clear?: 'none' | 'left' | 'right' | 'all';
}

/** 制表符元素 */
export interface TabElement extends DocumentElement {
  type: 'tab';
}

/** 符号元素 */
export interface SymbolElement extends DocumentElement {
  type: 'symbol';
  char: string;
  font?: string;
}

/** 域元素 */
export interface FieldElement extends DocumentElement {
  type: 'field';
  fieldType: FieldType;
  instruction?: string;
  result?: string;
}

/** 域类型 */
export type FieldType =
  | 'PAGE'
  | 'NUMPAGES'
  | 'DATE'
  | 'TIME'
  | 'AUTHOR'
  | 'TITLE'
  | 'SUBJECT'
  | 'TOC'
  | 'HYPERLINK'
  | 'REF'
  | 'PAGEREF'
  | 'SEQ'
  | 'MERGEFIELD'
  | 'IF'
  | 'FORMULA'
  | 'UNKNOWN';

/** 编号信息 */
export interface NumberingInfo {
  numId: number;
  level: number;
  format?: NumberFormat;
  text?: string;
  start?: number;
  suffix?: 'tab' | 'space' | 'nothing';
}

/** 编号格式 */
export type NumberFormat =
  | 'decimal'
  | 'upperRoman'
  | 'lowerRoman'
  | 'upperLetter'
  | 'lowerLetter'
  | 'ordinal'
  | 'cardinalText'
  | 'ordinalText'
  | 'hex'
  | 'chicago'
  | 'bullet'
  | 'ideographDigital'
  | 'japaneseCounting'
  | 'chineseCounting'
  | 'chineseLegalSimplified'
  | 'koreanCounting'
  | 'none';

/** 书签开始 */
export interface BookmarkStart {
  id: string;
  name: string;
}

// ============ 表格相关 ============

/** 表格元素 */
export interface TableElement extends DocumentElement {
  type: 'table';
  properties?: TableProperties;
  grid: TableGridCol[];
  rows: TableRowElement[];
}

/** 表格属性 */
export interface TableProperties {
  width?: TableWidth;
  alignment?: 'left' | 'center' | 'right';
  indent?: number;
  borders?: TableBorders;
  shading?: Shading;
  layout?: 'fixed' | 'autofit';
  cellMargin?: TableCellMargin;
  look?: TableLook;
}

/** 表格宽度 */
export interface TableWidth {
  value: number;
  type: 'auto' | 'dxa' | 'pct' | 'nil';
}

/** 表格边框 */
export interface TableBorders {
  top?: BorderStyle;
  bottom?: BorderStyle;
  left?: BorderStyle;
  right?: BorderStyle;
  insideH?: BorderStyle;
  insideV?: BorderStyle;
}

/** 表格列宽 */
export interface TableGridCol {
  width: number;
}

/** 表格单元格边距 */
export interface TableCellMargin {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

/** 表格外观 */
export interface TableLook {
  firstRow?: boolean;
  lastRow?: boolean;
  firstColumn?: boolean;
  lastColumn?: boolean;
  noHBand?: boolean;
  noVBand?: boolean;
}

/** 表格行元素 */
export interface TableRowElement extends DocumentElement {
  type: 'tableRow';
  properties?: TableRowProperties;
  cells: TableCellElement[];
}

/** 表格行属性 */
export interface TableRowProperties {
  height?: number;
  heightRule?: 'auto' | 'atLeast' | 'exact';
  header?: boolean;
  cantSplit?: boolean;
}

/** 表格单元格元素 */
export interface TableCellElement extends DocumentElement {
  type: 'tableCell';
  properties?: TableCellProperties;
  content: (ParagraphElement | TableElement)[];
}

/** 表格单元格属性 */
export interface TableCellProperties {
  width?: TableWidth;
  gridSpan?: number;
  vMerge?: 'restart' | 'continue';
  vAlign?: 'top' | 'center' | 'bottom';
  borders?: TableBorders;
  shading?: Shading;
  textDirection?: 'lrTb' | 'tbRl' | 'btLr' | 'lrTbV' | 'tbRlV' | 'tbLrV';
  noWrap?: boolean;
}

// ============ 图片相关 ============

/** 图片元素 */
export interface ImageElement extends DocumentElement {
  type: 'image';
  src: string;
  width: number;
  height: number;
  alt?: string;
  title?: string;
  blipId?: string;
  contentType?: string;
  positioning?: ImagePositioning;
  effects?: ImageEffects;
}

/** 图片定位 */
export interface ImagePositioning {
  type: 'inline' | 'anchor';
  wrapType?: 'none' | 'square' | 'tight' | 'through' | 'topAndBottom' | 'behind' | 'inFront';
  horizontalPosition?: PositionInfo;
  verticalPosition?: PositionInfo;
  allowOverlap?: boolean;
  layoutInCell?: boolean;
  locked?: boolean;
  behindDoc?: boolean;
}

/** 位置信息 */
export interface PositionInfo {
  relative: 'character' | 'column' | 'insideMargin' | 'leftMargin' | 'margin' | 'outsideMargin' | 'page' | 'rightMargin';
  align?: 'left' | 'center' | 'right' | 'inside' | 'outside';
  offset?: number;
}

/** 图片效果 */
export interface ImageEffects {
  rotation?: number;
  flipH?: boolean;
  flipV?: boolean;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  cropTop?: number;
  cropBottom?: number;
  cropLeft?: number;
  cropRight?: number;
}

// ============ 超链接相关 ============

/** 超链接元素 */
export interface HyperlinkElement extends DocumentElement {
  type: 'hyperlink';
  href?: string;
  anchor?: string;
  tooltip?: string;
  runs: RunElement[];
}

// ============ 脚注尾注 ============

/** 脚注元素 */
export interface FootnoteElement extends DocumentElement {
  type: 'footnote';
  id: string;
  content: ParagraphElement[];
}

/** 尾注元素 */
export interface EndnoteElement extends DocumentElement {
  type: 'endnote';
  id: string;
  content: ParagraphElement[];
}

// ============ 批注 ============

/** 批注元素 */
export interface CommentElement extends DocumentElement {
  type: 'comment';
  id: string;
  author?: string;
  date?: Date;
  initials?: string;
  content: ParagraphElement[];
}

// ============ 页眉页脚 ============

/** 页眉页脚类型 */
export type HeaderFooterType = 'default' | 'first' | 'even';

/** 页眉元素 */
export interface HeaderElement extends DocumentElement {
  type: 'header';
  headerType: HeaderFooterType;
  content: (ParagraphElement | TableElement)[];
}

/** 页脚元素 */
export interface FooterElement extends DocumentElement {
  type: 'footer';
  footerType: HeaderFooterType;
  content: (ParagraphElement | TableElement)[];
}

// ============ 节 ============

/** 节元素 */
export interface SectionElement extends DocumentElement {
  type: 'section';
  properties: SectionProperties;
  headers?: Map<HeaderFooterType, HeaderElement>;
  footers?: Map<HeaderFooterType, FooterElement>;
  content: (ParagraphElement | TableElement)[];
}

/** 节属性 */
export interface SectionProperties {
  pageSettings: PageSettings;
  type?: 'continuous' | 'nextPage' | 'evenPage' | 'oddPage' | 'nextColumn';
  titlePage?: boolean;
  pageNumberStart?: number;
}

// ============ 样式 ============

/** 样式定义 */
export interface StyleDefinition {
  id: string;
  name: string;
  type: 'paragraph' | 'character' | 'table' | 'numbering';
  basedOn?: string;
  next?: string;
  link?: string;
  isDefault?: boolean;
  isBuiltIn?: boolean;
  paragraphStyle?: ParagraphStyle;
  fontStyle?: FontStyle;
  tableStyle?: TableProperties;
}

// ============ 编号定义 ============

/** 编号定义 */
export interface NumberingDefinition {
  numId: number;
  abstractNumId: number;
  levels: NumberingLevel[];
}

/** 编号级别 */
export interface NumberingLevel {
  level: number;
  format: NumberFormat;
  text: string;
  alignment?: 'left' | 'center' | 'right';
  start: number;
  suffix?: 'tab' | 'space' | 'nothing';
  paragraphStyle?: ParagraphStyle;
  fontStyle?: FontStyle;
  isLegalNumbering?: boolean;
  restartAfterLevel?: number;
}

// ============ 完整文档 ============

/** 完整文档结构 */
export interface WordDocument {
  metadata: DocumentMetadata;
  styles: Map<string, StyleDefinition>;
  numbering: Map<number, NumberingDefinition>;
  sections: SectionElement[];
  footnotes: Map<string, FootnoteElement>;
  endnotes: Map<string, EndnoteElement>;
  comments: Map<string, CommentElement>;
  images: Map<string, ImageData>;
  relationships: Map<string, Relationship>;
  defaultStyles: DefaultStyles;
}

/** 图片数据 */
export interface ImageData {
  id: string;
  data: ArrayBuffer | string;
  contentType: string;
  width?: number;
  height?: number;
}

/** 关系 */
export interface Relationship {
  id: string;
  type: string;
  target: string;
  targetMode?: 'External' | 'Internal';
}

/** 默认样式 */
export interface DefaultStyles {
  paragraph?: ParagraphStyle;
  character?: FontStyle;
}

// ============ 渲染相关 ============

/** 渲染选项 */
export interface RenderOptions {
  /** 容器元素 */
  container: HTMLElement;
  /** 缩放比例 */
  scale?: number;
  /** 是否显示页面边框 */
  showPageBorder?: boolean;
  /** 是否显示页眉页脚 */
  showHeaderFooter?: boolean;
  /** 是否显示批注 */
  showComments?: boolean;
  /** 是否显示分页 */
  enablePagination?: boolean;
  /** 自定义样式类名前缀 */
  classPrefix?: string;
  /** 主题 */
  theme?: ThemeConfig;
  /** 是否启用虚拟滚动 */
  virtualScroll?: boolean;
  /** 虚拟滚动缓冲区大小 */
  virtualScrollBuffer?: number;
  /** 打印模式 */
  printMode?: boolean;
  /** 是否显示行号 */
  showLineNumbers?: boolean;
}

/** 主题配置 */
export interface ThemeConfig {
  name: string;
  backgroundColor: string;
  pageColor: string;
  pageShadow: string;
  textColor: string;
  linkColor: string;
  selectionColor: string;
  highlightColor: string;
  borderColor: string;
}

/** 预设主题 */
export const THEMES: Record<string, ThemeConfig> = {
  light: {
    name: 'light',
    backgroundColor: '#f0f0f0',
    pageColor: '#ffffff',
    pageShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    textColor: '#333333',
    linkColor: '#0066cc',
    selectionColor: 'rgba(0, 102, 204, 0.3)',
    highlightColor: '#ffff00',
    borderColor: '#dddddd'
  },
  dark: {
    name: 'dark',
    backgroundColor: '#1e1e1e',
    pageColor: '#2d2d2d',
    pageShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
    textColor: '#e0e0e0',
    linkColor: '#58a6ff',
    selectionColor: 'rgba(88, 166, 255, 0.3)',
    highlightColor: '#665500',
    borderColor: '#444444'
  },
  sepia: {
    name: 'sepia',
    backgroundColor: '#f4ecd8',
    pageColor: '#fbf7f0',
    pageShadow: '0 2px 8px rgba(139, 119, 92, 0.2)',
    textColor: '#5c4b37',
    linkColor: '#8b6914',
    selectionColor: 'rgba(139, 105, 20, 0.3)',
    highlightColor: '#e6d5a8',
    borderColor: '#d4c7b0'
  }
};

// ============ 事件 ============

/** 事件类型 */
export type EventType =
  | 'load'
  | 'loadError'
  | 'render'
  | 'renderError'
  | 'pageChange'
  | 'scaleChange'
  | 'scroll'
  | 'click'
  | 'linkClick'
  | 'imageClick'
  | 'selectionChange'
  | 'searchResult'
  | 'print'
  | 'themeChange';

/** 事件数据 */
export interface EventData {
  type: EventType;
  timestamp: number;
  [key: string]: unknown;
}

/** 加载事件 */
export interface LoadEvent extends EventData {
  type: 'load';
  document: WordDocument;
  pageCount: number;
}

/** 加载错误事件 */
export interface LoadErrorEvent extends EventData {
  type: 'loadError';
  error: Error;
}

/** 页面变化事件 */
export interface PageChangeEvent extends EventData {
  type: 'pageChange';
  currentPage: number;
  totalPages: number;
}

/** 缩放变化事件 */
export interface ScaleChangeEvent extends EventData {
  type: 'scaleChange';
  scale: number;
  previousScale: number;
}

/** 搜索结果事件 */
export interface SearchResultEvent extends EventData {
  type: 'searchResult';
  query: string;
  results: SearchResult[];
  currentIndex: number;
}

/** 搜索结果 */
export interface SearchResult {
  pageIndex: number;
  elementIndex: number;
  startOffset: number;
  endOffset: number;
  text: string;
  context: string;
}

/** 链接点击事件 */
export interface LinkClickEvent extends EventData {
  type: 'linkClick';
  href: string;
  isExternal: boolean;
  element: HTMLElement;
}

/** 选择变化事件 */
export interface SelectionChangeEvent extends EventData {
  type: 'selectionChange';
  selectedText: string;
  range: Range | null;
}

// ============ 目录 ============

/** 目录项 */
export interface TocItem {
  level: number;
  text: string;
  pageNumber?: number;
  anchor?: string;
  children: TocItem[];
}

// ============ 打印选项 ============

/** 打印选项 */
export interface PrintOptions {
  /** 页面范围 */
  pageRange?: string;
  /** 是否双面打印 */
  duplex?: boolean;
  /** 每页打印多少页 */
  pagesPerSheet?: 1 | 2 | 4 | 6 | 9 | 16;
  /** 页面方向 */
  orientation?: 'portrait' | 'landscape';
  /** 纸张大小 */
  paperSize?: 'A4' | 'A3' | 'Letter' | 'Legal' | 'Custom';
  /** 是否显示页眉页脚 */
  showHeaderFooter?: boolean;
  /** 是否显示背景 */
  showBackground?: boolean;
  /** 缩放比例 */
  scale?: number;
}

// ============ 导出选项 ============

/** 导出选项 */
export interface ExportOptions {
  /** 导出格式 */
  format: 'pdf' | 'html' | 'image' | 'text';
  /** 图片质量 (0-1) */
  quality?: number;
  /** 缩放比例 */
  scale?: number;
  /** 页面范围 */
  pageRange?: string;
  /** 包含元数据 */
  includeMetadata?: boolean;
  /** 图片格式 */
  imageFormat?: 'png' | 'jpeg' | 'webp';
  /** 文件名 */
  fileName?: string;
}

// ============ 视图模式 ============

/** 视图模式 */
export type ViewMode = 'single' | 'double' | 'continuous' | 'presentation';

/** 视图模式配置 */
export interface ViewModeConfig {
  /** 当前模式 */
  mode: ViewMode;
  /** 是否全屏 */
  fullscreen?: boolean;
  /** 页面间距 */
  pageGap?: number;
  /** 是否显示页面阴影 */
  showPageShadow?: boolean;
}

// ============ 缩略图 ============

/** 缩略图配置 */
export interface ThumbnailConfig {
  /** 缩略图宽度 */
  width?: number;
  /** 缩略图质量 */
  quality?: number;
  /** 是否显示页码 */
  showPageNumber?: boolean;
  /** 懒加载 */
  lazyLoad?: boolean;
}

/** 缩略图项 */
export interface ThumbnailItem {
  /** 页码 */
  pageIndex: number;
  /** 缩略图URL */
  imageUrl?: string;
  /** 是否已生成 */
  generated: boolean;
}

// ============ 书签 ============

/** 书签项 */
export interface BookmarkItem {
  /** 书签ID */
  id: string;
  /** 书签名称 */
  name: string;
  /** 目标锚点 */
  anchor?: string;
  /** 页码 */
  pageIndex?: number;
  /** 是否为用户创建 */
  isUserCreated?: boolean;
  /** 创建时间 */
  createdAt?: Date;
}

// ============ 批注增强 ============

/** 批注显示配置 */
export interface CommentDisplayConfig {
  /** 是否显示批注 */
  visible: boolean;
  /** 显示模式 */
  displayMode: 'sidebar' | 'inline' | 'tooltip';
  /** 是否显示已解决的批注 */
  showResolved?: boolean;
}

// ============ 标注/高亮 ============

/** 标注类型 */
export type AnnotationType = 'highlight' | 'underline' | 'strikethrough' | 'note';

/** 标注项 */
export interface AnnotationItem {
  /** 标注ID */
  id: string;
  /** 标注类型 */
  type: AnnotationType;
  /** 颜色 */
  color: string;
  /** 文本内容 */
  text: string;
  /** 备注 */
  note?: string;
  /** 页码 */
  pageIndex: number;
  /** 开始偏移 */
  startOffset: number;
  /** 结束偏移 */
  endOffset: number;
  /** 创建时间 */
  createdAt: Date;
  /** 修改时间 */
  updatedAt?: Date;
}

/** 标注存储 */
export interface AnnotationStore {
  /** 文档ID */
  documentId: string;
  /** 标注列表 */
  annotations: AnnotationItem[];
}

// ============ 选择 ============

/** 选择信息 */
export interface SelectionInfo {
  /** 选中的文本 */
  text: string;
  /** 选区范围 */
  range: Range | null;
  /** 起始页 */
  startPage?: number;
  /** 结束页 */
  endPage?: number;
  /** 边界矩形 */
  boundingRect?: DOMRect;
}

// ============ 右键菜单 ============

/** 右键菜单项 */
export interface ContextMenuItem {
  /** 唯一标识 */
  id: string;
  /** 显示文本 */
  label: string;
  /** 图标 */
  icon?: string;
  /** 快捷键 */
  shortcut?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否为分隔符 */
  separator?: boolean;
  /** 子菜单 */
  children?: ContextMenuItem[];
  /** 点击处理函数 */
  onClick?: () => void;
}

// ============ 更多事件类型 ============

/** 扩展事件类型 */
export type ExtendedEventType =
  | EventType
  | 'export'
  | 'exportError'
  | 'viewModeChange'
  | 'thumbnailGenerate'
  | 'bookmarkClick'
  | 'commentClick'
  | 'annotationChange'
  | 'contextMenu'
  | 'fullscreenChange';

/** 导出事件 */
export interface ExportEvent extends EventData {
  type: 'export';
  format: ExportOptions['format'];
  success: boolean;
  blob?: Blob;
}

/** 视图模式变化事件 */
export interface ViewModeChangeEvent extends EventData {
  type: 'viewModeChange';
  mode: ViewMode;
  previousMode: ViewMode;
}

/** 批注点击事件 */
export interface CommentClickEvent extends EventData {
  type: 'commentClick';
  comment: CommentElement;
}

/** 标注变化事件 */
export interface AnnotationChangeEvent extends EventData {
  type: 'annotationChange';
  action: 'add' | 'remove' | 'update';
  annotation: AnnotationItem;
}

/** 全屏变化事件 */
export interface FullscreenChangeEvent extends EventData {
  type: 'fullscreenChange';
  isFullscreen: boolean;
}
