<template>
  <div id="app">
    <header>
      <h1>💚 @word-viewer/vue 演示</h1>
      <p>Vue 3 组件版 Word 文档查看器的完整功能演示</p>
    </header>

    <nav class="tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        :class="['tab', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </nav>

    <!-- 基础用法 -->
    <section v-if="activeTab === 'basic'" class="tab-content">
      <h2>基础用法</h2>
      
      <div class="demo-section">
        <h3>1. 基本使用</h3>
        <input type="file" @change="handleFileChange" accept=".doc,.docx">
        <WordViewer 
          v-if="basicFile"
          :file="basicFile"
          :options="basicOptions"
          @loaded="handleLoaded"
          @error="handleError"
        />
      </div>

      <div class="demo-section">
        <h3>2. URL 加载</h3>
        <input v-model="urlInput" placeholder="输入文档URL">
        <button @click="loadUrl">加载</button>
        <WordViewer 
          v-if="currentUrl"
          :url="currentUrl"
          :options="basicOptions"
        />
      </div>

      <div class="demo-section">
        <h3>3. 配置选项</h3>
        <div class="config-controls">
          <label>
            渲染引擎:
            <select v-model="configOptions.renderEngine">
              <option value="auto">自动</option>
              <option value="docx-preview">docx-preview</option>
              <option value="mammoth">mammoth</option>
            </select>
          </label>
          <label>
            主题:
            <select v-model="configOptions.theme">
              <option value="light">浅色</option>
              <option value="dark">深色</option>
            </select>
          </label>
          <label>
            <input type="checkbox" v-model="configOptions.editable">
            可编辑
          </label>
        </div>
        <WordViewer 
          v-if="configFile"
          :file="configFile"
          :options="configOptions"
        />
      </div>
    </section>

    <!-- Props & Events -->
    <section v-if="activeTab === 'props'" class="tab-content">
      <h2>Props & Events</h2>
      
      <div class="demo-section">
        <h3>Props 演示</h3>
        <div class="props-demo">
          <div class="prop-control">
            <label>file:</label>
            <input type="file" @change="propsFile = $event.target.files[0]">
          </div>
          <div class="prop-control">
            <label>url:</label>
            <input v-model="propsUrl" placeholder="文档URL">
          </div>
          <div class="prop-control">
            <label>buffer:</label>
            <button @click="loadBuffer">加载 Buffer</button>
          </div>
          <div class="prop-control">
            <label>options:</label>
            <pre>{{ JSON.stringify(propsOptions, null, 2) }}</pre>
          </div>
        </div>
        <WordViewer 
          v-if="propsFile || propsUrl || propsBuffer"
          :file="propsFile"
          :url="propsUrl"
          :buffer="propsBuffer"
          :options="propsOptions"
          @loaded="logEvent('loaded', $event)"
          @error="logEvent('error', $event)"
          @progress="logEvent('progress', $event)"
          @page-change="logEvent('page-change', $event)"
          @zoom="logEvent('zoom', $event)"
          @edit-start="logEvent('edit-start')"
          @edit-end="logEvent('edit-end')"
          @changed="logEvent('changed')"
        />
        <div class="event-log">
          <h4>事件日志</h4>
          <div class="log-entries">
            <div v-for="(event, index) in eventLog" :key="index" class="log-entry">
              <span class="event-time">[{{ event.time }}]</span>
              <span class="event-name">{{ event.name }}</span>
              <span v-if="event.data" class="event-data">{{ JSON.stringify(event.data) }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 插槽 -->
    <section v-if="activeTab === 'slots'" class="tab-content">
      <h2>插槽使用</h2>
      
      <div class="demo-section">
        <h3>自定义加载状态</h3>
        <input type="file" @change="slotFile = $event.target.files[0]">
        <WordViewer v-if="slotFile" :file="slotFile">
          <template #loading>
            <div class="custom-loading">
              <div class="spinner"></div>
              <p>正在加载文档...</p>
            </div>
          </template>
          <template #error="{ error }">
            <div class="custom-error">
              <h3>加载失败</h3>
              <p>{{ error.message }}</p>
            </div>
          </template>
        </WordViewer>
      </div>

      <div class="demo-section">
        <h3>自定义工具栏</h3>
        <WordViewer 
          v-if="toolbarFile"
          :file="toolbarFile"
          ref="toolbarViewer"
        >
          <template #toolbar>
            <div class="custom-toolbar">
              <button @click="$refs.toolbarViewer?.zoomIn()">放大</button>
              <button @click="$refs.toolbarViewer?.zoomOut()">缩小</button>
              <button @click="$refs.toolbarViewer?.exportToPDF()">导出PDF</button>
            </div>
          </template>
        </WordViewer>
        <input type="file" @change="toolbarFile = $event.target.files[0]">
      </div>
    </section>

    <!-- 方法调用 -->
    <section v-if="activeTab === 'methods'" class="tab-content">
      <h2>组件方法</h2>
      
      <div class="demo-section">
        <h3>方法调用演示</h3>
        <input type="file" @change="methodFile = $event.target.files[0]">
        
        <div v-if="methodFile" class="method-controls">
          <h4>文档控制</h4>
          <button @click="$refs.methodViewer?.setZoom(1.5)">设置缩放 150%</button>
          <button @click="$refs.methodViewer?.goToPage(1)">跳到第一页</button>
          <button @click="testSearch">搜索 "test"</button>
          
          <h4>导出功能</h4>
          <button @click="exportPDF">导出 PDF</button>
          <button @click="exportHTML">导出 HTML</button>
          <button @click="exportDocx">导出 DOCX</button>
          
          <h4>编辑功能</h4>
          <button @click="$refs.methodViewer?.enableEdit()">启用编辑</button>
          <button @click="$refs.methodViewer?.disableEdit()">禁用编辑</button>
          <button @click="$refs.methodViewer?.applyFormat({ bold: true })">加粗</button>
          
          <h4>信息获取</h4>
          <button @click="getDocInfo">获取文档信息</button>
          <button @click="getPageInfo">获取页面信息</button>
          <button @click="getEditState">获取编辑状态</button>
        </div>
        
        <WordViewer 
          v-if="methodFile"
          ref="methodViewer"
          :file="methodFile"
          :options="{ editable: true }"
        />
        
        <div v-if="methodOutput" class="method-output">
          <h4>输出结果</h4>
          <pre>{{ methodOutput }}</pre>
        </div>
      </div>
    </section>

    <!-- 响应式 -->
    <section v-if="activeTab === 'reactive'" class="tab-content">
      <h2>响应式数据</h2>
      
      <div class="demo-section">
        <h3>双向绑定演示</h3>
        
        <div class="reactive-controls">
          <label>
            缩放级别:
            <input 
              type="range" 
              v-model.number="reactiveZoom" 
              min="50" 
              max="200"
              @input="updateZoom"
            >
            {{ reactiveZoom }}%
          </label>
          
          <label>
            当前页:
            <input 
              type="number" 
              v-model.number="reactivePage" 
              min="1"
              @change="updatePage"
            >
          </label>
          
          <label>
            <input type="checkbox" v-model="reactiveEditable" @change="updateEditable">
            编辑模式
          </label>
          
          <label>
            主题:
            <select v-model="reactiveTheme" @change="updateTheme">
              <option value="light">浅色</option>
              <option value="dark">深色</option>
            </select>
          </label>
        </div>
        
        <input type="file" @change="reactiveFile = $event.target.files[0]">
        
        <WordViewer 
          v-if="reactiveFile"
          ref="reactiveViewer"
          :file="reactiveFile"
          :options="{
            initialZoom: reactiveZoom / 100,
            editable: reactiveEditable,
            theme: reactiveTheme
          }"
          @zoom="reactiveZoom = $event * 100"
          @page-change="reactivePage = $event.current"
        />
        
        <div class="reactive-state">
          <h4>当前状态</h4>
          <p>缩放: {{ reactiveZoom }}%</p>
          <p>页面: {{ reactivePage }}</p>
          <p>编辑: {{ reactiveEditable ? '开启' : '关闭' }}</p>
          <p>主题: {{ reactiveTheme }}</p>
        </div>
      </div>
    </section>

    <!-- 高级用法 -->
    <section v-if="activeTab === 'advanced'" class="tab-content">
      <h2>高级用法</h2>
      
      <div class="demo-section">
        <h3>多实例管理</h3>
        <div class="multi-instance">
          <div v-for="(instance, index) in instances" :key="instance.id" class="instance">
            <h4>实例 {{ index + 1 }}</h4>
            <input type="file" @change="loadInstance(index, $event.target.files[0])">
            <WordViewer 
              v-if="instance.file"
              :file="instance.file"
              :options="instance.options"
            />
          </div>
          <button @click="addInstance">添加实例</button>
        </div>
      </div>

      <div class="demo-section">
        <h3>动态配置更新</h3>
        <button @click="toggleDynamicTheme">切换主题</button>
        <button @click="toggleDynamicEdit">切换编辑模式</button>
        <button @click="changeDynamicEngine">切换渲染引擎</button>
        
        <input type="file" @change="dynamicFile = $event.target.files[0]">
        <WordViewer 
          v-if="dynamicFile"
          ref="dynamicViewer"
          :file="dynamicFile"
          :options="dynamicOptions"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { WordViewer } from '../../src';
import '../../src/WordViewer.vue';

// Tabs
const tabs = [
  { id: 'basic', label: '基础用法' },
  { id: 'props', label: 'Props & Events' },
  { id: 'slots', label: '插槽' },
  { id: 'methods', label: '方法调用' },
  { id: 'reactive', label: '响应式' },
  { id: 'advanced', label: '高级用法' },
];

const activeTab = ref('basic');

// 基础用法
const basicFile = ref<File | null>(null);
const currentUrl = ref('');
const urlInput = ref('/samples/sample.docx');
const configFile = ref<File | null>(null);

const basicOptions = {
  renderEngine: 'auto' as const,
  theme: 'light' as const,
};

const configOptions = reactive({
  renderEngine: 'auto' as const,
  theme: 'light' as const,
  editable: false,
});

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  basicFile.value = target.files?.[0] || null;
};

