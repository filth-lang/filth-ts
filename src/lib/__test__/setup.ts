/* eslint-disable @typescript-eslint/consistent-type-definitions */

import { createLog } from '@helpers/log';
import { isFilthList, isFilthRange } from '@lib/helpers';
import { FilthExpr, FilthList, FilthRange } from '@lib/types';
import { expect } from 'bun:test';
import { createFilthList } from '../helpers';

const log = createLog('test');
declare module 'bun:test' {
  interface Matchers<T> {
    toEqualFilthList(expected: FilthExpr[]): T;
    toEqualFilthRange(expected: FilthRange): T;
  }
}

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
  toEqualFilthList,
  toEqualFilthRange
});
