/**
 * @word-viewer/core 完整演示
 */

import { WordViewer } from '../../src';
import '../../src/styles/default.css';
import './styles.css';

// 存储查看器实例
const viewers: Map<string, WordViewer> = new Map();

// Tab 切换
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const tabName = target.dataset.tab;

    // 切换 tab 样式
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    target.classList.add('active');

    // 切换内容
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(tabName!)?.classList.add('active');
  });
});

// ================== 基础用法演示 ==================

// 1. 从文件加载
const fileInput = document.getElementById('fileInput') as HTMLInputElement;
const loadFileBtn = document.getElementById('loadFile');

loadFileBtn?.addEventListener('click', () => {
  const file = fileInput?.files?.[0];
  if (!file) {
    alert('请先选择文件');
    return;
  }

  if (!viewers.has('viewer1')) {
    const viewer = new WordViewer('#viewer1', {
      renderEngine: 'auto',
      theme: 'light',
      showToolbar: false,
    });
    viewers.set('viewer1', viewer);
  }

  const viewer = viewers.get('viewer1')!;
  viewer.loadFile(file)
    .then(() => console.log('文件加载成功'))
    .catch(err => console.error('文件加载失败', err));
});

// 2. 从URL加载
const urlInput = document.getElementById('urlInput') as HTMLInputElement;
const loadUrlBtn = document.getElementById('loadUrl');

loadUrlBtn?.addEventListener('click', () => {
  const url = urlInput?.value;
  if (!url) {
    alert('请输入URL');
    return;
  }

  if (!viewers.has('viewer2')) {
    const viewer = new WordViewer('#viewer2', {
      renderEngine: 'docx-preview',
      theme: 'light',
    });
    viewers.set('viewer2', viewer);
  }

  const viewer = viewers.get('viewer2')!;
  viewer.loadUrl(url)
    .then(() => console.log('URL加载成功'))
    .catch(err => console.error('URL加载失败', err));
});

// 3. 从ArrayBuffer加载
const loadBufferBtn = document.getElementById('loadBuffer');

loadBufferBtn?.addEventListener('click', async () => {
  try {
    // 创建示例 ArrayBuffer
    const response = await fetch('/samples/sample.docx');
    const buffer = await response.arrayBuffer();

    if (!viewers.has('viewer3')) {
      const viewer = new WordViewer('#viewer3', {
        renderEngine: 'mammoth',
        theme: 'light',
      });
      viewers.set('viewer3', viewer);
    }

    const viewer = viewers.get('viewer3')!;
    await viewer.loadBuffer(buffer);
    console.log('Buffer加载成功');
  } catch (err) {
    console.error('Buffer加载失败', err);
  }
});

// ================== 高级功能演示 ==================

// 缩放控制
let zoomViewer: WordViewer | null = null;
const zoomSlider = document.getElementById('zoomSlider') as HTMLInputElement;
const zoomValue = document.getElementById('zoomValue');

// 初始化缩放演示
async function initZoomDemo() {
  if (!zoomViewer) {
    zoomViewer = new WordViewer('#viewer4', {
      renderEngine: 'auto',
      initialZoom: 1.0,
    });
    viewers.set('viewer4', zoomViewer);

    // 加载示例文档
    await fetch('/samples/sample.docx')
      .then(res => res.arrayBuffer())
      .then(buffer => zoomViewer!.loadBuffer(buffer));
  }
}

document.getElementById('zoomIn')?.addEventListener('click', () => {
  if (!zoomViewer) {
    initZoomDemo();
    return;
  }
  const currentZoom = zoomViewer.getZoom();
  const newZoom = Math.min(2, currentZoom + 0.1);
  zoomViewer.setZoom(newZoom);
  zoomSlider.value = String(newZoom * 100);
  zoomValue!.textContent = `${Math.round(newZoom * 100)}%`;
});

document.getElementById('zoomOut')?.addEventListener('click', () => {
  if (!zoomViewer) {
    initZoomDemo();
    return;
  }
  const currentZoom = zoomViewer.getZoom();
  const newZoom = Math.max(0.5, currentZoom - 0.1);
  zoomViewer.setZoom(newZoom);
  zoomSlider.value = String(newZoom * 100);
  zoomValue!.textContent = `${Math.round(newZoom * 100)}%`;
});

document.getElementById('zoomReset')?.addEventListener('click', () => {
  if (!zoomViewer) {
    initZoomDemo();
    return;
  }
  zoomViewer.setZoom(1);
  zoomSlider.value = '100';
  zoomValue!.textContent = '100%';
});

