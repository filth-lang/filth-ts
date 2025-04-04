import { beforeEach, describe, expect, test } from 'vitest';

import { createEnv, EvalEnvironment } from '@filth/env/create';

describe('Filth', () => {
  describe('type conversions', () => {
    let env: EvalEnvironment;

    beforeEach(() => {
      env = createEnv();
    });

    test.each([
      [`(to_s 123)`, `"123"`],
      [`(to_s 123.456)`, `"123.456"`],
      [`(to_s true)`, `"true"`],
      [`(to_s false)`, `"false"`],
      [`(to_s nil)`, `"nil"`],
      [`(to_s "hello")`, `"hello"`],
      [`(to_s "hello" "world")`, `"hello world"`],
      [`(to_s "the year is" 2025)`, `"the year is 2025"`]
    ])('to_s %p should equal %o', async (expr, expected) => {
      expect(await env.eval(expr)).toEqual(expected);
    });

    test.each([
      [`(to_i "123")`, 123],
      [`(to_i "123.456")`, 123],
      [`(to_i "123.456")`, 123]
    ])('to_i %p should equal %o', async (expr, expected) => {
      expect(await env.eval(expr)).toEqual(expected);
    });

    test.each([
      [`(to_f "123")`, 123],
      [`(to_f "123.456")`, 123.456],
      [`(to_f "123.456")`, 123.456]
    ])('to_f %p should equal %o', async (expr, expected) => {
      expect(await env.eval(expr)).toEqual(expected);
    });

    test.each([
      [`(to_b "true")`, true],
      [`(to_b "false")`, false],
      [`(to_b "nil")`, false]
    ])('to_b %p should equal %o', async (expr, expected) => {
      expect(await env.eval(expr)).toEqual(expected);
    });
  });
});
