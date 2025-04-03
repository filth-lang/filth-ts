import { beforeEach, describe, expect, it, test } from 'bun:test';
import { createEnv, EvalEnvironment } from '../../create';
import '../../__test__/setup';
import { createLog } from '@helpers/log';
import { FilthExpr } from '../../types';

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
      
        (def (arith mul x y) (* x y))
        (def (arith add x y) (+ x y))
        
        (arith mul 2 3)
      `);

      expect(result).toEqual(6);
    });

    test.skip('overloading def functions with regex args', async () => {
      const result = await env.eval(`
      
        (def (open /door/ ) '("opened")
        (def (close /door/ ) '("closed")
        
        (open "door")
      `);

      expect(result).toEqualFilthList(['"opened"']);
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
         
        def (add /(?<val>\d+)/) (+ (to_i val) 10)
        (add 5)
        ; 15
        `);

      expect(testResult[0]).toEqualFilthList(['state', 'open']);
    });
  });
});
