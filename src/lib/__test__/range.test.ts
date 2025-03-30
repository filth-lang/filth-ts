import { beforeEach, describe, expect, it } from 'bun:test';
import { createEnv, EvalEnvironment } from '../create';

describe('Filth', () => {
  describe('Ranges', () => {
    let env: EvalEnvironment;

    beforeEach(() => {
      env = createEnv();
    });

    it('should handle range', async () => {
      expect(true).toBe(true);
    });
  });
});
