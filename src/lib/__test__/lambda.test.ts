import { beforeEach, describe, expect, it } from 'vitest';

import { createEnv, EvalEnvironment } from '../env/create';

describe('Filth', () => {
  describe('Lists', () => {
    let env: EvalEnvironment;

    beforeEach(() => {
      env = createEnv();
    });

    it.skip('should scope variables', async () => {
      const result = await env.eval(`
        (def foo (fn () (x)))
        (let ((x 1)) (foo))
        `);

      expect(result).toBe(1);
    });
  });
});
