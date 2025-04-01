import { beforeEach, describe, expect, it } from 'bun:test';
import { createEnv, EvalEnvironment } from '../create';
import './setup';

describe('Filth', () => {
  describe('Ranges', () => {
    let env: EvalEnvironment;

    beforeEach(() => {
      env = createEnv();
    });

    it('should handle range', async () => {
      expect(
        await env.eval(`
      
      (def fun (=> (x) (* x 2)))

      (0..5 fun)
        `)
      ).toEqualFilthList([0, 2, 4, 6, 8, 10]);
    });
  });
});
