import React, { useState, useRef, useCallback, useMemo } from 'react';
import { WordViewer } from '../../src';

interface Tab {
  id: string;
  label: string;
}

interface EventLog {
  time: string;
  name: string;
  data?: any;
}

interface ViewerInstance {
  id: number;
  file: File | null;
  options: any;
}

const tabs: Tab[] = [
  { id: 'basic', label: '基础用法' },
  { id: 'props', label: 'Props & Events' },
  { id: 'hooks', label: 'Hooks 用法' },
  { id: 'ref', label: 'Ref 转发' },
  { id: 'performance', label: '性能优化' },
  { id: 'advanced', label: '高级用法' },
];

function App() {
  const [activeTab, setActiveTab] = useState('basic');

  // 基础用法
  const [basicFile, setBasicFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState('/samples/sample.docx');
  const [currentUrl, setCurrentUrl] = useState('');
  const [configFile, setConfigFile] = useState<File | null>(null);
  const [configOptions, setConfigOptions] = useState({
    renderEngine: 'auto' as const,
    theme: 'light' as const,
    editable: false,
  });

  // Props & Events
  const [propsFile, setPropsFile] = useState<File | null>(null);
  const [propsUrl, setPropsUrl] = useState('');
  const [propsBuffer, setPropsBuffer] = useState<ArrayBuffer | null>(null);
  const [eventLog, setEventLog] = useState<EventLog[]>([]);

  // Hooks
  const [hooksFile, setHooksFile] = useState<File | null>(null);
  const [zoom, setZoom] = useState(100);
  const [page, setPage] = useState(1);
  const [editMode, setEditMode] = useState(false);

  // Ref
  const refViewerRef = useRef<any>(null);
  const [refFile, setRefFile] = useState<File | null>(null);
  const [refOutput, setRefOutput] = useState('');

  // Performance
  const [perfFile, setPerfFile] = useState<File | null>(null);
  const [perfOptions] = useState({
    renderEngine: 'auto' as const,
    initialZoom: 1.0,
  });

  // Advanced
  const [instances, setInstances] = useState<ViewerInstance[]>([
    { id: 1, file: null, options: { theme: 'light' } },
  ]);
  const [dynamicFile, setDynamicFile] = useState<File | null>(null);
  const [dynamicOptions, setDynamicOptions] = useState({
    theme: 'light' as const,
    editable: false,
    renderEngine: 'auto' as const,
  });

  // Callbacks
  const logEvent = useCallback((name: string, data?: any) => {
    setEventLog((prev) => {
      const newLog = [
        ...prev,
        {
          time: new Date().toLocaleTimeString(),
          name,
          data,
        },
      ];
      return newLog.slice(-20); // 保持最多20条
    });
  }, []);

  const loadBuffer = useCallback(async () => {
    try {
      const response = await fetch('/samples/sample.docx');
      const buffer = await response.arrayBuffer();
      setPropsBuffer(buffer);
    } catch (err) {
      console.error('加载Buffer失败', err);
    }
  }, []);

  // Ref methods
  const testRefMethod = useCallback((method: string) => {
    if (!refViewerRef.current) {
      setRefOutput('Viewer未初始化');
      return;
    }

    try {
      let result;
      switch (method) {
        case 'getDocumentInfo':
          result = refViewerRef.current.getDocumentInfo();
          break;
        case 'getPageInfo':
          result = refViewerRef.current.getPageInfo();
          break;
        case 'getEditState':
          result = refViewerRef.current.getEditState();
          break;
        case 'getZoom':
          result = refViewerRef.current.getZoom();
          break;
        case 'search':
          result = refViewerRef.current.search('test');
          break;
        default:
          result = '未知方法';
      }
      setRefOutput(JSON.stringify(result, null, 2));
    } catch (err) {
      setRefOutput('错误: ' + err);
    }
  }, []);

  const exportFile = useCallback(async (format: 'pdf' | 'html' | 'docx') => {
    if (!refViewerRef.current) return;

    try {
      let result;
      switch (format) {
        case 'pdf':
          result = await refViewerRef.current.exportToPDF();
          downloadBlob(result, 'document.pdf');
          break;
        case 'html':
          result = refViewerRef.current.exportToHTML();
          downloadBlob(new Blob([result], { type: 'text/html' }), 'document.html');
          break;
        case 'docx':
          result = await refViewerRef.current.exportToDocx();
          downloadBlob(result, 'document.docx');
          break;
      }
      setRefOutput(`${format.toUpperCase()} 导出成功`);
    } catch (err) {
      setRefOutput('导出失败: ' + err);
    }
  }, []);

  // Advanced methods
  const addInstance = useCallback(() => {
    setInstances((prev) => [
      ...prev,
      { id: Date.now(), file: null, options: { theme: 'light' } },
    ]);
  }, []);

  const updateInstance = useCallback((index: number, file: File) => {
    setInstances((prev) => {
      const newInstances = [...prev];
      newInstances[index].file = file;
      return newInstances;
    });
  }, []);

  const toggleDynamicTheme = useCallback(() => {
    setDynamicOptions((prev) => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light',
    }));
  }, []);

  const toggleDynamicEdit = useCallback(() => {
    setDynamicOptions((prev) => ({
      ...prev,
      editable: !prev.editable,
    }));
  }, []);

  // Memoized options
  const memoizedPerfOptions = useMemo(() => perfOptions, [perfOptions]);

  // Helper
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="app">
      <header>
        <h1>⚛️ @word-viewer/react 演示</h1>
        <p>React 组件版 Word 文档查看器的完整功能演示</p>
      </header>

      <nav className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* 基础用法 */}
      {activeTab === 'basic' && (
        <section className="tab-content">
          <h2>基础用法</h2>

          <div className="demo-section">
            <h3>1. 文件上传</h3>
            <input
              type="file"
              accept=".doc,.docx"
              onChange={(e) => setBasicFile(e.target.files?.[0] || null)}
            />
            {basicFile && (
              <WordViewer
                file={basicFile}
                options={{ renderEngine: 'auto', theme: 'light' }}
                onLoaded={(e) => console.log('加载完成', e)}
                onError={(e) => console.error('加载错误', e)}
              />
            )}
          </div>

          <div className="demo-section">
            <h3>2. URL 加载</h3>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="输入文档URL"
            />
            <button onClick={() => setCurrentUrl(urlInput)}>加载</button>
            {currentUrl && (
              <WordViewer
                url={currentUrl}
                options={{ renderEngine: 'docx-preview' }}
              />
            )}
          </div>

          <div className="demo-section">
            <h3>3. 配置选项</h3>
            <div className="config-controls">
              <label>
                渲染引擎:
                <select
                  value={configOptions.renderEngine}
                  onChange={(e) =>
                    setConfigOptions({
                      ...configOptions,
                      renderEngine: e.target.value as any,
                    })
                  }
                >
                  <option value="auto">自动</option>
                  <option value="docx-preview">docx-preview</option>
                  <option value="mammoth">mammoth</option>
                </select>
              </label>
              <label>
                主题:
                <select
                  value={configOptions.theme}
                  onChange={(e) =>
                    setConfigOptions({
                      ...configOptions,
                      theme: e.target.value as any,
                    })
                  }
                >
                  <option value="light">浅色</option>
                  <option value="dark">深色</option>
                </select>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={configOptions.editable}
                  onChange={(e) =>
                    setConfigOptions({
                      ...configOptions,
                      editable: e.target.checked,
                    })
                  }
                />
                可编辑
              </label>
            </div>
            <input
              type="file"
              accept=".doc,.docx"
              onChange={(e) => setConfigFile(e.target.files?.[0] || null)}
            />
            {configFile && (
              <WordViewer file={configFile} options={configOptions} />
            )}
          </div>
        </section>
      )}

      {/* Props & Events */}
      {activeTab === 'props' && (
        <section className="tab-content">
          <h2>Props & Events</h2>

          <div className="demo-section">
            <h3>Props 演示</h3>
            <div className="prop-controls">
              <div>
                <label>file:</label>
                <input
                  type="file"
                  accept=".doc,.docx"
                  onChange={(e) => setPropsFile(e.target.files?.[0] || null)}
                />
              </div>
              <div>
                <label>url:</label>
                <input
                  type="text"
                  value={propsUrl}
                  onChange={(e) => setPropsUrl(e.target.value)}
                  placeholder="文档URL"
                />
              </div>
              <div>
                <label>buffer:</label>
                <button onClick={loadBuffer}>加载 Buffer</button>
              </div>
            </div>

            {(propsFile || propsUrl || propsBuffer) && (
              <WordViewer
                file={propsFile}
                url={propsUrl}
                buffer={propsBuffer}
                options={{ editable: true }}
                onLoaded={(e) => logEvent('loaded', e)}
                onError={(e) => logEvent('error', e)}
                onProgress={(e) => logEvent('progress', e)}
                onPageChange={(e) => logEvent('page-change', e)}
                onZoom={(e) => logEvent('zoom', e)}
                onEditStart={() => logEvent('edit-start')}
                onEditEnd={() => logEvent('edit-end')}
                onChanged={() => logEvent('changed')}
              />
            )}

            <div className="event-log">
              <h4>事件日志</h4>
              <div className="log-entries">
                {eventLog.map((event, index) => (
                  <div key={index} className="log-entry">
                    <span className="event-time">[{event.time}]</span>
                    <span className="event-name">{event.name}</span>
                    {event.data && (
                      <span className="event-data">
                        {JSON.stringify(event.data)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Hooks */}
      {activeTab === 'hooks' && (
        <section className="tab-content">
          <h2>Hooks 用法</h2>

          <div className="demo-section">
            <h3>useState 和 useCallback</h3>
            <div className="hooks-controls">
              <label>
                缩放:
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                />
                {zoom}%
              </label>
              <label>
                页码:
                <input
                  type="number"
                  min="1"
                  value={page}
                  onChange={(e) => setPage(Number(e.target.value))}
                />
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={editMode}
                  onChange={(e) => setEditMode(e.target.checked)}
                />
                编辑模式
              </label>
            </div>

            <input
              type="file"
              accept=".doc,.docx"
              onChange={(e) => setHooksFile(e.target.files?.[0] || null)}
            />

            {hooksFile && (
              <WordViewer
                file={hooksFile}
                options={{
                  initialZoom: zoom / 100,
                  editable: editMode,
                }}
                onZoom={(level) => setZoom(level * 100)}
                onPageChange={(info) => setPage(info.current)}
              />
            )}

            <div className="state-display">
              <h4>当前状态</h4>
              <p>缩放: {zoom}%</p>
              <p>页码: {page}</p>
              <p>编辑: {editMode ? '开启' : '关闭'}</p>
            </div>
          </div>
        </section>
      )}

      {/* Ref */}
      {activeTab === 'ref' && (
        <section className="tab-content">
          <h2>Ref 转发</h2>

          <div className="demo-section">
            <h3>通过 Ref 调用方法</h3>
            <input
              type="file"
              accept=".doc,.docx"
              onChange={(e) => setRefFile(e.target.files?.[0] || null)}
            />

            {refFile && (
              <>
                <div className="ref-controls">
                  <h4>文档控制</h4>
                  <button onClick={() => refViewerRef.current?.setZoom(1.5)}>
                    缩放 150%
                  </button>
                  <button onClick={() => refViewerRef.current?.goToPage(1)}>
                    第一页
                  </button>
                  <button onClick={() => testRefMethod('search')}>
                    搜索 "test"
                  </button>

                  <h4>导出功能</h4>
                  <button onClick={() => exportFile('pdf')}>导出 PDF</button>
                  <button onClick={() => exportFile('html')}>导出 HTML</button>
                  <button onClick={() => exportFile('docx')}>导出 DOCX</button>

                  <h4>信息获取</h4>
                  <button onClick={() => testRefMethod('getDocumentInfo')}>
                    文档信息
                  </button>
                  <button onClick={() => testRefMethod('getPageInfo')}>
                    页面信息
                  </button>
                  <button onClick={() => testRefMethod('getEditState')}>
                    编辑状态
                  </button>
                  <button onClick={() => testRefMethod('getZoom')}>
                    当前缩放
                  </button>
                </div>

                <WordViewer
                  ref={refViewerRef}
                  file={refFile}
                  options={{ editable: true }}
                />

                {refOutput && (
                  <div className="ref-output">
                    <h4>输出结果</h4>
                    <pre>{refOutput}</pre>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      )}

      {/* Performance */}
      {activeTab === 'performance' && (
        <section className="tab-content">
          <h2>性能优化</h2>

          <div className="demo-section">
            <h3>useMemo 优化</h3>
            <p>使用 useMemo 缓存 options 对象，避免不必要的重渲染</p>
            <input
              type="file"
              accept=".doc,.docx"
              onChange={(e) => setPerfFile(e.target.files?.[0] || null)}
            />
            {perfFile && (
              <WordViewer file={perfFile} options={memoizedPerfOptions} />
            )}
          </div>

          <div className="demo-section">
            <h3>React.memo 优化</h3>
            <p>WordViewer 组件已使用 React.memo 进行优化</p>
            <code>
              export default React.memo(WordViewer, (prevProps, nextProps) =&gt; {'{'}
              <br />
              &nbsp;&nbsp;// 自定义比较逻辑
              <br />
              {'}'});
            </code>
          </div>
        </section>
      )}

      {/* Advanced */}
      {activeTab === 'advanced' && (
        <section className="tab-content">
          <h2>高级用法</h2>

          <div className="demo-section">
            <h3>多实例管理</h3>
            {instances.map((instance, index) => (
              <div key={instance.id} className="instance">
                <h4>实例 {index + 1}</h4>
                <input
                  type="file"
                  accept=".doc,.docx"
                  onChange={(e) =>
                    updateInstance(index, e.target.files![0])
                  }
                />
                {instance.file && (
                  <WordViewer file={instance.file} options={instance.options} />
                )}
              </div>
            ))}
            <button onClick={addInstance}>添加实例</button>
          </div>

          <div className="demo-section">
            <h3>动态配置更新</h3>
            <button onClick={toggleDynamicTheme}>切换主题</button>
            <button onClick={toggleDynamicEdit}>切换编辑模式</button>
            <input
              type="file"
              accept=".doc,.docx"
              onChange={(e) => setDynamicFile(e.target.files?.[0] || null)}
            />
            {dynamicFile && (
              <WordViewer file={dynamicFile} options={dynamicOptions} />
            )}
            <div className="config-display">
              <h4>当前配置</h4>
              <pre>{JSON.stringify(dynamicOptions, null, 2)}</pre>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default App;
