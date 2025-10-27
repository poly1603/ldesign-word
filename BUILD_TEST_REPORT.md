# Word Viewer 构建测试报告

## 🎯 测试目标

1. ✅ 验证所有包能使用 @ldesign/builder 正常构建
2. ✅ 验证所有演示项目能正常启动
3. ✅ 确保没有配置错误

---

## 📦 包依赖更新

已为所有包添加 @ldesign/builder 依赖：

### 根 package.json
```json
"devDependencies": {
  "@ldesign/builder": "workspace:*",
  // ...其他依赖
}
```

### 各子包 package.json
所有子包（core, vue, react, lit）都已添加：
```json
"devDependencies": {
  "@ldesign/builder": "workspace:*",
  "typescript": "^5.2.2"
}
```

---

## 🔧 配置文件清单

### 构建配置 (.ldesign/builder.config.ts)
- ✅ `libraries/word/.ldesign/builder.config.ts`
- ✅ `packages/core/.ldesign/builder.config.ts`
- ✅ `packages/vue/.ldesign/builder.config.ts`
- ✅ `packages/react/.ldesign/builder.config.ts`
- ✅ `packages/lit/.ldesign/builder.config.ts`

### 演示项目配置
每个演示项目都包含：
- ✅ `package.json`
- ✅ `vite.config.ts`
- ✅ `tsconfig.json`
- ✅ `index.html`
- ✅ `src/main.ts` (或 .tsx)

---

## 🧪 测试步骤

### 1. 安装依赖

```bash
cd libraries/word
npm install
```

这将安装所有必需的依赖，包括 @ldesign/builder。

### 2. 构建测试

#### Core 包
```bash
cd packages/core
npm run build
```

**预期产物**:
- `dist/esm/index.js`
- `dist/cjs/index.js`
- `dist/umd/index.js`
- `dist/index.d.ts`
- `dist/word-viewer.css`

#### Vue 包
```bash
cd packages/vue
npm run build
```

**预期产物**:
- `dist/esm/index.js`
- `dist/cjs/index.js`
- `dist/index.d.ts`
- `dist/style.css`

#### React 包
```bash
cd packages/react
npm run build
```

**预期产物**:
- `dist/esm/index.js`
- `dist/cjs/index.js`
- `dist/index.d.ts`

#### Lit 包
```bash
cd packages/lit
npm run build
```

**预期产物**:
- `dist/esm/index.js`
- `dist/cjs/index.js`
- `dist/index.d.ts`

### 3. 演示项目测试

#### Core 演示 (端口 3001)
```bash
cd packages/core/demo
npm install
npm run dev
# 打开 http://localhost:3001
```

**测试项目**:
- [ ] 文件上传功能
- [ ] URL 加载功能
- [ ] 缩放控制
- [ ] 搜索功能
- [ ] 页面导航
- [ ] 导出功能
- [ ] 编辑功能
- [ ] API 调用

#### Vue 演示 (端口 3002)
```bash
cd packages/vue/demo
npm install
npm run dev
# 打开 http://localhost:3002
```

**测试项目**:
- [ ] 基础用法
- [ ] Props & Events
- [ ] 插槽功能
- [ ] 方法调用
- [ ] 响应式绑定
- [ ] 多实例管理

#### React 演示 (端口 3003)
```bash
cd packages/react/demo
npm install
npm run dev
# 打开 http://localhost:3003
```

**测试项目**:
- [ ] 基础用法
- [ ] Props & Events
- [ ] Hooks 用法
- [ ] Ref 转发
- [ ] 性能优化
- [ ] 多实例管理

#### Lit 演示 (端口 3004)
```bash
cd packages/lit/demo
npm install
npm run dev
# 打开 http://localhost:3004
```

**测试项目**:
- [ ] 基础用法
- [ ] 事件处理
- [ ] 属性绑定
- [ ] 方法调用
- [ ] 样式定制
- [ ] 生命周期

---

## 🐛 已知问题和解决方案

### 问题 1: @ldesign/builder 未找到
**解决方案**: 已在所有 package.json 中添加 `"@ldesign/builder": "workspace:*"`

### 问题 2: 演示项目无法引用父级源码
**解决方案**: 
- 在 vite.config.ts 中配置了 alias
- 在 tsconfig.json 中配置了 paths

### 问题 3: TypeScript 配置缺失
**解决方案**: 为所有演示项目创建了 tsconfig.json

---

## 📊 构建命令汇总

```bash
# 根目录构建所有包
cd libraries/word
npm run build

# 单独构建各包
cd packages/core && npm run build
cd packages/vue && npm run build
cd packages/react && npm run build
cd packages/lit && npm run build

# 运行演示
cd packages/core/demo && npm run dev    # 3001
cd packages/vue/demo && npm run dev      # 3002
cd packages/react/demo && npm run dev    # 3003
cd packages/lit/demo && npm run dev      # 3004
```

---

## ✅ 验证清单

### 构建验证
- [ ] Core 包构建成功，产物完整
- [ ] Vue 包构建成功，产物完整
- [ ] React 包构建成功，产物完整
- [ ] Lit 包构建成功，产物完整

### 演示项目验证
- [ ] Core 演示项目启动成功，无报错
- [ ] Vue 演示项目启动成功，无报错
- [ ] React 演示项目启动成功，无报错
- [ ] Lit 演示项目启动成功，无报错

### 功能验证
- [ ] 文件上传和查看功能正常
- [ ] 文档缩放功能正常
- [ ] 搜索功能正常
- [ ] 页面导航功能正常
- [ ] 事件触发正常
- [ ] API 调用正常

---

## 📝 测试注意事项

1. **首次运行**: 需要先构建包，再运行演示项目
2. **依赖安装**: 每个演示项目需要单独安装依赖
3. **端口冲突**: 确保端口 3001-3004 未被占用
4. **示例文档**: 需要准备 .docx 文件用于测试

---

## 🚀 快速测试脚本

创建一个测试脚本 `test-all.sh`:

```bash
#!/bin/bash

echo "=== 测试 Word Viewer 包构建 ==="

# 测试 Core
echo "测试 core 包..."
cd packages/core
npm run build
if [ $? -eq 0 ]; then
  echo "✅ core 包构建成功"
else
  echo "❌ core 包构建失败"
  exit 1
fi
cd ../..

# 测试 Vue
echo "测试 vue 包..."
cd packages/vue
npm run build
if [ $? -eq 0 ]; then
  echo "✅ vue 包构建成功"
else
  echo "❌ vue 包构建失败"
  exit 1
fi
cd ../..

# 测试 React
echo "测试 react 包..."
cd packages/react
npm run build
if [ $? -eq 0 ]; then
  echo "✅ react 包构建成功"
else
  echo "❌ react 包构建失败"
  exit 1
fi
cd ../..

# 测试 Lit
echo "测试 lit 包..."
cd packages/lit
npm run build
if [ $? -eq 0 ]; then
  echo "✅ lit 包构建成功"
else
  echo "❌ lit 包构建失败"
  exit 1
fi
cd ../..

echo "=== 所有包构建完成 ==="
```

---

## 📄 总结

所有配置文件已就绪，包括：
- ✅ 构建配置 (@ldesign/builder)
- ✅ TypeScript 配置
- ✅ Vite 配置
- ✅ 包依赖

待执行测试：
- ⏳ 实际构建测试
- ⏳ 演示项目启动测试
- ⏳ 浏览器功能测试

---

**准备就绪，可以开始测试！** 🎉
