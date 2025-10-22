# Word 库快速参考

> 快速查找常用 API 和最佳实践

## 🚀 快速开始

### 基本使用
```typescript
import { WordViewer } from '@word-viewer/core';

const viewer = new WordViewer('#container', {
  theme: 'light',
  editable: false,
  showToolbar: true,
});

// 加载文档
await viewer.loadFile(file);
```

## 📚 核心 API

### WordViewer 类

#### 文档加载
```typescript
// 从文件加载
await viewer.loadFile(file: File);

// 从 URL 加载
await viewer.loadUrl(url: string);

// 从 ArrayBuffer 加载
await viewer.loadBuffer(buffer: ArrayBuffer);
```

#### 视图控制
```typescript
// 缩放
viewer.setZoom(1.5);
const zoom = viewer.getZoom();

// 页面导航
viewer.goToPage(3);
const pageInfo = viewer.getPageInfo(); // { current: 3, total: 10 }
```

#### 搜索
```typescript
// 同步搜索
const results = viewer.search('关键词');

// 高亮结果
viewer.highlightSearch('关键词');
```

#### 编辑
```typescript
// 启用编辑
viewer.enableEdit();

// 插入文本
viewer.insertText('Hello World');

// 应用格式
viewer.applyFormat({
  bold: true,
  italic: true,
  fontSize: 16,
});

// 撤销/重做
viewer.undo();
viewer.redo();
```

#### 导出
```typescript
// 导出为 PDF
const pdfBlob = await viewer.exportToPDF();

// 导出为 HTML
const html = viewer.exportToHTML();

// 导出为 DOCX
const docxBlob = await viewer.exportToDocx();
```

#### 事件监听
```typescript
viewer.on('loaded', (data) => console.log('文档已加载', data));
viewer.on('error', (error) => console.error('发生错误', error));
viewer.on('changed', () => console.log('文档已修改'));
viewer.on('zoom', (level) => console.log('缩放级别', level));
```

## 🛠️ 工具函数

### 内存监控
```typescript
import { MemoryMonitor, formatBytes } from '@/utils/memory';

const monitor = new MemoryMonitor(5000); // 每5秒检查

monitor.onWarning((warning) => {
  console.log(`[${warning.level}] ${warning.message}`);
  console.log(`使用率: ${warning.usage}%`);
});

monitor.start();

// 获取当前内存信息
const info = monitor.getMemoryInfo();
console.log(`已用: ${formatBytes(info.usedJSHeapSize!)}`);
```

### 图片处理
```typescript
import { 
  compressImage, 
  LazyImageLoader,
  createThumbnail 
} from '@/utils/image';

// 压缩图片
const compressed = await compressImage(file, {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
});

// 懒加载
const loader = new LazyImageLoader({
  rootMargin: '100px',
});
loader.observe(imgElement, 'real-image.jpg', 'placeholder.jpg');

// 创建缩略图
const thumbnail = await createThumbnail(file, 200);
```

### 日志系统
```typescript
import { Logger, LogLevel, globalLogger } from '@/utils/logger';

// 使用全局 logger
globalLogger.info('应用启动');
globalLogger.warn('这是警告', { data: 'extra' });
globalLogger.error('发生错误', { error: new Error() });

// 创建自定义 logger
const logger = new Logger({
  level: LogLevel.DEBUG,
  prefix: '[MyModule]',
});

logger.debug('调试信息');
logger.info('普通信息');

// 导出日志
const logs = logger.export('json');
```

### 错误处理
```typescript
import { 
  ErrorBoundary, 
  LoadError, 
  ParseError,
  createError 
} from '@/core/errors';

// 创建错误边界
const boundary = new ErrorBoundary();

boundary.addHandler((error) => {
  // 发送到错误追踪服务
  console.error(error.toJSON());
});

boundary.registerRecovery('LOAD_ERROR', () => {
  // 重试逻辑
});

// 抛出自定义错误
throw new LoadError('加载失败', { url: 'doc.docx' });

// 使用工厂函数
throw createError('parse', '解析失败', { line: 123 });
```

### 类型工具
```typescript
import { 
  isFile,
  isArray,
  isObject,
  assertNotNullish,
  deepClone,
  deepMerge,
  pick,
  omit
} from '@/core/type-utils';

// 类型守卫
if (isFile(source)) {
  console.log(source.name); // TypeScript 知道这是 File
}

// 断言
assertNotNullish(value, '值不能为空');

// 深度克隆
const cloned = deepClone(originalObject);

// 深度合并
const merged = deepMerge(target, source1, source2);

// Pick / Omit
const selected = pick(obj, ['name', 'age']);
const filtered = omit(obj, ['password']);
```

### 防抖节流
```typescript
import { debounce, throttle, rafThrottle } from '@/utils/throttle';

// 防抖
const debouncedSearch = debounce((keyword: string) => {
  console.log('搜索:', keyword);
}, 300);

// 节流
const throttledScroll = throttle(() => {
  console.log('滚动事件');
}, 100);

// RAF 节流（用于动画）
const rafUpdate = rafThrottle(() => {
  // 更新 UI
});

window.addEventListener('scroll', rafUpdate);
```

## 🎨 最佳实践

### 1. 性能优化

