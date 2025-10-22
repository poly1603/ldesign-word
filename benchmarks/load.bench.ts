/**
 * 加载性能基准测试
 */

import { describe, bench, beforeAll } from 'vitest';
import { ParserModule } from '../src/modules/parser';

describe('Document Loading Performance', () => {
  let smallFile: File;
  let mediumFile: File;
  let largeFile: File;

  beforeAll(() => {
    // 创建测试文件
    const createFile = (size: number) => {
      const buffer = new ArrayBuffer(size);
      return new File([buffer], 'test.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
    };

    smallFile = createFile(100 * 1024); // 100KB
    mediumFile = createFile(1024 * 1024); // 1MB
    largeFile = createFile(10 * 1024 * 1024); // 10MB
  });

  bench('load small document (100KB)', async () => {
    const parser = new ParserModule({} as any);
    await parser.parseFile(smallFile);
  });

  bench('load medium document (1MB)', async () => {
    const parser = new ParserModule({} as any);
    await parser.parseFile(mediumFile);
  });

  bench('load large document (10MB)', async () => {
    const parser = new ParserModule({} as any);
    await parser.parseFile(largeFile);
  });

  bench('load with chunking (10MB)', async () => {
    const parser = new ParserModule({} as any);
    await parser.parseFileChunked(largeFile);
  });
});

describe('Cache Performance', () => {
  bench('first load (no cache)', async () => {
    // 第一次加载，没有缓存
  });

  bench('second load (with cache)', async () => {
    // 第二次加载，使用缓存
  });
});

