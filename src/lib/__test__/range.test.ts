import { beforeEach, describe, expect, it } from 'bun:test';
import { createEnv, EvalEnvironment } from '../create';

describe('Filth', () => {
  describe('Ranges', () => {
    let env: EvalEnvironment;

    beforeEach(() => {
      env = createEnv();
    });

    it('should handle range', async () => {
      expect(
        await env.eval(`
      
      (def fun (=> (x) (log x)))


      ; (log "-----")
      ; (0..5 fun)
        `)
      ).toEqual(null);
    });
  });
});
