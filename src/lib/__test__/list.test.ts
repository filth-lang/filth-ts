import { beforeEach, describe, expect, it } from 'vitest';

import { createEnv, EvalEnvironment } from '@filth/env/create';

import { createFilthList } from '../helpers';

describe('Filth', () => {
  describe('Lists', () => {
    let env: EvalEnvironment;

    beforeEach(() => {
      env = createEnv();
    });

    it('should evaluate a list', async () => {
      expect(await env.eval('(1 2 3)')).toEqual(3);
    });

    it('should return a quoted list', async () => {
      expect(await env.eval("'(1 2 3)")).toEqual(createFilthList([1, 2, 3]));
    });

    it.skip('should throw error with undefined symbol', async () => {
      expect(async () => {
        await env.eval("'(1 2 last-number)");
      }).toThrowError(`Undefined symbol: last-number`);
    });

    it('should evaluate list operations', async () => {
      expect(await env.eval("(car '(1 2 3))")).toBe(1);
      expect(await env.eval("(cdr '(1 2 3))")).toEqual({
        elements: [2, 3],
        type: 'list'
      });
      expect(await env.eval("(cons 1 '(2 3))")).toEqual({
        elements: [1, 2, 3],
        type: 'list'
      });
    });

    it('should return list length', async () => {
      expect(await env.eval(`(len '(1 2 3))`)).toBe(3);
      expect(await env.eval(`(len '())`)).toBe(0);
      expect(await env.eval(`(len (1 2 3))`)).toBe(0);
      expect(await env.eval('(len ())')).toBe(0);
    });

    it('should evaluate list predicates', async () => {
      expect(await env.eval("(list? '(1 2 3))")).toBe(true);
      expect(await env.eval("(list? '())")).toBe(true);
      expect(await env.eval("(null? '(1 2 3))")).toBe(false);
    });

    it('should evaluate equality checks', async () => {
      expect(await env.eval("(equal? '(1 2 3) '(1 2 3))")).toBe(true);
      expect(await env.eval("(equal? '(1 2) '(1 2 3))")).toBe(false);
    });

    it('should add a list to a list', async () => {
      expect(await env.eval("(+ '(1 2 3) '(4 5 6))")).toEqual({
        elements: [1, 2, 3, 4, 5, 6],
        type: 'list'
      });
    });
  });
});

const expectEval = async (env: EvalEnvironment, expr: string) => {
  const result = await env.eval(expr);
  return expect(result);
};
