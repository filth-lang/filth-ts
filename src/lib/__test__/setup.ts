/* eslint-disable @typescript-eslint/consistent-type-definitions */

import { isFilthList } from '@lib/helpers';
import { FilthExpr, FilthList } from '@lib/types';
import { expect } from 'bun:test';

declare module 'bun:test' {
  interface Matchers<T> {
    toEqualFilthList(expected: FilthExpr[]): T;
  }
}

const toEqualFilthList = (actual: unknown, expected: FilthExpr[]) => {
  if (!isFilthList(actual as FilthExpr)) {
    return {
      message: () => `expected ${actual} to be a Filth list`,
      pass: false
    };
  }

  const filthList = actual as FilthList;
  const pass =
    filthList.elements.length === expected.length &&
    filthList.elements.every((element, index) => element === expected[index]);

  return {
    message: () =>
      `expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`,
    pass
  };
};

expect.extend({
  toEqualFilthList
});
