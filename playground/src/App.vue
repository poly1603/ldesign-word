<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted, computed } from 'vue';
import { renderAsync } from 'docx-preview';
import {
  Upload,
  FileText,
  Sun,
  Moon,
  Search,
  X,
  ChevronUp,
  ChevronDown,
  ListTree,
  Settings,
  Info,
  Keyboard,
  Clock,
  Trash2,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Printer,
  Download,
  Type,
  RotateCw,
  Copy,
  Share2,
  BookOpen,
  PanelLeftClose,
  PanelLeft,
  FileImage,
  FileCode,
  FileDown,
  Bookmark,
  MessageSquare,
  Highlighter,
  LayoutGrid,
  Presentation,
  Columns,
  SplitSquareVertical,
  ScrollText,
  Fullscreen,
  BookMarked,
  MoreHorizontal
} from 'lucide-vue-next';

// ============== State ==============
const file = ref<File | null>(null);
const currentFile = ref<File | null>(null);
const isLoading = ref(false);
const isDarkTheme = ref(false);
const isSidebarCollapsed = ref(false);
const isDragging = ref(false);
const showSearch = ref(false);
const showToc = ref(false);
const showSettings = ref(false);
const showInfo = ref(false);
const showKeyboardShortcuts = ref(false);
const searchQuery = ref('');
const searchResults = ref<number>(0);
const currentSearchIndex = ref(0);
const zoomLevel = ref(100);
const currentPage = ref(1);
const totalPages = ref(1);
const recentFiles = ref<{ name: string; size: number; date: Date; blob?: Blob }[]>([]);
const tocItems = ref<{ id: string; text: string; level: number }[]>([]);

// 新功能状态
const showThumbnails = ref(false);
const showBookmarks = ref(false);
const showComments = ref(false);
const showAnnotations = ref(false);
const showFootnotes = ref(false);
const showExportMenu = ref(false);
const showViewModeMenu = ref(false);
const viewMode = ref<'continuous' | 'single' | 'double' | 'presentation'>('continuous');
const isFullscreen = ref(false);
const annotationEnabled = ref(true);

// Refs
const viewerRef = ref<HTMLElement>();
const fileInputRef = ref<HTMLInputElement>();
const searchInputRef = ref<HTMLInputElement>();

// ============== Computed ==============
const formattedFileSize = computed(() => {
  if (!currentFile.value) return '';
  const bytes = currentFile.value.size;
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
});

const pageInfo = computed(() => `${currentPage.value} / ${totalPages.value}`);

// ============== Methods ==============
function openFileDialog() {
  fileInputRef.value?.click();
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    loadFile(input.files[0]);
    input.value = '';
  }
}

async function loadFile(newFile: File) {
  file.value = newFile;
  
  // Add to recent files (store blob for re-opening)
  const existingIndex = recentFiles.value.findIndex(f => f.name === newFile.name);
  if (existingIndex !== -1) {
    // Update existing entry
    recentFiles.value[existingIndex].blob = newFile;
    recentFiles.value[existingIndex].date = new Date();
    // Move to top
    const item = recentFiles.value.splice(existingIndex, 1)[0];
    recentFiles.value.unshift(item);
  } else {
    recentFiles.value.unshift({
      name: newFile.name,
      size: newFile.size,
      date: new Date(),
      blob: newFile
    });
    // Keep only last 10 files
    if (recentFiles.value.length > 10) {
      recentFiles.value.pop();
    }
  }
  // Save metadata to localStorage (not blobs)
  try {
    const toSave = recentFiles.value.map(f => ({ name: f.name, size: f.size, date: f.date }));
    localStorage.setItem('word-viewer-recent', JSON.stringify(toSave));
  } catch (e) {}
}

function clearRecentFiles() {
  recentFiles.value = [];
  localStorage.removeItem('word-viewer-recent');
}

function openRecentFile(item: { name: string; size: number; date: Date; blob?: Blob }) {
  if (item.blob) {
    const recentFile = new File([item.blob], item.name, { type: item.blob.type });
    file.value = recentFile;
    currentFile.value = recentFile;
  }
}

function toggleTheme() {
  isDarkTheme.value = !isDarkTheme.value;
  document.documentElement.setAttribute('data-theme', isDarkTheme.value ? 'dark' : 'light');
  localStorage.setItem('word-viewer-theme', isDarkTheme.value ? 'dark' : 'light');
}

function toggleSidebar() {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
}

function handleDragOver(e: DragEvent) {
  e.preventDefault();
  isDragging.value = true;
}

function handleDragLeave() {
  isDragging.value = false;
}

function handleDrop(e: DragEvent) {
  e.preventDefault();
  isDragging.value = false;
  
  const files = e.dataTransfer?.files;
  if (files && files[0]) {
    const droppedFile = files[0];
    if (droppedFile.name.endsWith('.docx') || droppedFile.name.endsWith('.doc')) {
      loadFile(droppedFile);
    }
  }
}

