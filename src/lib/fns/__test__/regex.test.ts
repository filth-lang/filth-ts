import { beforeEach, describe, expect, it, test } from 'bun:test';
import { createEnv, EvalEnvironment } from '../../create';
import '../../__test__/setup';
import { FilthExpr } from '../../types';

describe('Filth', () => {
  describe('Regex', () => {
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
      [`(= /hello/ "hello")`, true],
      [`(= /door:(?<state>open|closed|locked)/ "door:open")`, true],
      [`(= /door:(?<state>open|closed|locked)/ "door:ajar")`, false]
    ])('regex %p should match %p', async (expr, expected) => {
      expect(await env.eval(expr)).toEqual(expected);
    });

    test.each([
      [`(/\\d+/g "this year is 2025, last year was 2024")`, ['2025', '2024']],
      [`(/\\d+/ "this year is 2025, last year was 2024")`, ['2025']]
    ])('regex %p should match %p', async (expr, expected) => {
      expect(await env.eval(expr)).toEqualFilthList(expected);
    });

    it('should define a value with named groups', async () => {
      await env.eval(`
        
        tr (/door:(?<state>open|closed|locked)/ "door:open")
         ; ['state', 'open']

         ; TODO define the result so that state=open
         ; perhaps the result should be a JSON object
        
        `);

      expect(testResult[0]).toEqualFilthList(['state', 'open']);
    });
  });
});
