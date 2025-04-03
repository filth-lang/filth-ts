/* eslint-disable @typescript-eslint/consistent-type-definitions */

import { createLog } from '@helpers/log';
import { isFilthEnv, isFilthList, isFilthRange } from '@lib/helpers';
import { FilthExpr, FilthList, FilthRange } from '@lib/types';
import { expect } from 'bun:test';
import { createFilthList } from '../helpers';

const log = createLog('test');
declare module 'bun:test' {
  interface Matchers<T> {
    envToContain(symbol: string, expected: FilthExpr): T;
    toEqualFilthList(expected: FilthList): T;
    toEqualFilthRange(expected: FilthRange): T;
  }
}

const envToContain = (env: unknown, symbol: string, expected: FilthExpr) => {
  if (!isFilthEnv(env)) {
    return {
      message: () => `expected ${env} to be a Filth environment`,
      pass: false
    };
  }

  const bindings = env.getBindings();

  const binding = bindings.get(symbol);

  log.debug('[envToContain]', symbol, binding);

  if (!binding) {
    return {
      message: () => `expected ${symbol} to be in the environment`,
      pass: false
    };
  }

  return {
    message: () =>
      `expected binding ${symbol} to equal ${expected}, not ${binding.value}`,
    pass: binding.value === expected
  };
};

const toEqualFilthList = (actual: unknown, expected: FilthExpr) => {
  if (!isFilthList(actual as FilthExpr)) {
    return {
      message: () => `expected ${actual} to be a Filth list`,
      pass: false
    };
  }

  if (!isFilthList(expected) && Array.isArray(expected)) {
    expected = createFilthList(expected);
  }

  const expectedList = expected as FilthList;

  const filthList = actual as FilthList;

  // log.debug('[assertEqualFilthList]', actual, expected);

  const pass =
    filthList.elements.length === expectedList.elements.length &&
    filthList.elements.every(
      (element, index) => element === expectedList.elements[index]
    );

  // log.debug('[assertEqualFilthList]', pass);

  return {
    message: () =>
      `expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`,
    pass
  };
};

const toEqualFilthRange = (actual: unknown, expected: FilthRange) => {
  if (!isFilthRange(actual as FilthExpr)) {
    return {
      message: () => `expected ${actual} to be a Filth range`,
      pass: false
    };
  }

  // log.debug('[assertEqualFilthRange]', actual, expected);

  const filthRange = actual as FilthRange;
  const pass =
    filthRange.elements.length === expected.elements.length &&
    filthRange.elements.every(
      (element, index) => element === expected.elements[index]
    );

  return {
    message: () =>
      `expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`,
    pass
  };
};

expect.extend({
  envToContain,
  toEqualFilthList,
  toEqualFilthRange
});
