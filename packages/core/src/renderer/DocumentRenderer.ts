import type {
  WordDocument,
  SectionElement,
  ParagraphElement,
  RunElement,
  TableElement,
  TableRowElement,
  TableCellElement,
  ImageElement,
  RenderOptions,
  ThemeConfig,
  ParagraphStyle,
  FontStyle,
  NumberingDefinition
} from '../types';
import { THEMES } from '../types';
import { UnitConverter } from '../utils/UnitConverter';
import { EventEmitter } from '../events/EventEmitter';

/**
 * 文档渲染器
 * 将解析后的文档结构渲染为 HTML
 */
export class DocumentRenderer {
  private container: HTMLElement | null = null;
  private document: WordDocument | null = null;
  private options: RenderOptions;
  private scale = 1;
  private currentPage = 1;
  private totalPages = 1;
  private theme: ThemeConfig;
  private eventEmitter: EventEmitter;
  private pages: HTMLElement[] = [];
  private classPrefix: string;

  constructor(eventEmitter: EventEmitter, options?: Partial<RenderOptions>) {
    this.eventEmitter = eventEmitter;
    this.options = {
      container: options?.container || document.body,
      scale: options?.scale ?? 1,
      showPageBorder: options?.showPageBorder ?? true,
      showHeaderFooter: options?.showHeaderFooter ?? true,
      showComments: options?.showComments ?? false,
      enablePagination: options?.enablePagination ?? true,
      classPrefix: options?.classPrefix ?? 'wv',
      theme: options?.theme,
      virtualScroll: options?.virtualScroll ?? false,
      virtualScrollBuffer: options?.virtualScrollBuffer ?? 2,
      printMode: options?.printMode ?? false,
      showLineNumbers: options?.showLineNumbers ?? false
    };

    this.scale = this.options.scale || 1;
    this.classPrefix = this.options.classPrefix || 'wv';
    this.theme = this.options.theme || (THEMES as Record<string, ThemeConfig>)['light']!;
  }

  /**
   * 渲染文档
   */
  render(document: WordDocument, container: HTMLElement): void {
    this.document = document;
    this.container = container;
    this.pages = [];

    // 清空容器
    container.innerHTML = '';

    // 创建文档包装器
    const wrapper = this.createElement('div', `${this.classPrefix}-document`);
    this.applyThemeStyles(wrapper);

    // 渲染各节
    for (const section of document.sections) {
      this.renderSection(section, wrapper);
    }

    container.appendChild(wrapper);

    // 计算总页数
    this.calculatePages();

    // 触发渲染完成事件
    this.eventEmitter.emit('render', {
      type: 'render',
      timestamp: Date.now(),
      pageCount: this.totalPages
    });
  }

  /**
   * 渲染节
   */
  private renderSection(section: SectionElement, parent: HTMLElement): void {
    const { pageSettings } = section.properties;

    // 创建页面容器
    const pageContainer = this.createElement('div', `${this.classPrefix}-page`);

    // 应用页面样式
    const pageWidth = pageSettings.width * this.scale;
    const pageHeight = pageSettings.height * this.scale;

    Object.assign(pageContainer.style, {
      width: `${pageWidth}px`,
      minHeight: `${pageHeight}px`,
      padding: `${pageSettings.marginTop * this.scale}px ${pageSettings.marginRight * this.scale}px ${pageSettings.marginBottom * this.scale}px ${pageSettings.marginLeft * this.scale}px`,
      backgroundColor: this.theme.pageColor,
      boxShadow: this.options.showPageBorder ? this.theme.pageShadow : 'none',
      margin: '20px auto',
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'hidden'
    });

    // 创建内容区域
    const contentArea = this.createElement('div', `${this.classPrefix}-content`);
    Object.assign(contentArea.style, {
      width: '100%',
      minHeight: '100%'
    });

    // 渲染内容
    for (const element of section.content) {
      if (element.type === 'paragraph') {
        this.renderParagraph(element, contentArea);
      } else if (element.type === 'table') {
        this.renderTable(element, contentArea);
      }
    }

    pageContainer.appendChild(contentArea);
    parent.appendChild(pageContainer);
    this.pages.push(pageContainer);
  }

