import { ref, onMounted, onUnmounted, type Ref } from 'vue';

/**
 * 文档拖放 Composable 返回类型
 */
export interface UseDocumentDropReturn {
  /** 是否正在拖拽 */
  isDragging: Ref<boolean>;
  /** 拖放的文件 */
  droppedFile: Ref<File | null>;
  /** 错误信息 */
  error: Ref<string | null>;
}

/**
 * 文档拖放 Composable 选项
 */
export interface UseDocumentDropOptions {
  /** 目标元素引用 */
  target?: Ref<HTMLElement | undefined>;
  /** 接受的文件类型 */
  accept?: string[];
  /** 拖放回调 */
  onDrop?: (file: File) => void;
  /** 错误回调 */
  onError?: (error: string) => void;
}

/**
 * 文档拖放 Composable
 * 
 * @example
 * ```typescript
 * const containerRef = ref<HTMLElement>();
 * 
 * const { isDragging, droppedFile } = useDocumentDrop({
 *   target: containerRef,
 *   accept: ['.docx', '.doc'],
 *   onDrop: (file) => {
 *     console.log('Dropped file:', file.name);
 *   }
 * });
 * ```
 */
export function useDocumentDrop(options: UseDocumentDropOptions = {}): UseDocumentDropReturn {
  const {
    target,
    accept = ['.docx', '.doc', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    onDrop,
    onError
  } = options;

  const isDragging = ref(false);
  const droppedFile = ref<File | null>(null);
  const error = ref<string | null>(null);

  let dragCounter = 0;

  /**
   * 检查文件类型是否被接受
   */
  const isAcceptedFile = (file: File): boolean => {
    const fileName = file.name.toLowerCase();
    const fileType = file.type;

    return accept.some(accepted => {
      if (accepted.startsWith('.')) {
        return fileName.endsWith(accepted);
      }
      return fileType === accepted;
    });
  };

  /**
   * 处理拖拽进入
   */
  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter++;
    isDragging.value = true;
  };

  /**
   * 处理拖拽离开
   */
  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter--;
    if (dragCounter === 0) {
      isDragging.value = false;
    }
  };

  /**
   * 处理拖拽悬停
   */
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  /**
   * 处理放置
   */
  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    dragCounter = 0;
    isDragging.value = false;
    error.value = null;

    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) {
      error.value = '未检测到文件';
      onError?.(error.value);
      return;
    }

    const file = files[0];
    if (!file) {
      error.value = '无法读取文件';
      onError?.(error.value);
      return;
    }

    if (!isAcceptedFile(file)) {
      error.value = '不支持的文件类型，请拖放 Word 文档 (.docx)';
      onError?.(error.value);
      return;
    }

    droppedFile.value = file;
    onDrop?.(file);
  };

  /**
   * 绑定事件
   */
  const bindEvents = (element: HTMLElement) => {
    element.addEventListener('dragenter', handleDragEnter);
    element.addEventListener('dragleave', handleDragLeave);
    element.addEventListener('dragover', handleDragOver);
    element.addEventListener('drop', handleDrop);
  };

  /**
   * 解绑事件
   */
  const unbindEvents = (element: HTMLElement) => {
    element.removeEventListener('dragenter', handleDragEnter);
    element.removeEventListener('dragleave', handleDragLeave);
    element.removeEventListener('dragover', handleDragOver);
    element.removeEventListener('drop', handleDrop);
  };

  onMounted(() => {
    const element = target?.value || document.body;
    bindEvents(element);
  });

  onUnmounted(() => {
    const element = target?.value || document.body;
    unbindEvents(element);
  });

  return {
    isDragging,
    droppedFile,
    error
  };
}
