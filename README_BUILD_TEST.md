# 🚀 Word Viewer 构建测试指南

## ✅ 所有配置已完成

我已经完成了所有必要的配置工作，现在您可以进行实际的构建和测试了。

---

## 📋 已完成的工作

### 1. ✅ 添加 @ldesign/builder 依赖

所有包的 package.json 都已添加：
```json
"devDependencies": {
  "@ldesign/builder": "workspace:*"
}
```

- ✅ `libraries/word/package.json`
- ✅ `packages/core/package.json`
- ✅ `packages/vue/package.json`
- ✅ `packages/react/package.json`
- ✅ `packages/lit/package.json`

### 2. ✅ 创建 @ldesign/builder 配置

- ✅ `libraries/word/.ldesign/builder.config.ts` (根配置)
- ✅ `packages/core/.ldesign/builder.config.ts`
- ✅ `packages/vue/.ldesign/builder.config.ts`
- ✅ `packages/react/.ldesign/builder.config.ts`
- ✅ `packages/lit/.ldesign/builder.config.ts`

### 3. ✅ 创建演示项目

每个包都有完整的演示项目：

#### Core 演示 (packages/core/demo/)
- ✅ index.html
- ✅ src/main.ts (完整的6个功能演示)
- ✅ src/styles.css
- ✅ vite.config.ts
- ✅ package.json
- ✅ tsconfig.json

#### Vue 演示 (packages/vue/demo/)
- ✅ index.html
- ✅ src/main.ts
- ✅ src/App.vue (完整的6个功能演示)
- ✅ src/styles.css
- ✅ vite.config.ts
- ✅ package.json
- ✅ tsconfig.json

#### React 演示 (packages/react/demo/)
- ✅ index.html
- ✅ src/main.tsx
- ✅ src/App.tsx (完整的6个功能演示)
- ✅ src/styles.css
- ✅ vite.config.ts
- ✅ package.json
- ✅ tsconfig.json

#### Lit 演示 (packages/lit/demo/)
- ✅ index.html
- ✅ src/main.ts (完整的6个功能演示)
- ✅ vite.config.ts
- ✅ package.json
- ✅ tsconfig.json

### 4. ✅ 移除旧配置

- ✅ 删除所有 rollup.config.js 文件
- ✅ 清理不需要的依赖

### 5. ✅ 更新脚本命令

所有包的 package.json 都更新为：
```json
"scripts": {
  "build": "ldesign-builder build",
  "dev": "ldesign-builder dev",
  "clean": "rimraf dist",
  "demo": "cd demo && vite",
  "demo:build": "cd demo && vite build",
  "demo:preview": "cd demo && vite preview"
}
```

---

## 🧪 测试步骤

### 步骤 1: 安装依赖

```bash
cd D:\WorkBench\ldesign\libraries\word

# 安装根目录依赖
npm install

# 如果使用 pnpm (推荐)
pnpm install
```

### 步骤 2: 构建所有包

```bash
# 方式 1: 在根目录构建所有包
npm run build

# 方式 2: 单独构建每个包
cd packages/core
npm run build

cd ../vue
npm run build

cd ../react
npm run build

cd ../lit
npm run build
```

### 步骤 3: 检查构建产物

#### Core 包产物
```bash
ls packages/core/dist/

# 应该看到:
# - esm/index.js
# - cjs/index.js
# - umd/index.js
# - index.d.ts
# - word-viewer.css
```

#### Vue 包产物
```bash
ls packages/vue/dist/

# 应该看到:
# - esm/index.js
# - cjs/index.js
# - index.d.ts
# - style.css
```

#### React 包产物
```bash
ls packages/react/dist/

# 应该看到:
# - esm/index.js
# - cjs/index.js
# - index.d.ts
```

#### Lit 包产物
```bash
ls packages/lit/dist/

# 应该看到:
# - esm/index.js
# - cjs/index.js
# - index.d.ts
```

### 步骤 4: 运行演示项目

打开 4 个终端窗口，分别运行：

#### 终端 1: Core 演示
```bash
cd packages/core/demo
npm install
npm run dev
```
访问: http://localhost:3001

#### 终端 2: Vue 演示
```bash
cd packages/vue/demo
npm install
npm run dev
```
访问: http://localhost:3002

#### 终端 3: React 演示
```bash
cd packages/react/demo
npm install
npm run dev
```
访问: http://localhost:3003

#### 终端 4: Lit 演示
```bash
cd packages/lit/demo
npm install
npm run dev
```
访问: http://localhost:3004

### 步骤 5: 浏览器测试

在每个演示页面中测试：

1. **文件上传**
   - 准备一个 .docx 文件
   - 点击"打开文件"或"上传文件"
   - 验证文档能正常显示