function toggleSearch() {
  showSearch.value = !showSearch.value;
  showToc.value = false;
  showSettings.value = false;
  if (showSearch.value) {
    nextTick(() => searchInputRef.value?.focus());
  }
}

function toggleToc() {
  showToc.value = !showToc.value;
  showSearch.value = false;
  showSettings.value = false;
}

function toggleSettings() {
  showSettings.value = !showSettings.value;
  showSearch.value = false;
  showToc.value = false;
}

function performSearch() {
  if (!searchQuery.value || !viewerRef.value) return;
  
  // Simple text search implementation
  const text = viewerRef.value.textContent || '';
  const query = searchQuery.value.toLowerCase();
  let count = 0;
  let index = 0;
  while ((index = text.toLowerCase().indexOf(query, index)) !== -1) {
    count++;
    index += query.length;
  }
  searchResults.value = count;
  currentSearchIndex.value = count > 0 ? 1 : 0;
}

function nextSearchResult() {
  if (currentSearchIndex.value < searchResults.value) {
    currentSearchIndex.value++;
  } else {
    currentSearchIndex.value = 1;
  }
}

function prevSearchResult() {
  if (currentSearchIndex.value > 1) {
    currentSearchIndex.value--;
  } else {
    currentSearchIndex.value = searchResults.value;
  }
}

function clearSearch() {
  searchQuery.value = '';
  searchResults.value = 0;
  currentSearchIndex.value = 0;
}

function handleZoom(delta: number) {
  const newZoom = Math.min(200, Math.max(50, zoomLevel.value + delta));
  zoomLevel.value = newZoom;
  applyZoom(newZoom);
}

function resetZoom() {
  zoomLevel.value = 100;
  applyZoom(100);
}

function applyZoom(scale: number) {
  if (!viewerRef.value) return;
  const docWrapper = viewerRef.value.querySelector('.docx-wrapper') as HTMLElement;
  if (docWrapper) {
    docWrapper.style.transform = `scale(${scale / 100})`;
    docWrapper.style.transformOrigin = 'top center';
  }
}

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value && viewerRef.value) {
    currentPage.value = page;
    const pages = viewerRef.value.querySelectorAll('.docx-wrapper > section.docx');
    const targetPage = pages[page - 1];
    if (targetPage) {
      targetPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

function downloadFile() {
  if (currentFile.value) {
    const url = URL.createObjectURL(currentFile.value);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.value.name;
    a.click();
    URL.revokeObjectURL(url);
  }
}

function printDocument() {
  // 只打印文档内容
  if (!viewerRef.value) return;
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('请允许弹出窗口以使用打印功能');
    return;
  }
  
  const docContent = viewerRef.value.innerHTML;
  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map(el => el.outerHTML)
    .join('\n');
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${currentFile.value?.name || 'Word Viewer - 文档预览'}</title>
      ${styles}
      <style>
        body { margin: 0; padding: 20px; background: white; }
        .docx-wrapper { background: white !important; }
        @media print {
          body { padding: 0; }
          .docx-wrapper { box-shadow: none !important; }
        }
      </style>
    </head>
    <body>
      ${docContent}
    </body>
    </html>
  `);
  printWindow.document.close();
  
  printWindow.onload = () => {
    printWindow.print();
    printWindow.onafterprint = () => printWindow.close();
  };
}

// ============== 新功能方法 ==============

// 导出功能
async function exportToPdf() {
  if (!currentFile.value || !viewerRef.value) return;
  showExportMenu.value = false;
  
  // 通过打印对话框导出为 PDF（选择"保存为 PDF"打印机）
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('请允许弹出窗口以导出 PDF');
    return;
  }
  
  const docContent = viewerRef.value.innerHTML;
  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map(el => el.outerHTML)
    .join('\n');
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${currentFile.value.name.replace(/\.docx?$/, '.pdf')}</title>
      ${styles}
      <style>
        body { margin: 0; padding: 20px; background: white; }
        .docx-wrapper { background: white !important; }
        @media print {
          body { padding: 0; }
          .docx-wrapper { box-shadow: none !important; }
        }
      </style>
    </head>
    <body>
      <p style="text-align:center;color:#666;font-size:12px;margin-bottom:20px;">提示：请在打印对话框中选择"保存为 PDF"打印机</p>
      ${docContent}
    </body>
    </html>
  `);
  printWindow.document.close();
  
  printWindow.onload = () => {
    printWindow.print();
  };
}

async function exportToHtml() {
  if (!currentFile.value) return;
  showExportMenu.value = false;
  
  // 简单实现：导出当前渲染的 HTML
  if (viewerRef.value) {
    const html = viewerRef.value.innerHTML;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.value.name.replace(/\.docx?$/, '.html');
    a.click();
    URL.revokeObjectURL(url);
  }
}

