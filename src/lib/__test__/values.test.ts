import { beforeEach, describe, expect, it } from 'bun:test';
import { createEnv, EvalEnvironment } from '../create';

describe('Filth', () => {
  describe('Values', () => {
    let env: EvalEnvironment;
    beforeEach(() => {
      env = createEnv();
      // env.define('hello', 'hello');
    });
    it('should throw on undefined symbol', async () => {
      expect(async () => await env.eval(`hello`)).toThrow(
        'Undefined symbol: hello'
      );
    });

    it('should accept a string as a string', async () => {
      expect(await env.eval(`"hello"`)).toBe('"hello"');
    });
  });
});
