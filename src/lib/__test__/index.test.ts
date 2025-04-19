import { describe, expect, it } from 'vitest';

import { createEnv } from '../env/create';

describe('Filth', () => {
  describe('Evaluator', () => {
    const env = createEnv();

    it('should evaluate basic arithmetic', async () => {
      expect(await env.eval('(+ 1 2 3)')).toBe(6);
      expect(await env.eval('(- 10 3 2)')).toBe(5);
      expect(await env.eval('(* 2 3 4)')).toBe(24);
      expect(await env.eval('(/ 24 2 3)')).toBe(4);
    });

    it('should evaluate conditional expressions', async () => {
      expect(await env.eval('(if true 1 2)')).toBe(1);
      expect(await env.eval('(if false 1 2)')).toBe(2);
    });

    it('should evaluate variable definitions', async () => {
      const testEnv = createEnv();
      await testEnv.eval('(def x 42)');
      const result = await testEnv.eval('x');
      expect(result).toBe(42);
    });

    it('should evaluate fn expressions', async () => {
      const testEnv = createEnv();
      await testEnv.eval('(def double (x) (* x 2))');
      expect(await testEnv.eval('(double 21)')).toBe(42);
    });

    it('should handle async functions', async () => {
      const start = Date.now();
      await env.eval('(wait 100)');
      const end = Date.now();
      expect(end - start).toBeGreaterThanOrEqual(100);
    });
  });

  describe('Promises', () => {
    it('should handle promises', async () => {
      const env = createEnv();
      await env.eval(
        `(def 
          wait-and-log 
          (fn () 
            (wait 100) 
            (log "Hello, world!")))`
      );
      await env.eval('(wait-and-log)');
    });

    it('should handle async operations in sequence', async () => {
      const env = createEnv();
      const start = Date.now();

      // Test sequential waits using begin
      await env.eval('( (wait 50) (wait 50) )');
      const end = Date.now();
      expect(end - start).toBeGreaterThanOrEqual(100);

      // Test wait inside let
      const startLet = Date.now();
      await env.eval('(let ((delay 50)) (wait delay))');
      const endLet = Date.now();
      expect(endLet - startLet).toBeGreaterThanOrEqual(50);

      // Test multiple sequential waits
      const startMulti = Date.now();
      await env.eval(`
        (
          (wait 25)
          (wait 25)
          (wait 25)
          (wait 25)
        )
      `);
      const endMulti = Date.now();
      expect(endMulti - startMulti).toBeGreaterThanOrEqual(100);
    });
  });
});