async function exportToText() {
  if (!currentFile.value) return;
  showExportMenu.value = false;
  
  if (viewerRef.value) {
    const text = viewerRef.value.textContent || '';
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.value.name.replace(/\.docx?$/, '.txt');
    a.click();
    URL.revokeObjectURL(url);
  }
}

// 视图模式
function setViewMode(mode: 'continuous' | 'single' | 'double' | 'presentation') {
  viewMode.value = mode;
  showViewModeMenu.value = false;
  
  // 应用视图模式样式
  if (viewerRef.value) {
    const wrapper = viewerRef.value.querySelector('.docx-wrapper') as HTMLElement;
    if (wrapper) {
      wrapper.classList.remove('view-mode-continuous', 'view-mode-single', 'view-mode-double', 'view-mode-presentation');
      wrapper.classList.add(`view-mode-${mode}`);
    }
  }
}

// 全屏
async function toggleFullscreen() {
  if (!document.fullscreenElement) {
    await document.documentElement.requestFullscreen();
    isFullscreen.value = true;
  } else {
    await document.exitFullscreen();
    isFullscreen.value = false;
  }
}

// 演示模式
function enterPresentationMode() {
  setViewMode('presentation');
  toggleFullscreen();
}

// 切换面板
function togglePanel(panel: 'thumbnails' | 'bookmarks' | 'comments' | 'annotations' | 'footnotes') {
  // 关闭其他面板
  showThumbnails.value = panel === 'thumbnails' ? !showThumbnails.value : false;
  showBookmarks.value = panel === 'bookmarks' ? !showBookmarks.value : false;
  showComments.value = panel === 'comments' ? !showComments.value : false;
  showAnnotations.value = panel === 'annotations' ? !showAnnotations.value : false;
  showFootnotes.value = panel === 'footnotes' ? !showFootnotes.value : false;
  showToc.value = false;
  showSearch.value = false;
}

// 切换标注功能
function toggleAnnotation() {
  annotationEnabled.value = !annotationEnabled.value;
}

// 添加书签
function addBookmark() {
  const name = prompt('请输入书签名称：');
  if (name) {
    alert(`已添加书签: ${name}\n(完整功能需要集成 @word-viewer/core 的 BookmarkManager)`);
  }
}

// 复制选中内容
function copySelection() {
  const selection = window.getSelection();
  if (selection && selection.toString()) {
    navigator.clipboard.writeText(selection.toString());
    alert('已复制到剪贴板');
  }
}

function extractToc() {
  if (!viewerRef.value) return;
  
  const items: { id: string; text: string; level: number }[] = [];
  
  // 方法1: 查找标准的 h1-h6 标签
  const headings = viewerRef.value.querySelectorAll('h1, h2, h3, h4, h5, h6');
  headings.forEach((h, i) => {
    const id = `toc-heading-${i}`;
    h.id = id;
    items.push({
      id,
      text: h.textContent?.trim() || '',
      level: parseInt(h.tagName[1])
    });
  });
  
  // 方法2: 查找 docx-preview 生成的标题样式段落
  // docx-preview 可能会把 Word 标题样式转换为带有 Heading 类名的段落
  if (items.length === 0) {
    const styledHeadings = viewerRef.value.querySelectorAll('[class*="Heading"], [class*="heading"], [class*="\u6807\u9898"]');
    styledHeadings.forEach((el, i) => {
      const id = `toc-styled-${i}`;
      el.id = id;
      const className = el.className || '';
      // 尝试从类名中提取级别
      let level = 1;
      const levelMatch = className.match(/[Hh]eading(\d)|\u6807\u9898\s*(\d)/);
      if (levelMatch) {
        level = parseInt(levelMatch[1] || levelMatch[2]) || 1;
      }
      items.push({
        id,
        text: el.textContent?.trim() || '',
        level: Math.min(level, 6)
      });
    });
  }
  
  // 方法3: 查找带有较大字号或加粗的段落作为潜在标题
  if (items.length === 0) {
    const paragraphs = viewerRef.value.querySelectorAll('p');
    paragraphs.forEach((p, i) => {
      const style = window.getComputedStyle(p);
      const fontSize = parseFloat(style.fontSize);
      const fontWeight = style.fontWeight;
      const text = p.textContent?.trim() || '';
      
      // 只考虑较短的加粗或大字体文本作为标题
      if (text.length > 0 && text.length < 100 && (fontSize >= 18 || fontWeight === 'bold' || parseInt(fontWeight) >= 600)) {
        const id = `toc-para-${i}`;
        p.id = id;
        // 根据字号确定级别
        let level = 3;
        if (fontSize >= 24) level = 1;
        else if (fontSize >= 20) level = 2;
        
        items.push({
          id,
          text,
          level
        });
      }
    });
  }
  
  // 过滤掉空文本
  tocItems.value = items.filter(item => item.text.length > 0);
}

