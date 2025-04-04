import { describe, expect, it } from 'vitest';
import { createEnv } from '../env/create';

describe('Filth', () => {
  describe('begin', () => {
    it('should handle begin expressions', async () => {
      const env = createEnv();
      // begin should execute expressions in sequence and return the last value
      expect(
        await env.eval(`
        (begin 
          (+ 1 2) 
          (* 3 4) 
          (- 10 5))`)
      ).toBe(5);

      // begin with a single expression should return that expression's value
      expect(
        await env.eval(`
        (begin 
          (* 2 3))`)
      ).toBe(6);

      // empty begin should return null
      expect(await env.eval('(begin)')).toBe(null);

      // begin should handle side effects
      await env.eval(`
        (begin 
          (define x 10) 
          (define y 20))`);
      expect(await env.eval('(+ x y)')).toBe(30);
    });

    it.skip('should handle define with function with parameters', async () => {
      const env = createEnv();
      const result = await env.eval(`
        (define (print-and-square x)
          (begin
            (log "Calculating square...")
            (* x x)))

        (print-and-square 5)
      `);
      expect(result).toBe(25);
    });
  });
});
