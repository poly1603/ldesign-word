/**
 * 事件系统测试
 */

import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from '../../../src/utils/event';

describe('EventEmitter', () => {
  let emitter: EventEmitter;

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  describe('on', () => {
    it('should register event listener', () => {
      const handler = vi.fn();
      emitter.on('test', handler);
      emitter.emit('test', 'data');

      expect(handler).toHaveBeenCalledWith('data');
    });

    it('should allow multiple listeners for same event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      emitter.on('test', handler1);
      emitter.on('test', handler2);
      emitter.emit('test');

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });
  });

  describe('once', () => {
    it('should call listener only once', () => {
      const handler = vi.fn();
      emitter.once('test', handler);

      emitter.emit('test');
      emitter.emit('test');

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('off', () => {
    it('should remove specific listener', () => {
      const handler = vi.fn();
      emitter.on('test', handler);
      emitter.off('test', handler);
      emitter.emit('test');

      expect(handler).not.toHaveBeenCalled();
    });

    it('should remove all listeners for event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      emitter.on('test', handler1);
      emitter.on('test', handler2);
      emitter.off('test');
      emitter.emit('test');

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe('emit', () => {
    it('should pass multiple arguments', () => {
      const handler = vi.fn();
      emitter.on('test', handler);
      emitter.emit('test', 'arg1', 'arg2', 'arg3');

      expect(handler).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
    });

    it('should handle errors in listeners', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const badHandler = () => {
        throw new Error('Handler error');
      };
      const goodHandler = vi.fn();

      emitter.on('test', badHandler);
      emitter.on('test', goodHandler);
      emitter.emit('test');

      expect(errorSpy).toHaveBeenCalled();
      expect(goodHandler).toHaveBeenCalled();

      errorSpy.mockRestore();
    });
  });

  describe('removeAllListeners', () => {
    it('should remove all listeners', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      emitter.on('event1', handler1);
      emitter.on('event2', handler2);
      emitter.removeAllListeners();
      emitter.emit('event1');
      emitter.emit('event2');

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe('listenerCount', () => {
    it('should return correct listener count', () => {
      expect(emitter.listenerCount('test')).toBe(0);

      emitter.on('test', () => {});
      expect(emitter.listenerCount('test')).toBe(1);

      emitter.on('test', () => {});
      expect(emitter.listenerCount('test')).toBe(2);
    });
  });
});

