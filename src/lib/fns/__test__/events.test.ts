import { beforeEach, describe, expect } from 'vitest';

import { createEnv, EvalEnvironment } from '@filth/env/create';
import { FilthExpr } from '@filth/types';

describe('Filth', () => {
  describe('Events', () => {
    let env: EvalEnvironment;
    let testResult: FilthExpr[];

    beforeEach(() => {
      env = createEnv();
      env.define('tr', (...args: FilthExpr[]) => {
        testResult = args;
        return null;
      });
    });

    it.skip('should perform event operations', async () => {
      await env.eval(`

        (on "click" (fn (event) (log "clicked")))

        (emit "click")
        ; "clicked"

        `);

      expect(testResult[0]).toEqualFilthList(['state', 'open']);
    });
  });
});
