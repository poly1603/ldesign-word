/**
 * 插件开发示例
 */

import { Plugin, PluginContext, createPlugin } from '../src/core/plugin';
import { Logger } from '../src/utils/logger';

const logger = new Logger({ prefix: '[PluginExample]' });

/**
 * 示例插件 1: 自动保存插件
 */
export const AutoSavePlugin: Plugin = {
  metadata: {
    name: 'AutoSave',
    version: '1.0.0',
    author: 'Word Viewer Team',
    description: '自动保存文档到本地存储',
  },

  install(context: PluginContext) {
    logger.info('安装自动保存插件');

    let saveInterval: number;

    // 监听文档变更
    context.registerEvent('changed', () => {
      // 延迟保存
      clearInterval(saveInterval);
      saveInterval = window.setTimeout(() => {
        const content = context.viewer.getContainer().innerHTML;
        context.setState('lastSave', {
          content,
          timestamp: Date.now(),
        });
        logger.info('自动保存完成');
      }, 5000); // 5秒后保存
    });

    // 注册恢复命令
    context.registerCommand('restore', () => {
      const lastSave = context.getState('lastSave');
      if (lastSave) {
        logger.info('恢复上次保存', { timestamp: lastSave.timestamp });
        // 恢复逻辑
      }
    });
  },

  uninstall(context: PluginContext) {
    logger.info('卸载自动保存插件');
    // 清理工作
  },
};

/**
 * 示例插件 2: 字数统计插件
 */
export const WordCountPlugin = createPlugin(
  {
    name: 'WordCount',
    version: '1.0.0',
    description: '实时显示文档字数',
  },
  (context: PluginContext) => {
    logger.info('安装字数统计插件');

    // 创建字数显示元素
    const counter = document.createElement('div');
    counter.className = 'word-counter';
    counter.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 10px 15px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      font-size: 14px;
    `;

    document.body.appendChild(counter);

    // 更新字数
    const updateCount = () => {
      const container = context.viewer.getContainer();
      const text = container.textContent || '';
      const words = text.trim().split(/\s+/).length;
      const chars = text.length;

      counter.textContent = `字数: ${words} | 字符: ${chars}`;
    };

    // 监听变更
    context.registerEvent('loaded', updateCount);
    context.registerEvent('changed', updateCount);

    // 保存元素引用以便清理
    context.setState('counterElement', counter);
  },
  (context: PluginContext) => {
    logger.info('卸载字数统计插件');
    
    const counter = context.getState('counterElement');
    if (counter && counter.parentNode) {
      counter.parentNode.removeChild(counter);
    }
  }
);

/**
 * 示例插件 3: 导出增强插件
 */
export const ExportEnhancerPlugin: Plugin = {
  metadata: {
    name: 'ExportEnhancer',
    version: '1.0.0',
    description: '增强导出功能，添加更多选项',
  },

  install(context: PluginContext) {
    logger.info('安装导出增强插件');

    // 注册自定义导出命令
    context.registerCommand('exportWithOptions', async (format: string, options: any) => {
      logger.info('导出文档', { format, options });

      switch (format) {
        case 'pdf':
          return await context.viewer.exportToPDF(options);
        case 'html':
          return context.viewer.exportToHTML();
        case 'markdown':
          return context.viewer.exportToMarkdown?.();
        default:
          throw new Error(`不支持的格式: ${format}`);
      }
    });
  },
};

/**
 * 示例插件 4: 主题切换插件
 */
export const ThemeSwitcherPlugin: Plugin = {
  metadata: {
    name: 'ThemeSwitcher',
    version: '1.0.0',
    description: '添加主题切换功能',
  },

  install(context: PluginContext) {
    logger.info('安装主题切换插件');

    // 创建主题切换按钮
    const button = document.createElement('button');
    button.textContent = '🌓 切换主题';
    button.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 8px 16px;
      border: 1px solid #ddd;
      background: white;
      cursor: pointer;
      border-radius: 4px;
    `;

    let isDark = false;

    button.addEventListener('click', () => {
      isDark = !isDark;
      context.viewer.updateOptions({
        theme: isDark ? 'dark' : 'light',
      });
      logger.info('主题已切换', { theme: isDark ? 'dark' : 'light' });
    });

    document.body.appendChild(button);
    context.setState('themeButton', button);
  },

  uninstall(context: PluginContext) {
    const button = context.getState('themeButton');
    if (button && button.parentNode) {
      button.parentNode.removeChild(button);
    }
  },
};

/**
 * 使用示例
 */
export async function exampleUsage() {
  // 这个函数展示如何使用插件系统
  const { WordViewer } = await import('../src/core/WordViewer');
  const { PluginManager } = await import('../src/core/plugin');

  const viewer = new WordViewer('#container');
  const pluginManager = new PluginManager(viewer);

  // 注册并启用插件
  await pluginManager.register(AutoSavePlugin);
  await pluginManager.register(WordCountPlugin);
  await pluginManager.register(ExportEnhancerPlugin);
  await pluginManager.register(ThemeSwitcherPlugin);

  // 执行插件命令
  pluginManager.executeCommand('AutoSave:restore');
  
  // 禁用插件
  await pluginManager.disable('WordCount');
  
  // 重新启用
  await pluginManager.enable('WordCount');
}

