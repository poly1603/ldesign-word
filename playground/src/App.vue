<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue';
import { renderAsync } from 'docx-preview';
import { Toolbar } from '@word-viewer/core';
import { Upload, FileText } from 'lucide-vue-next';

const file = ref<File | null>(null);
const currentFile = ref<File | null>(null);
const isLoading = ref(false);
const toolbarRef = ref<HTMLElement>();
const viewerRef = ref<HTMLElement>();
const fileInputRef = ref<HTMLInputElement>();
let toolbar: Toolbar | null = null;

// 打开文件选择
function openFileDialog() {
  fileInputRef.value?.click();
}

// 处理文件选择
function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    file.value = input.files[0];
    // 重置 input 以允许选择相同文件
    input.value = '';
  }
}

// 初始化工具栏
onMounted(() => {
  if (toolbarRef.value && viewerRef.value) {
    toolbar = new Toolbar({
      container: toolbarRef.value,
      documentContainer: viewerRef.value,
      enablePrint: true,
      enableDownload: true,
      enableFullscreen: true,
      enableZoom: true,
      enablePageNumber: true,
      enableWatermark: true
    });
    
    toolbar.setCallbacks({
      onDownload: () => {
        if (currentFile.value) {
          const url = URL.createObjectURL(currentFile.value);
          const a = document.createElement('a');
          a.href = url;
          a.download = currentFile.value.name;
          a.click();
          URL.revokeObjectURL(url);
        }
      }
    });
    
    toolbar.render();
  }
});

// 监听文件变化，渲染文档
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
    
    // 更新页数
    await nextTick();
    toolbar?.updatePageCount();
  } catch (error) {
    console.error('渲染失败', error);
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div class="app">
    <!-- 左侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <FileText :size="24" />
        <span>Word Viewer</span>
      </div>
      
      <div class="sidebar-content">
        <input
          ref="fileInputRef"
          type="file"
          accept=".docx,.doc"
          @change="handleFileChange"
          hidden
        />
        
        <button class="upload-btn" @click="openFileDialog" :disabled="isLoading">
          <Upload :size="20" />
          <span>{{ isLoading ? '加载中...' : '上传文档' }}</span>
        </button>
        
        <div v-if="file" class="file-info">
          <FileText :size="16" />
          <span class="file-name">{{ file.name }}</span>
        </div>
      </div>
    </aside>
    
    <!-- 右侧文档区域 -->
    <div class="viewer-wrapper">
      <!-- 工具栏容器 - 独立于 Vue 管理 -->
      <div ref="toolbarRef" class="toolbar-container"></div>
      
      <!-- 空状态提示 - 独立于 viewer -->
      <div v-if="!file" class="empty-state">
        <FileText :size="48" />
        <p>点击左侧按钮上传 Word 文档</p>
      </div>
      
      <!-- 文档容器 - 纯粹由 docx-preview 管理，Vue 不干预 -->
      <main v-show="file" class="viewer" ref="viewerRef"></main>
    </div>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  width: 100%;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.app {
  display: flex;
  height: 100%;
}

/* 左侧边栏 */
.sidebar {
  width: 200px;
  background: #1e293b;
  color: white;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px;
  border-bottom: 1px solid #334155;
  font-weight: 600;
  font-size: 16px;
}

.sidebar-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.upload-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.upload-btn:hover:not(:disabled) {
  background: #2563eb;
}

.upload-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: #334155;
  border-radius: 6px;
  font-size: 12px;
}

.file-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 右侧文档区域 */
.viewer-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.toolbar-container {
  flex-shrink: 0;
}

.viewer {
  flex: 1;
  overflow: auto;
  background: white;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
  color: #94a3b8;
}

.empty-state p {
  font-size: 14px;
}

/* docx-preview 样式 */
.viewer :deep(.docx-wrapper) {
  background: white !important;
  padding: 0;
}

.viewer :deep(.docx-wrapper > section.docx) {
  background: white !important;
  box-shadow: none;
  margin: 0;
}
</style>
