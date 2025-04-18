import { beforeEach, describe, expect, it } from 'vitest';

import { createEnv, EvalEnvironment } from '../env/create';

describe('Filth', () => {
  describe('rest parameters', () => {
    let env: EvalEnvironment;

    beforeEach(() => {
      env = createEnv();
    });

    it('should handle rest apply', async () => {
      // actually, we dont need apply anymore, because matching
      // handles this
      const input = `
      (def sum (x y z)
        (+ x y z))
      (sum 1 2 3)
      `;
      expect(await env.eval(input)).toBe(6);
    });
  });
});
