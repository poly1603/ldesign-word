import type { WordDocument, ExportOptions } from '../types';
import { EventEmitter } from '../events/EventEmitter';

/**
 * 导出管理器
 * 提供文档导出功能：PDF、图片、HTML、纯文本
 */
export class ExportManager {
  private document: WordDocument | null = null;
  private container: HTMLElement | null = null;
  private eventEmitter: EventEmitter;
  private classPrefix = 'wv';

  constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter;
  }

  /**
   * 设置文档
   */
  setDocument(document: WordDocument, container: HTMLElement): void {
    this.document = document;
    this.container = container;
  }

  /**
   * 导出文档
   */
  async export(options: ExportOptions): Promise<Blob | null> {
    if (!this.container || !this.document) {
      console.warn('没有可导出的内容');
      return null;
    }

    try {
      let result: Blob | null = null;

      switch (options.format) {
        case 'pdf':
          result = await this.exportToPdf(options);
          break;
        case 'image':
          result = await this.exportToImage(options);
          break;
        case 'html':
          result = await this.exportToHtml(options);
          break;
        case 'text':
          result = await this.exportToText(options);
          break;
      }

      // 触发导出成功事件
      this.eventEmitter.emit('export', {
        type: 'export',
        timestamp: Date.now(),
        format: options.format,
        success: true,
        blob: result
      });

      // 自动下载
      if (result && options.fileName) {
        this.downloadBlob(result, options.fileName);
      }

      return result;
    } catch (error) {
      // 触发导出失败事件
      this.eventEmitter.emit('exportError', {
        type: 'exportError',
        timestamp: Date.now(),
        format: options.format,
        error
      });
      throw error;
    }
  }

  /**
   * 导出为 PDF
   */
  async exportToPdf(options: ExportOptions): Promise<Blob | null> {
    // 检查是否有 jspdf 和 html2canvas
    const jsPDF = (window as any).jspdf?.jsPDF;
    const html2canvas = (window as any).html2canvas;

    if (!jsPDF || !html2canvas) {
      // 尝试动态导入
      try {
        const [jspdfModule, html2canvasModule] = await Promise.all([
          import('jspdf'),
          import('html2canvas')
        ]);
        return this.generatePdf(
          jspdfModule.jsPDF || jspdfModule.default,
          html2canvasModule.default,
          options
        );
      } catch {
        console.warn('PDF 导出需要安装 jspdf 和 html2canvas 依赖');
        console.warn('npm install jspdf html2canvas');
        return null;
      }
    }

    return this.generatePdf(jsPDF, html2canvas, options);
  }

  /**
   * 生成 PDF
   */
  private async generatePdf(
    jsPDF: any,
    html2canvas: any,
    options: ExportOptions
  ): Promise<Blob | null> {
    if (!this.container) return null;

    const pages = this.container.querySelectorAll(`.${this.classPrefix}-page`);
    if (pages.length === 0) return null;

    // 获取第一页的尺寸来确定 PDF 大小
    const firstPage = pages[0] as HTMLElement;
    const pageWidth = firstPage.offsetWidth;
    const pageHeight = firstPage.offsetHeight;

    // 创建 PDF 文档
    const orientation = pageWidth > pageHeight ? 'landscape' : 'portrait';
    const pdf = new jsPDF({
      orientation,
      unit: 'px',
      format: [pageWidth, pageHeight]
    });

    const scale = options.scale || 2;
    const quality = options.quality || 0.95;

    // 解析页面范围
    const pageIndices = this.parsePageRange(options.pageRange, pages.length);

    for (let i = 0; i < pageIndices.length; i++) {
      const pageIndex = pageIndices[i];
      if (pageIndex === undefined) continue;

      const page = pages[pageIndex] as HTMLElement;
      if (!page) continue;

      // 使用 html2canvas 渲染页面
      const canvas = await html2canvas(page, {
        scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      // 添加页面到 PDF
      if (i > 0) {
        pdf.addPage([pageWidth, pageHeight], orientation);
      }

      const imgData = canvas.toDataURL('image/jpeg', quality);
      pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);
    }

    // 添加元数据
    if (options.includeMetadata && this.document) {
      const meta = this.document.metadata;
      if (meta.title) pdf.setProperties({ title: meta.title });
      if (meta.subject) pdf.setProperties({ subject: meta.subject });
      if (meta.creator) pdf.setProperties({ author: meta.creator });
      if (meta.keywords) pdf.setProperties({ keywords: meta.keywords });
    }

    return pdf.output('blob');
  }

  /**
   * 导出为图片
   */
  async exportToImage(options: ExportOptions): Promise<Blob | null> {
    const html2canvas = (window as any).html2canvas;

    if (!html2canvas) {
      try {
        const module = await import('html2canvas');
        return this.generateImage(module.default, options);
      } catch {
        console.warn('图片导出需要安装 html2canvas 依赖');
        console.warn('npm install html2canvas');
        return null;
      }
    }

    return this.generateImage(html2canvas, options);
  }

  /**
   * 生成图片
   */
  private async generateImage(
    html2canvas: any,
    options: ExportOptions
  ): Promise<Blob | null> {
    if (!this.container) return null;

    const pages = this.container.querySelectorAll(`.${this.classPrefix}-page`);
    if (pages.length === 0) return null;

    const scale = options.scale || 2;
    const quality = options.quality || 0.95;
    const format = options.imageFormat || 'png';

    // 解析页面范围
    const pageIndices = this.parsePageRange(options.pageRange, pages.length);

    // 如果只有一页，直接导出
    if (pageIndices.length === 1) {
      const page = pages[pageIndices[0]!] as HTMLElement;
      const canvas = await html2canvas(page, {
        scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      return new Promise((resolve) => {
        canvas.toBlob(
          (blob: Blob | null) => resolve(blob),
          `image/${format}`,
          quality
        );
      });
    }

    // 多页合并为一张长图
    const canvases: HTMLCanvasElement[] = [];
    let totalHeight = 0;
    let maxWidth = 0;

    for (const pageIndex of pageIndices) {
      if (pageIndex === undefined) continue;
      const page = pages[pageIndex] as HTMLElement;
      if (!page) continue;

      const canvas = await html2canvas(page, {
        scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      canvases.push(canvas);
      totalHeight += canvas.height + 20; // 页面间距
      maxWidth = Math.max(maxWidth, canvas.width);
    }

    // 创建合并的 canvas
    const mergedCanvas = document.createElement('canvas');
    mergedCanvas.width = maxWidth;
    mergedCanvas.height = totalHeight;
    const ctx = mergedCanvas.getContext('2d');

    if (!ctx) return null;

    // 填充背景
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, maxWidth, totalHeight);

    // 绘制每一页
    let currentY = 0;
    for (const canvas of canvases) {
      const x = (maxWidth - canvas.width) / 2;
      ctx.drawImage(canvas, x, currentY);
      currentY += canvas.height + 20;
    }

    return new Promise((resolve) => {
      mergedCanvas.toBlob(
        (blob: Blob | null) => resolve(blob),
        `image/${format}`,
        quality
      );
    });
  }

  /**
   * 导出为 HTML
   */
  async exportToHtml(options: ExportOptions): Promise<Blob | null> {
    if (!this.container || !this.document) return null;

    // 克隆内容
    const content = this.container.cloneNode(true) as HTMLElement;

    // 移除不需要的元素
    const unwanted = content.querySelectorAll(
      `.${this.classPrefix}-toolbar, .${this.classPrefix}-sidebar, .${this.classPrefix}-search-highlight`
    );
    unwanted.forEach((el) => el.remove());

    // 获取当前页面的样式
    const styles = this.collectStyles();

    // 构建完整 HTML
    const meta = this.document.metadata;
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${meta.title ? `<title>${this.escapeHtml(meta.title)}</title>` : '<title>文档导出</title>'}
  ${meta.creator ? `<meta name="author" content="${this.escapeHtml(meta.creator)}">` : ''}
  ${meta.description ? `<meta name="description" content="${this.escapeHtml(meta.description)}">` : ''}
  ${meta.keywords ? `<meta name="keywords" content="${this.escapeHtml(meta.keywords)}">` : ''}
  <style>
    ${styles}
    body {
      margin: 0;
      padding: 20px;
      background: #f0f0f0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .${this.classPrefix}-page {
      background: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      margin: 20px auto;
    }
    @media print {
      body { background: white; padding: 0; }
      .${this.classPrefix}-page { box-shadow: none; margin: 0; }
    }
  </style>
</head>
<body>
  ${content.innerHTML}
</body>
</html>`;

    return new Blob([html], { type: 'text/html;charset=utf-8' });
  }

  /**
   * 导出为纯文本
   */
  async exportToText(_options: ExportOptions): Promise<Blob | null> {
    if (!this.document) return null;

    const lines: string[] = [];

    // 添加元数据
    const meta = this.document.metadata;
    if (meta.title) {
      lines.push(meta.title);
      lines.push('='.repeat(meta.title.length));
      lines.push('');
    }

    // 遍历所有节和内容
    for (const section of this.document.sections) {
      for (const content of section.content) {
        if (content.type === 'paragraph') {
          const text = this.extractParagraphText(content);
          lines.push(text);
        } else if (content.type === 'table') {
          lines.push(this.extractTableText(content));
        }
      }
    }

    const text = lines.join('\n');
    return new Blob([text], { type: 'text/plain;charset=utf-8' });
  }

  /**
   * 提取段落文本
   */
  private extractParagraphText(paragraph: any): string {
    let text = '';
    for (const run of paragraph.runs) {
      for (const child of run.children) {
        if (child.type === 'text') {
          text += child.text;
        } else if (child.type === 'tab') {
          text += '\t';
        } else if (child.type === 'break') {
          if (child.breakType === 'line') {
            text += '\n';
          }
        }
      }
    }
    return text;
  }

  /**
   * 提取表格文本
   */
  private extractTableText(table: any): string {
    const rows: string[] = [];

    for (const row of table.rows) {
      const cells: string[] = [];
      for (const cell of row.cells) {
        const cellTexts: string[] = [];
        for (const content of cell.content) {
          if (content.type === 'paragraph') {
            cellTexts.push(this.extractParagraphText(content));
          }
        }
        cells.push(cellTexts.join(' '));
      }
      rows.push(cells.join('\t'));
    }

    return rows.join('\n');
  }

  /**
   * 收集样式
   */
  private collectStyles(): string {
    const styles: string[] = [];

    for (const sheet of Array.from(document.styleSheets)) {
      try {
        const rules = sheet.cssRules || sheet.rules;
        for (const rule of Array.from(rules)) {
          if (rule.cssText.includes(this.classPrefix)) {
            styles.push(rule.cssText);
          }
        }
      } catch {
        // 跨域样式表无法访问
      }
    }

    return styles.join('\n');
  }

  /**
   * 解析页面范围
   */
  private parsePageRange(range: string | undefined, total: number): number[] {
    if (!range) {
      return Array.from({ length: total }, (_, i) => i);
    }

    const indices: Set<number> = new Set();
    const parts = range.split(',');

    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [start, end] = trimmed.split('-').map((s) => parseInt(s.trim(), 10));
        if (!isNaN(start!) && !isNaN(end!)) {
          for (let i = Math.max(0, start! - 1); i < Math.min(total, end!); i++) {
            indices.add(i);
          }
        }
      } else {
        const page = parseInt(trimmed, 10);
        if (!isNaN(page) && page > 0 && page <= total) {
          indices.add(page - 1);
        }
      }
    }

    return Array.from(indices).sort((a, b) => a - b);
  }

  /**
   * 下载 Blob
   */
  private downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * 转义 HTML
   */
  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.document = null;
    this.container = null;
  }
}
