/**
 * 错误类测试
 */

import { describe, it, expect } from 'vitest';
import {
  WordViewerError,
  LoadError,
  ParseError,
  RenderError,
  ExportError,
  NetworkError,
  ValidationError,
  UnsupportedFormatError,
  createError,
  ErrorBoundary,
} from '../../../src/core/errors';

describe('Custom Error Classes', () => {
  describe('WordViewerError', () => {
    it('should create error with code and details', () => {
      const error = new WordViewerError('Test error', 'TEST_CODE', { extra: 'data' });

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.details).toEqual({ extra: 'data' });
      expect(error.timestamp).toBeGreaterThan(0);
    });

    it('should have correct prototype', () => {
      const error = new WordViewerError('Test', 'TEST');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(WordViewerError);
    });

    it('should convert to JSON', () => {
      const error = new WordViewerError('Test', 'TEST');
      const json = error.toJSON();

      expect(json.name).toBe('WordViewerError');
      expect(json.code).toBe('TEST');
      expect(json.message).toBe('Test');
    });
  });

  describe('LoadError', () => {
    it('should create load error', () => {
      const error = new LoadError('Load failed');
      
      expect(error).toBeInstanceOf(LoadError);
      expect(error).toBeInstanceOf(WordViewerError);
      expect(error.code).toBe('LOAD_ERROR');
    });
  });

  describe('ParseError', () => {
    it('should create parse error', () => {
      const error = new ParseError('Parse failed');
      
      expect(error).toBeInstanceOf(ParseError);
      expect(error.code).toBe('PARSE_ERROR');
    });
  });

  describe('NetworkError', () => {
    it('should create network error with status', () => {
      const error = new NetworkError('Network failed', 404, 'Not Found');
      
      expect(error).toBeInstanceOf(NetworkError);
      expect(error.status).toBe(404);
      expect(error.statusText).toBe('Not Found');
    });
  });

  describe('createError factory', () => {
    it('should create load error', () => {
      const error = createError('load', 'Failed to load');
      expect(error).toBeInstanceOf(LoadError);
    });

    it('should create parse error', () => {
      const error = createError('parse', 'Failed to parse');
      expect(error).toBeInstanceOf(ParseError);
    });

    it('should create generic error for unknown type', () => {
      const error = createError('unknown', 'Unknown error');
      expect(error).toBeInstanceOf(WordViewerError);
      expect(error.code).toBe('UNKNOWN_ERROR');
    });
  });
});

describe('ErrorBoundary', () => {
  it('should add and remove handlers', () => {
    const boundary = new ErrorBoundary();
    const handler = () => {};

    boundary.addHandler(handler);
    boundary.removeHandler(handler);
  });

  it('should call error handlers', async () => {
    const boundary = new ErrorBoundary();
    const handler = vi.fn();

    boundary.addHandler(handler);

    const error = new LoadError('Test error');
    await boundary.handleError(error);

    expect(handler).toHaveBeenCalledWith(error);
  });

  it('should execute recovery strategies', async () => {
    const boundary = new ErrorBoundary();
    const recovery = vi.fn();

    boundary.registerRecovery('TEST_ERROR', recovery);

    const error = new WordViewerError('Test', 'TEST_ERROR');
    await boundary.handleError(error);

    expect(recovery).toHaveBeenCalled();
  });

  it('should handle handler errors gracefully', async () => {
    const boundary = new ErrorBoundary();
    const badHandler = () => {
      throw new Error('Handler error');
    };

    boundary.addHandler(badHandler);

    const error = new LoadError('Test');
    await expect(boundary.handleError(error)).resolves.not.toThrow();
  });
});