zoomSlider?.addEventListener('input', () => {
  if (!zoomViewer) {
    initZoomDemo();
    return;
  }
  const zoom = parseInt(zoomSlider.value) / 100;
  zoomViewer.setZoom(zoom);
  zoomValue!.textContent = `${zoomSlider.value}%`;
});

// 搜索功能
let searchViewer: WordViewer | null = null;
const searchInput = document.getElementById('searchInput') as HTMLInputElement;
const searchBtn = document.getElementById('search');
const clearSearchBtn = document.getElementById('clearSearch');
const searchResults = document.getElementById('searchResults');

async function initSearchDemo() {
  if (!searchViewer) {
    searchViewer = new WordViewer('#viewer5');
    viewers.set('viewer5', searchViewer);

    await fetch('/samples/sample.docx')
      .then(res => res.arrayBuffer())
      .then(buffer => searchViewer!.loadBuffer(buffer));
  }
}

searchBtn?.addEventListener('click', () => {
  if (!searchViewer) {
    initSearchDemo();
    return;
  }

  const keyword = searchInput.value.trim();
  if (!keyword) {
    alert('请输入搜索关键词');
    return;
  }

  const results = searchViewer.search(keyword);

  if (results.length === 0) {
    searchResults!.innerHTML = '<p>未找到匹配结果</p>';
  } else {
    searchResults!.innerHTML = `
      <p>找到 ${results.length} 个匹配项:</p>
      <ul>
        ${results.map(r => `
          <li>
            页面 ${r.pageNumber}: "${r.context}"
          </li>
        `).join('')}
      </ul>
    `;
  }
});

clearSearchBtn?.addEventListener('click', () => {
  searchInput.value = '';
  searchResults!.innerHTML = '';
});

// 页面导航
let navViewer: WordViewer | null = null;
const pageInfo = document.getElementById('pageInfo');
const pageInput = document.getElementById('pageInput') as HTMLInputElement;

async function initNavDemo() {
  if (!navViewer) {
    navViewer = new WordViewer('#viewer6');
    viewers.set('viewer6', navViewer);

    await fetch('/samples/sample.docx')
      .then(res => res.arrayBuffer())
      .then(buffer => navViewer!.loadBuffer(buffer));

    updatePageInfo();
  }
}

function updatePageInfo() {
  if (!navViewer) return;
  const info = navViewer.getPageInfo();
  pageInfo!.textContent = `${info.current} / ${info.total}`;
  pageInput.max = String(info.total);
}

document.getElementById('firstPage')?.addEventListener('click', () => {
  if (!navViewer) {
    initNavDemo();
    return;
  }
  navViewer.goToPage(1);
  updatePageInfo();
});

document.getElementById('prevPage')?.addEventListener('click', () => {
  if (!navViewer) {
    initNavDemo();
    return;
  }
  const info = navViewer.getPageInfo();
  if (info.current > 1) {
    navViewer.goToPage(info.current - 1);
    updatePageInfo();
  }
});

document.getElementById('nextPage')?.addEventListener('click', () => {
  if (!navViewer) {
    initNavDemo();
    return;
  }
  const info = navViewer.getPageInfo();
  if (info.current < info.total) {
    navViewer.goToPage(info.current + 1);
    updatePageInfo();
  }
});

document.getElementById('lastPage')?.addEventListener('click', () => {
  if (!navViewer) {
    initNavDemo();
    return;
  }
  const info = navViewer.getPageInfo();
  navViewer.goToPage(info.total);
  updatePageInfo();
});

document.getElementById('goToPage')?.addEventListener('click', () => {
  if (!navViewer) {
    initNavDemo();
    return;
  }
  const page = parseInt(pageInput.value);
  if (page) {
    navViewer.goToPage(page);
    updatePageInfo();
  }
});

// ================== 事件处理演示 ==================

let eventViewer: WordViewer | null = null;
const eventLog = document.getElementById('eventLog');

function logEvent(event: string, data?: any) {
  const time = new Date().toLocaleTimeString();
  const entry = document.createElement('div');
  entry.className = 'event-entry';
  entry.innerHTML = `
    <span class="event-time">[${time}]</span>
    <span class="event-name">${event}</span>
    ${data ? `<span class="event-data">${JSON.stringify(data)}</span>` : ''}
  `;
  eventLog?.appendChild(entry);
  eventLog?.scrollTo(0, eventLog.scrollHeight);
}

