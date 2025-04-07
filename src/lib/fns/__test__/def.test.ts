import { beforeEach, describe, expect, it, test } from 'vitest';

import { createEnv, EvalEnvironment } from '@filth/env/create';
import { FilthExpr } from '@filth/types';
import { createLog } from '@helpers/log';

const log = createLog('fns/def');

describe('Filth', () => {
  describe('def', () => {
    let env: EvalEnvironment;
    let testResult: FilthExpr[];

    beforeEach(() => {
      env = createEnv();
      env.define('tr', (...args: FilthExpr[]) => {
        testResult = args;
        return null;
      });
    });

    test.each([
      // [`"filth"`, 'filth'],
      [`def hello "nice"`, 'hello', '"nice"'],
      [`def (mult x) (* x 2)`, 'mult', { body: ['*', 'x', 2], params: ['x'] }]
    ])('json %p should evalute to %p', async (expr, symbol, expected) => {
      await env.eval(expr);
      expect(env).envToContain(symbol, expected);
    });

    test('overloading def functions with constant string args', async () => {
      const result = await env.eval(`
      
        (def (hello "world") '("saying hello to world"))
        (def (hello "moon") '("saying hello to moon"))
        
        (hello "world")
      `);

      expect(result).toEqualFilthList(['"saying hello to world"']);
    });

    test('overloading def functions with constant numeric args', async () => {
      const result = await env.eval(`
      
        (def (age 12) '("child"))
        (def (age 25) '("adult"))
        
        (age 12)
      `);

      expect(result).toEqualFilthList(['"child"']);
    });

    test('overloading def functions with args', async () => {
      const result = await env.eval(`
      
        (def (arith "mul" x y) (* x y))
        (def (arith "add" x y) (+ x y))
        
        (arith "mul" 2 3)
      `);

      expect(result).toEqual(6);
    });

    test('overloading def functions with regex args', async () => {
      const result = await env.eval(`
      
        (def (open /door/ ) "opened")
        (def (open /(?<val>window)/ ) (+ "the " val " cannot be opened"))
        
        (open "window")
      `);

      expect(result).toEqual('"the window cannot be opened"');
    });

    it('should handle rest parameters in def', async () => {
      const input = `
      ; Function that takes rest parameters
      (def (sum first ... rest)
        (if (null? rest)
            first
            (+ first (sum rest))))

      ; Sum numbers
      (sum 1 2 3 4 5)
      `;
      const result = await env.eval(input);
      expect(result).toBe(15);
    });

    it('def fn', async () => {
      await env.eval(`def (fn x) (+ x 1)`);
      const result = await env.eval('fn 1');
      expect(result).toBe(2);
    });

    it('one shot def fn', async () => {
      const result = await env.eval(`(def (foo x) (+ x 2)) (foo 2)`);
      expect(result).toBe(4);
    });

    it.skip('should perform json operations', async () => {
      await env.eval(`

        def foo 45
        def bar 15
        (+ foo bar)
        ; 60

        def (mult x) (* x 2)
        (mult 10)
        ; 20

        ; fn overload
        def (mult x y) (* x y)
        (mult 10 20)
        ; 200

        def (mult x 10) (* x 10)
        (mult 10)
        ; 100
         
        def (add /(?<val>d+)/) (+ (to_i val) 10)
        (add 5)
        ; 15
        `);

      expect(testResult[0]).toEqualFilthList(['state', 'open']);
    });
  });
});
