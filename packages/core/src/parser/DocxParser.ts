import JSZip from 'jszip';
import type {
  WordDocument,
  DocumentMetadata,
  SectionElement,
  ParagraphElement,
  RunElement,
  TextElement,
  BreakElement,
  TabElement,
  ImageElement,
  TableElement,
  TableRowElement,
  TableCellElement,
  HyperlinkElement,
  StyleDefinition,
  NumberingDefinition,
  PageSettings,
  ParagraphStyle,
  FontStyle,
  TableProperties,
  TableWidth,
  BorderStyle,
  BorderType,
  Shading,
  ImageData,
  Relationship,
  HeaderElement,
  FooterElement,
  HeaderFooterType,
  FootnoteElement,
  EndnoteElement,
  CommentElement,
  NumberingLevel,
  NumberFormat,
  SectionProperties,
  DefaultStyles
} from '../types';
import { XmlUtils } from '../utils/XmlUtils';
import { UnitConverter } from '../utils/UnitConverter';

/**
 * DOCX 文档解析器
 * 负责将 DOCX 文件解析为结构化的文档对象
 */
export class DocxParser {
  private zip: JSZip | null = null;
  private relationships: Map<string, Relationship> = new Map();
  private documentRelationships: Map<string, Relationship> = new Map();
  private styles: Map<string, StyleDefinition> = new Map();
  private numbering: Map<number, NumberingDefinition> = new Map();
  private abstractNumbering: Map<number, NumberingLevel[]> = new Map();
  private images: Map<string, ImageData> = new Map();
  private footnotes: Map<string, FootnoteElement> = new Map();
  private endnotes: Map<string, EndnoteElement> = new Map();
  private comments: Map<string, CommentElement> = new Map();
  private defaultStyles: DefaultStyles = {};
  private themeColors: Map<string, string> = new Map();

  /**
   * 解析 DOCX 文件
   */
  async parse(file: File | ArrayBuffer | Blob): Promise<WordDocument> {
    // 加载 ZIP 文件
    const data = file instanceof File || file instanceof Blob
      ? await file.arrayBuffer()
      : file;

    this.zip = await JSZip.loadAsync(data);

    // 按顺序解析各部分
    await this.parseRelationships();
    await this.parseTheme();
    await this.parseStyles();
    await this.parseNumbering();
    await this.parseImages();
    await this.parseFootnotes();
    await this.parseEndnotes();
    await this.parseComments();

    // 解析元数据
    const metadata = await this.parseMetadata();

    // 解析文档内容
    const sections = await this.parseDocument();

    return {
      metadata,
      styles: this.styles,
      numbering: this.numbering,
      sections,
      footnotes: this.footnotes,
      endnotes: this.endnotes,
      comments: this.comments,
      images: this.images,
      relationships: this.documentRelationships,
      defaultStyles: this.defaultStyles
    };
  }

  /**
   * 解析关系文件
   */
  private async parseRelationships(): Promise<void> {
    // 解析主关系
    const relsContent = await this.getFileContent('_rels/.rels');
    if (relsContent) {
      const relsDoc = XmlUtils.parseXml(relsContent);
      this.relationships = this.parseRelationshipElements(relsDoc);
    }

    // 解析文档关系
    const docRelsContent = await this.getFileContent('word/_rels/document.xml.rels');
    if (docRelsContent) {
      const docRelsDoc = XmlUtils.parseXml(docRelsContent);
      this.documentRelationships = this.parseRelationshipElements(docRelsDoc);
    }
  }

  /**
   * 解析关系元素
   */
  private parseRelationshipElements(doc: Document): Map<string, Relationship> {
    const relationships = new Map<string, Relationship>();
    const elements = doc.getElementsByTagName('Relationship');

    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      if (!el) continue;

      const id = el.getAttribute('Id') || '';
      const type = el.getAttribute('Type') || '';
      const target = el.getAttribute('Target') || '';
      const targetMode = el.getAttribute('TargetMode') as 'External' | 'Internal' | undefined;

      relationships.set(id, { id, type, target, targetMode });
    }

