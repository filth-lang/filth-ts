import { beforeEach, describe, expect, it, test } from 'vitest';

import { createEnv } from '@filth/env/create';
import { compareParams, Environment } from '@filth/env/env';
import { parse } from '@filth/parser/index';
import { FilthExpr, FilthList } from '@filth/types';
import { createLog } from '@helpers/log';

import { EvalEnvironment } from '../create';

const log = createLog('env');

describe('Filth', () => {
  describe('Env', () => {
    let env: EvalEnvironment;
    let testResult: FilthExpr[];

    beforeEach(() => {
      env = createEnv();
      env.define('tr', (...args: FilthExpr[]) => {
        testResult = args;
        return null;
      });
    });

    it('should define and lookup variables', () => {
      const env = new Environment();
      env.define('x', 42);
      expect(env.lookup('x')).toEqual({
        options: {},
        value: 42
      });
    });

    it('should handle nested environments', () => {
      const parent = new Environment();
      parent.define('x', 42);
      const child = new Environment(parent);
      expect(child.lookup('x')).toEqual({
        options: {},
        value: 42
      });
    });

    it('should throw on undefined variables', () => {
      const env = new Environment();
      expect(() => env.lookup('x')).toThrow('Undefined symbol: x');
    });

    describe('compareParams', () => {
      test.each([
        //
        [`(12)`, `(12)`, true],
        [`(12)`, `(25)`, false],
        [`(true)`, `(true)`, true],
        [`(true)`, `(false)`, false],
        [`(a b c)`, `(1 2 3)`, true],
        [`(a b 5)`, `(1 2 3)`, false],
        [`("mul" a b)`, `("mul" 2 3)`, true],
        [`("mul" a b)`, `("add" 2 3)`, false],
        [`(/door/)`, `("door")`, true],
        [`(/\\d+/ a b)`, `("15" 2 3)`, true],
        [`(/\\d+/ a b)`, `("fifteen" 2 3)`, false],
        [`( /(?<val>door|window)/ )`, `("door")`, true],
        [`( /(?<val>door|window)/ )`, `("window")`, true],
        [`( /(?<val>door|window)/ )`, `("chest")`, false]
      ])('%s matches %s -> %j', async (params, args, expected) => {
        const paramsList = (parse(params)! as FilthList).elements;
        const argsList = (parse(args)! as FilthList).elements;

        // log.debug('[compareParams]', paramsList, argsList);

        const result = compareParams(paramsList, argsList);

        expect(result).toBe(expected);
      });
    });
  });
});
