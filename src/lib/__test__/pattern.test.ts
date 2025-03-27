import { beforeEach, describe, expect, it } from 'bun:test';
import { createEnv, EvalEnvironment } from '../create';

describe('Filth', () => {
  describe.skip('pattern matching', () => {
    let env: EvalEnvironment;

    beforeEach(() => {
      env = createEnv();
    });

    it('should match simple patterns', async () => {
      expect(
        await env.eval(`
      (= 1 1)
    `)
      ).toBe(true);

      expect(
        await env.eval(`
      (= x 1)
    `)
      ).toBe(1);

      // expect(
      //   async () =>
      //     await env.eval(`
      //   (= 2 x)
      // `)
      // ).rejects.toThrow('no match of right hand side value: 1');
    });

    it('should match list patterns', async () => {
      expect(
        await env.eval(`
      (= '(x y z) '(1 2 3))`)
      ).toEqual({
        elements: [1, 2, 3],
        type: 'list'
      });

      expect(await env.eval(`x`)).toBe(1);
      expect(await env.eval(`y`)).toBe(2);
      expect(await env.eval(`z`)).toBe(3);
    });
  });
});
