/**
 * WordViewer 核心类测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WordViewer } from '../../../src/core/WordViewer';

describe('WordViewer', () => {
  let container: HTMLElement;
  let viewer: WordViewer;

  beforeEach(() => {
    // 创建测试容器
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    // 清理
    if (viewer) {
      viewer.destroy();
    }
    document.body.removeChild(container);
  });

  describe('初始化', () => {
    it('应该成功创建 WordViewer 实例', () => {
      viewer = new WordViewer(container);
      expect(viewer).toBeInstanceOf(WordViewer);
    });

    it('应该通过选择器创建实例', () => {
      viewer = new WordViewer('#test-container');
      expect(viewer).toBeInstanceOf(WordViewer);
    });

    it('使用无效选择器应该抛出错误', () => {
      expect(() => {
        viewer = new WordViewer('#non-existent');
      }).toThrow();
    });

    it('应该应用默认选项', () => {
      viewer = new WordViewer(container);
      const options = viewer.getOptions();
      
      expect(options.theme).toBe('light');
      expect(options.editable).toBe(false);
      expect(options.showToolbar).toBe(true);
    });

    it('应该应用自定义选项', () => {
      viewer = new WordViewer(container, {
        theme: 'dark',
        editable: true,
        showToolbar: false,
      });
      
      const options = viewer.getOptions();
      expect(options.theme).toBe('dark');
      expect(options.editable).toBe(true);
      expect(options.showToolbar).toBe(false);
    });
  });

  describe('文档加载', () => {
    beforeEach(() => {
      viewer = new WordViewer(container);
    });

    it('应该触发 progress 事件', async () => {
      const progressSpy = vi.fn();
      viewer.on('progress', progressSpy);

      const file = new File(['test'], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      
      try {
        await viewer.loadFile(file);
      } catch (error) {
        // 忽略加载错误，我们只关心事件
      }

      expect(progressSpy).toHaveBeenCalled();
    });

    it('加载失败应该触发 error 事件', async () => {
      const errorSpy = vi.fn();
      viewer.on('error', errorSpy);

      const invalidFile = new File(['invalid'], 'test.txt', { type: 'text/plain' });
      
      try {
        await viewer.loadFile(invalidFile);
      } catch (error) {
        // 预期错误
      }

      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('缩放功能', () => {
    beforeEach(() => {
      viewer = new WordViewer(container);
    });

    it('应该设置缩放级别', () => {
      viewer.setZoom(1.5);
      expect(viewer.getZoom()).toBe(1.5);
    });

    it('应该限制最小缩放', () => {
      viewer.setZoom(0.1);
      expect(viewer.getZoom()).toBe(0.5);
    });

    it('应该限制最大缩放', () => {
      viewer.setZoom(5);
      expect(viewer.getZoom()).toBe(3.0);
    });

    it('应该触发 zoom 事件', () => {
      const zoomSpy = vi.fn();
      viewer.on('zoom', zoomSpy);
      
      viewer.setZoom(1.2);
      expect(zoomSpy).toHaveBeenCalledWith(1.2);
    });
  });

  describe('编辑功能', () => {
    beforeEach(() => {
      viewer = new WordViewer(container, { editable: false });
    });

    it('应该启用编辑模式', () => {
      viewer.enableEdit();
      const state = viewer.getEditState();
      expect(state.isEditing).toBe(true);
    });

    it('应该禁用编辑模式', () => {
      viewer.enableEdit();
      viewer.disableEdit();
      const state = viewer.getEditState();
      expect(state.isEditing).toBe(false);
    });

    it('应该触发 edit-start 事件', () => {
      const startSpy = vi.fn();
      viewer.on('edit-start', startSpy);
      
      viewer.enableEdit();
      expect(startSpy).toHaveBeenCalled();
    });

    it('应该触发 edit-end 事件', () => {
      const endSpy = vi.fn();
      viewer.on('edit-end', endSpy);
      
      viewer.enableEdit();
      viewer.disableEdit();
      expect(endSpy).toHaveBeenCalled();
    });

    it('未启用编辑时插入文本应该抛出错误', () => {
      expect(() => {
        viewer.insertText('test');
      }).toThrow();
    });
  });

  describe('选项更新', () => {
    beforeEach(() => {
      viewer = new WordViewer(container);
    });

    it('应该更新主题', () => {
      viewer.updateOptions({ theme: 'dark' });
      const options = viewer.getOptions();
      expect(options.theme).toBe('dark');
    });

    it('应该更新编辑模式', () => {
      viewer.updateOptions({ editable: true });
      const state = viewer.getEditState();
      expect(state.isEditing).toBe(true);
    });
  });

  describe('页面导航', () => {
    beforeEach(() => {
      viewer = new WordViewer(container);
    });

    it('应该获取页面信息', () => {
      const pageInfo = viewer.getPageInfo();
      expect(pageInfo).toHaveProperty('current');
      expect(pageInfo).toHaveProperty('total');
    });

    it('应该跳转到指定页', () => {
      const pageSpy = vi.fn();
      viewer.on('page-change', pageSpy);
      
      viewer.goToPage(2);
      expect(pageSpy).toHaveBeenCalled();
    });
  });

  describe('销毁', () => {
    it('应该清理所有资源', () => {
      viewer = new WordViewer(container);
      viewer.destroy();
      
      // 销毁后操作应该抛出错误
      expect(() => {
        viewer.setZoom(1.5);
      }).toThrow();
    });

    it('应该移除容器类名', () => {
      viewer = new WordViewer(container);
      expect(container.classList.contains('word-viewer-container')).toBe(true);
      
      viewer.destroy();
      expect(container.classList.contains('word-viewer-container')).toBe(false);
    });
  });
});
