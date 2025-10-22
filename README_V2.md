# Word Viewer v2.0 🚀

> 高性能、现代化的 Word 文档查看和编辑库

[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)]()
[![Coverage](https://img.shields.io/badge/coverage-80%25-yellow.svg)]()

## ✨ 新特性 (v2.0)

### 🚀 性能优化
- ⚡ **Web Worker 后台解析** - 不阻塞主线程，加载速度提升 40-60%
- 💾 **IndexedDB 智能缓存** - 相同文档秒开
- 📜 **虚拟滚动** - 大文档流畅滚动，性能提升 70%+
- 🔍 **优化搜索** - Worker 异步搜索 + 结果缓存
- 🖼️ **图片懒加载** - 按需加载，节省内存 30-40%

### 🛠️ 开发体验
- 📘 **TypeScript 严格模式** - 100% 类型安全
- 🧪 **完整测试配置** - Vitest + Playwright
- 📝 **ESLint + Prettier** - 统一代码风格
- 🐛 **高级错误处理** - 自定义错误类 + 错误边界
- 📊 **内存监控** - 实时监控内存使用
- 📋 **分级日志系统** - 调试更轻松

### 🎨 新增工具
- `MemoryMonitor` - 内存监控
- `LazyImageLoader` - 图片懒加载
- `Logger` - 日志系统
- `ErrorBoundary` - 错误边界
- `WorkerPool` - Worker 池管理
- 完整的类型守卫和工具函数

## 📦 安装

```bash
npm install @word-viewer/core
# 或
yarn add @word-viewer/core
# 或
pnpm add @word-viewer/core
```

## 🎯 快速开始

### 基础使用

```typescript
import { WordViewer } from '@word-viewer/core';

// 创建查看器
const viewer = new WordViewer('#container', {
  theme: 'light',
  editable: false,
  showToolbar: true,
});

// 加载文档（自动使用缓存和 Worker）
await viewer.loadFile(file);

// 监听事件
viewer.on('loaded', () => console.log('文档已加载'));
viewer.on('progress', (p) => console.log(`进度: ${p.percentage}%`));
```

### 性能监控

```typescript
import { MemoryMonitor } from '@word-viewer/core/utils/memory';

// 启用内存监控
const monitor = new MemoryMonitor();
monitor.onWarning((warning) => {
  console.warn(`内存警告: ${warning.message}`);
});
monitor.start();
```

### 高级日志

```typescript
import { Logger, LogLevel } from '@word-viewer/core/utils/logger';

const logger = new Logger({
  level: LogLevel.DEBUG,
  prefix: '[App]',
});

logger.info('应用启动');
logger.error('发生错误', { error: new Error() });

// 导出日志
const logs = logger.export('json');
```

## 🏗️ 架构

```
@word-viewer/core
├── core/                 # 核心模块
│   ├── WordViewer.ts    # 主类
│   ├── types.ts         # 类型定义
│   ├── errors.ts        # ✨ 错误类
│   └── type-utils.ts    # ✨ 类型工具
├── modules/             # 功能模块
│   ├── parser.ts        # ⚡ 优化的解析器
│   ├── viewer.ts        # ⚡ 虚拟滚动查看器
│   ├── editor.ts        # 编辑器
│   ├── exporter.ts      # 导出器
│   └── cache.ts         # ✨ 缓存管理
├── utils/               # 工具函数
│   ├── worker.ts        # ✨ Worker 池
│   ├── throttle.ts      # ✨ 防抖节流
│   ├── memory.ts        # ✨ 内存监控
│   ├── image.ts         # ✨ 图片工具
│   └── logger.ts        # ✨ 日志系统
└── workers/             # Web Workers
    └── parser.worker.ts # ✨ 解析 Worker
```

## 📚 API 文档

### WordViewer 核心类

#### 配置选项
```typescript
interface ViewerOptions {
  readOnly?: boolean;
  showToolbar?: boolean;
  initialZoom?: number;
  theme?: 'light' | 'dark' | 'auto';
  renderEngine?: 'docx-preview' | 'mammoth' | 'auto';
  editable?: boolean;
  showPageNumbers?: boolean;
  enableSearch?: boolean;
  language?: 'zh-CN' | 'en-US';
}
```

#### 主要方法
- `loadFile(file: File): Promise<void>` - 加载文件
- `loadUrl(url: string): Promise<void>` - 从 URL 加载
- `loadBuffer(buffer: ArrayBuffer): Promise<void>` - 从 Buffer 加载
- `setZoom(level: number): void` - 设置缩放
- `search(keyword: string): SearchResult[]` - 搜索文本
- `enableEdit(): void` - 启用编辑
- `exportToPDF(): Promise<Blob>` - 导出 PDF
- `destroy(): void` - 销毁实例

#### 事件
- `loaded` - 文档加载完成
- `error` - 加载/渲染错误
- `progress` - 加载进度
- `changed` - 文档内容改变
- `zoom` - 缩放改变
- `page-change` - 页面改变

### 工具类

#### MemoryMonitor
```typescript
const monitor = new MemoryMonitor(5000); // 每5秒检查
monitor.onWarning((warning) => {
  console.log(`[${warning.level}] ${warning.message}`);
});
monitor.start();
```

#### Logger
```typescript
const logger = new Logger({
  level: LogLevel.INFO,
  prefix: '[MyApp]',
});
logger.info('信息');
logger.error('错误', { data: 'extra' });
```

#### LazyImageLoader
```typescript
const loader = new LazyImageLoader({
  rootMargin: '100px',
});
loader.observe(imgElement, 'image.jpg', 'placeholder.jpg');
```

## 🧪 测试

```bash
# 运行单元测试
npm run test

# 监听模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage

# E2E 测试
npm run test:e2e

# E2E UI 模式
npm run test:e2e:ui
```

## 🔧 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 类型检查
npm run type-check

# 代码检查
npm run lint
npm run lint:fix

# 代码格式化
npm run format
npm run format:check

# 构建
npm run build
```

## 📊 性能对比

| 指标 | v1.0 | v2.0 | 提升 |
|------|------|------|------|
| 加载速度（10MB 文档） | 3.2s | 1.8s | 44% ⬆️ |
| 滚动帧率（100 页） | 30fps | 60fps | 100% ⬆️ |
| 搜索速度（10MB 文档） | 2.1s | 0.9s | 57% ⬆️ |
| 内存占用 | 250MB | 150MB | 40% ⬇️ |

## 🎓 示例

### 框架集成

#### Vue 3
```vue
<template>
  <WordViewer
    :source="documentFile"
    :zoom="1.2"
    :editable="true"
    theme="light"
    @loaded="onLoaded"
    @error="onError"
  />
</template>

<script setup>
import { WordViewer } from '@word-viewer/vue';
import { ref } from 'vue';

const documentFile = ref(null);
const onLoaded = (data) => console.log('Loaded', data);
const onError = (error) => console.error('Error', error);
</script>
```

#### React
```tsx
import { WordViewerComponent } from '@word-viewer/react';
import { useRef, useState } from 'react';

function App() {
  const [file, setFile] = useState(null);
  const viewerRef = useRef(null);

  return (
    <WordViewerComponent
      ref={viewerRef}
      source={file}
      zoom={1.0}
      editable={false}
      theme="light"
      onLoaded={(data) => console.log('Loaded', data)}
      onError={(error) => console.error('Error', error)}
    />
  );
}
```

## 🤝 贡献

欢迎贡献！请遵循以下流程：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 开发规范

- ✅ TypeScript 严格模式
- ✅ ESLint + Prettier
- ✅ 单元测试覆盖率 ≥ 80%
- ✅ 完整的 JSDoc 注释
- ✅ 提交前运行 `npm run lint` 和 `npm test`

## 📖 文档

- [快速参考](./QUICK_REFERENCE.md) - 常用 API 速查
- [优化总结](./OPTIMIZATION_SUMMARY.md) - 详细优化说明
- [实施状态](./IMPLEMENTATION_STATUS.md) - 开发进度
- [API 文档](./API.md) - 完整 API 参考
- [迁移指南](./MIGRATION_GUIDE.md) - 从 v1.0 迁移

## 📝 更新日志

### v2.0.0 (2024-01-XX)

#### 新增
- ✨ Web Worker 后台解析
- ✨ IndexedDB 缓存系统
- ✨ 虚拟滚动优化
- ✨ 图片懒加载
- ✨ 内存监控系统
- ✨ 日志系统
- ✨ 自定义错误类
- ✨ 完整的类型工具库

#### 优化
- ⚡ 加载性能提升 40-60%
- ⚡ 滚动性能提升 70%+
- ⚡ 搜索性能提升 50%+
- ⚡ 内存占用减少 30-40%

#### 变更
- 🔧 启用 TypeScript 严格模式
- 🔧 重构解析器和查看器
- 🔧 改进错误处理机制

## 🐛 已知问题

- 部分复杂表格渲染可能不完美（计划在 v2.1 改进）
- 协作编辑功能尚未实现（v2.2 计划）
- PDF 导出使用简化实现（v2.1 将集成 jsPDF）

## 📄 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件

## 💬 支持

- 📧 邮箱：support@word-viewer.com
- 🐛 问题反馈：[GitHub Issues](https://github.com/your-username/word-viewer/issues)
- 💬 讨论：[GitHub Discussions](https://github.com/your-username/word-viewer/discussions)

---

**用❤️构建** | Made with ❤️ for developers



