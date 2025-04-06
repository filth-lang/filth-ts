import { beforeEach, describe, expect, it } from 'vitest';

import { createEnv, EvalEnvironment } from '@filth/env/create';
import { FilthExpr } from '@filth/types';

describe('Filth', () => {
  describe('Conditionals', () => {
    let env: EvalEnvironment;
    let testResult: FilthExpr[];

    beforeEach(() => {
      env = createEnv();
      env.define('tr', (...args: FilthExpr[]) => {
        testResult = args;
        return null;
      });
    });

    it.skip('should perform json operations', async () => {
      await env.eval(`

      (cond (false 1) (true 2))
       ; 2

      (cond (false 1) (false 2))
       ; nil

      (cond
        (true "yes")
        (false "no")
      )
        ; "yes"

      (cond
        ((= 5 6) "no")
        ((= 5 5) "yes")
      )
        ; "yes"

      (case (1 2 3)
        ((4 5 6) "this clause won't match")
        ((1 x 3) "this clause will match")
        (_ "this clause will match if nothing else matches")
      )
        ; "this clause will match"

      (case "open door"
        (/^open/ "open door")
        (/^closed/ "closed door")
        (_ "unknown state")
      )
        ; "open door"

        `);

      expect(testResult[0]).toEqualFilthList(['state', 'open']);
    });
  });
});
