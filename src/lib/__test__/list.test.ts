import { beforeEach, describe, expect, it } from 'bun:test';
import { createEnv, EvalEnvironment } from '../create';

describe('Filth', () => {
  describe('Lists', () => {
    let env: EvalEnvironment;

    beforeEach(() => {
      env = createEnv();
    });

    it('should throw error with undefined symbol', async () => {
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

    it.only('should return list length', async () => {
      expect(await env.eval(`(len '(1 2 3))`)).toBe(0);
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
  });
});

const expectEval = async (env: EvalEnvironment, expr: string) => {
  const result = await env.eval(expr);
  return expect(result);
};
