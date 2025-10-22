/**
 * 表格模块
 * 支持表格插入、编辑和样式化
 */

import { Logger } from '../utils/logger';
import { insertHTML } from '../utils/selection';
import { OperationError } from '../core/errors';

const logger = new Logger({ prefix: '[Table]' });

export interface TableOptions {
  rows: number;
  cols: number;
  width?: string;
  border?: number;
  cellPadding?: number;
  cellSpacing?: number;
  headerRow?: boolean;
  className?: string;
}

export interface CellPosition {
  row: number;
  col: number;
}

export interface TableStyle {
  borderColor?: string;
  borderWidth?: number;
  backgroundColor?: string;
  headerBackgroundColor?: string;
  alternateRowColor?: boolean;
}

/**
 * 表格管理器
 */
export class TableManager {
  /**
   * 创建表格
   */
  createTable(options: TableOptions): HTMLTableElement {
    const {
      rows,
      cols,
      width = '100%',
      border = 1,
      cellPadding = 8,
      cellSpacing = 0,
      headerRow = false,
      className = 'word-table',
    } = options;

    logger.debug('创建表格', { rows, cols });

    const table = document.createElement('table');
    table.className = className;
    table.style.width = width;
    table.style.borderCollapse = 'collapse';
    table.style.border = `${border}px solid #ddd`;

    // 创建表头
    if (headerRow) {
      const thead = document.createElement('thead');
      const headerRowElement = document.createElement('tr');

      for (let j = 0; j < cols; j++) {
        const th = document.createElement('th');
        th.style.border = `${border}px solid #ddd`;
        th.style.padding = `${cellPadding}px`;
        th.style.backgroundColor = '#f0f0f0';
        th.style.fontWeight = 'bold';
        th.textContent = `列 ${j + 1}`;
        headerRowElement.appendChild(th);
      }

      thead.appendChild(headerRowElement);
      table.appendChild(thead);
    }

    // 创建表体
    const tbody = document.createElement('tbody');
    const startRow = headerRow ? 1 : 0;

    for (let i = startRow; i < rows; i++) {
      const tr = document.createElement('tr');

      for (let j = 0; j < cols; j++) {
        const td = document.createElement('td');
        td.style.border = `${border}px solid #ddd`;
        td.style.padding = `${cellPadding}px`;
        td.contentEditable = 'true';
        td.textContent = '';
        tr.appendChild(td);
      }

      tbody.appendChild(tr);
    }

    table.appendChild(tbody);

    return table;
  }

  /**
   * 插入表格到当前位置
   */
  insertTable(options: TableOptions): void {
    try {
      const table = this.createTable(options);
      const tableHTML = table.outerHTML;

      insertHTML(tableHTML);
      logger.info('表格已插入', options);
    } catch (error) {
      logger.error('插入表格失败', error);
      throw new OperationError('插入表格失败', 'insertTable', error);
    }
  }

  /**
   * 在表格中插入行
   */
  insertRow(table: HTMLTableElement, position: number): void {
    const tbody = table.querySelector('tbody') || table;
    const rows = tbody.querySelectorAll('tr');

    if (rows.length === 0) {
      throw new OperationError('表格没有行');
    }

    const firstRow = rows[0];
    const cols = firstRow.querySelectorAll('td, th').length;

    const newRow = document.createElement('tr');
    for (let i = 0; i < cols; i++) {
      const td = document.createElement('td');
      td.style.border = '1px solid #ddd';
      td.style.padding = '8px';
      td.contentEditable = 'true';
      newRow.appendChild(td);
    }

    if (position >= rows.length) {
      tbody.appendChild(newRow);
    } else {
      tbody.insertBefore(newRow, rows[position]);
    }

    logger.debug('插入行', { position });
  }

  /**
   * 在表格中插入列
   */
  insertColumn(table: HTMLTableElement, position: number): void {
    const rows = table.querySelectorAll('tr');

    rows.forEach(row => {
      const cells = row.querySelectorAll('td, th');
      const isHeader = row.parentElement?.tagName === 'THEAD';

      const newCell = document.createElement(isHeader ? 'th' : 'td');
      newCell.style.border = '1px solid #ddd';
      newCell.style.padding = '8px';
      newCell.contentEditable = 'true';

      if (isHeader) {
        newCell.style.backgroundColor = '#f0f0f0';
        newCell.style.fontWeight = 'bold';
      }

      if (position >= cells.length) {
        row.appendChild(newCell);
      } else {
        row.insertBefore(newCell, cells[position]);
      }
    });

    logger.debug('插入列', { position });
  }

