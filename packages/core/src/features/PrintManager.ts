import type { WordDocument, PrintOptions } from '../types';
import { EventEmitter } from '../events/EventEmitter';

/**
 * 打印管理器
 * 提供文档打印功能
 */
export class PrintManager {
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
   * 打印文档
   */
  print(options?: PrintOptions): void {
    if (!this.container) {
      console.warn('没有可打印的内容');
      return;
    }

    // 创建打印样式
    const printStyles = this.createPrintStyles(options);
    const styleElement = document.createElement('style');
    styleElement.textContent = printStyles;
    styleElement.id = `${this.classPrefix}-print-styles`;

    // 移除旧的打印样式
    const oldStyle = document.getElementById(`${this.classPrefix}-print-styles`);
    if (oldStyle) {
      oldStyle.remove();
    }

    // 添加新的打印样式
    document.head.appendChild(styleElement);

    // 添加打印类
    document.body.classList.add(`${this.classPrefix}-printing`);

    // 触发打印事件
    this.eventEmitter.emit('print', {
      type: 'print',
      timestamp: Date.now(),
      options
    });

    // 调用浏览器打印
    window.print();

    // 打印后清理
    setTimeout(() => {
      document.body.classList.remove(`${this.classPrefix}-printing`);
      styleElement.remove();
    }, 1000);
  }

  /**
   * 创建打印样式
   */
  private createPrintStyles(options?: PrintOptions): string {
    const scale = options?.scale ?? 1;
    const showHeaderFooter = options?.showHeaderFooter ?? true;
    const showBackground = options?.showBackground ?? true;

    return `
      @media print {
        /* 隐藏非打印内容 */
        body > *:not(.${this.classPrefix}-document) {
          display: none !important;
        }

        /* 隐藏工具栏等 */
        .${this.classPrefix}-toolbar,
        .${this.classPrefix}-sidebar,
        .${this.classPrefix}-toc-panel,
        .${this.classPrefix}-search-panel {
          display: none !important;
        }

        /* 显示文档内容 */
        .${this.classPrefix}-document {
          display: block !important;
          position: static !important;
          width: 100% !important;
          height: auto !important;
          overflow: visible !important;
          background: none !important;
          padding: 0 !important;
          margin: 0 !important;
        }

        /* 页面样式 */
        .${this.classPrefix}-page {
          width: 100% !important;
          height: auto !important;
          min-height: auto !important;
          margin: 0 !important;
          padding: 20mm !important;
          box-shadow: none !important;
          page-break-after: always;
          page-break-inside: avoid;
          transform: scale(${scale}) !important;
          transform-origin: top left !important;
          ${!showBackground ? 'background: white !important;' : ''}
        }

        .${this.classPrefix}-page:last-child {
          page-break-after: auto;
        }

        /* 分页控制 */
        .${this.classPrefix}-page-break {
          page-break-after: always !important;
        }

        /* 表格分页 */
        .${this.classPrefix}-table {
          page-break-inside: avoid;
        }

        .${this.classPrefix}-table-row {
          page-break-inside: avoid;
        }

        /* 图片分页 */
        .${this.classPrefix}-image {
          page-break-inside: avoid;
          max-width: 100% !important;
        }

        /* 段落分页 */
        .${this.classPrefix}-paragraph {
          orphans: 3;
          widows: 3;
        }

        /* 页眉页脚 */
        ${!showHeaderFooter ? `
          .${this.classPrefix}-header,
          .${this.classPrefix}-footer {
            display: none !important;
          }
        ` : ''}

        /* 链接样式 */
        a {
          text-decoration: underline;
          color: black !important;
        }

        /* 隐藏搜索高亮 */
        .${this.classPrefix}-search-highlight {
          background: none !important;
        }

        /* 打印颜色设置 */
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }

      /* 打印预览模式 */
      body.${this.classPrefix}-printing {
        overflow: visible !important;
      }

      @page {
        size: ${this.getPageSize(options?.paperSize)} ${options?.orientation || 'portrait'};
        margin: 10mm;
      }
    `;
  }

  /**
   * 获取纸张大小
   */
  private getPageSize(size?: PrintOptions['paperSize']): string {
    switch (size) {
      case 'A3':
        return 'A3';
      case 'Letter':
        return 'letter';
      case 'Legal':
        return 'legal';
      case 'A4':
      default:
        return 'A4';
    }
  }

  /**
   * 打印预览
   */
  printPreview(): void {
    if (!this.container) return;

    // 创建预览窗口
    const previewWindow = window.open('', '_blank', 'width=800,height=600');
    if (!previewWindow) {
      alert('无法打开打印预览窗口，请检查浏览器弹出窗口设置');
      return;
    }

    // 获取文档内容
    const content = this.container.cloneNode(true) as HTMLElement;

    // 移除不需要的元素
    const unwanted = content.querySelectorAll(`.${this.classPrefix}-toolbar, .${this.classPrefix}-sidebar`);
    unwanted.forEach(el => el.remove());

    // 获取当前页面的样式
    const styles = Array.from(document.styleSheets)
      .map(sheet => {
        try {
          return Array.from(sheet.cssRules)
            .map(rule => rule.cssText)
            .join('\n');
        } catch {
          return '';
        }
      })
      .join('\n');

    // 写入预览内容
    previewWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>打印预览</title>
          <style>
            ${styles}
            body {
              margin: 0;
              padding: 20px;
              background: #f0f0f0;
            }
            .${this.classPrefix}-document {
              background: #f0f0f0;
            }
            .${this.classPrefix}-page {
              background: white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.15);
              margin: 20px auto;
            }
            .print-button {
              position: fixed;
              top: 20px;
              right: 20px;
              padding: 10px 24px;
              font-size: 14px;
              font-weight: 600;
              color: white;
              background: #1976d2;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
            .print-button:hover {
              background: #1565c0;
            }
            @media print {
              .print-button {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <button class="print-button" onclick="window.print()">打印</button>
          ${content.outerHTML}
        </body>
      </html>
    `);

    previewWindow.document.close();
  }

  /**
   * 导出为 PDF（需要额外库支持）
   */
  async exportToPdf(_options?: PrintOptions): Promise<Blob | null> {
    // 这里需要使用 jspdf 或 html2pdf 等库
    // 由于是可选依赖，这里只提供接口
    console.warn('PDF 导出需要安装 jspdf 和 html2canvas 依赖');

    // 基本实现思路：
    // 1. 使用 html2canvas 将内容渲染为 canvas
    // 2. 使用 jspdf 将 canvas 转换为 PDF

    return null;
  }

  /**
   * 销毁
   */
  destroy(): void {
    const styleElement = document.getElementById(`${this.classPrefix}-print-styles`);
    if (styleElement) {
      styleElement.remove();
    }
    document.body.classList.remove(`${this.classPrefix}-printing`);
    this.document = null;
    this.container = null;
  }
}
