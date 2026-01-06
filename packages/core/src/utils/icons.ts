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
  ),

  // 上传
  upload: (opts?: IconOptions) => createSvg(
    '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
    opts
  ),

  // 文件夹
  folder: (opts?: IconOptions) => createSvg(
    '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
    opts
  ),

  // 文件夹打开
  folderOpen: (opts?: IconOptions) => createSvg(
    '<path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/>',
    opts
  ),

  // 历史记录
  history: (opts?: IconOptions) => createSvg(
    '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
    opts
  ),

  // 设置
  settings: (opts?: IconOptions) => createSvg(
    '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    opts
  ),

  // 月亮(暗色主题)
  moon: (opts?: IconOptions) => createSvg(
    '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    opts
  ),

  // 太阳(亮色主题)
  sun: (opts?: IconOptions) => createSvg(
    '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
    opts
  ),

  // 列表
  list: (opts?: IconOptions) => createSvg(
    '<line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/>',
    opts
  ),

  // 目录树
  listTree: (opts?: IconOptions) => createSvg(
    '<path d="M21 12h-8"/><path d="M21 6H8"/><path d="M21 18h-8"/><path d="M3 6v4c0 1.1.9 2 2 2h3"/><path d="M3 10v6c0 1.1.9 2 2 2h3"/>',
    opts
  ),

  // 信息
  info: (opts?: IconOptions) => createSvg(
    '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    opts
  ),

  // 复制
  copy: (opts?: IconOptions) => createSvg(
    '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    opts
  ),

  // 分享
  share: (opts?: IconOptions) => createSvg(
    '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/>',
    opts
  ),

  // 链接
  link: (opts?: IconOptions) => createSvg(
    '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    opts
  ),

  // 外部链接
  externalLink: (opts?: IconOptions) => createSvg(
    '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/>',
    opts
  ),

  // 勾选
  check: (opts?: IconOptions) => createSvg(
    '<polyline points="20 6 9 17 4 12"/>',
    opts
  ),

  // 垃圾桶
  trash: (opts?: IconOptions) => createSvg(
    '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
    opts
  ),

  // 眼睛
  eye: (opts?: IconOptions) => createSvg(
    '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    opts
  ),

  // 眼睛关闭
  eyeOff: (opts?: IconOptions) => createSvg(
    '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>',
    opts
  ),

  // 菜单
  menu: (opts?: IconOptions) => createSvg(
    '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
    opts
  ),

  // 更多
  moreHorizontal: (opts?: IconOptions) => createSvg(
    '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    opts
  ),

  // 更多(垂直)
  moreVertical: (opts?: IconOptions) => createSvg(
    '<circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>',
    opts
  ),

  // 图片
  image: (opts?: IconOptions) => createSvg(
    '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
    opts
  ),

  // 布局
  layout: (opts?: IconOptions) => createSvg(
    '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/>',
    opts
  ),

  // 缩略图
  grip: (opts?: IconOptions) => createSvg(
    '<circle cx="12" cy="5" r="1"/><circle cx="19" cy="5" r="1"/><circle cx="5" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="12" cy="19" r="1"/><circle cx="19" cy="19" r="1"/><circle cx="5" cy="19" r="1"/>',
    opts
  ),

  // 旋转
  rotateCw: (opts?: IconOptions) => createSvg(
    '<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>',
    opts
  ),

  // 帮助
  helpCircle: (opts?: IconOptions) => createSvg(
    '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
    opts
  ),

  // 书签
  bookmark: (opts?: IconOptions) => createSvg(
    '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>',
    opts
  ),

  // 高亮
  highlighter: (opts?: IconOptions) => createSvg(
    '<path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/>',
    opts
  ),

  // 键盘
  keyboard: (opts?: IconOptions) => createSvg(
    '<rect width="20" height="16" x="2" y="4" rx="2" ry="2"/><path d="M6 8h.001"/><path d="M10 8h.001"/><path d="M14 8h.001"/><path d="M18 8h.001"/><path d="M8 12h.001"/><path d="M12 12h.001"/><path d="M16 12h.001"/><path d="M7 16h10"/>',
    opts
  ),

  // 缩小窗口
  minimize: (opts?: IconOptions) => createSvg(
    '<path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>',
    opts
  ),

  // 展开
  expand: (opts?: IconOptions) => createSvg(
    '<path d="m21 21-6-6m6 6v-4.8m0 4.8h-4.8"/><path d="M3 16.2V21m0 0h4.8M3 21l6-6"/><path d="M21 7.8V3m0 0h-4.8M21 3l-6 6"/><path d="M3 7.8V3m0 0h4.8M3 3l6 6"/>',
    opts
  ),

  // 文档
  file: (opts?: IconOptions) => createSvg(
    '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/>',
    opts
  ),

  // Word 文件
  fileWord: (opts?: IconOptions) => createSvg(
    '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h2l1 4 1-4h2"/>',
    opts
  ),

  // 编辑
  edit: (opts?: IconOptions) => createSvg(
    '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
    opts
  ),

  // 删除
  trash2: (opts?: IconOptions) => createSvg(
    '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
    opts
  ),

  // 播放
  play: (opts?: IconOptions) => createSvg(
    '<polygon points="5 3 19 12 5 21 5 3"/>',
    opts
  ),

  // 暂停
  pause: (opts?: IconOptions) => createSvg(
    '<rect width="4" height="16" x="6" y="4"/><rect width="4" height="16" x="14" y="4"/>',
    opts
  ),

  // 全屏
  fullscreen: (opts?: IconOptions) => createSvg(
    '<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>',
    opts
  ),

  // 退出全屏
  exitFullscreen: (opts?: IconOptions) => createSvg(
    '<path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>',
    opts
  ),

  // 单页
  fileOne: (opts?: IconOptions) => createSvg(
    '<rect width="16" height="20" x="4" y="2" rx="2"/>',
    opts
  ),

  // 双页
  filesDouble: (opts?: IconOptions) => createSvg(
    '<rect width="12" height="16" x="2" y="4" rx="2"/><rect width="12" height="16" x="10" y="4" rx="2"/>',
    opts
  )
};

/**
 * 创建图标元素
 * @param iconFnOrSvg - 图标函数或 SVG 字符串
 * @param options - 图标选项
 */
export function createIconElement(
  iconFnOrSvg: ((opts?: IconOptions) => string) | string, 
  options?: IconOptions
): HTMLElement {
  const span = document.createElement('span');
  
  if (typeof iconFnOrSvg === 'string') {
    // 如果是字符串，假设它是 SVG 字符串或图标名称
    if (iconFnOrSvg.startsWith('<svg') || iconFnOrSvg.startsWith('<')) {
      span.innerHTML = iconFnOrSvg;
    } else {
      // 尝试从 Icons 对象中查找
      const iconFn = (Icons as Record<string, (opts?: IconOptions) => string>)[iconFnOrSvg];
      if (iconFn) {
        span.innerHTML = iconFn(options);
      } else {
        span.innerHTML = iconFnOrSvg; // fallback
      }
    }
  } else {
    span.innerHTML = iconFnOrSvg(options);
  }
  
  span.style.display = 'inline-flex';
  span.style.alignItems = 'center';
  span.style.justifyContent = 'center';
  return span;
}