document.getElementById('loadEventDemo')?.addEventListener('click', async () => {
  if (!eventViewer) {
    eventViewer = new WordViewer('#viewer7');
    viewers.set('viewer7', eventViewer);

    // 注册所有事件
    eventViewer.on('loaded', (data) => logEvent('loaded', data));
    eventViewer.on('error', (error) => logEvent('error', error));
    eventViewer.on('progress', (progress) => logEvent('progress', progress));
    eventViewer.on('page-change', (info) => logEvent('page-change', info));
    eventViewer.on('zoom', (level) => logEvent('zoom', level));
    eventViewer.on('edit-start', () => logEvent('edit-start'));
    eventViewer.on('edit-end', () => logEvent('edit-end'));
    eventViewer.on('changed', () => logEvent('changed'));
  }

  // 清空日志
  eventLog!.innerHTML = '';
  logEvent('开始加载文档');

  try {
    const response = await fetch('/samples/sample.docx');
    const buffer = await response.arrayBuffer();
    await eventViewer.loadBuffer(buffer);
  } catch (err) {
    logEvent('加载失败', err);
  }
});

// ================== 导出功能演示 ==================

let exportViewer: WordViewer | null = null;

document.getElementById('loadExportDemo')?.addEventListener('click', async () => {
  if (!exportViewer) {
    exportViewer = new WordViewer('#viewer8');
    viewers.set('viewer8', exportViewer);
  }

  try {
    const response = await fetch('/samples/sample.docx');
    const buffer = await response.arrayBuffer();
    await exportViewer.loadBuffer(buffer);
    alert('文档已加载，可以开始导出');
  } catch (err) {
    alert('加载失败: ' + err);
  }
});

document.getElementById('exportPDF')?.addEventListener('click', async () => {
  if (!exportViewer) {
    alert('请先加载文档');
    return;
  }

  try {
    const blob = await exportViewer.exportToPDF();
    downloadFile(blob, 'document.pdf');
  } catch (err) {
    alert('导出PDF失败: ' + err);
  }
});

document.getElementById('exportHTML')?.addEventListener('click', () => {
  if (!exportViewer) {
    alert('请先加载文档');
    return;
  }

  try {
    const html = exportViewer.exportToHTML();
    const blob = new Blob([html], { type: 'text/html' });
    downloadFile(blob, 'document.html');
  } catch (err) {
    alert('导出HTML失败: ' + err);
  }
});

document.getElementById('exportDocx')?.addEventListener('click', async () => {
  if (!exportViewer) {
    alert('请先加载文档');
    return;
  }

  try {
    const blob = await exportViewer.exportToDocx();
    downloadFile(blob, 'document.docx');
  } catch (err) {
    alert('导出DOCX失败: ' + err);
  }
});

document.getElementById('exportText')?.addEventListener('click', async () => {
  if (!exportViewer) {
    alert('请先加载文档');
    return;
  }

  try {
    const text = await exportViewer.export({ format: 'txt' });
    const blob = new Blob([text as string], { type: 'text/plain' });
    downloadFile(blob, 'document.txt');
  } catch (err) {
    alert('导出文本失败: ' + err);
  }
});

// ================== 编辑功能演示 ==================

let editViewer: WordViewer | null = null;
let editMode = false;
const editStatus = document.getElementById('editStatus');

document.getElementById('loadEditDemo')?.addEventListener('click', async () => {
  if (!editViewer) {
    editViewer = new WordViewer('#viewer9', {
      editable: false,
      theme: 'light',
    });
    viewers.set('viewer9', editViewer);
  }

  try {
    const response = await fetch('/samples/sample.docx');
    const buffer = await response.arrayBuffer();
    await editViewer.loadBuffer(buffer);
    updateEditStatus();
    alert('文档已加载，点击"切换编辑模式"开始编辑');
  } catch (err) {
    alert('加载失败: ' + err);
  }
});

document.getElementById('toggleEdit')?.addEventListener('click', () => {
  if (!editViewer) {
    alert('请先加载文档');
    return;
  }

  editMode = !editMode;
  if (editMode) {
    editViewer.enableEdit();
  } else {
    editViewer.disableEdit();
  }
  updateEditStatus();
});

document.getElementById('bold')?.addEventListener('click', () => {
  if (!editViewer || !editMode) {
    alert('请先启用编辑模式');
    return;
  }
  editViewer.applyFormat({ bold: true });
});

document.getElementById('italic')?.addEventListener('click', () => {
  if (!editViewer || !editMode) {
    alert('请先启用编辑模式');
    return;
  }
  editViewer.applyFormat({ italic: true });
});

