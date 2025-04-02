import { beforeEach, describe, expect, it, test } from 'bun:test';
import { createEnv, EvalEnvironment } from '../../create';
import '../../__test__/setup';
import { createFilthRange } from '../range';

describe('Filth', () => {
  describe('Ranges', () => {
    let env: EvalEnvironment;

    beforeEach(() => {
      env = createEnv();
    });

    test.each([
      [`(.. 10 15)`, createFilthRange(10, 15)],
      [`(.. 10 15 2)`, createFilthRange(10, 15, 2)],
      [`(.. 10 15 3)`, createFilthRange(10, 15, 3)],
      [`(.. 10 15 4)`, createFilthRange(10, 15, 4)],
      [`(.. 10 1 2)`, createFilthRange(10, 1, 2)]
    ])('range expr %p should equal %o', async (expr, expected) => {
      expect(await env.eval(expr)).toEqualFilthRange(expected);
    });

    test.each([
      [`(= 1..2 1..2)`, true],
      [`(= 1..2 1..3)`, true],
      [`(= 1..2 1..4)`, true],
      [`(= 100..1 20..50)`, true],
      [`(= 20..50 50..75)`, true]
    ])('%p should equal %p', async (expr, expected) => {
      expect(await env.eval(expr)).toEqual(expected);
    });

    test.each([
      [`(= 1..2 (1) )`, true],
      [`(= 1..2 (10) )`, false],
      [`(= 1..2 (1 2 3) )`, false],
      [`(= 1..2 '(3 2 1) )`, false],
      [`(= 1..10 '(4 7 8) )`, true],
      [`(= 1..10 '("hello" "world") )`, false],
      [`(= 1..10 '(true false) )`, false]
    ])('%p should match list %p', async (expr, expected) => {
      expect(await env.eval(expr)).toEqual(expected);
    });

    it('equals another range', async () => {
      expect(
        await env.eval(`
      (= 1..2 1..2)
        `)
      ).toEqual(true);
    });

    it('tests whether a value is in a range', async () => {
      expect(
        await env.eval(`
      (= 1..10 5)
        `)
      ).toEqual(true);
    });

    it('should handle range', async () => {
      expect(
        await env.eval(`
        
          (0..5 (=> (x) (+ x 10)))
        
        `)
      ).toEqualFilthList([10, 11, 12, 13, 14, 15]);
    });
  });
});
