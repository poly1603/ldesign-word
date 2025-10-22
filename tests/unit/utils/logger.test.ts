/**
 * 日志系统测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Logger, LogLevel } from '../../../src/utils/logger';

describe('Logger', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger({
      level: LogLevel.DEBUG,
      prefix: '[Test]',
    });
  });

  describe('initialization', () => {
    it('should create logger with default options', () => {
      const defaultLogger = new Logger();
      expect(defaultLogger).toBeDefined();
    });

    it('should create logger with custom options', () => {
      const customLogger = new Logger({
        level: LogLevel.ERROR,
        prefix: '[Custom]',
        enableTimestamp: false,
      });

      expect(customLogger.getLevel()).toBe(LogLevel.ERROR);
    });
  });

  describe('logging methods', () => {
    it('should log debug messages', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => { });

      logger.debug('Debug message');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should log info messages', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => { });

      logger.info('Info message');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should log warn messages', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

      logger.warn('Warning message');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should log error messages', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

      logger.error('Error message');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('log level filtering', () => {
    it('should respect log level', () => {
      logger.setLevel(LogLevel.WARN);

      const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => { });
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => { });
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

      logger.debug('Debug');
      logger.info('Info');
      logger.warn('Warn');

      expect(debugSpy).not.toHaveBeenCalled();
      expect(infoSpy).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();

      debugSpy.mockRestore();
      infoSpy.mockRestore();
      warnSpy.mockRestore();
    });
  });

  describe('log entries', () => {
    it('should store log entries', () => {
      logger.info('Test message');

      const entries = logger.getEntries();
      expect(entries.length).toBeGreaterThan(0);
      expect(entries[entries.length - 1].message).toBe('Test message');
    });

    it('should filter entries by level', () => {
      logger.debug('Debug');
      logger.info('Info');
      logger.error('Error');

      const errors = logger.getEntries(LogLevel.ERROR);
      expect(errors.length).toBe(1);
      expect(errors[0].message).toBe('Error');
    });

    it('should clear entries', () => {
      logger.info('Test');
      logger.clear();

      expect(logger.getEntries().length).toBe(0);
    });
  });

  describe('export', () => {
    it('should export as JSON', () => {
      logger.info('Test message', { data: 'value' });

      const json = logger.export('json');
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should export as text', () => {
      logger.info('Test message');

      const text = logger.export('text');
      expect(text).toContain('Test message');
    });
  });

  describe('child logger', () => {
    it('should create child logger', () => {
      const child = logger.createChild('Child');
      expect(child).toBeDefined();
    });
  });
});

