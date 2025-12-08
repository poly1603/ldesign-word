import type { App, Plugin } from 'vue';
import WordViewer from './components/WordViewer.vue';

// 导出组件
export { WordViewer };

// 导出 composables
export {
  useWordViewer,
  useDocumentDrop,
  type UseWordViewerReturn,
  type UseDocumentDropReturn,
  type UseDocumentDropOptions
} from './composables';

// 从 core 包重新导出类型
export type {
  WordDocument,
  RenderOptions,
  ThemeConfig,
  PrintOptions,
  TocItem,
  SearchResult,
  EventType,
  EventData,
  WordViewerOptions
} from '@word-viewer/core';

// 从 core 包重新导出常量
export { THEMES } from '@word-viewer/core';

/**
 * Vue 插件安装函数
 */
export const WordViewerPlugin: Plugin = {
  install(app: App) {
    app.component('WordViewer', WordViewer);
  }
};

// 默认导出插件
export default WordViewerPlugin;
