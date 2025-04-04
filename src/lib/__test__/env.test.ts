import { describe, expect, it } from 'vitest';
import { Environment } from '../env/env';

describe('Filth', () => {
  describe('Environment', () => {
    it('should define and lookup variables', () => {
      const env = new Environment();
      env.define('x', 42);
      expect(env.lookup('x')).toEqual({
        options: {},
        value: 42
      });
    });

    it('should handle nested environments', () => {
      const parent = new Environment();
      parent.define('x', 42);
      const child = new Environment(parent);
      expect(child.lookup('x')).toEqual({
        options: {},
        value: 42
      });
    });

    it('should throw on undefined variables', () => {
      const env = new Environment();
      expect(() => env.lookup('x')).toThrow('Undefined symbol: x');
    });
  });
});
