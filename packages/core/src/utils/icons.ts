/**
 * SVG 图标集合 - 基于 Lucide 图标设计
 */

export interface IconOptions {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

function createSvg(paths: string, options: IconOptions = {}): string {
  const { size = 18, color = 'currentColor', strokeWidth = 2 } = options;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}

export const Icons = {
  // 目录
  bookOpen: (opts?: IconOptions) => createSvg(
    '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    opts
  ),

  // 缩小
  minus: (opts?: IconOptions) => createSvg(
    '<path d="M5 12h14"/>',
    opts
  ),

  // 放大
  plus: (opts?: IconOptions) => createSvg(
    '<path d="M5 12h14"/><path d="M12 5v14"/>',
    opts
  ),

  // 适应宽度
  arrowLeftRight: (opts?: IconOptions) => createSvg(
    '<path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/>',
    opts
  ),

  // 适应页面
  maximize: (opts?: IconOptions) => createSvg(
    '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
    opts
  ),

  // 搜索
  search: (opts?: IconOptions) => createSvg(
    '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    opts
  ),

  // 上一个
  chevronUp: (opts?: IconOptions) => createSvg(
    '<path d="m18 15-6-6-6 6"/>',
    opts
  ),

  // 下一个
  chevronDown: (opts?: IconOptions) => createSvg(
    '<path d="m6 9 6 6 6-6"/>',
    opts
  ),

  // 主题/调色板
  palette: (opts?: IconOptions) => createSvg(
    '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/>',
    opts
  ),

  // 打印
  printer: (opts?: IconOptions) => createSvg(
    '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/>',
    opts
  ),

  // 关闭
  x: (opts?: IconOptions) => createSvg(
    '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    opts
  ),

  // 文件
  fileText: (opts?: IconOptions) => createSvg(
    '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/>',
    opts
  ),

  // 侧边栏
  panelLeft: (opts?: IconOptions) => createSvg(
    '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/>',
    opts
  ),

  // 加载中
  loader: (opts?: IconOptions) => createSvg(
    '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>',
    opts
  ),

  // 警告
  alertCircle: (opts?: IconOptions) => createSvg(
    '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',
    opts
  ),

  // 下载
  download: (opts?: IconOptions) => createSvg(
    '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
    opts
  ),

  // 放大镜加
  zoomIn: (opts?: IconOptions) => createSvg(
    '<circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="11" x2="11" y1="8" y2="14"/><line x1="8" x2="14" y1="11" y2="11"/>',
    opts
  ),

  // 放大镜减
  zoomOut: (opts?: IconOptions) => createSvg(
    '<circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="8" x2="14" y1="11" y2="11"/>',
    opts
  ),

  // 左箭头
  chevronLeft: (opts?: IconOptions) => createSvg(
    '<path d="m15 18-6-6 6-6"/>',
    opts
  ),

  // 右箭头
  chevronRight: (opts?: IconOptions) => createSvg(
    '<path d="m9 18 6-6-6-6"/>',
    opts
  ),

  // 文字/水印
  type: (opts?: IconOptions) => createSvg(
    '<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/>',
    opts
  )
};

/**
 * 创建图标元素
 */
export function createIconElement(iconFn: (opts?: IconOptions) => string, options?: IconOptions): HTMLElement {
  const span = document.createElement('span');
  span.innerHTML = iconFn(options);
  span.style.display = 'inline-flex';
  span.style.alignItems = 'center';
  span.style.justifyContent = 'center';
  return span;
}