  /**
   * 删除行
   */
  deleteRow(table: HTMLTableElement, rowIndex: number): void {
    const tbody = table.querySelector('tbody') || table;
    const rows = tbody.querySelectorAll('tr');

    if (rowIndex >= 0 && rowIndex < rows.length) {
      rows[rowIndex].remove();
      logger.debug('删除行', { rowIndex });
    }
  }

  /**
   * 删除列
   */
  deleteColumn(table: HTMLTableElement, colIndex: number): void {
    const rows = table.querySelectorAll('tr');

    rows.forEach(row => {
      const cells = row.querySelectorAll('td, th');
      if (colIndex >= 0 && colIndex < cells.length) {
        cells[colIndex].remove();
      }
    });

    logger.debug('删除列', { colIndex });
  }

  /**
   * 合并单元格
   */
  mergeCells(table: HTMLTableElement, start: CellPosition, end: CellPosition): void {
    const rows = table.querySelectorAll('tr');
    const startRow = Math.min(start.row, end.row);
    const endRow = Math.max(start.row, end.row);
    const startCol = Math.min(start.col, end.col);
    const endCol = Math.max(start.col, end.col);

    const rowSpan = endRow - startRow + 1;
    const colSpan = endCol - startCol + 1;

    // 获取起始单元格
    const startCell = rows[startRow]?.querySelectorAll('td, th')[startCol];
    if (!startCell) {
      throw new OperationError('找不到起始单元格');
    }

    // 设置跨度
    (startCell as HTMLTableCellElement).rowSpan = rowSpan;
    (startCell as HTMLTableCellElement).colSpan = colSpan;

    // 删除其他单元格
    for (let i = startRow; i <= endRow; i++) {
      const row = rows[i];
      if (!row) continue;

      const cells = row.querySelectorAll('td, th');
      for (let j = startCol; j <= endCol; j++) {
        if (i === startRow && j === startCol) continue;
        cells[j]?.remove();
      }
    }

    logger.info('单元格已合并', { rowSpan, colSpan });
  }

  /**
   * 应用表格样式
   */
  applyTableStyle(table: HTMLTableElement, style: TableStyle): void {
    if (style.borderColor) {
      const cells = table.querySelectorAll('td, th');
      cells.forEach(cell => {
        (cell as HTMLElement).style.borderColor = style.borderColor!;
      });
    }

    if (style.borderWidth !== undefined) {
      const cells = table.querySelectorAll('td, th');
      cells.forEach(cell => {
        (cell as HTMLElement).style.borderWidth = `${style.borderWidth}px`;
      });
    }

    if (style.backgroundColor) {
      const cells = table.querySelectorAll('tbody td');
      cells.forEach(cell => {
        (cell as HTMLElement).style.backgroundColor = style.backgroundColor!;
      });
    }

    if (style.headerBackgroundColor) {
      const headers = table.querySelectorAll('thead th');
      headers.forEach(header => {
        (header as HTMLElement).style.backgroundColor = style.headerBackgroundColor!;
      });
    }

    if (style.alternateRowColor) {
      const rows = table.querySelectorAll('tbody tr');
      rows.forEach((row, index) => {
        if (index % 2 === 1) {
          (row as HTMLElement).style.backgroundColor = '#f9f9f9';
        }
      });
    }

    logger.debug('应用表格样式', style);
  }

  /**
   * 获取单元格
   */
  getCell(table: HTMLTableElement, position: CellPosition): HTMLTableCellElement | null {
    const rows = table.querySelectorAll('tr');
    const row = rows[position.row];
    if (!row) return null;

    const cells = row.querySelectorAll('td, th');
    return (cells[position.col] as HTMLTableCellElement) || null;
  }

  /**
   * 设置单元格内容
   */
  setCellContent(table: HTMLTableElement, position: CellPosition, content: string): void {
    const cell = this.getCell(table, position);
    if (cell) {
      cell.textContent = content;
      logger.debug('设置单元格内容', { position, content });
    }
  }

  /**
   * 获取表格尺寸
   */
  getTableSize(table: HTMLTableElement): { rows: number; cols: number } {
    const rows = table.querySelectorAll('tr');
    const firstRow = rows[0];
    const cols = firstRow ? firstRow.querySelectorAll('td, th').length : 0;

    return {
      rows: rows.length,
      cols,
    };
  }
}