function scrollToHeading(id: string) {
  const element = document.getElementById(id);
  element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function handleKeydown(e: KeyboardEvent) {
  // Ctrl/Cmd + F: Search
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    e.preventDefault();
    toggleSearch();
  }
  // Ctrl/Cmd + P: Print
  if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
    e.preventDefault();
    printDocument();
  }
  // Escape: Close panels
  if (e.key === 'Escape') {
    showSearch.value = false;
    showToc.value = false;
    showSettings.value = false;
    showInfo.value = false;
    showKeyboardShortcuts.value = false;
    showExportMenu.value = false;
  }
  // +/- for zoom
  if ((e.ctrlKey || e.metaKey) && e.key === '=') {
    e.preventDefault();
    handleZoom(10);
  }
  if ((e.ctrlKey || e.metaKey) && e.key === '-') {
    e.preventDefault();
    handleZoom(-10);
  }
}

// 点击外部关闭下拉菜单
function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (!target.closest('.dropdown-wrapper')) {
    showExportMenu.value = false;
  }
}

// ============== Lifecycle ==============
onMounted(() => {
  // Load saved theme
  const savedTheme = localStorage.getItem('word-viewer-theme');
  if (savedTheme === 'dark') {
    isDarkTheme.value = true;
    document.documentElement.setAttribute('data-theme', 'dark');
  }
  
  // Load recent files
  try {
    const saved = localStorage.getItem('word-viewer-recent');
    if (saved) {
      recentFiles.value = JSON.parse(saved);
    }
  } catch (e) {}
  
  // Keyboard shortcuts & click outside
  document.addEventListener('keydown', handleKeydown);
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  document.removeEventListener('click', handleClickOutside);
});

// ============== Watchers ==============
watch(file, async (newFile) => {
  if (!newFile || !viewerRef.value) return;
  
  currentFile.value = newFile;
  isLoading.value = true;
  
  try {
    viewerRef.value.innerHTML = '';
    
    await renderAsync(newFile, viewerRef.value, undefined, {
      className: 'docx-wrapper',
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
      ignoreFonts: false,
      breakPages: true,
      ignoreLastRenderedPageBreak: true,
      trimXmlDeclaration: true,
      useBase64URL: true,
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true,
      renderEndnotes: true
    });
    
    await nextTick();
    
    // Update page count
    const pages = viewerRef.value.querySelectorAll('.docx-wrapper > section.docx');
    totalPages.value = pages.length || 1;
    currentPage.value = 1;
    
    // Extract TOC
    extractToc();
    
  } catch (error) {
    console.error('渲染失败', error);
  } finally {
    isLoading.value = false;
  }
});

watch(searchQuery, () => {
  performSearch();
});
</script>

