/**
 * 文档导出模块
 * 支持多种格式导出，包括 PDF、HTML、DOCX、TXT、Markdown、RTF
 */

import type { WordViewer } from '../core/WordViewer';
import { ExportError } from '../core/errors';
import { Logger } from '../utils/logger';

const logger = new Logger({ prefix: '[Exporter]' });

export interface ExportOptions {
  format: 'pdf' | 'html' | 'docx' | 'txt' | 'markdown' | 'rtf';
  includeImages?: boolean;
  includeStyles?: boolean;
  pageSize?: 'A4' | 'Letter' | 'Legal';
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  template?: string;
  watermark?: {
    text: string;
    opacity?: number;
    fontSize?: number;
  };
}

export interface PDFOptions {
  pageSize?: 'A4' | 'Letter' | 'Legal';
  orientation?: 'portrait' | 'landscape';
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  header?: string;
  footer?: string;
  watermark?: {
    text: string;
    opacity?: number;
    fontSize?: number;
  };
  compress?: boolean;
}

export class ExporterModule {
  private viewer: WordViewer;

  constructor(viewer: WordViewer) {
    this.viewer = viewer;
  }

  /**
   * 导出为 PDF（使用 html2canvas + jsPDF）
   */
  async exportToPDF(container: HTMLElement, options: PDFOptions = {}): Promise<Blob> {
    try {
      logger.info('开始导出 PDF');

      const content = container.querySelector('.viewer-content');
      if (!content) {
        throw new ExportError('没有可导出的内容');
      }

      // 动态导入 jsPDF 和 html2canvas（按需加载）
      const [{ default: jsPDF }, html2canvas] = await Promise.all([
        import('jspdf').catch(() => {
          logger.warn('jsPDF 未安装，使用简化实现');
          return { default: null };
        }),
        import('html2canvas').catch(() => {
          logger.warn('html2canvas 未安装，使用简化实现');
          return null;
        }),
      ]);

      if (!jsPDF || !html2canvas) {
        // 降级到简化实现
        return this.exportToPDFSimple(container, options);
      }

      // 配置
      const pageSize = options.pageSize || 'A4';
      const orientation = options.orientation || 'portrait';
      const margin = options.margin || { top: 20, right: 20, bottom: 20, left: 20 };

      // 创建 PDF
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: pageSize.toLowerCase(),
        compress: options.compress !== false,
      });