  /**
   * 渲染段落
   */
  private renderParagraph(paragraph: ParagraphElement, parent: HTMLElement): void {
    const p = this.createElement('p', `${this.classPrefix}-paragraph`);

    // 应用段落样式
    this.applyParagraphStyle(p, paragraph.style);

    // 处理编号
    if (paragraph.numbering && this.document) {
      this.renderNumbering(p, paragraph.numbering, this.document.numbering);
    }

    // 渲染运行元素
    for (const run of paragraph.runs) {
      this.renderRun(run, p);
    }

    // 如果段落为空，添加占位符
    if (paragraph.runs.length === 0) {
      const br = document.createElement('br');
      p.appendChild(br);
    }

    parent.appendChild(p);
  }

  /**
   * 渲染编号
   */
  private renderNumbering(
    p: HTMLElement,
    numbering: ParagraphElement['numbering'],
    definitions: Map<number, NumberingDefinition>
  ): void {
    if (!numbering) return;

    const definition = definitions.get(numbering.numId);
    if (!definition) return;

    const level = definition.levels[numbering.level];
    if (!level) return;

    const numberSpan = this.createElement('span', `${this.classPrefix}-numbering`);

    // 生成编号文本
    let numberText = level.text || '';
    // 简化处理：替换 %1 等占位符
    numberText = numberText.replace(/%(\d+)/g, (_match, levelNum) => {
      const lvl = parseInt(levelNum, 10) - 1;
      if (lvl === numbering.level) {
        return this.formatNumber(numbering.start || 1, level.format);
      }
      return '';
    });

    numberSpan.textContent = numberText + (level.suffix === 'tab' ? '\t' : level.suffix === 'space' ? ' ' : '');

    Object.assign(numberSpan.style, {
      marginRight: '8px',
      display: 'inline-block',
      minWidth: '2em'
    });

    p.insertBefore(numberSpan, p.firstChild);
  }

  /**
   * 格式化编号
   */
  private formatNumber(num: number, format: string): string {
    switch (format) {
      case 'decimal':
        return num.toString();
      case 'upperRoman':
        return this.toRoman(num).toUpperCase();
      case 'lowerRoman':
        return this.toRoman(num).toLowerCase();
      case 'upperLetter':
        return this.toLetter(num).toUpperCase();
      case 'lowerLetter':
        return this.toLetter(num).toLowerCase();
      case 'bullet':
        return '•';
      case 'chineseCounting':
        return this.toChineseNumber(num);
      default:
        return num.toString();
    }
  }

