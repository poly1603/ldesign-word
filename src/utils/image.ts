/**
 * 图片处理工具
 */

export interface ImageCompressOptions {
  /** 最大宽度 */
  maxWidth?: number;
  /** 最大高度 */
  maxHeight?: number;
  /** 质量 (0-1) */
  quality?: number;
  /** 输出格式 */
  mimeType?: string;
}

export interface LazyImageOptions {
  /** 根元素 */
  root?: Element | null;
  /** 根边距 */
  rootMargin?: string;
  /** 阈值 */
  threshold?: number | number[];
  /** 占位图 */
  placeholder?: string;
}

/**
 * 压缩图片
 */
export async function compressImage(
  file: File | Blob,
  options: ImageCompressOptions = {}
): Promise<Blob> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    mimeType = 'image/jpeg',
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // 计算新尺寸
        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        // 创建 canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法获取 canvas context'));
          return;
        }

        // 绘制图片
        ctx.drawImage(img, 0, 0, width, height);

        // 转换为 Blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('图片压缩失败'));
            }
          },
          mimeType,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('图片加载失败'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('读取文件失败'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * 图片懒加载管理器
 */
export class LazyImageLoader {
  private observer: IntersectionObserver | null = null;
  private images: Map<HTMLImageElement, string> = new Map();

  constructor(options: LazyImageOptions = {}) {
    const {
      root = null,
      rootMargin = '50px',
      threshold = 0.01,
    } = options;

    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.loadImage(entry.target as HTMLImageElement);
            }
          });
        },
        {
          root,
          rootMargin,
          threshold,
        }
      );
    }
  }

  /**
   * 观察图片
   */
  observe(img: HTMLImageElement, src: string, placeholder?: string): void {
    if (!this.observer) {
      // 降级方案：直接加载
      img.src = src;
      return;
    }

    // 设置占位图
    if (placeholder) {
      img.src = placeholder;
    }

    // 保存真实 src
    this.images.set(img, src);
    img.dataset.lazySrc = src;

    // 开始观察
    this.observer.observe(img);
  }

  /**
   * 加载图片
   */
  private loadImage(img: HTMLImageElement): void {
    const src = this.images.get(img);

    if (!src) {
      return;
    }

    // 加载图片
    img.src = src;
    img.removeAttribute('data-lazy-src');

    // 停止观察
    if (this.observer) {
      this.observer.unobserve(img);
    }

    // 移除记录
    this.images.delete(img);
  }

  /**
   * 取消观察所有图片
   */
  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.images.clear();
  }

  /**
   * 立即加载所有图片
   */
  loadAll(): void {
    this.images.forEach((src, img) => {
      img.src = src;
      img.removeAttribute('data-lazy-src');
    });

    if (this.observer) {
      this.observer.disconnect();
    }

    this.images.clear();
  }
}

/**
 * 转换图片为 Base64
 */
export async function imageToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };

    reader.onerror = () => {
      reject(new Error('读取文件失败'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Base64 转 Blob
 */
export function base64ToBlob(base64: string, mimeType?: string): Blob {
  const byteString = atob(base64.split(',')[1]);
  const type = mimeType || base64.split(',')[0].split(':')[1].split(';')[0];

  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);

  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ab], { type });
}

/**
 * 获取图片尺寸
 */
export async function getImageDimensions(
  file: File | Blob | string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
      });
    };

    img.onerror = () => {
      reject(new Error('加载图片失败'));
    };

    if (typeof file === 'string') {
      img.src = file;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        reject(new Error('读取文件失败'));
      };
      reader.readAsDataURL(file);
    }
  });
}

/**
 * 创建缩略图
 */
export async function createThumbnail(
  file: File | Blob,
  size: number = 200
): Promise<Blob> {
  return compressImage(file, {
    maxWidth: size,
    maxHeight: size,
    quality: 0.7,
  });
}

/**
 * 预加载图片
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`预加载图片失败: ${src}`));
    img.src = src;
  });
}

/**
 * 批量预加载图片
 */
export async function preloadImages(srcs: string[]): Promise<void> {
  await Promise.all(srcs.map(src => preloadImage(src)));
}