<template>
  <div class="app" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ collapsed: isSidebarCollapsed }">
      <!-- Logo -->
      <div class="sidebar-header">
        <div class="logo">
          <div class="logo-icon">
            <BookOpen :size="20" />
          </div>
          <span v-show="!isSidebarCollapsed" class="logo-text">Word Viewer</span>
        </div>
        <button 
          class="sidebar-toggle" 
          @click="toggleSidebar"
          :title="isSidebarCollapsed ? '展开侧边栏' : '收起侧边栏'"
        >
          <PanelLeftClose v-if="!isSidebarCollapsed" :size="18" />
          <PanelLeft v-else :size="18" />
        </button>
      </div>
      
      <!-- Upload Section -->
      <div class="sidebar-section">
        <input
          ref="fileInputRef"
          type="file"
          accept=".docx,.doc"
          @change="handleFileChange"
          class="sr-only"
        />
        
        <button 
          class="upload-btn" 
          @click="openFileDialog" 
          :disabled="isLoading"
          :title="isSidebarCollapsed ? '上传文档' : undefined"
        >
          <Upload :size="18" />
          <span v-show="!isSidebarCollapsed">{{ isLoading ? '加载中...' : '上传文档' }}</span>
        </button>
      </div>
      
      <!-- Current File -->
      <div v-if="currentFile && !isSidebarCollapsed" class="sidebar-section">
        <div class="section-title">当前文档</div>
        <div class="file-item active">
          <div class="file-icon">
            <FileText :size="18" />
          </div>
          <div class="file-info">
            <div class="file-name">{{ currentFile.name }}</div>
            <div class="file-meta">{{ formattedFileSize }}</div>
          </div>
        </div>
      </div>
      
      <!-- Recent Files -->
      <div v-if="recentFiles.length > 0 && !isSidebarCollapsed" class="sidebar-section">
        <div class="section-header">
          <div class="section-title">
            <Clock :size="14" />
            <span>最近文件</span>
          </div>
          <button class="section-action" @click="clearRecentFiles" title="清除历史">
            <Trash2 :size="14" />
          </button>
        </div>
        <div class="recent-files">
          <div 
            v-for="(item, index) in recentFiles.slice(0, 5)" 
            :key="index"
            class="file-item"
            :class="{ clickable: item.blob }"
            @click="openRecentFile(item)"
            :title="item.blob ? '点击打开' : '文件不可用（需重新上传）'"
          >
            <div class="file-icon">
              <FileText :size="16" />
            </div>
            <div class="file-info">
              <div class="file-name">{{ item.name }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Sidebar Footer -->
      <div class="sidebar-footer">
        <button 
          class="sidebar-btn" 
          @click="toggleTheme" 
          :title="isDarkTheme ? '切换亮色模式' : '切换暗色模式'"
        >
          <Moon v-if="!isDarkTheme" :size="18" />
          <Sun v-else :size="18" />
        </button>
        <button 
          v-show="!isSidebarCollapsed"
          class="sidebar-btn" 
          @click="showKeyboardShortcuts = true" 
          title="键盘快捷键"
        >
          <Keyboard :size="18" />
        </button>
        <button 
          v-show="!isSidebarCollapsed"
          class="sidebar-btn" 
          @click="showInfo = true" 
          title="关于"
        >
          <Info :size="18" />
        </button>
      </div>
    </aside>
    
    <!-- Main Content -->
    <div class="main-content">
      <!-- Toolbar -->
      <header class="toolbar">
        <div class="toolbar-left">
          <!-- File Actions -->
          <div class="toolbar-group">
            <button class="toolbar-btn" @click="openFileDialog" title="打开文件">
              <FolderOpen :size="18" />
            </button>
          </div>
          
          <div class="toolbar-divider"></div>
          
          <!-- Zoom Controls -->
          <div class="toolbar-group">
            <button class="toolbar-btn" @click="handleZoom(-10)" title="缩小" :disabled="zoomLevel <= 50">
              <ZoomOut :size="18" />
            </button>
            <button class="zoom-label" @click="resetZoom" title="重置缩放">
              {{ zoomLevel }}%
            </button>
            <button class="toolbar-btn" @click="handleZoom(10)" title="放大" :disabled="zoomLevel >= 200">
              <ZoomIn :size="18" />
            </button>
          </div>
          
          <div class="toolbar-divider"></div>
          
          <!-- Page Navigation -->
          <div class="toolbar-group" v-if="currentFile">
            <button class="toolbar-btn" @click="goToPage(currentPage - 1)" :disabled="currentPage <= 1" title="上一页">
              <ChevronLeft :size="18" />
            </button>
            <span class="page-info">{{ pageInfo }}</span>
            <button class="toolbar-btn" @click="goToPage(currentPage + 1)" :disabled="currentPage >= totalPages" title="下一页">
              <ChevronRight :size="18" />
            </button>
          </div>
        </div>
        
        <div class="toolbar-right">
          <!-- Feature Buttons -->
          <div class="toolbar-group">
            <button 
              class="toolbar-btn" 
              :class="{ active: showSearch }" 
              @click="toggleSearch" 
              title="搜索 (Ctrl+F)"
            >
              <Search :size="18" />
            </button>
            <button 
              class="toolbar-btn" 
              :class="{ active: showToc }" 
              @click="toggleToc" 
              title="文档目录"
              :disabled="!currentFile"
            >
              <ListTree :size="18" />
            </button>
          </div>
          
          <div class="toolbar-divider"></div>
          
          <!-- Document Actions -->
          <div class="toolbar-group">
            <button class="toolbar-btn" @click="printDocument" title="打印文档 (Ctrl+P)" :disabled="!currentFile">
              <Printer :size="18" />
            </button>
            
            <!-- 导出下拉菜单 -->
            <div class="dropdown-wrapper">
              <button 
                class="toolbar-btn" 
                @click="showExportMenu = !showExportMenu" 
                title="导出" 
                :disabled="!currentFile"
              >
                <FileDown :size="18" />
              </button>
              <div v-if="showExportMenu" class="dropdown-menu dropdown-menu-right">
                <button class="dropdown-item" @click="exportToPdf">
                  <FileText :size="16" />
                  <span>导出为 PDF</span>
                </button>
                <button class="dropdown-item" @click="exportToHtml">
                  <FileCode :size="16" />
                  <span>导出为 HTML</span>
                </button>
                <button class="dropdown-item" @click="exportToText">
                  <FileText :size="16" />
                  <span>导出为纯文本</span>
                </button>
              </div>
            </div>
            
            <button class="toolbar-btn" @click="downloadFile" title="下载原文件" :disabled="!currentFile">
              <Download :size="18" />
            </button>
          </div>
        </div>
      </header>
      
      <!-- Search Panel -->
      <div v-if="showSearch" class="search-panel animate-fadeInUp">
        <div class="search-input-wrapper">
          <Search :size="16" class="search-icon" />
          <input 
            ref="searchInputRef"
            v-model="searchQuery"
            type="text" 
            class="search-input" 
            placeholder="搜索文档内容..."
            @keydown.enter="nextSearchResult"
            @keydown.shift.enter="prevSearchResult"
          />
          <span v-if="searchQuery" class="search-count">
            {{ currentSearchIndex }}/{{ searchResults }}
          </span>
          <button v-if="searchQuery" class="search-clear" @click="clearSearch">
            <X :size="14" />
          </button>
        </div>
        <div class="search-actions">
          <button class="search-nav-btn" @click="prevSearchResult" :disabled="searchResults === 0" title="上一个">
            <ChevronUp :size="16" />
          </button>
          <button class="search-nav-btn" @click="nextSearchResult" :disabled="searchResults === 0" title="下一个">
            <ChevronDown :size="16" />
          </button>
          <button class="search-close-btn" @click="showSearch = false">
            <X :size="16" />
          </button>
        </div>
      </div>
      
      <!-- TOC Panel -->
      <div v-if="showToc" class="toc-panel animate-slideInRight">
        <div class="panel-header">
          <span class="panel-title">文档目录</span>
          <button class="panel-close" @click="showToc = false">
            <X :size="16" />
          </button>
        </div>
        <div class="panel-body">
          <!-- 有目录项 -->
          <template v-if="tocItems.length > 0">
            <div 
              v-for="item in tocItems" 
              :key="item.id"
              class="toc-item"
              :class="`toc-item-level-${item.level}`"
              @click="scrollToHeading(item.id)"
            >
              {{ item.text }}
            </div>
          </template>
          <!-- 无目录项 -->
          <div v-else class="toc-empty">
            <ListTree :size="32" />
            <p>未检测到文档目录</p>
            <p class="hint">文档中需要包含标题样式（如 Heading 1、Heading 2）或加粗/大字体段落</p>
          </div>
        </div>
      </div>
      
      <!-- Viewer Wrapper -->
      <div class="viewer-wrapper">
        <!-- Drop Zone / Empty State -->
        <div 
          v-if="!currentFile" 
          class="drop-zone"
          :class="{ dragging: isDragging }"
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
          @drop="handleDrop"
          @click="openFileDialog"
        >
          <div class="drop-zone-icon">
            <Upload :size="32" />
          </div>
          <div class="drop-zone-text">
            <p class="drop-zone-title">点击或拖放文件到此处</p>
            <p class="drop-zone-hint">支持 .docx 和 .doc 格式</p>
          </div>
        </div>
        
        <!-- Loading State -->
        <div v-if="isLoading" class="loading-overlay">
          <div class="spinner spinner-lg"></div>
          <p>正在加载文档...</p>
        </div>
        
        <!-- Document Viewer -->
        <main 
          v-show="currentFile && !isLoading" 
          class="viewer" 
          ref="viewerRef"
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
          @drop="handleDrop"
        ></main>
      </div>
      
      <!-- Status Bar -->
      <footer class="status-bar" v-if="currentFile">
        <div class="status-left">
          <span class="status-item">
            <FileText :size="12" />
            {{ currentFile.name }}
          </span>
          <span class="status-item">{{ formattedFileSize }}</span>
        </div>
        <div class="status-right">
          <span class="status-item">第 {{ currentPage }} 页，共 {{ totalPages }} 页</span>
          <span class="status-item">{{ zoomLevel }}%</span>
        </div>
      </footer>
    </div>
    
    <!-- Info Modal -->
    <div class="modal-overlay" :class="{ open: showInfo }" @click.self="showInfo = false">
      <div class="modal" style="width: 400px;">
        <div class="modal-header">
          <span class="modal-title">关于 Word Viewer</span>
          <button class="icon-btn" @click="showInfo = false">
            <X :size="18" />
          </button>
        </div>
        <div class="modal-body">
          <div class="info-content">
            <div class="info-logo">
              <BookOpen :size="48" />
            </div>
            <h3>Word Viewer</h3>
            <p>功能强大的 Word 文档在线预览插件</p>
            <div class="info-features">
              <div class="info-feature">✓ 支持 .docx 和 .doc 格式</div>
              <div class="info-feature">✓ 完整的样式渲染</div>
              <div class="info-feature">✓ 缩放、打印、下载</div>
              <div class="info-feature">✓ 亮色/暗色主题</div>
            </div>
            <p class="info-version">Version 1.0.0</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Keyboard Shortcuts Modal -->
    <div class="modal-overlay" :class="{ open: showKeyboardShortcuts }" @click.self="showKeyboardShortcuts = false">
      <div class="modal" style="width: 420px;">
        <div class="modal-header">
          <span class="modal-title">键盘快捷键</span>
          <button class="icon-btn" @click="showKeyboardShortcuts = false">
            <X :size="18" />
          </button>
        </div>
        <div class="modal-body">
          <div class="shortcuts-list">
            <div class="shortcut-item">
              <span>打开搜索</span>
              <span><kbd class="kbd">Ctrl</kbd> + <kbd class="kbd">F</kbd></span>
            </div>
            <div class="shortcut-item">
              <span>打印文档</span>
              <span><kbd class="kbd">Ctrl</kbd> + <kbd class="kbd">P</kbd></span>
            </div>
            <div class="shortcut-item">
              <span>放大</span>
              <span><kbd class="kbd">Ctrl</kbd> + <kbd class="kbd">+</kbd></span>
            </div>
            <div class="shortcut-item">
              <span>缩小</span>
              <span><kbd class="kbd">Ctrl</kbd> + <kbd class="kbd">-</kbd></span>
            </div>
            <div class="shortcut-item">
              <span>关闭弹窗</span>
              <span><kbd class="kbd">Esc</kbd></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  height: 100%;
  background: var(--bg-secondary);
}