document.getElementById('underline')?.addEventListener('click', () => {
  if (!editViewer || !editMode) {
    alert('请先启用编辑模式');
    return;
  }
  editViewer.applyFormat({ underline: true });
});

document.getElementById('insertText')?.addEventListener('click', () => {
  if (!editViewer || !editMode) {
    alert('请先启用编辑模式');
    return;
  }
  const text = prompt('输入要插入的文本:');
  if (text) {
    editViewer.insertText(text);
  }
});

document.getElementById('insertImage')?.addEventListener('click', () => {
  if (!editViewer || !editMode) {
    alert('请先启用编辑模式');
    return;
  }

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      editViewer!.insertImage(file, { width: 300, height: 200 });
    }
  };
  input.click();
});

document.getElementById('undo')?.addEventListener('click', () => {
  if (!editViewer || !editMode) {
    alert('请先启用编辑模式');
    return;
  }
  editViewer.undo();
});

document.getElementById('redo')?.addEventListener('click', () => {
  if (!editViewer || !editMode) {
    alert('请先启用编辑模式');
    return;
  }
  editViewer.redo();
});

document.getElementById('save')?.addEventListener('click', async () => {
  if (!editViewer) {
    alert('请先加载文档');
    return;
  }

  try {
    const blob = await editViewer.exportToDocx();
    downloadFile(blob, 'edited-document.docx');
    alert('文档已保存');
  } catch (err) {
    alert('保存失败: ' + err);
  }
});

function updateEditStatus() {
  if (!editViewer) return;

  const state = editViewer.getEditState();
  editStatus!.innerHTML = `
    <p>编辑模式: ${state.isEditing ? '开启' : '关闭'}</p>
    <p>有修改: ${state.isDirty ? '是' : '否'}</p>
    <p>可撤销: ${state.canUndo ? '是' : '否'}</p>
    <p>可重做: ${state.canRedo ? '是' : '否'}</p>
  `;
}

// ================== API 测试演示 ==================

let apiViewer: WordViewer | null = null;
const apiOutput = document.getElementById('apiOutput');

function outputAPI(method: string, result: any) {
  apiOutput!.textContent = `${method}:\n${JSON.stringify(result, null, 2)}`;
}

document.getElementById('testInit')?.addEventListener('click', () => {
  if (apiViewer) {
    apiViewer.destroy();
  }

  apiViewer = new WordViewer('#viewer10', {
    renderEngine: 'auto',
    editable: false,
    initialZoom: 1.0,
    showToolbar: false,
    theme: 'light',
  });
  viewers.set('viewer10', apiViewer);

  outputAPI('new WordViewer()', {
    status: 'initialized',
    container: '#viewer10',
  });
});

document.getElementById('testLoad')?.addEventListener('click', async () => {
  if (!apiViewer) {
    alert('请先初始化');
    return;
  }

  try {
    const response = await fetch('/samples/sample.docx');
    const buffer = await response.arrayBuffer();
    await apiViewer.loadBuffer(buffer);
    outputAPI('loadBuffer()', { status: 'loaded' });
  } catch (err) {
    outputAPI('loadBuffer()', { error: String(err) });
  }
});

document.getElementById('testGetInfo')?.addEventListener('click', () => {
  if (!apiViewer) {
    alert('请先初始化并加载文档');
    return;
  }

  const info = apiViewer.getDocumentInfo();
  outputAPI('getDocumentInfo()', info);
});

document.getElementById('testGetOptions')?.addEventListener('click', () => {
  if (!apiViewer) {
    alert('请先初始化');
    return;
  }

  const options = apiViewer.getOptions();
  outputAPI('getOptions()', options);
});

document.getElementById('testUpdateOptions')?.addEventListener('click', () => {
  if (!apiViewer) {
    alert('请先初始化');
    return;
  }

  const newOptions = {
    theme: 'dark' as const,
    editable: true,
  };

  apiViewer.updateOptions(newOptions);
  outputAPI('updateOptions()', {
    updated: newOptions,
    current: apiViewer.getOptions(),
  });
});

document.getElementById('testDestroy')?.addEventListener('click', () => {
  if (!apiViewer) {
    alert('请先初始化');
    return;
  }

  apiViewer.destroy();
  viewers.delete('viewer10');
  apiViewer = null;
  outputAPI('destroy()', { status: 'destroyed' });
});

// ================== 工具函数 ==================

function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// 清理
window.addEventListener('beforeunload', () => {
  viewers.forEach(viewer => viewer.destroy());
  viewers.clear();
});

