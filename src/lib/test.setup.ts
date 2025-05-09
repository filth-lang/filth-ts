/* eslint-disable @typescript-eslint/consistent-type-definitions */
/* eslint-disable @typescript-eslint/no-empty-object-type */

import 'vitest';

import { expect } from 'vitest';

import {
  createFilthList,
  exprToString,
  isFilthBasicValue,
  isFilthEnv,
  isFilthFunction,
  isFilthList,
  isFilthRange,
  isFilthString,
  isFilthValue
} from '@filth/helpers';
import { FilthExpr, FilthFunction, FilthList, FilthRange } from '@filth/types';
import { createLog } from '@helpers/log';

const log = createLog('test');

const envToContain = (env: unknown, symbol: unknown, expected: unknown) => {
  if (!isFilthEnv(env)) {
    return {
      message: () => `expected ${env} to be a Filth environment`,
      pass: false
    };
  }

  if (!isFilthString(symbol)) {
    return {
      actual: symbol,
      expected: 'string',
      message: () => `expected ${symbol} to be a string`,
      pass: false
    };
  }

  const binding = env.lookup(symbol);

  // log.debug('[envToContain]', symbol, binding);

  if (!binding) {
    return {
      message: () => `expected ${symbol} to be in the environment`,
      pass: false
    };
  }

  if (isFilthValue(expected) || isFilthBasicValue(expected)) {
    return {
      message: () =>
        `expected binding ${symbol} to equal ${expected}, not ${binding.value}`,
      pass: binding.value === expected
    };
  }

  if (!expected || typeof expected !== 'object') {
    return {
      message: () => `expected ${expected} to be an object`,
      pass: false
    };
  }

  if (isFilthList(expected) && isFilthList(binding.value)) {
    // log.debug('[envToContain]', expected, exprToString(expected));
    // log.debug('[envToContain]', binding.value, exprToString(binding.value));
    return {
      message: () =>
        `expected binding ${symbol} to equal ${exprToString(expected)}, not ${exprToString(binding.value)}`,
      pass: exprToString(expected) == exprToString(binding.value)
    };
  }

  if (!isFilthFunction(binding.value)) {
    return {
      message: () => `expected binding ${symbol} to be a Filth function`,
      pass: false
    };
  }

  if ('params' in expected) {
    const bindingFunction = binding as unknown as FilthFunction;

    const expectedParams = expected.params as unknown as string[];
    const bindingParams = bindingFunction.params;

    if (expectedParams && bindingParams) {
      const pass = expectedParams.every(
        (param, index) => param === bindingParams[index]
      );

      if (!pass) {
        return {
          message: () =>
            `expected binding params to equal ${JSON.stringify(expectedParams)}`,
          pass
        };
      }
    }
  }

  if ('body' in expected) {
    const bindingBody = binding.value.body;
    const expectedBody = expected.body as unknown as FilthExpr[];

    if (!bindingBody) {
      return {
        message: () => `expected binding ${symbol} to have a body`,
        pass: false
      };
    }

    const pass =
      isFilthList(bindingBody) &&
      bindingBody.elements.every((expr, index) => expr === expectedBody[index]);

    if (!pass) {
      return {
        message: () =>
          `expected binding body to equal ${JSON.stringify(expected.body)}`,
        pass: false
      };
    }
  }

  return {
    message: () =>
      `expected binding ${symbol} to equal ${JSON.stringify(expected)}`,
    pass: true
  };
};

const toEqualFilthList = (
  actual: unknown,
  expected: FilthList | FilthExpr[]
) => {
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

const toBeFilthFunction = (actual: unknown) => {
  if (!isFilthFunction(actual as FilthExpr)) {
    return {
      message: () => `expected ${actual} to be a Filth function`,
      pass: false
    };
  }

  return {
    message: () => `expected ${actual} to be a Filth function`,
    pass: true
  };
};

expect.extend({
  envToContain,
  toBeFilthFunction,
  toEqualFilthList,
  toEqualFilthRange
});

interface CustomMatchers<T = unknown> {
  envToContain(symbol: unknown, expected: unknown): T;
  toBeFilthFunction(): T;
  toEqualFilthList(expected: FilthList | FilthExpr[]): T;
  toEqualFilthRange(expected: FilthRange): T;
}

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Assertion<T = any> extends CustomMatchers<T> {}

  interface AsymmetricMatchersContaining extends CustomMatchers {}
}