    return relationships;
  }

  /**
   * 解析主题文件
   */
  private async parseTheme(): Promise<void> {
    const themeContent = await this.getFileContent('word/theme/theme1.xml');
    if (!themeContent) return;

    const themeDoc = XmlUtils.parseXml(themeContent);

    // 解析颜色方案
    const clrScheme = themeDoc.getElementsByTagName('a:clrScheme')[0];
    if (!clrScheme) return;

    // 解析各种主题颜色
    const colorMappings: Record<string, string[]> = {
      'dk1': ['a:dk1'],      // dark1
      'lt1': ['a:lt1'],      // light1
      'dk2': ['a:dk2'],      // dark2
      'lt2': ['a:lt2'],      // light2
      'accent1': ['a:accent1'],
      'accent2': ['a:accent2'],
      'accent3': ['a:accent3'],
      'accent4': ['a:accent4'],
      'accent5': ['a:accent5'],
      'accent6': ['a:accent6'],
      'hlink': ['a:hlink'],  // hyperlink
      'folHlink': ['a:folHlink']  // followed hyperlink
    };

    for (const [colorName, tagNames] of Object.entries(colorMappings)) {
      for (const tagName of tagNames) {
        const colorEl = clrScheme.getElementsByTagName(tagName)[0];
        if (colorEl) {
          const color = this.extractThemeColor(colorEl);
          if (color) {
            this.themeColors.set(colorName, color);
            // 也添加完整名称的映射
            if (colorName === 'dk1') this.themeColors.set('dark1', color);
            if (colorName === 'lt1') this.themeColors.set('light1', color);
            if (colorName === 'dk2') this.themeColors.set('dark2', color);
            if (colorName === 'lt2') this.themeColors.set('light2', color);
            if (colorName === 'hlink') this.themeColors.set('hyperlink', color);
            if (colorName === 'folHlink') this.themeColors.set('followedHyperlink', color);
          }
        }
      }
    }
  }

  /**
   * 从主题颜色元素中提取颜色值
   */
  private extractThemeColor(colorEl: Element): string | null {
    // 尝试获取 srgbClr (RGB颜色)
    const srgbClr = colorEl.getElementsByTagName('a:srgbClr')[0];
    if (srgbClr) {
      const val = srgbClr.getAttribute('val');
      if (val) return `#${val}`;
    }

    // 尝试获取 sysClr (系统颜色)
    const sysClr = colorEl.getElementsByTagName('a:sysClr')[0];
    if (sysClr) {
      const lastClr = sysClr.getAttribute('lastClr');
      if (lastClr) return `#${lastClr}`;
    }

    return null;
  }

  /**
   * 解析样式
   */
  private async parseStyles(): Promise<void> {
    const stylesContent = await this.getFileContent('word/styles.xml');
    if (!stylesContent) return;

    const stylesDoc = XmlUtils.parseXml(stylesContent);

    // 解析默认样式
    const docDefaults = XmlUtils.getElement(stylesDoc, 'w:docDefaults');
    if (docDefaults) {
      const rPrDefault = XmlUtils.getElement(docDefaults, 'w:rPrDefault');
      const pPrDefault = XmlUtils.getElement(docDefaults, 'w:pPrDefault');

      if (rPrDefault) {
        const rPr = XmlUtils.getElement(rPrDefault, 'w:rPr');
        if (rPr) {
          this.defaultStyles.character = this.parseFontStyle(rPr);
        }
      }

      if (pPrDefault) {
        const pPr = XmlUtils.getElement(pPrDefault, 'w:pPr');
        if (pPr) {
          this.defaultStyles.paragraph = this.parseParagraphStyle(pPr);
        }
      }
    }

    // 解析样式定义
    const styleElements = stylesDoc.getElementsByTagName('w:style');

    for (let i = 0; i < styleElements.length; i++) {
      const styleEl = styleElements[i];
      if (!styleEl) continue;

      const style = this.parseStyleElement(styleEl);
      if (style) {
        this.styles.set(style.id, style);
      }
    }
  }

  /**
   * 解析单个样式元素
   */
  private parseStyleElement(el: Element): StyleDefinition | null {
    const id = el.getAttribute('w:styleId');
    if (!id) return null;

    const type = el.getAttribute('w:type') as StyleDefinition['type'];
    const isDefault = el.getAttribute('w:default') === '1';

    const nameEl = XmlUtils.getElement(el, 'w:name');
    const basedOnEl = XmlUtils.getElement(el, 'w:basedOn');
    const nextEl = XmlUtils.getElement(el, 'w:next');
    const linkEl = XmlUtils.getElement(el, 'w:link');

    const style: StyleDefinition = {
      id,
      name: nameEl?.getAttribute('w:val') || id,
      type,
      basedOn: basedOnEl?.getAttribute('w:val') || undefined,
      next: nextEl?.getAttribute('w:val') || undefined,
      link: linkEl?.getAttribute('w:val') || undefined,
      isDefault
    };

    // 解析段落属性
    const pPr = XmlUtils.getElement(el, 'w:pPr');
    if (pPr) {
      style.paragraphStyle = this.parseParagraphStyle(pPr);
    }

    // 解析字符属性
    const rPr = XmlUtils.getElement(el, 'w:rPr');
    if (rPr) {
      style.fontStyle = this.parseFontStyle(rPr);
    }

    // 解析表格属性
    const tblPr = XmlUtils.getElement(el, 'w:tblPr');
    if (tblPr) {
      style.tableStyle = this.parseTableProperties(tblPr);
    }

    return style;
  }

  /**
   * 解析样式继承链，返回合并后的样式
   */
  private resolveStyle(styleId: string, visited: Set<string> = new Set()): {
    paragraphStyle?: ParagraphStyle;
    fontStyle?: FontStyle;
  } {
    // 防止循环引用
    if (visited.has(styleId)) return {};
    visited.add(styleId);

    const styleDef = this.styles.get(styleId);
    if (!styleDef) return {};

    let result: { paragraphStyle?: ParagraphStyle; fontStyle?: FontStyle } = {};

    // 先解析基础样式
    if (styleDef.basedOn) {
      const baseResult = this.resolveStyle(styleDef.basedOn, visited);
      if (baseResult.paragraphStyle) {
        result.paragraphStyle = { ...baseResult.paragraphStyle };
      }
      if (baseResult.fontStyle) {
        result.fontStyle = { ...baseResult.fontStyle };
      }
    }

    // 合并当前样式
    if (styleDef.paragraphStyle) {
      result.paragraphStyle = { ...result.paragraphStyle, ...styleDef.paragraphStyle };
    }
    if (styleDef.fontStyle) {
      result.fontStyle = { ...result.fontStyle, ...styleDef.fontStyle };
    }

    return result;
  }

  /**
   * 解析编号定义
   */
  private async parseNumbering(): Promise<void> {
    const numberingContent = await this.getFileContent('word/numbering.xml');
    if (!numberingContent) return;

    const numberingDoc = XmlUtils.parseXml(numberingContent);

    // 解析抽象编号
    const abstractNumElements = numberingDoc.getElementsByTagName('w:abstractNum');
    for (let i = 0; i < abstractNumElements.length; i++) {
      const abstractNumEl = abstractNumElements[i];
      if (!abstractNumEl) continue;

      const abstractNumId = parseInt(abstractNumEl.getAttribute('w:abstractNumId') || '0', 10);
      const levels = this.parseNumberingLevels(abstractNumEl);
      this.abstractNumbering.set(abstractNumId, levels);
    }

    // 解析编号实例
    const numElements = numberingDoc.getElementsByTagName('w:num');
    for (let i = 0; i < numElements.length; i++) {
      const numEl = numElements[i];
      if (!numEl) continue;

      const numId = parseInt(numEl.getAttribute('w:numId') || '0', 10);
      const abstractNumIdEl = XmlUtils.getElement(numEl, 'w:abstractNumId');
      const abstractNumId = parseInt(abstractNumIdEl?.getAttribute('w:val') || '0', 10);

      const levels = this.abstractNumbering.get(abstractNumId) || [];

      this.numbering.set(numId, {
        numId,
        abstractNumId,
        levels
      });
    }
  }

  /**
   * 解析编号级别
   */
  private parseNumberingLevels(abstractNumEl: Element): NumberingLevel[] {
    const levels: NumberingLevel[] = [];
    const lvlElements = abstractNumEl.getElementsByTagName('w:lvl');

    for (let i = 0; i < lvlElements.length; i++) {
      const lvlEl = lvlElements[i];
      if (!lvlEl) continue;

      const level = parseInt(lvlEl.getAttribute('w:ilvl') || '0', 10);

      const startEl = XmlUtils.getElement(lvlEl, 'w:start');
      const numFmtEl = XmlUtils.getElement(lvlEl, 'w:numFmt');
      const lvlTextEl = XmlUtils.getElement(lvlEl, 'w:lvlText');
      const lvlJcEl = XmlUtils.getElement(lvlEl, 'w:lvlJc');
      const suffEl = XmlUtils.getElement(lvlEl, 'w:suff');

      const pPr = XmlUtils.getElement(lvlEl, 'w:pPr');
      const rPr = XmlUtils.getElement(lvlEl, 'w:rPr');

      levels.push({
        level,
        format: (numFmtEl?.getAttribute('w:val') as NumberFormat) || 'decimal',
        text: lvlTextEl?.getAttribute('w:val') || '',
        alignment: lvlJcEl?.getAttribute('w:val') as 'left' | 'center' | 'right' | undefined,
        start: parseInt(startEl?.getAttribute('w:val') || '1', 10),
        suffix: suffEl?.getAttribute('w:val') as 'tab' | 'space' | 'nothing' | undefined,
        paragraphStyle: pPr ? this.parseParagraphStyle(pPr) : undefined,
        fontStyle: rPr ? this.parseFontStyle(rPr) : undefined
      });
    }

    return levels;
  }

  /**
   * 解析图片
   */
  private async parseImages(): Promise<void> {
    if (!this.zip) return;

    // 遍历 word/media 目录
    const mediaFolder = this.zip.folder('word/media');
    if (!mediaFolder) return;

    const files = Object.keys(this.zip.files).filter(name => name.startsWith('word/media/'));

    for (const fileName of files) {
      const file = this.zip.file(fileName);
      if (!file) continue;

      const data = await file.async('arraybuffer');
      const contentType = this.getContentType(fileName);
      const id = fileName.replace('word/media/', '');

      this.images.set(id, {
        id,
        data,
        contentType
      });
    }
  }

  /**
   * 获取文件内容类型
   */
  private getContentType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const contentTypes: Record<string, string> = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'bmp': 'image/bmp',
      'tiff': 'image/tiff',
      'wmf': 'image/x-wmf',
      'emf': 'image/x-emf',
      'svg': 'image/svg+xml'
    };
    return contentTypes[ext || ''] || 'application/octet-stream';
  }

  /**
   * 解析脚注
   */
  private async parseFootnotes(): Promise<void> {
    const footnotesContent = await this.getFileContent('word/footnotes.xml');
    if (!footnotesContent) return;

    const footnotesDoc = XmlUtils.parseXml(footnotesContent);
    const footnoteElements = footnotesDoc.getElementsByTagName('w:footnote');

    for (let i = 0; i < footnoteElements.length; i++) {
      const footnoteEl = footnoteElements[i];
      if (!footnoteEl) continue;

      const id = footnoteEl.getAttribute('w:id');
      if (!id || id === '0' || id === '-1') continue; // 跳过分隔符和延续符

      const paragraphs = this.parseParagraphs(footnoteEl);

      this.footnotes.set(id, {
        type: 'footnote',
        id,
        content: paragraphs
      });
    }
  }

  /**
   * 解析尾注
   */
  private async parseEndnotes(): Promise<void> {
    const endnotesContent = await this.getFileContent('word/endnotes.xml');
    if (!endnotesContent) return;

    const endnotesDoc = XmlUtils.parseXml(endnotesContent);
    const endnoteElements = endnotesDoc.getElementsByTagName('w:endnote');

    for (let i = 0; i < endnoteElements.length; i++) {
      const endnoteEl = endnoteElements[i];
      if (!endnoteEl) continue;

      const id = endnoteEl.getAttribute('w:id');
      if (!id || id === '0' || id === '-1') continue;

      const paragraphs = this.parseParagraphs(endnoteEl);

      this.endnotes.set(id, {
        type: 'endnote',
        id,
        content: paragraphs
      });
    }
  }

  /**
   * 解析批注
   */
  private async parseComments(): Promise<void> {
    const commentsContent = await this.getFileContent('word/comments.xml');
    if (!commentsContent) return;

    const commentsDoc = XmlUtils.parseXml(commentsContent);
    const commentElements = commentsDoc.getElementsByTagName('w:comment');

    for (let i = 0; i < commentElements.length; i++) {
      const commentEl = commentElements[i];
      if (!commentEl) continue;

      const id = commentEl.getAttribute('w:id');
      if (!id) continue;

      const author = commentEl.getAttribute('w:author') || undefined;
      const dateStr = commentEl.getAttribute('w:date');
      const initials = commentEl.getAttribute('w:initials') || undefined;

      const paragraphs = this.parseParagraphs(commentEl);

      this.comments.set(id, {
        type: 'comment',
        id,
        author,
        date: dateStr ? new Date(dateStr) : undefined,
        initials,
        content: paragraphs
      });
    }
  }

  /**
   * 解析元数据
   */
  private async parseMetadata(): Promise<DocumentMetadata> {
    const coreContent = await this.getFileContent('docProps/core.xml');
    const appContent = await this.getFileContent('docProps/app.xml');

    const metadata: DocumentMetadata = {};

    if (coreContent) {
      const coreDoc = XmlUtils.parseXml(coreContent);

      metadata.title = XmlUtils.getTextContent(coreDoc, 'dc:title') || undefined;
      metadata.subject = XmlUtils.getTextContent(coreDoc, 'dc:subject') || undefined;
      metadata.creator = XmlUtils.getTextContent(coreDoc, 'dc:creator') || undefined;
      metadata.keywords = XmlUtils.getTextContent(coreDoc, 'cp:keywords') || undefined;
      metadata.description = XmlUtils.getTextContent(coreDoc, 'dc:description') || undefined;
      metadata.lastModifiedBy = XmlUtils.getTextContent(coreDoc, 'cp:lastModifiedBy') || undefined;
      metadata.revision = XmlUtils.getTextContent(coreDoc, 'cp:revision') || undefined;

      const created = XmlUtils.getTextContent(coreDoc, 'dcterms:created');
      const modified = XmlUtils.getTextContent(coreDoc, 'dcterms:modified');

      if (created) metadata.created = new Date(created);
      if (modified) metadata.modified = new Date(modified);
    }

    if (appContent) {
      const appDoc = XmlUtils.parseXml(appContent);
      metadata.category = XmlUtils.getTextContent(appDoc, 'Category') || undefined;
      metadata.version = XmlUtils.getTextContent(appDoc, 'AppVersion') || undefined;
    }

    return metadata;
  }

  /**
   * 解析文档内容
   */
  private async parseDocument(): Promise<SectionElement[]> {
    const documentContent = await this.getFileContent('word/document.xml');
    if (!documentContent) {
      throw new Error('无法找到文档内容');
    }

    const documentDoc = XmlUtils.parseXml(documentContent);
    const body = XmlUtils.getElement(documentDoc, 'w:body');

    if (!body) {
      throw new Error('无法找到文档主体');
    }

    return this.parseSections(body);
  }

  /**
   * 解析节
   */
  private parseSections(body: Element): SectionElement[] {
    const sections: SectionElement[] = [];
    const children = Array.from(body.children);

    let currentContent: (ParagraphElement | TableElement)[] = [];
    let sectionIndex = 0;

    for (const child of children) {
      if (child.tagName === 'w:p') {
        // 检查是否有节属性
        const sectPr = XmlUtils.getElement(child, 'w:pPr', 'w:sectPr');

        if (sectPr) {
          // 解析当前段落
          const paragraph = this.parseParagraph(child);
          if (paragraph) {
            currentContent.push(paragraph);
          }

          // 创建新节
          const section = this.createSection(sectPr, currentContent, sectionIndex++);
          sections.push(section);
          currentContent = [];
        } else {
          const paragraph = this.parseParagraph(child);
          if (paragraph) {
            currentContent.push(paragraph);
          }
        }
      } else if (child.tagName === 'w:tbl') {
        const table = this.parseTable(child);
        if (table) {
          currentContent.push(table);
        }
      } else if (child.tagName === 'w:sectPr') {
        // 文档末尾的节属性
        const section = this.createSection(child, currentContent, sectionIndex++);
        sections.push(section);
        currentContent = [];
      }
    }

    // 如果还有剩余内容，创建默认节
    if (currentContent.length > 0) {
      sections.push({
        type: 'section',
        properties: {
          pageSettings: this.getDefaultPageSettings()
        },
        content: currentContent
      });
    }

    // 如果没有节，创建一个空节
    if (sections.length === 0) {
      sections.push({
        type: 'section',
        properties: {
          pageSettings: this.getDefaultPageSettings()
        },
        content: []
      });
    }

    return sections;
  }

  /**
   * 创建节
   */
  private createSection(
    sectPr: Element,
    content: (ParagraphElement | TableElement)[],
    _index: number
  ): SectionElement {
    const properties = this.parseSectionProperties(sectPr);

    const section: SectionElement = {
      type: 'section',
      properties,
      content
    };

    // 解析页眉页脚引用
    const headerRefs = sectPr.getElementsByTagName('w:headerReference');
    const footerRefs = sectPr.getElementsByTagName('w:footerReference');

    if (headerRefs.length > 0) {
      section.headers = new Map();
      // 异步加载页眉内容会在后续处理
    }

    if (footerRefs.length > 0) {
      section.footers = new Map();
      // 异步加载页脚内容会在后续处理
    }

    return section;
  }

  /**
   * 解析节属性
   */
  private parseSectionProperties(sectPr: Element): SectionProperties {
    const pgSz = XmlUtils.getElement(sectPr, 'w:pgSz');
    const pgMar = XmlUtils.getElement(sectPr, 'w:pgMar');
    const cols = XmlUtils.getElement(sectPr, 'w:cols');
    const typeEl = XmlUtils.getElement(sectPr, 'w:type');
    const titlePg = XmlUtils.getElement(sectPr, 'w:titlePg');
    const pgNumType = XmlUtils.getElement(sectPr, 'w:pgNumType');

    const orientation = pgSz?.getAttribute('w:orient') === 'landscape' ? 'landscape' : 'portrait';

    const pageSettings: PageSettings = {
      width: UnitConverter.twipsToPixels(parseInt(pgSz?.getAttribute('w:w') || '12240', 10)),
      height: UnitConverter.twipsToPixels(parseInt(pgSz?.getAttribute('w:h') || '15840', 10)),
      marginTop: UnitConverter.twipsToPixels(parseInt(pgMar?.getAttribute('w:top') || '1440', 10)),
      marginBottom: UnitConverter.twipsToPixels(parseInt(pgMar?.getAttribute('w:bottom') || '1440', 10)),
      marginLeft: UnitConverter.twipsToPixels(parseInt(pgMar?.getAttribute('w:left') || '1800', 10)),
      marginRight: UnitConverter.twipsToPixels(parseInt(pgMar?.getAttribute('w:right') || '1800', 10)),
      headerDistance: UnitConverter.twipsToPixels(parseInt(pgMar?.getAttribute('w:header') || '720', 10)),
      footerDistance: UnitConverter.twipsToPixels(parseInt(pgMar?.getAttribute('w:footer') || '720', 10)),
      orientation,
      columns: parseInt(cols?.getAttribute('w:num') || '1', 10),
      columnSpace: UnitConverter.twipsToPixels(parseInt(cols?.getAttribute('w:space') || '720', 10))
    };

    return {
      pageSettings,
      type: typeEl?.getAttribute('w:val') as SectionProperties['type'],
      titlePage: !!titlePg,
      pageNumberStart: pgNumType ? parseInt(pgNumType.getAttribute('w:start') || '1', 10) : undefined
    };
  }

  /**
   * 获取默认页面设置
   */
  private getDefaultPageSettings(): PageSettings {
    return {
      width: UnitConverter.twipsToPixels(12240), // 8.5 inches
      height: UnitConverter.twipsToPixels(15840), // 11 inches
      marginTop: UnitConverter.twipsToPixels(1440), // 1 inch
      marginBottom: UnitConverter.twipsToPixels(1440),
      marginLeft: UnitConverter.twipsToPixels(1800), // 1.25 inches
      marginRight: UnitConverter.twipsToPixels(1800),
      headerDistance: UnitConverter.twipsToPixels(720),
      footerDistance: UnitConverter.twipsToPixels(720),
      orientation: 'portrait',
      columns: 1,
      columnSpace: UnitConverter.twipsToPixels(720)
    };
  }

  /**
   * 解析多个段落
   */
  private parseParagraphs(parent: Element): ParagraphElement[] {
    const paragraphs: ParagraphElement[] = [];
    const pElements = parent.getElementsByTagName('w:p');

    for (let i = 0; i < pElements.length; i++) {
      const pEl = pElements[i];
      if (!pEl) continue;

      const paragraph = this.parseParagraph(pEl);
      if (paragraph) {
        paragraphs.push(paragraph);
      }
    }

    return paragraphs;
  }

  /**
   * 解析段落
   */
  private parseParagraph(p: Element): ParagraphElement | null {
    const pPr = XmlUtils.getElement(p, 'w:pPr');
    const runs = this.parseRuns(p);

    const paragraph: ParagraphElement = {
      type: 'paragraph',
      runs
    };

    if (pPr) {
      // 获取段落样式引用
      const pStyleEl = XmlUtils.getElement(pPr, 'w:pStyle');
      const styleId = pStyleEl?.getAttribute('w:val');

      // 获取继承的样式
      let baseStyle: ParagraphStyle = { ...this.defaultStyles.paragraph };
      let baseFontStyle: FontStyle = { ...this.defaultStyles.character };

      if (styleId) {
        const resolvedStyle = this.resolveStyle(styleId);
        if (resolvedStyle.paragraphStyle) {
          baseStyle = { ...baseStyle, ...resolvedStyle.paragraphStyle };
        }
        if (resolvedStyle.fontStyle) {
          baseFontStyle = { ...baseFontStyle, ...resolvedStyle.fontStyle };
        }
      }

      // 解析直接定义的段落样式（覆盖继承的样式）
      const directStyle = this.parseParagraphStyle(pPr);
      // 只合并已定义的属性，避免 undefined 覆盖有效值
      paragraph.style = { ...baseStyle };
      for (const [key, value] of Object.entries(directStyle)) {
        if (value !== undefined) {
          (paragraph.style as Record<string, unknown>)[key] = value;
        }
      }

      // 将字体样式也应用到 runs
      if (Object.keys(baseFontStyle).length > 0) {
        for (const run of runs) {
          run.style = { ...baseFontStyle, ...run.style };
        }
      }

      // 解析编号
      const numPr = XmlUtils.getElement(pPr, 'w:numPr');
      if (numPr) {
        const numIdEl = XmlUtils.getElement(numPr, 'w:numId');
        const ilvlEl = XmlUtils.getElement(numPr, 'w:ilvl');

        if (numIdEl) {
          paragraph.numbering = {
            numId: parseInt(numIdEl.getAttribute('w:val') || '0', 10),
            level: parseInt(ilvlEl?.getAttribute('w:val') || '0', 10)
          };
        }
      }
    }

    // 解析书签
    const bookmarkStarts = p.getElementsByTagName('w:bookmarkStart');
    const bookmarkEnds = p.getElementsByTagName('w:bookmarkEnd');

    if (bookmarkStarts.length > 0) {
      paragraph.bookmarkStart = [];
      for (let i = 0; i < bookmarkStarts.length; i++) {
        const bs = bookmarkStarts[i];
        if (!bs) continue;
        paragraph.bookmarkStart.push({
          id: bs.getAttribute('w:id') || '',
          name: bs.getAttribute('w:name') || ''
        });
      }
    }

    if (bookmarkEnds.length > 0) {
      paragraph.bookmarkEnd = [];
      for (let i = 0; i < bookmarkEnds.length; i++) {
        const be = bookmarkEnds[i];
        if (!be) continue;
        const id = be.getAttribute('w:id');
        if (id) paragraph.bookmarkEnd.push(id);
      }
    }

    return paragraph;
  }

  /**
   * 解析段落样式
   */
  private parseParagraphStyle(pPr: Element): ParagraphStyle {
    const style: ParagraphStyle = {};

    // 对齐方式
    const jc = XmlUtils.getElement(pPr, 'w:jc');
    if (jc) {
      const val = jc.getAttribute('w:val');
      if (val === 'both') {
        style.alignment = 'justify';
      } else {
        style.alignment = val as ParagraphStyle['alignment'];
      }
    }

    // 缩进
    const ind = XmlUtils.getElement(pPr, 'w:ind');
    if (ind) {
      const left = ind.getAttribute('w:left') || ind.getAttribute('w:start');
      const right = ind.getAttribute('w:right') || ind.getAttribute('w:end');
      const firstLine = ind.getAttribute('w:firstLine');
      const hanging = ind.getAttribute('w:hanging');

      if (left) style.indentLeft = UnitConverter.twipsToPixels(parseInt(left, 10));
      if (right) style.indentRight = UnitConverter.twipsToPixels(parseInt(right, 10));
      if (firstLine) style.indentFirstLine = UnitConverter.twipsToPixels(parseInt(firstLine, 10));
      if (hanging) style.indentHanging = UnitConverter.twipsToPixels(parseInt(hanging, 10));
    }

    // 间距
    const spacing = XmlUtils.getElement(pPr, 'w:spacing');
    if (spacing) {
      const before = spacing.getAttribute('w:before');
      const after = spacing.getAttribute('w:after');
      const line = spacing.getAttribute('w:line');
      const lineRule = spacing.getAttribute('w:lineRule');

      if (before) style.spaceBefore = UnitConverter.twipsToPixels(parseInt(before, 10));
      if (after) style.spaceAfter = UnitConverter.twipsToPixels(parseInt(after, 10));
      if (line) style.lineSpacing = parseInt(line, 10) / 240; // 转换为倍数
      if (lineRule) style.lineSpacingType = lineRule as ParagraphStyle['lineSpacingType'];
    }

    // 分页控制
    const keepNext = XmlUtils.getElement(pPr, 'w:keepNext');
    const keepLines = XmlUtils.getElement(pPr, 'w:keepLines');
    const pageBreakBefore = XmlUtils.getElement(pPr, 'w:pageBreakBefore');
    const widowControl = XmlUtils.getElement(pPr, 'w:widowControl');

    if (keepNext) style.keepNext = true;
    if (keepLines) style.keepLines = true;
    if (pageBreakBefore) style.pageBreakBefore = true;
    if (widowControl) style.widowControl = widowControl.getAttribute('w:val') !== '0';

    // 大纲级别
    const outlineLvl = XmlUtils.getElement(pPr, 'w:outlineLvl');
    if (outlineLvl) {
      style.outlineLevel = parseInt(outlineLvl.getAttribute('w:val') || '9', 10);
    }

    // 边框
    const pBdr = XmlUtils.getElement(pPr, 'w:pBdr');
    if (pBdr) {
      style.borders = {};
      const sides = ['top', 'bottom', 'left', 'right', 'between', 'bar'] as const;

      for (const side of sides) {
        const borderEl = XmlUtils.getElement(pBdr, `w:${side}`);
        if (borderEl) {
          style.borders[side] = this.parseBorder(borderEl);
        }
      }
    }

    // 底纹
    const shd = XmlUtils.getElement(pPr, 'w:shd');
    if (shd) {
      style.shading = this.parseShading(shd);
    }

    // 文字方向
    const bidi = XmlUtils.getElement(pPr, 'w:bidi');
    if (bidi) {
      style.direction = bidi.getAttribute('w:val') === '0' ? 'ltr' : 'rtl';
    }

    return style;
  }

  /**
   * 解析边框
   */
  private parseBorder(borderEl: Element): BorderStyle {
    return {
      style: (borderEl.getAttribute('w:val') as BorderType) || 'single',
      width: UnitConverter.eighthPointsToPixels(parseInt(borderEl.getAttribute('w:sz') || '4', 10)),
      color: this.parseColor(borderEl.getAttribute('w:color') || '000000'),
      space: borderEl.getAttribute('w:space') ? parseInt(borderEl.getAttribute('w:space') || '0', 10) : undefined,
      shadow: borderEl.getAttribute('w:shadow') === 'true'
    };
  }

  /**
   * 解析底纹
   */
  private parseShading(shd: Element): Shading | undefined {
    const fill = shd.getAttribute('w:fill');
    const color = shd.getAttribute('w:color');
    const pattern = shd.getAttribute('w:val');

    // 如果 fill 是 auto 或 FFFFFF（白色），不返回 shading（保持透明）
    if (!fill || fill === 'auto' || fill.toUpperCase() === 'FFFFFF') {
      return undefined;
    }

    return {
      fill: this.parseColor(fill),
      color: color ? this.parseColor(color) : undefined,
      pattern: pattern as Shading['pattern']
    };
  }

  /**
   * 解析颜色值
   */
  private parseColor(color: string): string {
    if (color === 'auto') return 'inherit';
    if (color.startsWith('#')) return color;
    if (/^[0-9A-Fa-f]{6}$/.test(color)) return `#${color}`;
    return color;
  }

  /**
   * 解析运行元素列表
   */
  private parseRuns(parent: Element): RunElement[] {
    const runs: RunElement[] = [];
    const children = Array.from(parent.children);

    for (const child of children) {
      if (child.tagName === 'w:r') {
        const run = this.parseRun(child);
        if (run) runs.push(run);
      } else if (child.tagName === 'w:hyperlink') {
        const hyperlink = this.parseHyperlink(child);
        if (hyperlink) {
          // 将超链接的运行添加到列表
          for (const run of hyperlink.runs) {
            runs.push(run);
          }
        }
      }
    }

    return runs;
  }

  /**
   * 解析运行元素
   */
  private parseRun(r: Element): RunElement | null {
    const rPr = XmlUtils.getElement(r, 'w:rPr');
    const children = this.parseRunChildren(r);

    if (children.length === 0) return null;

    const run: RunElement = {
      type: 'run',
      children
    };

    if (rPr) {
      run.style = this.parseFontStyle(rPr);
    }

    return run;
  }

  /**
   * 解析运行子元素
   */
  private parseRunChildren(r: Element): RunElement['children'] {
    const children: RunElement['children'] = [];

    for (const child of Array.from(r.children)) {
      switch (child.tagName) {
        case 'w:t':
          children.push({
            type: 'text',
            text: child.textContent || ''
          } as TextElement);
          break;

        case 'w:br':
          const breakType = child.getAttribute('w:type');
          children.push({
            type: 'break',
            breakType: breakType === 'page' ? 'page' : breakType === 'column' ? 'column' : 'line',
            clear: child.getAttribute('w:clear') as BreakElement['clear']
          } as BreakElement);
          break;

        case 'w:tab':
          children.push({ type: 'tab' } as TabElement);
          break;

        case 'w:drawing':
          const image = this.parseDrawing(child);
          if (image) children.push(image);
          break;

        case 'w:pict':
          const pictImage = this.parsePict(child);
          if (pictImage) children.push(pictImage);
          break;
      }
    }

    return children;
  }

  /**
   * 解析字体样式
   */
  private parseFontStyle(rPr: Element): FontStyle {
    const style: FontStyle = {};

    // 字体名称
    const rFonts = XmlUtils.getElement(rPr, 'w:rFonts');
    if (rFonts) {
      style.name = rFonts.getAttribute('w:ascii') ||
        rFonts.getAttribute('w:hAnsi') ||
        rFonts.getAttribute('w:eastAsia') ||
        rFonts.getAttribute('w:cs') ||
        undefined;
    }

    // 字体大小
    const sz = XmlUtils.getElement(rPr, 'w:sz');
    if (sz) {
      style.size = parseInt(sz.getAttribute('w:val') || '24', 10) / 2; // 半点转换为点
    }

    // 粗体
    const b = XmlUtils.getElement(rPr, 'w:b');
    if (b) {
      style.bold = b.getAttribute('w:val') !== '0';
    }

    // 斜体
    const i = XmlUtils.getElement(rPr, 'w:i');
    if (i) {
      style.italic = i.getAttribute('w:val') !== '0';
    }

    // 下划线
    const u = XmlUtils.getElement(rPr, 'w:u');
    if (u) {
      const val = u.getAttribute('w:val');
      if (val && val !== 'none') {
        style.underline = val as FontStyle['underline'];
      }
    }

    // 删除线
    const strike = XmlUtils.getElement(rPr, 'w:strike');
    if (strike) {
      style.strike = strike.getAttribute('w:val') !== '0';
    }

    // 双删除线
    const dstrike = XmlUtils.getElement(rPr, 'w:dstrike');
    if (dstrike) {
      style.doubleStrike = dstrike.getAttribute('w:val') !== '0';
    }

    // 颜色 - 支持主题颜色
    const color = XmlUtils.getElement(rPr, 'w:color');
    if (color) {
      const themeColor = color.getAttribute('w:themeColor');
      const colorVal = color.getAttribute('w:val');
      if (themeColor) {
        style.color = this.parseThemeColor(themeColor, color.getAttribute('w:themeShade'), color.getAttribute('w:themeTint'));
      } else if (colorVal) {
        style.color = this.parseColor(colorVal);
      }
    }

    // 高亮
    const highlight = XmlUtils.getElement(rPr, 'w:highlight');
    if (highlight) {
      style.highlight = this.parseHighlightColor(highlight.getAttribute('w:val') || '');
    }

    // 上标下标
    const vertAlign = XmlUtils.getElement(rPr, 'w:vertAlign');
    if (vertAlign) {
      style.vertAlign = vertAlign.getAttribute('w:val') as FontStyle['vertAlign'];
    }

    // 字间距
    const spacing = XmlUtils.getElement(rPr, 'w:spacing');
    if (spacing) {
      style.spacing = UnitConverter.twipsToPixels(parseInt(spacing.getAttribute('w:val') || '0', 10));
    }

    // 小型大写
    const smallCaps = XmlUtils.getElement(rPr, 'w:smallCaps');
    if (smallCaps) {
      style.smallCaps = smallCaps.getAttribute('w:val') !== '0';
    }

    // 全部大写
    const caps = XmlUtils.getElement(rPr, 'w:caps');
    if (caps) {
      style.allCaps = caps.getAttribute('w:val') !== '0';
    }

    return style;
  }

  /**
   * 解析主题颜色
   */
  private parseThemeColor(themeColor: string, shade?: string | null, tint?: string | null): string {
    // 优先使用从 theme1.xml 解析的颜色
    let baseColor = this.themeColors.get(themeColor);

    // 如果没有找到，使用默认 Office 主题颜色
    if (!baseColor) {
      const defaultColors: Record<string, string> = {
        'dark1': '#000000',
        'light1': '#ffffff',
        'dark2': '#44546a',
        'light2': '#e7e6e6',
        'accent1': '#4472c4',
        'accent2': '#ed7d31',
        'accent3': '#a5a5a5',
        'accent4': '#ffc000',
        'accent5': '#5b9bd5',
        'accent6': '#70ad47',
        'hyperlink': '#0563c1',
        'followedHyperlink': '#954f72',
        'text1': '#000000',
        'text2': '#44546a',
        'background1': '#ffffff',
        'background2': '#e7e6e6'
      };
      baseColor = defaultColors[themeColor] || '#000000';
    }

    // 应用深浅色调整
    if (shade || tint) {
      baseColor = this.applyColorModifier(baseColor, shade, tint);
    }

    return baseColor;
  }

  /**
   * 应用颜色修改器（shade/tint）
   */
  private applyColorModifier(color: string, shade?: string | null, tint?: string | null): string {
    // 解析基础颜色
    const hex = color.replace('#', '');
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    if (shade) {
      // shade 使颜色变深
      const factor = parseInt(shade, 16) / 255;
      r = Math.round(r * factor);
      g = Math.round(g * factor);
      b = Math.round(b * factor);
    }

    if (tint) {
      // tint 使颜色变浅
      const factor = parseInt(tint, 16) / 255;
      r = Math.round(r + (255 - r) * (1 - factor));
      g = Math.round(g + (255 - g) * (1 - factor));
      b = Math.round(b + (255 - b) * (1 - factor));
    }

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  /**
   * 解析高亮颜色
   */
  private parseHighlightColor(color: string): string {
    const highlightColors: Record<string, string> = {
      'yellow': '#ffff00',
      'green': '#00ff00',
      'cyan': '#00ffff',
      'magenta': '#ff00ff',
      'blue': '#0000ff',
      'red': '#ff0000',
      'darkBlue': '#000080',
      'darkCyan': '#008080',
      'darkGreen': '#008000',
      'darkMagenta': '#800080',
      'darkRed': '#800000',
      'darkYellow': '#808000',
      'darkGray': '#808080',
      'lightGray': '#c0c0c0',
      'black': '#000000',
      'white': '#ffffff'
    };
    return highlightColors[color] || color;
  }

  /**
   * 解析超链接
   */
  private parseHyperlink(hyperlink: Element): HyperlinkElement | null {
    const rId = hyperlink.getAttribute('r:id');
    const anchor = hyperlink.getAttribute('w:anchor');
    const tooltip = hyperlink.getAttribute('w:tooltip');

    let href: string | undefined;

    if (rId) {
      const rel = this.documentRelationships.get(rId);
      if (rel) {
        href = rel.target;
      }
    }

    const runs: RunElement[] = [];
    const rElements = hyperlink.getElementsByTagName('w:r');

    for (let i = 0; i < rElements.length; i++) {
      const rEl = rElements[i];
      if (!rEl) continue;

      const run = this.parseRun(rEl);
      if (run) {
        // 添加超链接样式
        if (!run.style) run.style = {};
        run.style.color = '#0066cc';
        run.style.underline = 'single';
        runs.push(run);
      }
    }

    if (runs.length === 0) return null;

    return {
      type: 'hyperlink',
      href,
      anchor: anchor || undefined,
      tooltip: tooltip || undefined,
      runs
    };
  }

  /**
   * 解析绘图元素
   */
  private parseDrawing(drawing: Element): ImageElement | null {
    // 尝试解析内联图片
    const inline = XmlUtils.getElement(drawing, 'wp:inline');
    const anchor = XmlUtils.getElement(drawing, 'wp:anchor');

    const container = inline || anchor;
    if (!container) return null;

    // 获取尺寸
    const extent = XmlUtils.getElement(container, 'wp:extent');
    const cx = extent?.getAttribute('cx');
    const cy = extent?.getAttribute('cy');

    const width = cx ? UnitConverter.emusToPixels(parseInt(cx, 10)) : 0;
    const height = cy ? UnitConverter.emusToPixels(parseInt(cy, 10)) : 0;

    // 获取图片引用
    const blip = container.getElementsByTagName('a:blip')[0];
    const embed = blip?.getAttribute('r:embed');

    if (!embed) return null;

    const rel = this.documentRelationships.get(embed);
    if (!rel) return null;

    const imageName = rel.target.replace('media/', '');
    const imageData = this.images.get(imageName);

    let src = '';
    if (imageData) {
      const base64 = this.arrayBufferToBase64(imageData.data as ArrayBuffer);
      src = `data:${imageData.contentType};base64,${base64}`;
    }

    // 获取替代文本
    const docPr = XmlUtils.getElement(container, 'wp:docPr');
    const alt = docPr?.getAttribute('descr') || docPr?.getAttribute('name') || undefined;

    return {
      type: 'image',
      src,
      width,
      height,
      alt,
      blipId: embed,
      contentType: imageData?.contentType,
      positioning: {
        type: inline ? 'inline' : 'anchor'
      }
    };
  }

  /**
   * 解析旧版图片元素
   */
  private parsePict(pict: Element): ImageElement | null {
    const shape = pict.getElementsByTagName('v:shape')[0];
    if (!shape) return null;

    const imagedata = shape.getElementsByTagName('v:imagedata')[0];
    if (!imagedata) return null;

    const rId = imagedata.getAttribute('r:id');
    if (!rId) return null;

    const rel = this.documentRelationships.get(rId);
    if (!rel) return null;

    const imageName = rel.target.replace('media/', '');
    const imageDataObj = this.images.get(imageName);

    let src = '';
    if (imageDataObj) {
      const base64 = this.arrayBufferToBase64(imageDataObj.data as ArrayBuffer);
      src = `data:${imageDataObj.contentType};base64,${base64}`;
    }

    // 解析样式获取尺寸
    const style = shape.getAttribute('style') || '';
    const widthMatch = style.match(/width:\s*([0-9.]+)(?:pt|px)?/);
    const heightMatch = style.match(/height:\s*([0-9.]+)(?:pt|px)?/);

    const width = widthMatch ? parseFloat(widthMatch[1]) : 100;
    const height = heightMatch ? parseFloat(heightMatch[1]) : 100;

    return {
      type: 'image',
      src,
      width,
      height,
      blipId: rId,
      contentType: imageDataObj?.contentType,
      positioning: { type: 'inline' }
    };
  }

  /**
   * 解析表格
   */
  private parseTable(tbl: Element): TableElement | null {
    const tblPr = XmlUtils.getElement(tbl, 'w:tblPr');
    const tblGrid = XmlUtils.getElement(tbl, 'w:tblGrid');

    const properties = tblPr ? this.parseTableProperties(tblPr) : undefined;

    // 解析列宽
    const grid: { width: number }[] = [];
    if (tblGrid) {
      const gridCols = tblGrid.getElementsByTagName('w:gridCol');
      for (let i = 0; i < gridCols.length; i++) {
        const gridCol = gridCols[i];
        if (!gridCol) continue;

        const w = gridCol.getAttribute('w:w');
        grid.push({
          width: w ? UnitConverter.twipsToPixels(parseInt(w, 10)) : 0
        });
      }
    }

    // 解析行
    const rows: TableRowElement[] = [];
    const trElements = tbl.getElementsByTagName('w:tr');

    for (let i = 0; i < trElements.length; i++) {
      const tr = trElements[i];
      if (!tr || tr.parentElement !== tbl) continue; // 只处理直接子元素

      const row = this.parseTableRow(tr);
      if (row) rows.push(row);
    }

    return {
      type: 'table',
      properties,
      grid,
      rows
    };
  }

  /**
   * 解析表格属性
   */
  private parseTableProperties(tblPr: Element): TableProperties {
    const properties: TableProperties = {};

    // 表格宽度
    const tblW = XmlUtils.getElement(tblPr, 'w:tblW');
    if (tblW) {
      properties.width = this.parseTableWidth(tblW);
    }

    // 对齐方式
    const jc = XmlUtils.getElement(tblPr, 'w:jc');
    if (jc) {
      properties.alignment = jc.getAttribute('w:val') as TableProperties['alignment'];
    }

    // 缩进
    const tblInd = XmlUtils.getElement(tblPr, 'w:tblInd');
    if (tblInd) {
      properties.indent = UnitConverter.twipsToPixels(parseInt(tblInd.getAttribute('w:w') || '0', 10));
    }

    // 边框
    const tblBorders = XmlUtils.getElement(tblPr, 'w:tblBorders');
    if (tblBorders) {
      properties.borders = {};
      const sides = ['top', 'bottom', 'left', 'right', 'insideH', 'insideV'] as const;

      for (const side of sides) {
        const borderEl = XmlUtils.getElement(tblBorders, `w:${side}`);
        if (borderEl) {
          properties.borders[side] = this.parseBorder(borderEl);
        }
      }
    }

    // 底纹
    const shd = XmlUtils.getElement(tblPr, 'w:shd');
    if (shd) {
      properties.shading = this.parseShading(shd);
    }

    // 布局
    const tblLayout = XmlUtils.getElement(tblPr, 'w:tblLayout');
    if (tblLayout) {
      properties.layout = tblLayout.getAttribute('w:type') as TableProperties['layout'];
    }

    // 单元格边距
    const tblCellMar = XmlUtils.getElement(tblPr, 'w:tblCellMar');
    if (tblCellMar) {
      properties.cellMargin = {};
      const sides = ['top', 'bottom', 'left', 'right'] as const;

      for (const side of sides) {
        const marEl = XmlUtils.getElement(tblCellMar, `w:${side}`);
        if (marEl) {
          properties.cellMargin[side] = UnitConverter.twipsToPixels(
            parseInt(marEl.getAttribute('w:w') || '0', 10)
          );
        }
      }
    }

    return properties;
  }

  /**
   * 解析表格宽度
   */
  private parseTableWidth(el: Element): TableWidth {
    const w = el.getAttribute('w:w');
    const type = el.getAttribute('w:type') as TableWidth['type'];

    let value = parseInt(w || '0', 10);

    if (type === 'dxa') {
      value = UnitConverter.twipsToPixels(value);
    } else if (type === 'pct') {
      value = value / 50; // 转换为百分比
    }

    return { value, type: type || 'auto' };
  }

  /**
   * 解析表格行
   */
  private parseTableRow(tr: Element): TableRowElement | null {
    const trPr = XmlUtils.getElement(tr, 'w:trPr');

    const properties: TableRowElement['properties'] = {};

    if (trPr) {
      // 行高
      const trHeight = XmlUtils.getElement(trPr, 'w:trHeight');
      if (trHeight) {
        properties.height = UnitConverter.twipsToPixels(
          parseInt(trHeight.getAttribute('w:val') || '0', 10)
        );
        properties.heightRule = trHeight.getAttribute('w:hRule') as 'auto' | 'atLeast' | 'exact';
      }

      // 表头行
      const tblHeader = XmlUtils.getElement(trPr, 'w:tblHeader');
      if (tblHeader) {
        properties.header = true;
      }

      // 不允许跨页断行
      const cantSplit = XmlUtils.getElement(trPr, 'w:cantSplit');
      if (cantSplit) {
        properties.cantSplit = true;
      }
    }

    // 解析单元格
    const cells: TableCellElement[] = [];
    const tcElements = tr.getElementsByTagName('w:tc');

    for (let i = 0; i < tcElements.length; i++) {
      const tc = tcElements[i];
      if (!tc || tc.parentElement !== tr) continue;

      const cell = this.parseTableCell(tc);
      if (cell) cells.push(cell);
    }

    return {
      type: 'tableRow',
      properties,
      cells
    };
  }

  /**
   * 解析表格单元格
   */
  private parseTableCell(tc: Element): TableCellElement | null {
    const tcPr = XmlUtils.getElement(tc, 'w:tcPr');

    const properties: TableCellElement['properties'] = {};

    if (tcPr) {
      // 单元格宽度
      const tcW = XmlUtils.getElement(tcPr, 'w:tcW');
      if (tcW) {
        properties.width = this.parseTableWidth(tcW);
      }

      // 列合并
      const gridSpan = XmlUtils.getElement(tcPr, 'w:gridSpan');
      if (gridSpan) {
        properties.gridSpan = parseInt(gridSpan.getAttribute('w:val') || '1', 10);
      }

      // 行合并
      const vMerge = XmlUtils.getElement(tcPr, 'w:vMerge');
      if (vMerge) {
        const val = vMerge.getAttribute('w:val');
        properties.vMerge = val === 'restart' ? 'restart' : 'continue';
      }

      // 垂直对齐
      const vAlign = XmlUtils.getElement(tcPr, 'w:vAlign');
      if (vAlign) {
        properties.vAlign = vAlign.getAttribute('w:val') as 'top' | 'center' | 'bottom';
      }

      // 边框
      const tcBorders = XmlUtils.getElement(tcPr, 'w:tcBorders');
      if (tcBorders) {
        properties.borders = {};
        const sides = ['top', 'bottom', 'left', 'right'] as const;

        for (const side of sides) {
          const borderEl = XmlUtils.getElement(tcBorders, `w:${side}`);
          if (borderEl) {
            (properties.borders as Record<string, BorderStyle>)[side] = this.parseBorder(borderEl);
          }
        }
      }

      // 底纹
      const shd = XmlUtils.getElement(tcPr, 'w:shd');
      if (shd) {
        properties.shading = this.parseShading(shd);
      }

      // 文字方向
      const textDirection = XmlUtils.getElement(tcPr, 'w:textDirection');
      if (textDirection) {
        properties.textDirection = textDirection.getAttribute('w:val') as TableCellElement['properties']['textDirection'];
      }
    }

    // 解析单元格内容
    const content: (ParagraphElement | TableElement)[] = [];

    for (const child of Array.from(tc.children)) {
      if (child.tagName === 'w:p') {
        const paragraph = this.parseParagraph(child);
        if (paragraph) content.push(paragraph);
      } else if (child.tagName === 'w:tbl') {
        const table = this.parseTable(child);
        if (table) content.push(table);
      }
    }

    return {
      type: 'tableCell',
      properties,
      content
    };
  }

  /**
   * 获取文件内容
   */
  private async getFileContent(path: string): Promise<string | null> {
    if (!this.zip) return null;

    const file = this.zip.file(path);
    if (!file) return null;

    return await file.async('string');
  }

  /**
   * ArrayBuffer 转 Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]!);
    }
    return btoa(binary);
  }
}