/* ============== Sidebar ============== */
.sidebar {
  width: var(--sidebar-width);
  background: var(--bg-sidebar);
  color: var(--text-inverse);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: width var(--transition-normal);
  overflow: hidden;
}

.sidebar.collapsed {
  width: var(--sidebar-collapsed-width);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  border-radius: 8px;
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
}

.sidebar-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.sidebar-toggle:hover {
  background: var(--bg-sidebar-hover);
  color: var(--text-inverse);
}

.sidebar-section {
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.section-header .section-title {
  margin-bottom: 0;
}

.section-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.section-action:hover {
  background: var(--bg-sidebar-hover);
  color: var(--text-inverse);
}

.upload-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px 16px;
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.upload-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--primary-600), var(--primary-700));
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.upload-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.sidebar.collapsed .upload-btn {
  padding: 12px;
}

.sidebar-footer {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.sidebar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.sidebar-btn:hover {
  background: var(--bg-sidebar-hover);
  color: var(--text-inverse);
}

/* ============== Main Content ============== */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  position: relative;
}

/* ============== Toolbar ============== */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 2px;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: var(--border-color);
  margin: 0 8px;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.toolbar-btn:hover:not(:disabled) {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.toolbar-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.toolbar-btn.active {
  background: var(--primary-100);
  color: var(--primary-600);
}

[data-theme="dark"] .toolbar-btn.active {
  background: rgba(59, 130, 246, 0.2);
  color: var(--primary-400);
}

.zoom-label {
  min-width: 56px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  text-align: center;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.zoom-label:hover {
  border-color: var(--primary-400);
  color: var(--text-primary);
}

.page-info {
  min-width: 60px;
  font-size: 13px;
  color: var(--text-secondary);
  text-align: center;
}

/* ============== Search Panel ============== */
.search-panel {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
}

.search-input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  height: 40px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  transition: all var(--transition-fast);
}

.search-input-wrapper:focus-within {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-icon {
  color: var(--text-muted);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  color: var(--text-primary);
  outline: none;
}

.search-input::placeholder {
  color: var(--text-muted);
}

.search-count {
  font-size: 12px;
  color: var(--text-tertiary);
  white-space: nowrap;
}

.search-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 4px;
  background: var(--bg-tertiary);
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.search-clear:hover {
  background: var(--gray-300);
  color: var(--text-primary);
}

.search-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.search-nav-btn,
.search-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.search-nav-btn:hover:not(:disabled),
.search-close-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.search-nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ============== TOC Panel ============== */
.toc-panel {
  position: absolute;
  top: 57px;
  right: 16px;
  width: 280px;
  max-height: calc(100% - 120px);
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: var(--shadow-xl);
  z-index: 100;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.panel-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.panel-close:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

/* ============== Viewer Wrapper ============== */
.viewer-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: var(--bg-viewer);
}

.drop-zone {
  position: absolute;
  inset: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  border: 2px dashed var(--border-color);
  border-radius: 16px;
  background: var(--bg-card);
  cursor: pointer;
  transition: all var(--transition-normal);
}

.drop-zone:hover,
.drop-zone.dragging {
  border-color: var(--primary-400);
  background: var(--primary-50);
}

[data-theme="dark"] .drop-zone:hover,
[data-theme="dark"] .drop-zone.dragging {
  background: rgba(59, 130, 246, 0.1);
}

.drop-zone-icon {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  border-radius: 20px;
  color: var(--text-muted);
  transition: all var(--transition-normal);
}

.drop-zone:hover .drop-zone-icon,
.drop-zone.dragging .drop-zone-icon {
  background: var(--primary-100);
  color: var(--primary-500);
  transform: scale(1.05);
}

[data-theme="dark"] .drop-zone:hover .drop-zone-icon,
[data-theme="dark"] .drop-zone.dragging .drop-zone-icon {
  background: rgba(59, 130, 246, 0.2);
  color: var(--primary-400);
}

.drop-zone-text {
  text-align: center;
}

.drop-zone-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.drop-zone-hint {
  font-size: 14px;
  color: var(--text-tertiary);
}

.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: var(--bg-overlay);
  z-index: 50;
}

.loading-overlay p {
  font-size: 14px;
  color: var(--text-inverse);
}

.viewer {
  height: 100%;
  overflow: auto;
  background: var(--bg-viewer);
}

/* 覆盖 docx-preview 的默认灰色背景 */
.viewer :deep(.docx-wrapper) {
  background: var(--bg-viewer) !important;
}

/* ============== Status Bar ============== */
.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 16px;
  background: var(--bg-card);
  border-top: 1px solid var(--border-color);
  font-size: 12px;
  color: var(--text-tertiary);
}

