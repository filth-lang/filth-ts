import { beforeEach, describe, expect, it, test } from 'vitest';

import { createEnv } from '@filth/env/create';
import { Environment, matchParams } from '@filth/env/env';
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

    describe('matchParams', () => {
      test.each([
        [`(12)`, `(12)`, {}],
        [`(12)`, `(25)`, false],
        [`(true)`, `(true)`, {}],
        [`(true)`, `(false)`, false],
        [`(a b c)`, `(1 2 3)`, { a: 1, b: 2, c: 3 }],
        [`(a b 5)`, `(1 2 3)`, false],
        [`("mul" a b)`, `("mul" 2 3)`, { a: 2, b: 3 }],
        [`("mul" a b)`, `("add" 2 3)`, false],
        [`(/door/)`, `("door")`, {}],
        [`(/\\d+/ a b)`, `("15" 2 3)`, { a: 2, b: 3 }],
        [`(/\\d+/ a b)`, `("fifteen" 2 3)`, false],
        [`( /(?<val>door|window)/ )`, `("door")`, { val: 'door' }],
        [`( /(?<val>door|window)/ )`, `("door window")`, { val: 'door' }],
        [`( /(?<val>door|window)/ )`, `("window")`, { val: 'window' }],
        [`( /(?<val>door|window)/ )`, `("chest")`, false],
        [`( 0..5 )`, `(1)`, {}],
        [`( 0..5 )`, `(6)`, false],
        [`( first ... rest )`, `(1 2 3)`, { first: 1, rest: [2, 3] }],
        [
          `( first ... /(?<val>door|window)/ )`,
          `(open door chest bottle window)`,
          { first: 'open', val: ['door', 'window'] }
        ],
        [`( head ... 0..5 )`, `(1 3 5 7 9)`, { ':tail': [3, 5], head: 1 }],
        [`( head ... 0..5 )`, `(1)`, { ':tail': [], head: 1 }]
      ])('%s matches %s -> %j', async (params, args, expected) => {
        const paramsList = (parse(params)! as FilthList).elements;
        const argsList = (parse(args)! as FilthList).elements;

        // log.debug('[matchParams]', paramsList, argsList);

        const result = matchParams(paramsList, argsList);

        expect(result).toEqual(expected);
      });
    });
  });
});