  /**
   * 转换为罗马数字
   */
  private toRoman(num: number): string {
    const romanNumerals: [number, string][] = [
      [1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'],
      [100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'],
      [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']
    ];

    let result = '';
    for (const [value, numeral] of romanNumerals) {
      while (num >= value) {
        result += numeral;
        num -= value;
      }
    }
    return result;
  }

  /**
   * 转换为字母编号
   */
  private toLetter(num: number): string {
    let result = '';
    while (num > 0) {
      num--;
      result = String.fromCharCode(97 + (num % 26)) + result;
      num = Math.floor(num / 26);
    }
    return result;
  }

  /**
   * 转换为中文数字
   */
  private toChineseNumber(num: number): string {
    const digits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    const units = ['', '十', '百', '千', '万'];

    if (num < 10) return digits[num] || '';
    if (num < 100) {
      const tens = Math.floor(num / 10);
      const ones = num % 10;
      return (tens === 1 ? '' : (digits[tens] || '')) + '十' + (ones === 0 ? '' : (digits[ones] || ''));
    }

    // 简化处理，仅支持到 99
    return num.toString();
  }

  /**
   * 渲染运行元素
   */
  private renderRun(run: RunElement, parent: HTMLElement): void {
    const span = this.createElement('span', `${this.classPrefix}-run`);

    // 应用字体样式
    this.applyFontStyle(span, run.style);

    // 渲染子元素
    for (const child of run.children) {
      switch (child.type) {
        case 'text':
          span.appendChild(document.createTextNode(child.text));
          break;
        case 'break':
          if (child.breakType === 'line') {
            span.appendChild(document.createElement('br'));
          } else if (child.breakType === 'page') {
            // 分页符处理
            const pageBreak = this.createElement('div', `${this.classPrefix}-page-break`);
            Object.assign(pageBreak.style, {
              pageBreakAfter: 'always',
              breakAfter: 'page'
            });
            parent.appendChild(span);
            parent.appendChild(pageBreak);
            return;
          }
          break;
        case 'tab':
          const tabSpan = document.createElement('span');
          tabSpan.innerHTML = '&emsp;&emsp;';
          span.appendChild(tabSpan);
          break;
        case 'image':
          this.renderImage(child, span);
          break;
      }
    }

    parent.appendChild(span);
  }

  /**
   * 渲染图片
   */
  private renderImage(image: ImageElement, parent: HTMLElement): void {
    const img = document.createElement('img');

    img.src = image.src;
    img.alt = image.alt || '';

    Object.assign(img.style, {
      width: `${image.width * this.scale}px`,
      height: `${image.height * this.scale}px`,
      maxWidth: '100%',
      verticalAlign: 'middle'
    });

    img.className = `${this.classPrefix}-image`;

    // 添加点击事件
    img.addEventListener('click', (e) => {
      this.eventEmitter.emit('imageClick', {
        type: 'imageClick',
        timestamp: Date.now(),
        src: image.src,
        element: img,
        originalEvent: e
      });
    });

    parent.appendChild(img);
  }

  /**
   * 渲染表格
   */
  private renderTable(table: TableElement, parent: HTMLElement): void {
    const tableEl = this.createElement('table', `${this.classPrefix}-table`) as HTMLTableElement;

    // 应用表格样式
    Object.assign(tableEl.style, {
      width: table.properties?.width?.type === 'pct'
        ? `${table.properties.width.value}%`
        : table.properties?.width?.value
          ? `${table.properties.width.value * this.scale}px`
          : '100%',
      borderCollapse: 'collapse',
      marginBottom: '10px'
    });

    // 应用表格边框
    if (table.properties?.borders) {
      this.applyTableBorders(tableEl, table.properties.borders);
    }

    // 创建 colgroup
    if (table.grid.length > 0) {
      const colgroup = document.createElement('colgroup');
      for (const col of table.grid) {
        const colEl = document.createElement('col');
        if (col.width > 0) {
          colEl.style.width = `${col.width * this.scale}px`;
        }
        colgroup.appendChild(colEl);
      }
      tableEl.appendChild(colgroup);
    }

    // 创建 tbody
    const tbody = document.createElement('tbody');

    // 渲染行
    for (const row of table.rows) {
      this.renderTableRow(row, tbody, table);
    }

    tableEl.appendChild(tbody);
    parent.appendChild(tableEl);
  }

  /**
   * 渲染表格行
   */
  private renderTableRow(row: TableRowElement, parent: HTMLElement, _table: TableElement): void {
    const tr = document.createElement('tr');
    tr.className = `${this.classPrefix}-table-row`;

    // 应用行高
    if (row.properties?.height) {
      tr.style.height = `${row.properties.height * this.scale}px`;
    }

    // 渲染单元格
    for (const cell of row.cells) {
      this.renderTableCell(cell, tr);
    }

    parent.appendChild(tr);
  }

  /**
   * 渲染表格单元格
   */
  private renderTableCell(cell: TableCellElement, parent: HTMLElement): void {
    const td = document.createElement('td');
    td.className = `${this.classPrefix}-table-cell`;

    // 应用单元格属性
    if (cell.properties?.gridSpan && cell.properties.gridSpan > 1) {
      td.colSpan = cell.properties.gridSpan;
    }

    // 垂直合并
    if (cell.properties?.vMerge === 'continue') {
      return; // 跳过继续合并的单元格
    }

    // 垂直对齐
    if (cell.properties?.vAlign) {
      td.style.verticalAlign = cell.properties.vAlign;
    }

    // 边框
    if (cell.properties?.borders) {
      this.applyCellBorders(td, cell.properties.borders);
    }

    // 底纹
    if (cell.properties?.shading?.fill) {
      td.style.backgroundColor = cell.properties.shading.fill;
    }

    // 内边距
    td.style.padding = '5px';

    // 渲染单元格内容
    for (const content of cell.content) {
      if (content.type === 'paragraph') {
        this.renderParagraph(content, td);
      } else if (content.type === 'table') {
        this.renderTable(content, td);
      }
    }

    parent.appendChild(td);
  }

  /**
   * 应用段落样式
   */
  private applyParagraphStyle(element: HTMLElement, style?: ParagraphStyle): void {
    if (!style) return;

    const cssStyles: Record<string, string> = {
      margin: '0',
      padding: '0'
    };

    // 对齐方式
    if (style.alignment) {
      cssStyles['textAlign'] = style.alignment === 'justify' ? 'justify' : style.alignment;
    }

    // 缩进
    if (style.indentLeft) {
      cssStyles['marginLeft'] = `${style.indentLeft * this.scale}px`;
    }
    if (style.indentRight) {
      cssStyles['marginRight'] = `${style.indentRight * this.scale}px`;
    }
    if (style.indentFirstLine) {
      cssStyles['textIndent'] = `${style.indentFirstLine * this.scale}px`;
    }
    if (style.indentHanging) {
      cssStyles['textIndent'] = `-${style.indentHanging * this.scale}px`;
      cssStyles['paddingLeft'] = `${style.indentHanging * this.scale}px`;
    }

    // 间距
    if (style.spaceBefore) {
      cssStyles['marginTop'] = `${style.spaceBefore * this.scale}px`;
    }
    if (style.spaceAfter) {
      cssStyles['marginBottom'] = `${style.spaceAfter * this.scale}px`;
    }
    if (style.lineSpacing) {
      cssStyles['lineHeight'] = style.lineSpacing.toString();
    }

    // 边框
    if (style.borders) {
      if (style.borders.top) {
        cssStyles['borderTop'] = this.formatBorder(style.borders.top);
      }
      if (style.borders.bottom) {
        cssStyles['borderBottom'] = this.formatBorder(style.borders.bottom);
      }
      if (style.borders.left) {
        cssStyles['borderLeft'] = this.formatBorder(style.borders.left);
      }
      if (style.borders.right) {
        cssStyles['borderRight'] = this.formatBorder(style.borders.right);
      }
    }

    // 底纹 - 忽略 inherit 和透明值
    if (style.shading?.fill && style.shading.fill !== 'inherit' && style.shading.fill !== 'transparent') {
      cssStyles['backgroundColor'] = style.shading.fill;
    }

    // 文字方向
    if (style.direction === 'rtl') {
      cssStyles['direction'] = 'rtl';
    }

    Object.assign(element.style, cssStyles);
  }

  /**
   * 应用字体样式
   */
  private applyFontStyle(element: HTMLElement, style?: FontStyle): void {
    if (!style) return;

    const cssStyles: Record<string, string> = {};

    // 字体
    if (style.name) {
      cssStyles['fontFamily'] = `"${style.name}", sans-serif`;
    }

    // 字号
    if (style.size) {
      cssStyles['fontSize'] = `${UnitConverter.pointsToPixels(style.size) * this.scale}px`;
    }

    // 粗体
    if (style.bold) {
      cssStyles['fontWeight'] = 'bold';
    }

    // 斜体
    if (style.italic) {
      cssStyles['fontStyle'] = 'italic';
    }

    // 下划线
    if (style.underline) {
      cssStyles['textDecoration'] = 'underline';
    }

    // 删除线
    if (style.strike || style.doubleStrike) {
      cssStyles['textDecoration'] = cssStyles['textDecoration']
        ? `${cssStyles['textDecoration']} line-through`
        : 'line-through';
    }

    // 颜色
    if (style.color) {
      cssStyles['color'] = style.color;
    }

    // 高亮
    if (style.highlight) {
      cssStyles['backgroundColor'] = style.highlight;
    }

    // 上标下标
    if (style.vertAlign === 'superscript') {
      cssStyles['verticalAlign'] = 'super';
      cssStyles['fontSize'] = '0.8em';
    } else if (style.vertAlign === 'subscript') {
      cssStyles['verticalAlign'] = 'sub';
      cssStyles['fontSize'] = '0.8em';
    }

    // 字间距
    if (style.spacing) {
      cssStyles['letterSpacing'] = `${style.spacing * this.scale}px`;
    }

    // 小型大写
    if (style.smallCaps) {
      cssStyles['fontVariant'] = 'small-caps';
    }

    // 全部大写
    if (style.allCaps) {
      cssStyles['textTransform'] = 'uppercase';
    }

    Object.assign(element.style, cssStyles);
  }

  /**
   * 应用表格边框
   */
  private applyTableBorders(table: HTMLTableElement, borders: TableElement['properties']): void {
    // 简化处理：应用统一边框
    table.style.border = '1px solid #000';
  }

  /**
   * 应用单元格边框
   */
  private applyCellBorders(cell: HTMLTableCellElement, borders: Record<string, unknown>): void {
    cell.style.border = '1px solid #000';
  }

  /**
   * 格式化边框样式
   */
  private formatBorder(border: { style: string; width: number; color: string }): string {
    const style = border.style === 'single' ? 'solid' : border.style;
    return `${border.width}px ${style} ${border.color}`;
  }

  /**
   * 应用主题样式
   */
  private applyThemeStyles(wrapper: HTMLElement): void {
    Object.assign(wrapper.style, {
      backgroundColor: this.theme.backgroundColor,
      color: this.theme.textColor,
      minHeight: '100%',
      padding: '20px',
      boxSizing: 'border-box'
    });
  }

  /**
   * 计算页数
   */
  private calculatePages(): void {
    this.totalPages = this.pages.length || 1;
  }

  /**
   * 创建元素
   */
  private createElement(tag: string, className?: string): HTMLElement {
    const el = document.createElement(tag);
    if (className) {
      el.className = className;
    }
    return el;
  }

  /**
   * 设置缩放比例
   */
  setScale(scale: number): void {
    const previousScale = this.scale;
    this.scale = Math.max(0.25, Math.min(4, scale));

    if (this.document && this.container) {
      this.render(this.document, this.container);
    }

    this.eventEmitter.emit('scaleChange', {
      type: 'scaleChange',
      timestamp: Date.now(),
      scale: this.scale,
      previousScale
    });
  }

  /**
   * 获取当前缩放比例
   */
  getScale(): number {
    return this.scale;
  }

  /**
   * 设置主题
   */
  setTheme(theme: ThemeConfig): void {
    this.theme = theme;

    if (this.document && this.container) {
      this.render(this.document, this.container);
    }

    this.eventEmitter.emit('themeChange', {
      type: 'themeChange',
      timestamp: Date.now(),
      theme
    });
  }

  /**
   * 获取当前主题
   */
  getTheme(): ThemeConfig {
    return this.theme;
  }

  /**
   * 获取当前页码
   */
  getCurrentPage(): number {
    return this.currentPage;
  }

  /**
   * 获取总页数
   */
  getTotalPages(): number {
    return this.totalPages;
  }

  /**
   * 跳转到指定页
   */
  goToPage(page: number): void {
    const targetPage = Math.max(1, Math.min(this.totalPages, page));

    if (targetPage !== this.currentPage && this.pages[targetPage - 1]) {
      this.currentPage = targetPage;
      this.pages[targetPage - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' });

      this.eventEmitter.emit('pageChange', {
        type: 'pageChange',
        timestamp: Date.now(),
        currentPage: this.currentPage,
        totalPages: this.totalPages
      });
    }
  }

  /**
   * 销毁渲染器
   */
  destroy(): void {
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.pages = [];
    this.document = null;
    this.container = null;
  }
}
