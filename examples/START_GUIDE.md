# Word Viewer 示例项目启动指南

所有示例项目都使用 Vite 构建，支持热更新和快速开发。

## 📦 准备工作

### 1. 构建核心包（必需）

所有示例都依赖核心包，必须先构建：

```bash
cd packages/core
npm install
npm run build
```

## 🚀 示例项目

### 1. Vanilla JavaScript 示例 ✅

**端口**: http://localhost:3000  
**目录**: `examples/vite-vanilla/`

```bash
cd examples/vite-vanilla
npm install
npm run dev
```

**特点**:
- 原生 JavaScript
- 最简单的集成方式
- 完整功能演示

---

### 2. Vue 3 示例 ✅

**端口**: http://localhost:3001  
**目录**: `examples/vite-vue/`

```bash
cd examples/vite-vue
npm install
npm run dev
```

**特点**:
- Vue 3 Composition API
- 响应式数据
- 平滑动画

---

### 3. React 示例 ✅

**端口**: http://localhost:3002  
**目录**: `examples/vite-react/`

```bash
cd examples/vite-react
npm install
npm run dev
```

**特点**:
- React 18
- React Hooks
- 状态管理

---

## ⚙️ Vite Alias 配置

所有示例都配置了 Vite alias，直接引用本地核心包：

```javascript
// vite.config.js
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@word-viewer/core': path.resolve(__dirname, '../../packages/core/dist/index.esm.js'),
    },
  },
});
```

这样可以：
- ✅ 直接使用最新构建的核心包
- ✅ 无需发布到 npm
- ✅ 支持热更新开发

---

## 🎯 快速测试步骤

### 一键测试所有示例

```bash
# 1. 构建核心包
cd packages/core
npm install
npm run build

# 2. 测试 Vanilla 示例
cd ../../examples/vite-vanilla
npm install
npm run dev
# 浏览器打开 http://localhost:3000

# 3. 测试 Vue 示例（新终端）
cd ../vite-vue
npm install
npm run dev
# 浏览器打开 http://localhost:3001

# 4. 测试 React 示例（新终端）
cd ../vite-react
npm install
npm run dev
# 浏览器打开 http://localhost:3002
```

---

## 📝 测试清单

### 核心功能测试

在每个示例中测试：

- [ ] **文档加载** - 选择 .docx 文件能否正常加载
- [ ] **缩放控制** - 放大/缩小按钮是否有效
- [ ] **编辑模式** - 能否切换编辑/查看模式
- [ ] **主题切换** - 浅色/深色主题切换是否正常
- [ ] **文本搜索** - 搜索功能是否正常工作
- [ ] **PDF 导出** - 能否导出 PDF 文件
- [ ] **HTML 导出** - 能否导出 HTML 文件
- [ ] **文档信息** - 是否正确显示文档信息
- [ ] **控制台** - 无报错信息

---

## 🐛 常见问题

### Q1: 启动报错 "Cannot find module '@word-viewer/core'"

**解决**: 先构建核心包

```bash
cd packages/core
npm run build
```

### Q2: 页面空白，控制台报错

**解决**: 检查核心包是否构建成功

```bash
ls packages/core/dist/
# 应该看到 index.esm.js 文件
```

### Q3: 端口被占用

**解决**: 修改 vite.config.js 中的端口号

```javascript
server: {
  port: 3000, // 改为其他端口
}
```

### Q4: 热更新不工作

**解决**: 
1. 重启开发服务器
2. 清除浏览器缓存
3. 检查 Vite 配置

---

## 📊 项目对比

| 特性 | Vanilla | Vue | React |
|------|---------|-----|-------|
| **端口** | 3000 | 3001 | 3002 |
| **框架** | 无 | Vue 3 | React 18 |
| **API** | DOM | Composition | Hooks |
| **体积** | 最小 | 中等 | 中等 |
| **学习曲线** | 低 | 中 | 中 |
| **推荐场景** | 快速集成 | Vue 项目 | React 项目 |

---

## 🎨 自定义开发

### 修改核心包代码

1. 修改 `packages/core/src/` 中的代码
2. 重新构建: `cd packages/core && npm run build`
3. 刷新示例项目浏览器页面

### 开发模式（推荐）

在核心包目录启用 watch 模式：

```bash
cd packages/core
npm run dev  # 监听文件变化自动构建
```

然后在另一个终端启动示例项目。

---

## ✨ 下一步

1. **选择一个示例** - 根据你的技术栈选择
2. **启动项目** - 按照上面的步骤启动
3. **加载文档** - 选择一个 .docx 文件测试
4. **探索功能** - 试试所有工具栏功能
5. **查看代码** - 了解如何集成到你的项目

---

**提示**: 所有示例项目都是完整可用的，可以直接复制到你的项目中使用！

🎉 祝你使用愉快！

