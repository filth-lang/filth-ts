import { beforeEach, describe, expect, it } from 'bun:test';
import { createEnv, EvalEnvironment } from '../create';

describe('Filth', () => {
  describe('rest parameters', () => {
    let env: EvalEnvironment;

    beforeEach(() => {
      env = createEnv();
    });

    it('should handle rest parameters in define', async () => {
      const input = `
      ; Function that takes rest parameters
      (define (sum first . rest)
        (if (null? rest)
            first
            (+ first (apply sum rest))))

      ; Sum numbers
      (sum 1 2 3 4 5)
      `;
      const result = await env.eval(input);
      expect(result).toBe(15);
    });

    it('should handle rest apply', async () => {
      const input = `
      (define (sum x y z)
        (+ x y z))
      (apply sum '(1 2 3))
      `;
      expect(await env.eval(input)).toBe(6);

      // dont support common lisp syntax
      expect(async () => {
        await env.eval(`(apply 'sum 1 2 '(3))`);
      }).toThrowError(`Undefined symbol: 'sum`);
    });
  });
});
