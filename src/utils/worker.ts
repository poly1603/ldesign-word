/**
 * Web Worker 工具模块
 * 用于在后台线程执行耗时操作，避免阻塞主线程
 */

export type WorkerTask<T = any, R = any> = {
  id: string;
  type: string;
  data: T;
  resolve: (value: R) => void;
  reject: (error: Error) => void;
};

export class WorkerPool {
  private workers: Worker[] = [];
  private availableWorkers: Worker[] = [];
  private taskQueue: WorkerTask[] = [];
  private workerTasks: Map<Worker, WorkerTask> = new Map();
  private maxWorkers: number;
  private workerScript: string;

  constructor(workerScript: string, maxWorkers: number = navigator.hardwareConcurrency || 4) {
    this.workerScript = workerScript;
    this.maxWorkers = Math.min(maxWorkers, 8); // 最多8个worker
    this.initializeWorkers();
  }

  /**
   * 初始化 Worker 池
   */
  private initializeWorkers(): void {
    for (let i = 0; i < this.maxWorkers; i++) {
      const worker = this.createWorker();
      this.workers.push(worker);
      this.availableWorkers.push(worker);
    }
  }

  /**
   * 创建单个 Worker
   */
  private createWorker(): Worker {
    const worker = new Worker(this.workerScript, { type: 'module' });

    worker.onmessage = (event) => {
      this.handleWorkerMessage(worker, event.data);
    };

    worker.onerror = (error) => {
      this.handleWorkerError(worker, error);
    };

    return worker;
  }

  /**
   * 处理 Worker 消息
   */
  private handleWorkerMessage(worker: Worker, data: any): void {
    const task = this.workerTasks.get(worker);
    if (task) {
      if (data.error) {
        task.reject(new Error(data.error));
      } else {
        task.resolve(data.result);
      }
      this.workerTasks.delete(worker);
      this.releaseWorker(worker);
    }
  }

  /**
   * 处理 Worker 错误
   */
  private handleWorkerError(worker: Worker, error: ErrorEvent): void {
    const task = this.workerTasks.get(worker);
    if (task) {
      task.reject(new Error(error.message));
      this.workerTasks.delete(worker);
      this.releaseWorker(worker);
    }
  }

  /**
   * 释放 Worker
   */
  private releaseWorker(worker: Worker): void {
    this.availableWorkers.push(worker);
    this.processNextTask();
  }

  /**
   * 处理下一个任务
   */
  private processNextTask(): void {
    if (this.taskQueue.length === 0 || this.availableWorkers.length === 0) {
      return;
    }

    const task = this.taskQueue.shift()!;
    const worker = this.availableWorkers.shift()!;

    this.workerTasks.set(worker, task);
    worker.postMessage({
      id: task.id,
      type: task.type,
      data: task.data,
    });
  }

  /**
   * 执行任务
   */
  execute<T = any, R = any>(type: string, data: T): Promise<R> {
    return new Promise((resolve, reject) => {
      const task: WorkerTask<T, R> = {
        id: `task_${Date.now()}_${Math.random()}`,
        type,
        data,
        resolve: resolve as any,
        reject,
      };

      this.taskQueue.push(task);
      this.processNextTask();
    });
  }

  /**
   * 销毁 Worker 池
   */
  destroy(): void {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.availableWorkers = [];
    this.taskQueue = [];
    this.workerTasks.clear();
  }
}

/**
 * 创建内联 Worker（从函数创建）
 */
export function createInlineWorker(fn: Function): Worker {
  const blob = new Blob([`(${fn.toString()})()`], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  const worker = new Worker(url);

  // 清理 URL
  setTimeout(() => URL.revokeObjectURL(url), 0);

  return worker;
}

/**
 * 在 Worker 中执行单个任务
 */
export function executeInWorker<T = any, R = any>(
  fn: (data: T) => R,
  data: T
): Promise<R> {
  return new Promise((resolve, reject) => {
    const worker = createInlineWorker(function () {
      self.onmessage = (e: MessageEvent) => {
        try {
          const fn = new Function('return ' + e.data.fn)();
          const result = fn(e.data.data);
          self.postMessage({ result });
        } catch (error) {
          self.postMessage({ error: (error as Error).message });
        }
      };
    });

    worker.onmessage = (event) => {
      if (event.data.error) {
        reject(new Error(event.data.error));
      } else {
        resolve(event.data.result);
      }
      worker.terminate();
    };

    worker.onerror = (error) => {
      reject(error);
      worker.terminate();
    };

    worker.postMessage({
      fn: fn.toString(),
      data,
    });
  });
}