.status-left,
.status-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* ============== Modals ============== */
.info-content {
  text-align: center;
  padding: 16px 0;
}

.info-logo {
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-100), var(--primary-200));
  border-radius: 20px;
  color: var(--primary-600);
}

[data-theme="dark"] .info-logo {
  background: rgba(59, 130, 246, 0.2);
  color: var(--primary-400);
}

.info-content h3 {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.info-content p {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.info-features {
  text-align: left;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 8px;
  margin-bottom: 16px;
}

.info-feature {
  font-size: 13px;
  color: var(--text-secondary);
  padding: 4px 0;
}

.info-version {
  font-size: 12px;
  color: var(--text-muted);
}

.shortcuts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.shortcut-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-secondary);
}

.shortcut-item span:last-child {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* ============== Dropdown Menu ============== */
.dropdown-wrapper {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  min-width: 180px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  overflow: hidden;
}

.dropdown-menu-right {
  left: auto;
  right: 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.dropdown-item:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.dropdown-item.active {
  background: var(--primary-50);
  color: var(--primary-600);
}

[data-theme="dark"] .dropdown-item.active {
  background: rgba(59, 130, 246, 0.15);
  color: var(--primary-400);
}

.dropdown-divider {
  height: 1px;
  background: var(--border-color);
  margin: 4px 0;
}

/* ============== Side Panel ============== */
.side-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 280px;
  height: 100%;
  background: var(--bg-card);
  border-left: 1px solid var(--border-color);
  box-shadow: var(--shadow-xl);
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.panel-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--primary-500);
  cursor: pointer;
  transition: all var(--transition-fast);
  margin-right: auto;
  margin-left: 8px;
}

