/**
 * 插件系统
 * 支持功能的模块化扩展
 */

import { Logger } from '../utils/logger';
import type { WordViewer } from './WordViewer';

const logger = new Logger({ prefix: '[Plugin]' });

export interface PluginMetadata {
  name: string;
  version: string;
  author?: string;
  description?: string;
  dependencies?: string[];
}

export interface PluginContext {
  viewer: WordViewer;
  registerCommand: (name: string, handler: Function) => void;
  registerEvent: (event: string, handler: Function) => void;
  getState: <T = any>(key: string) => T | undefined;
  setState: <T = any>(key: string, value: T) => void;
}

export interface Plugin {
  metadata: PluginMetadata;
  install: (context: PluginContext) => void | Promise<void>;
  uninstall?: (context: PluginContext) => void | Promise<void>;
  onEnable?: () => void | Promise<void>;
  onDisable?: () => void | Promise<void>;
}

export interface PluginOptions {
  enabled?: boolean;
  config?: Record<string, any>;
}

/**
 * 插件管理器
 */
export class PluginManager {
  private viewer: WordViewer;
  private plugins: Map<string, Plugin> = new Map();
  private pluginOptions: Map<string, PluginOptions> = new Map();
  private enabledPlugins: Set<string> = new Set();
  private commands: Map<string, Function> = new Map();
  private pluginState: Map<string, Map<string, any>> = new Map();

  constructor(viewer: WordViewer) {
    this.viewer = viewer;
    logger.info('插件管理器已初始化');
  }

  /**
   * 注册插件
   */
  async register(plugin: Plugin, options: PluginOptions = {}): Promise<void> {
    const { name, version, dependencies } = plugin.metadata;

    // 检查是否已注册
    if (this.plugins.has(name)) {
      logger.warn('插件已注册', { name });
      return;
    }

    // 检查依赖
    if (dependencies && dependencies.length > 0) {
      const missingDeps = dependencies.filter(dep => !this.plugins.has(dep));
      if (missingDeps.length > 0) {
        throw new Error(`缺少依赖插件: ${missingDeps.join(', ')}`);
      }
    }

    // 注册插件
    this.plugins.set(name, plugin);
    this.pluginOptions.set(name, options);
    this.pluginState.set(name, new Map());

    logger.info('插件已注册', { name, version });

    // 如果设置了自动启用，立即安装
    if (options.enabled !== false) {
      await this.enable(name);
    }
  }

  /**
   * 启用插件
   */
  async enable(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`插件不存在: ${pluginName}`);
    }

    if (this.enabledPlugins.has(pluginName)) {
      logger.warn('插件已启用', { name: pluginName });
      return;
    }

    // 创建插件上下文
    const context = this.createContext(pluginName);

    // 安装插件
    await plugin.install(context);

    // 调用 onEnable 钩子
    if (plugin.onEnable) {
      await plugin.onEnable();
    }

    this.enabledPlugins.add(pluginName);
    logger.info('插件已启用', { name: pluginName });
  }

  /**
   * 禁用插件
   */
  async disable(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`插件不存在: ${pluginName}`);
    }

    if (!this.enabledPlugins.has(pluginName)) {
      logger.warn('插件未启用', { name: pluginName });
      return;
    }

    // 调用 onDisable 钩子
    if (plugin.onDisable) {
      await plugin.onDisable();
    }

    // 卸载插件
    if (plugin.uninstall) {
      const context = this.createContext(pluginName);
      await plugin.uninstall(context);
    }

    this.enabledPlugins.delete(pluginName);
    logger.info('插件已禁用', { name: pluginName });
  }

  /**
   * 卸载插件
   */
  async unregister(pluginName: string): Promise<void> {
    // 先禁用
    if (this.enabledPlugins.has(pluginName)) {
      await this.disable(pluginName);
    }

    // 移除插件
    this.plugins.delete(pluginName);
    this.pluginOptions.delete(pluginName);
    this.pluginState.delete(pluginName);

    logger.info('插件已卸载', { name: pluginName });
  }

  /**
   * 创建插件上下文
   */
  private createContext(pluginName: string): PluginContext {
    return {
      viewer: this.viewer,
      registerCommand: (name: string, handler: Function) => {
        this.commands.set(`${pluginName}:${name}`, handler);
      },
      registerEvent: (event: string, handler: Function) => {
        this.viewer.on(event, handler as any);
      },
      getState: <T = any>(key: string): T | undefined => {
        const state = this.pluginState.get(pluginName);
        return state?.get(key) as T | undefined;
      },
      setState: <T = any>(key: string, value: T): void => {
        const state = this.pluginState.get(pluginName);
        if (state) {
          state.set(key, value);
        }
      },
    };
  }

  /**
   * 执行命令
   */
  executeCommand(commandName: string, ...args: any[]): any {
    const handler = this.commands.get(commandName);
    if (!handler) {
      throw new Error(`命令不存在: ${commandName}`);
    }

    return handler(...args);
  }

  /**
   * 获取所有插件
   */
  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * 获取已启用的插件
   */
  getEnabledPlugins(): Plugin[] {
    return Array.from(this.enabledPlugins)
      .map(name => this.plugins.get(name))
      .filter((p): p is Plugin => p !== undefined);
  }

  /**
   * 检查插件是否已启用
   */
  isEnabled(pluginName: string): boolean {
    return this.enabledPlugins.has(pluginName);
  }

  /**
   * 获取插件配置
   */
  getPluginConfig(pluginName: string): Record<string, any> | undefined {
    return this.pluginOptions.get(pluginName)?.config;
  }

  /**
   * 更新插件配置
   */
  updatePluginConfig(pluginName: string, config: Record<string, any>): void {
    const options = this.pluginOptions.get(pluginName);
    if (options) {
      options.config = { ...options.config, ...config };
      logger.debug('插件配置已更新', { name: pluginName });
    }
  }

  /**
   * 销毁插件管理器
   */
  async destroy(): Promise<void> {
    // 禁用所有插件
    const enabledPlugins = Array.from(this.enabledPlugins);
    for (const pluginName of enabledPlugins) {
      await this.disable(pluginName);
    }

    this.plugins.clear();
    this.pluginOptions.clear();
    this.pluginState.clear();
    this.commands.clear();

    logger.info('插件管理器已销毁');
  }
}

/**
 * 创建简单插件的辅助函数
 */
export function createPlugin(
  metadata: PluginMetadata,
  install: (context: PluginContext) => void | Promise<void>,
  uninstall?: (context: PluginContext) => void | Promise<void>
): Plugin {
  return {
    metadata,
    install,
    uninstall,
  };
}

