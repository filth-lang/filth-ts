import { beforeEach, describe, expect, it } from 'bun:test';
import { createEnv, EvalEnvironment } from '../create';

describe('Filth', () => {
  describe('Lists', () => {
    let env: EvalEnvironment;

    beforeEach(() => {
      env = createEnv();
    });

    it('should scope variables', async () => {
      const result = await env.eval(`
        (def fn (lambda () (x)))
        (let ((x 1)) (fn))
        `);

      expect(result).toBe(1);
    });
  });
});