const handleLoaded = (event: any) => {
  console.log('文档加载完成', event);
};

const handleError = (error: any) => {
  console.error('加载失败', error);
};

const loadUrl = () => {
  currentUrl.value = urlInput.value;
};

// Props & Events
const propsFile = ref<File | null>(null);
const propsUrl = ref('');
const propsBuffer = ref<ArrayBuffer | null>(null);
const propsOptions = reactive({
  renderEngine: 'auto' as const,
  editable: true,
  initialZoom: 1.0,
});

const eventLog = ref<Array<{
  time: string;
  name: string;
  data?: any;
}>>([]);

const logEvent = (name: string, data?: any) => {
  eventLog.value.push({
    time: new Date().toLocaleTimeString(),
    name,
    data,
  });
  
  // 保持日志最多20条
  if (eventLog.value.length > 20) {
    eventLog.value.shift();
  }
};

const loadBuffer = async () => {
  try {
    const response = await fetch('/samples/sample.docx');
    propsBuffer.value = await response.arrayBuffer();
  } catch (err) {
    console.error('加载Buffer失败', err);
  }
};

// 插槽
const slotFile = ref<File | null>(null);
const toolbarFile = ref<File | null>(null);

// 方法调用
const methodFile = ref<File | null>(null);
const methodViewer = ref<InstanceType<typeof WordViewer> | null>(null);
const methodOutput = ref('');