#### 使用缓存
```typescript
// 文档会自动缓存，第二次加载更快
await viewer.loadFile(file); // 首次加载
await viewer.loadFile(file); // 从缓存加载
```

#### 监控内存
```typescript
const monitor = new MemoryMonitor();
monitor.setThresholds({
  low: 50,
  medium: 70,
  high: 85,
  critical: 95,
});
monitor.start();
```

#### 图片懒加载
```typescript
const loader = new LazyImageLoader();
// 为所有图片启用懒加载
document.querySelectorAll('img[data-src]').forEach((img) => {
  const src = img.getAttribute('data-src');
  if (src) {
    loader.observe(img as HTMLImageElement, src);
  }
});
```

### 2. 错误处理

#### 全局错误边界
```typescript
const boundary = new ErrorBoundary();

boundary.addHandler((error) => {
  // 记录日志
  logger.error('全局错误', error);
  
  // 发送到追踪服务
  // sendToTracking(error);
  
  // 显示用户友好的错误
  showErrorMessage(error.message);
});

// 应用于 viewer
try {
  await viewer.loadFile(file);
} catch (error) {
  boundary.handleError(error as Error);
}
```

#### 具体错误处理
```typescript
try {
  await viewer.loadFile(file);
} catch (error) {
  if (error instanceof LoadError) {
    console.error('加载失败:', error.details);
  } else if (error instanceof ParseError) {
    console.error('解析失败:', error.details);
  } else if (error instanceof UnsupportedFormatError) {
    console.error('不支持的格式:', error.format);
  }
}
```

### 3. 类型安全

#### 使用类型守卫
```typescript
function loadDocument(source: File | ArrayBuffer | string) {
  if (isFile(source)) {
    return viewer.loadFile(source);
  } else if (isArrayBuffer(source)) {
    return viewer.loadBuffer(source);
  } else if (isString(source)) {
    return viewer.loadUrl(source);
  }
}
```

#### 使用断言
```typescript
function processConfig(config: any) {
  assertObject(config, '配置必须是对象');
  assertString(config.theme, '主题必须是字符串');
  assertNumber(config.zoom, '缩放必须是数字');
  
  // TypeScript 现在知道 config 的类型
}
```

### 4. 日志记录

#### 模块化日志
```typescript
class MyModule {
  private logger = new Logger({
    prefix: '[MyModule]',
    level: LogLevel.INFO,
  });

  async doSomething() {
    this.logger.info('开始处理');
    try {
      // 操作
      this.logger.debug('详细信息', { data: 'some data' });
    } catch (error) {
      this.logger.error('处理失败', error);
      throw error;
    }
    this.logger.info('处理完成');
  }
}
```

#### 日志导出
```typescript
// 导出所有日志
const allLogs = logger.export('json');
downloadFile(new Blob([allLogs]), 'logs.json');

// 只导出错误
const errors = logger.getEntries(LogLevel.ERROR);
console.table(errors);
```

## ⚡ 常见问题

### Q1: 如何处理大文件？
```typescript
// 使用流式加载
const parser = new ParserModule(viewer);
await parser.parseFileChunked(largeFile, (loaded, total) => {
  const percent = (loaded / total * 100).toFixed(1);
  console.log(`加载进度: ${percent}%`);
});
```

### Q2: 如何优化搜索性能？
```typescript
// 使用异步搜索（自动使用 Worker）
const viewerModule = viewer.getViewer();
const results = await viewerModule.searchAsync('keyword');

// 结果会自动缓存，第二次搜索更快
const cached = await viewerModule.searchAsync('keyword');
```

### Q3: 如何监控应用性能？
```typescript
// 1. 内存监控
const memMonitor = new MemoryMonitor();
memMonitor.start();

// 2. 性能日志
const perfLogger = new Logger({ prefix: '[Perf]' });

// 3. 测量操作时间
const start = performance.now();
await viewer.loadFile(file);
const duration = performance.now() - start;
perfLogger.info(`加载耗时: ${duration.toFixed(2)}ms`);
```

### Q4: 如何自定义错误处理？
```typescript
// 创建自定义错误类
class CustomError extends WordViewerError {
  constructor(message: string, customData: any) {
    super(message, 'CUSTOM_ERROR', customData);
    this.name = 'CustomError';
  }
}

// 使用
throw new CustomError('自定义错误', { extra: 'data' });
```

## 📦 配置文件

### TypeScript (tsconfig.json)
```json
{
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["src/*"],
      "@core/*": ["src/core/*"],
      "@modules/*": ["src/modules/*"],
      "@utils/*": ["src/utils/*"]
    }
  }
}
```

### ESLint (.eslintrc.json)
```json
{
  "extends": [
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

### Vitest (vitest.config.ts)
```typescript
export default defineConfig({
  test: {
    environment: 'jsdom',
    coverage: {
      lines: 80,
      functions: 80,
      branches: 80,
    },
  },
});
```

## 🔗 相关文档

- [优化总结](./OPTIMIZATION_SUMMARY.md) - 详细的优化说明
- [实施状态](./IMPLEMENTATION_STATUS.md) - 当前进度和计划
- [API 文档](./API.md) - 完整的 API 参考
- [示例](./examples/) - 使用示例

---

**提示**：此文档持续更新中，更多功能完成后会添加相应的参考内容。