2. **功能测试**
   - 缩放控制 (放大/缩小)
   - 页面导航 (上一页/下一页)
   - 搜索功能
   - 编辑模式 (如果支持)
   - 导出功能

3. **检查控制台**
   - 打开浏览器开发者工具 (F12)
   - 查看 Console 是否有错误
   - 查看 Network 是否有加载失败

4. **事件测试**
   - 触发各种操作
   - 观察事件日志是否正常记录

---

## 🔍 预期结果

### 构建成功标志
- ✅ 没有构建错误
- ✅ dist 目录生成完整
- ✅ 包含所有必需的格式 (esm, cjs, umd)
- ✅ TypeScript 类型定义生成

### 演示项目成功标志
- ✅ 服务器成功启动
- ✅ 浏览器页面正常加载
- ✅ 无控制台错误
- ✅ 可以上传和查看文档
- ✅ 所有功能按钮可点击
- ✅ 事件正常触发

---

## 🐛 可能的问题和解决方案

### 问题 1: 找不到 @ldesign/builder

**现象**: 
```
Error: Cannot find module '@ldesign/builder'
```

**解决方案**:
```bash
# 确保在 monorepo 根目录安装了依赖
cd D:\WorkBench\ldesign
pnpm install

# 然后在 word 目录重新安装
cd libraries/word
pnpm install
```

### 问题 2: 演示项目启动失败

**现象**:
```
Error: Cannot find module '@word-viewer/core'
```

**解决方案**:
```bash
# 先构建核心包
cd packages/core
npm run build

# 然后启动演示
cd demo
npm install
npm run dev
```

### 问题 3: TypeScript 类型错误

**解决方案**:
- 检查 tsconfig.json 中的 paths 配置
- 确保 vite.config.ts 中的 alias 配置正确
- 运行 `npm run type-check` 查看详细错误

### 问题 4: 端口被占用

**现象**:
```
Port 3001 is already in use
```

**解决方案**:
- 修改 vite.config.ts 中的 port 配置
- 或关闭占用端口的程序

---

## 📊 测试检查清单

### 构建测试
- [ ] Core 包构建成功
- [ ] Vue 包构建成功
- [ ] React 包构建成功
- [ ] Lit 包构建成功
- [ ] 所有包产物完整

### 演示项目测试
- [ ] Core 演示启动成功
- [ ] Vue 演示启动成功
- [ ] React 演示启动成功
- [ ] Lit 演示启动成功

### 功能测试
- [ ] 文件上传功能正常
- [ ] URL 加载功能正常
- [ ] 缩放功能正常
- [ ] 搜索功能正常
- [ ] 页面导航正常
- [ ] 事件触发正常
- [ ] 无控制台错误

### 跨浏览器测试
- [ ] Chrome 测试通过
- [ ] Firefox 测试通过
- [ ] Edge 测试通过
- [ ] Safari 测试通过 (如有 Mac)

---

## 📝 测试记录模板

```markdown
## 测试记录

**测试日期**: [填写日期]
**测试人员**: [填写姓名]
**环境**: Windows 10, Node.js [版本]

### Core 包
- 构建状态: ✅/❌
- 产物检查: ✅/❌
- 演示启动: ✅/❌
- 功能测试: ✅/❌
- 备注: [填写]

### Vue 包
- 构建状态: ✅/❌
- 产物检查: ✅/❌
- 演示启动: ✅/❌
- 功能测试: ✅/❌
- 备注: [填写]

### React 包
- 构建状态: ✅/❌
- 产物检查: ✅/❌
- 演示启动: ✅/❌
- 功能测试: ✅/❌
- 备注: [填写]

### Lit 包
- 构建状态: ✅/❌
- 产物检查: ✅/❌
- 演示启动: ✅/❌
- 功能测试: ✅/❌
- 备注: [填写]

### 问题记录
1. [描述问题]
2. [描述问题]

### 截图
[附上测试截图]
```

---

## 🎯 下一步

完成测试后，您可以：

1. **发布包**: 如果所有测试通过
2. **修复问题**: 如果发现错误
3. **优化性能**: 根据测试结果调整
4. **添加功能**: 基于反馈增强

---

## 💡 提示

1. **首次测试**: 建议从 Core 包开始，因为其他包依赖它
2. **增量测试**: 一个包测试通过后再测试下一个
3. **保存日志**: 记录构建和运行日志以便排查问题
4. **文档齐全**: 所有配置文件都已创建，可直接使用

---

**所有配置已就绪，祝测试顺利！** 🚀

如有问题，请查看:
- [BUILD_TEST_REPORT.md](./BUILD_TEST_REPORT.md) - 详细测试报告
- [FINAL_PACKAGE_CONFIGURATION.md](./FINAL_PACKAGE_CONFIGURATION.md) - 配置说明
- [QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md) - 快速开始