const testSearch = () => {
  const results = methodViewer.value?.search('test');
  methodOutput.value = JSON.stringify(results, null, 2);
};

const exportPDF = async () => {
  try {
    const blob = await methodViewer.value?.exportToPDF();
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'document.pdf';
      a.click();
      URL.revokeObjectURL(url);
    }
  } catch (err) {
    console.error('导出PDF失败', err);
  }
};

const exportHTML = () => {
  const html = methodViewer.value?.exportToHTML();
  if (html) {
    methodOutput.value = 'HTML导出成功，长度: ' + html.length;
  }
};

const exportDocx = async () => {
  try {
    const blob = await methodViewer.value?.exportToDocx();
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'document.docx';
      a.click();
      URL.revokeObjectURL(url);
    }
  } catch (err) {
    console.error('导出DOCX失败', err);
  }
};

const getDocInfo = () => {
  const info = methodViewer.value?.getDocumentInfo();
  methodOutput.value = JSON.stringify(info, null, 2);
};

const getPageInfo = () => {
  const info = methodViewer.value?.getPageInfo();
  methodOutput.value = JSON.stringify(info, null, 2);
};

const getEditState = () => {
  const state = methodViewer.value?.getEditState();
  methodOutput.value = JSON.stringify(state, null, 2);
};

// 响应式
const reactiveFile = ref<File | null>(null);
const reactiveViewer = ref<InstanceType<typeof WordViewer> | null>(null);
const reactiveZoom = ref(100);
const reactivePage = ref(1);
const reactiveEditable = ref(false);
const reactiveTheme = ref<'light' | 'dark'>('light');

const updateZoom = () => {
  reactiveViewer.value?.setZoom(reactiveZoom.value / 100);
};

const updatePage = () => {
  reactiveViewer.value?.goToPage(reactivePage.value);
};

const updateEditable = () => {
  if (reactiveEditable.value) {
    reactiveViewer.value?.enableEdit();
  } else {
    reactiveViewer.value?.disableEdit();
  }
};

const updateTheme = () => {
  reactiveViewer.value?.updateOptions({ theme: reactiveTheme.value });
};

// 高级用法
const instances = ref([
  { id: 1, file: null as File | null, options: { theme: 'light' as const } },
]);

const addInstance = () => {
  instances.value.push({
    id: Date.now(),
    file: null,
    options: { theme: 'light' as const },
  });
};

const loadInstance = (index: number, file: File) => {
  instances.value[index].file = file;
};

const dynamicFile = ref<File | null>(null);
const dynamicViewer = ref<InstanceType<typeof WordViewer> | null>(null);
const dynamicOptions = reactive({
  theme: 'light' as const,
  editable: false,
  renderEngine: 'auto' as const,
});

const toggleDynamicTheme = () => {
  dynamicOptions.theme = dynamicOptions.theme === 'light' ? 'dark' : 'light';
  dynamicViewer.value?.updateOptions({ theme: dynamicOptions.theme });
};

const toggleDynamicEdit = () => {
  dynamicOptions.editable = !dynamicOptions.editable;
  if (dynamicOptions.editable) {
    dynamicViewer.value?.enableEdit();
  } else {
    dynamicViewer.value?.disableEdit();
  }
};

const changeDynamicEngine = () => {
  const engines = ['auto', 'docx-preview', 'mammoth'] as const;
  const currentIndex = engines.indexOf(dynamicOptions.renderEngine);
  const nextIndex = (currentIndex + 1) % engines.length;
  dynamicOptions.renderEngine = engines[nextIndex];
};
</script>

<style scoped>
/* 样式将在单独的文件中定义 */
</style>

