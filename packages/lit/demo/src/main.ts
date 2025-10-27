import { LitElement, html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import '@word-viewer/lit';

@customElement('word-demo-app')
export class WordDemoApp extends LitElement {
  static styles = css`
    :host {
      display: block;
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
    }

    header {
      background: white;
      padding: 40px;
      border-radius: 15px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      margin-bottom: 30px;
      text-align: center;
    }

    h1 {
      font-size: 42px;
      color: #ff6d00;
      margin-bottom: 10px;
    }

    .subtitle {
      color: #6c757d;
      font-size: 18px;
    }

    .tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 30px;
      background: white;
      padding: 15px;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      overflow-x: auto;
    }

    .tab {
      padding: 12px 24px;
      background: #f8f9fa;
      border: 2px solid transparent;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      color: #2c3e50;
      transition: all 0.3s ease;
      white-space: nowrap;
    }

    .tab:hover {
      background: #ff6d00;
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(255, 109, 0, 0.3);
    }

    .tab.active {
      background: #ff6d00;
      color: white;
      border-color: #e65100;
    }

    .tab-content {
      display: none;
      animation: fadeIn 0.4s ease;
    }

    .tab-content.active {
      display: block;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .tab-content h2 {
      font-size: 32px;
      color: white;
      margin-bottom: 30px;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    }

    .demo-section {
      background: white;
      padding: 30px;
      border-radius: 15px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      margin-bottom: 30px;
    }

    .demo-section h3 {
      font-size: 24px;
      color: #ff6d00;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #dee2e6;
    }

    input, select, button {
      padding: 10px 15px;
      border: 2px solid #dee2e6;
      border-radius: 8px;
      font-size: 14px;
      margin: 5px;
      transition: all 0.3s ease;
    }

    button {
      background: #ff6d00;
      color: white;
      border: none;
      cursor: pointer;
      font-weight: 600;
    }

    button:hover {
      background: #e65100;
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(255, 109, 0, 0.4);
    }

    .controls {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin: 20px 0;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .event-log {
      margin-top: 20px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
      max-height: 200px;
      overflow-y: auto;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 12px;
    }

    .log-entry {
      padding: 5px;
      margin-bottom: 5px;
      background: white;
      border-radius: 4px;
      border-left: 3px solid #ff6d00;
    }

    word-viewer {
      display: block;
      margin-top: 20px;
      min-height: 400px;
      border: 2px solid #dee2e6;
      border-radius: 8px;
    }
  `;

  @state() private activeTab = 'basic';
  @state() private basicFile: File | null = null;
  @state() private urlInput = '/samples/sample.docx';
  @state() private currentUrl = '';
  @state() private eventLog: Array<{ time: string; name: string; data?: any }> = [];

  @query('#basic-file') private basicFileInput!: HTMLInputElement;
  @query('#basic-viewer') private basicViewer: any;

  private tabs = [
    { id: 'basic', label: '基础用法' },
    { id: 'events', label: '事件处理' },
    { id: 'properties', label: '属性绑定' },
    { id: 'methods', label: '方法调用' },
    { id: 'styling', label: '样式定制' },
    { id: 'advanced', label: '高级特性' },
  ];

  private logEvent(name: string, data?: any) {
    this.eventLog = [
      ...this.eventLog.slice(-19),
      {
        time: new Date().toLocaleTimeString(),
        name,
        data: data ? JSON.stringify(data) : undefined,
      },
    ];
  }

  render() {
    return html`
      <header>
        <h1>🔥 @word-viewer/lit 演示</h1>
        <p class="subtitle">Lit Web Components 版 Word 文档查看器的完整功能演示</p>
      </header>

      <div class="tabs">
        ${this.tabs.map(
      (tab) => html`
            <button
              class="tab ${this.activeTab === tab.id ? 'active' : ''}"
              @click="${() => (this.activeTab = tab.id)}"
            >
              ${tab.label}
            </button>
          `
    )}
      </div>

      <!-- 基础用法 -->
      <div class="tab-content ${this.activeTab === 'basic' ? 'active' : ''}">
        <h2>基础用法</h2>

        <div class="demo-section">
          <h3>1. 文件上传</h3>
          <input
            id="basic-file"
            type="file"
            accept=".doc,.docx"
            @change="${(e: Event) => {
        const target = e.target as HTMLInputElement;
        this.basicFile = target.files?.[0] || null;
      }}"
          />
          ${this.basicFile
        ? html`
                <word-viewer
                  id="basic-viewer"
                  .file="${this.basicFile}"
                  .options="${{ renderEngine: 'auto', theme: 'light' }}"
                ></word-viewer>
              `
        : html`<p>请选择一个文档文件</p>`}
        </div>

        <div class="demo-section">
          <h3>2. URL 加载</h3>
          <input
            type="text"
            .value="${this.urlInput}"
            @input="${(e: Event) => {
        const target = e.target as HTMLInputElement;
        this.urlInput = target.value;
      }}"
            placeholder="输入文档URL"
          />
          <button @click="${() => (this.currentUrl = this.urlInput)}">加载</button>
          ${this.currentUrl
        ? html`
                <word-viewer
                  .url="${this.currentUrl}"
                  .options="${{ renderEngine: 'docx-preview' }}"
                ></word-viewer>
              `
        : ''}
        </div>

        <div class="demo-section">
          <h3>3. 配置选项</h3>
          <div class="controls">
            <select id="engine-select">
              <option value="auto">自动</option>
              <option value="docx-preview">docx-preview</option>
              <option value="mammoth">mammoth</option>
            </select>
            <select id="theme-select">
              <option value="light">浅色</option>
              <option value="dark">深色</option>
            </select>
            <label>
              <input type="checkbox" id="editable-check" />
              可编辑
            </label>
          </div>
          <p>Web Components 支持通过属性传递配置</p>
        </div>
      </div>

      <!-- 事件处理 -->
      <div class="tab-content ${this.activeTab === 'events' ? 'active' : ''}">
        <h2>事件处理</h2>

        <div class="demo-section">
          <h3>事件监听</h3>
          <input
            type="file"
            accept=".doc,.docx"
            @change="${(e: Event) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
          this.basicFile = file;
        }
      }}"
          />
          ${this.basicFile
        ? html`
                <word-viewer
                  .file="${this.basicFile}"
                  @loaded="${(e: CustomEvent) => this.logEvent('loaded', e.detail)}"
                  @error="${(e: CustomEvent) => this.logEvent('error', e.detail)}"
                  @progress="${(e: CustomEvent) => this.logEvent('progress', e.detail)}"
                  @page-change="${(e: CustomEvent) => this.logEvent('page-change', e.detail)}"
                  @zoom="${(e: CustomEvent) => this.logEvent('zoom', e.detail)}"
                ></word-viewer>
              `
        : ''}

          <div class="event-log">
            <h4>事件日志</h4>
            ${this.eventLog.map(
          (event) => html`
                <div class="log-entry">
                  <span>[${event.time}]</span>
                  <strong>${event.name}</strong>
                  ${event.data ? html`<span>${event.data}</span>` : ''}
                </div>
              `
        )}
          </div>
        </div>
      </div>

      <!-- 属性绑定 -->
      <div class="tab-content ${this.activeTab === 'properties' ? 'active' : ''}">
        <h2>属性绑定</h2>

        <div class="demo-section">
          <h3>动态属性绑定</h3>
          <p>Lit 支持通过 <code>.property</code> 语法进行属性绑定</p>
          <pre>
&lt;word-viewer
  .file="\${file}"
  .options="\${{ theme: 'dark', editable: true }}"
&gt;&lt;/word-viewer&gt;
          </pre>
        </div>

        <div class="demo-section">
          <h3>属性类型</h3>
          <ul>
            <li><strong>file</strong>: File | null</li>
            <li><strong>url</strong>: string | null</li>
            <li><strong>buffer</strong>: ArrayBuffer | null</li>
            <li><strong>options</strong>: ViewerOptions</li>
          </ul>
        </div>
      </div>

      <!-- 方法调用 -->
      <div class="tab-content ${this.activeTab === 'methods' ? 'active' : ''}">
        <h2>方法调用</h2>

        <div class="demo-section">
          <h3>通过引用调用方法</h3>
          <p>使用 <code>@query</code> 装饰器获取元素引用</p>
          <pre>
@query('word-viewer') private viewer: any;

// 调用方法
this.viewer.setZoom(1.5);
this.viewer.goToPage(1);
          </pre>
          <p>支持的方法: setZoom, goToPage, search, export等</p>
        </div>
      </div>

      <!-- 样式定制 -->
      <div class="tab-content ${this.activeTab === 'styling' ? 'active' : ''}">
        <h2>样式定制</h2>

        <div class="demo-section">
          <h3>CSS 变量</h3>
          <p>通过 CSS 变量自定义样式：</p>
          <pre>
word-viewer {
  --viewer-bg-color: #ffffff;
  --viewer-text-color: #333;
  --viewer-border-color: #dee2e6;
  --viewer-primary-color: #ff6d00;
}
          </pre>
        </div>

        <div class="demo-section">
          <h3>Shadow DOM</h3>
          <p>组件使用 Shadow DOM 实现样式隔离</p>
          <p>可以通过 ::part() 伪元素选择器定制内部样式</p>
        </div>
      </div>

      <!-- 高级特性 -->
      <div class="tab-content ${this.activeTab === 'advanced' ? 'active' : ''}">
        <h2>高级特性</h2>

        <div class="demo-section">
          <h3>Reactive Properties</h3>
          <p>Lit 自动追踪属性变化并重新渲染</p>
          <pre>
@property({ type: Object }) file: File | null = null;
@property({ type: Object }) options: ViewerOptions = {};
          </pre>
        </div>

        <div class="demo-section">
          <h3>生命周期</h3>
          <ul>
            <li><strong>connectedCallback</strong>: 元素添加到 DOM</li>
            <li><strong>disconnectedCallback</strong>: 元素从 DOM 移除</li>
            <li><strong>updated</strong>: 属性更新后</li>
            <li><strong>firstUpdated</strong>: 首次渲染完成</li>
          </ul>
        </div>

        <div class="demo-section">
          <h3>事件总线</h3>
          <p>使用 CustomEvent 发送自定义事件：</p>
          <pre>
this.dispatchEvent(
  new CustomEvent('loaded', {
    detail: { documentInfo },
    bubbles: true,
    composed: true,
  })
);
          </pre>
        </div>
      </div>
    `;
  }
}

// 初始化应用
const app = document.getElementById('app');
if (app) {
  app.innerHTML = '<word-demo-app></word-demo-app>';
}
