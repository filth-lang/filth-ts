import { beforeEach, describe, expect, test } from 'vitest';

import { createEnv, EvalEnvironment } from '@filth/env/create';
import { FilthExpr } from '@filth/types';
import { createLog } from '@helpers/log';

const log = createLog('env');

describe('Filth', () => {
  describe('List', () => {
    let env: EvalEnvironment;
    let testResult: FilthExpr[];

    beforeEach(() => {
      env = createEnv();
      env.define('tr', (...args: FilthExpr[]) => {
        testResult = args;
        return null;
      });
    });

    describe('=', () => {
      test.each([
        [`= (12) (12)`, true],
        [`= (12) (25)`, false],
        [`= (12) (12 25)`, false],
        [`= (12 25) (12)`, false],
        [`= (12 25) (12 25)`, true],
        [`= (12 25) (12 26)`, false],
        [`= (12 25) (12 25 26)`, false],
        [`~ (a b c) (1 2 3)`, true]
      ])('%s equals %o', async (expr, expected) => {
        const result = await env.eval(expr);

        expect(result).toEqual(expected);
      });
    });
    describe('~', () => {
      test.each([
        [`~ (a b c) (1 2 3)`, true],
        [`~ (head ... tail) (1 2 3 4)`, true]
      ])('%o matches %o', async (expr, expected) => {
        const result = await env.eval(expr);

        expect(result).toEqual(expected);
      });
    });
  });
});