      // 渲染为 canvas
      const canvas = await html2canvas(content as HTMLElement, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pdf.internal.pageSize.getWidth() - margin.left - margin.right;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // 添加图片到 PDF
      pdf.addImage(imgData, 'PNG', margin.left, margin.top, imgWidth, imgHeight);

      // 添加页眉
      if (options.header) {
        pdf.setFontSize(10);
        pdf.text(options.header, margin.left, 10);
      }

      // 添加页脚
      if (options.footer) {
        pdf.setFontSize(10);
        const pageHeight = pdf.internal.pageSize.getHeight();
        pdf.text(options.footer, margin.left, pageHeight - 10);
      }

      // 添加水印
      if (options.watermark) {
        this.addWatermarkToPDF(pdf, options.watermark);
      }

      // 生成 Blob
      const blob = pdf.output('blob');
      logger.info('PDF 导出成功');

      return blob;
    } catch (error) {
      logger.error('PDF 导出失败', error);
      throw new ExportError(
        `导出 PDF 失败: ${error instanceof Error ? error.message : '未知错误'}`,
        { originalError: error }
      );
    }
  }

  /**
   * 简化的 PDF 导出（不依赖外部库）
   */
  private async exportToPDFSimple(container: HTMLElement, options: PDFOptions): Promise<Blob> {
    logger.info('使用简化 PDF 导出');

    const content = container.querySelector('.viewer-content');
    if (!content) {
      throw new ExportError('没有可导出的内容');
    }

    // 生成 HTML 格式，浏览器可以直接打印为 PDF
    const html = this.exportToHTML(container);
    const printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Document</title>
        <style>
          @media print {
            @page {
              size: ${options.pageSize || 'A4'};
              margin: ${options.margin?.top || 20}mm ${options.margin?.right || 20}mm 
                      ${options.margin?.bottom || 20}mm ${options.margin?.left || 20}mm;
            }
          }
        </style>
      </head>
      <body>${html}</body>
      </html>
    `;

    return new Blob([printHtml], { type: 'application/pdf' });
  }

  /**
   * 添加水印到 PDF
   */
  private addWatermarkToPDF(pdf: any, watermark: NonNullable<PDFOptions['watermark']>): void {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    pdf.setFontSize(watermark.fontSize || 48);
    pdf.setTextColor(200, 200, 200);
    pdf.setGState(new pdf.GState({ opacity: watermark.opacity || 0.3 }));

    // 对角线水印
    pdf.text(
      watermark.text,
      pageWidth / 2,
      pageHeight / 2,
      { angle: 45, align: 'center' }
    );
  }

  /**
   * 导出为 HTML
   */
  exportToHTML(container: HTMLElement): string {
    const content = container.querySelector('.viewer-content');
    if (!content) {
      throw new Error('没有可导出的内容');
    }

    // 创建完整的 HTML 文档
    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Word Document</title>
  <style>
    body {
      font-family: 'Calibri', 'Arial', sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    img {
      max-width: 100%;
      height: auto;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 10px 0;
    }
    table, th, td {
      border: 1px solid #ddd;
      padding: 8px;
    }
  </style>
</head>
<body>
${content.innerHTML}
</body>
</html>
    `.trim();

    return html;
  }

  /**
   * 导出为 DOCX
   */
  async exportToDocx(buffer: ArrayBuffer): Promise<Blob> {
    try {
      // 如果文档已经是 DOCX 格式，直接返回
      return new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
    } catch (error) {
      throw new Error(`导出 DOCX 失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 导出为纯文本
   */
  exportToText(container: HTMLElement): string {
    const content = container.querySelector('.viewer-content');
    if (!content) {
      throw new Error('没有可导出的内容');
    }

    // 提取纯文本内容
    return content.textContent || '';
  }

  /**
   * 导出为 Markdown（增强版）
   */
  exportToMarkdown(container: HTMLElement): string {
    logger.info('导出为 Markdown');

    const content = container.querySelector('.viewer-content');
    if (!content) {
      throw new ExportError('没有可导出的内容');
    }

    const html = content.innerHTML;
    return this.convertHtmlToMarkdown(html);
  }

  /**
   * HTML 到 Markdown 转换
   */
  private convertHtmlToMarkdown(html: string): string {
    let markdown = html;

    // 转换标题
    markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
    markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
    markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
    markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
    markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n');
    markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n');

    // 转换加粗和斜体
    markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
    markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
    markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
    markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');

    // 转换删除线
    markdown = markdown.replace(/<del[^>]*>(.*?)<\/del>/gi, '~~$1~~');
    markdown = markdown.replace(/<s[^>]*>(.*?)<\/s>/gi, '~~$1~~');

    // 转换链接
    markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

    // 转换图片
    markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, '![$2]($1)');
    markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, '![]($1)');

    // 转换代码
    markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
    markdown = markdown.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis, '```\n$1\n```\n');
    markdown = markdown.replace(/<pre[^>]*>(.*?)<\/pre>/gis, '```\n$1\n```\n');

    // 转换列表
    markdown = markdown.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
      return content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
    });
    markdown = markdown.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
      let index = 1;
      return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${index++}. $1\n`);
    });

    // 转换引用
    markdown = markdown.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, (match, content) => {
      return content.split('\n').map((line: string) => `> ${line}`).join('\n') + '\n';
    });

    // 转换水平线
    markdown = markdown.replace(/<hr[^>]*>/gi, '\n---\n');

    // 转换段落
    markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');

    // 转换换行
    markdown = markdown.replace(/<br[^>]*>/gi, '\n');

    // 移除其他 HTML 标签
    markdown = markdown.replace(/<[^>]+>/g, '');

    // 解码 HTML 实体
    const div = document.createElement('div');
    div.innerHTML = markdown;
    markdown = div.textContent || markdown;

    // 清理多余的空行
    markdown = markdown.replace(/\n{3,}/g, '\n\n');

    return markdown.trim();
  }

  /**
   * 导出为 RTF
   */
  exportToRTF(container: HTMLElement): string {
    logger.info('导出为 RTF');

    const content = container.querySelector('.viewer-content');
    if (!content) {
      throw new ExportError('没有可导出的内容');
    }

    const html = content.innerHTML;
    return this.convertHtmlToRTF(html);
  }

  /**
   * HTML 到 RTF 转换
   */
  private convertHtmlToRTF(html: string): string {
    // RTF 文件头
    let rtf = '{\\rtf1\\ansi\\deff0\n';

    // 字体表
    rtf += '{\\fonttbl{\\f0\\fnil\\fcharset0 Calibri;}}\n';

    // 颜色表
    rtf += '{\\colortbl;\\red0\\green0\\blue0;\\red255\\green0\\blue0;}\n';

    // 文档内容
    rtf += '\\viewkind4\\uc1\\pard\\f0\\fs22\n';

    // 简化的 HTML 到 RTF 转换
    let text = html;

    // 转换加粗
    text = text.replace(/<(strong|b)[^>]*>(.*?)<\/\1>/gi, '\\\\b $2\\\\b0 ');

    // 转换斜体
    text = text.replace(/<(em|i)[^>]*>(.*?)<\/\1>/gi, '\\\\i $2\\\\i0 ');

    // 转换下划线
    text = text.replace(/<u[^>]*>(.*?)<\/u>/gi, '\\\\ul $1\\\\ul0 ');

    // 转换段落
    text = text.replace(/<p[^>]*>/gi, '\\\\par\n');
    text = text.replace(/<\/p>/gi, '');

    // 转换换行
    text = text.replace(/<br[^>]*>/gi, '\\\\line\n');

    // 移除其他 HTML 标签
    text = text.replace(/<[^>]+>/g, '');

    // 解码 HTML 实体
    const div = document.createElement('div');
    div.innerHTML = text;
    text = div.textContent || text;

    rtf += text;
    rtf += '\n}';

    return rtf;
  }

  /**
   * 批量导出文档
   */
  async exportBatch(
    documents: Array<{ name: string; content: HTMLElement }>,
    format: ExportOptions['format']
  ): Promise<Blob[]> {
    logger.info(`批量导出 ${documents.length} 个文档为 ${format}`);

    const results: Blob[] = [];

    for (const doc of documents) {
      try {
        let blob: Blob;

        switch (format) {
          case 'pdf':
            blob = await this.exportToPDF(doc.content);
            break;
          case 'html':
            const html = this.exportToHTML(doc.content);
            blob = new Blob([html], { type: 'text/html' });
            break;
          case 'markdown':
            const md = this.exportToMarkdown(doc.content);
            blob = new Blob([md], { type: 'text/markdown' });
            break;
          case 'rtf':
            const rtf = this.exportToRTF(doc.content);
            blob = new Blob([rtf], { type: 'application/rtf' });
            break;
          case 'txt':
            const txt = this.exportToText(doc.content);
            blob = new Blob([txt], { type: 'text/plain' });
            break;
          default:
            throw new ExportError(`不支持的格式: ${format}`);
        }

        results.push(blob);
      } catch (error) {
        logger.error(`导出文档 ${doc.name} 失败`, error);
        throw error;
      }
    }

    logger.info('批量导出完成');
    return results;
  }

  /**
   * 导出为 ZIP（批量导出）
   */
  async exportAsZip(
    documents: Array<{ name: string; content: HTMLElement }>,
    format: ExportOptions['format']
  ): Promise<Blob> {
    try {
      // 动态导入 JSZip
      const JSZip = await import('jszip').then(m => m.default).catch(() => {
        throw new ExportError('JSZip 未安装，无法创建 ZIP 文件');
      });

      const zip = new JSZip();
      const blobs = await this.exportBatch(documents, format);

      documents.forEach((doc, index) => {
        const extension = format === 'markdown' ? 'md' : format;
        zip.file(`${doc.name}.${extension}`, blobs[index]);
      });

      return await zip.generateAsync({ type: 'blob' });
    } catch (error) {
      throw new ExportError(
        `创建 ZIP 失败: ${error instanceof Error ? error.message : '未知错误'}`,
        { originalError: error }
      );
    }
  }
}