.panel-action:hover {
  background: var(--primary-50);
}

[data-theme="dark"] .panel-action:hover {
  background: rgba(59, 130, 246, 0.15);
}

/* ============== Thumbnails Grid ============== */
.thumbnails-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 12px;
}

.thumbnail-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px;
  background: var(--bg-secondary);
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.thumbnail-item:hover {
  background: var(--bg-tertiary);
  border-color: var(--border-color);
}

.thumbnail-item.active {
  border-color: var(--primary-500);
  background: var(--primary-50);
}

[data-theme="dark"] .thumbnail-item.active {
  background: rgba(59, 130, 246, 0.15);
}

.thumbnail-preview {
  width: 100%;
  aspect-ratio: 3/4;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-card);
  border-radius: 4px;
  color: var(--text-muted);
}

.thumbnail-label {
  font-size: 11px;
  color: var(--text-secondary);
}

/* ============== Empty State ============== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  text-align: center;
  color: var(--text-muted);
}

.empty-state p {
  margin-top: 12px;
  font-size: 14px;
  color: var(--text-secondary);
}

.empty-state .hint {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-tertiary);
}

/* ============== Annotation Hint ============== */
.annotation-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  margin: 8px;
  background: var(--primary-50);
  border-radius: 8px;
  color: var(--primary-600);
}

[data-theme="dark"] .annotation-hint {
  background: rgba(59, 130, 246, 0.15);
  color: var(--primary-400);
}

.annotation-hint p {
  font-size: 13px;
  margin: 0;
}

/* ============== Toolbar Active State ============== */
.toolbar-btn.active {
  background: var(--primary-50);
  color: var(--primary-600);
}

[data-theme="dark"] .toolbar-btn.active {
  background: rgba(59, 130, 246, 0.2);
  color: var(--primary-400);
}

/* ============== TOC Empty State ============== */
.toc-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  text-align: center;
  color: var(--text-muted);
}

.toc-empty p {
  margin-top: 12px;
  font-size: 14px;
  color: var(--text-secondary);
}

.toc-empty .hint {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-tertiary);
  line-height: 1.5;
}
</style>
