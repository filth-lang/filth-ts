import { beforeEach, describe, expect, test } from 'vitest';

import { createEnv, EvalEnvironment } from '@filth/env/create';
import { FilthExpr } from '@filth/types';

import { createFilthPointer } from '../pointer';

describe('Filth', () => {
  describe('Pointer', () => {
    let env: EvalEnvironment;
    let testResult: FilthExpr[];

    beforeEach(() => {
      env = createEnv();
      env.define('tr', (...args: FilthExpr[]) => {
        testResult = args;
        return null;
      });
    });

    test.each([
      [`//path`, createFilthPointer('/path')],
      [`//0/one/2`, createFilthPointer('/0/one/2')],
      [`= //path //path`, true],
      [`= //path //other`, false],
      [`= //1 '(1 2 3)`, true],
      [`= //3 '(1 2 3)`, false],
      [`= //msg { msg: "hello" }`, true],
      [`= //other { msg: "hello" }`, false]
    ])('%s should evalute to %s', async (expr, expected) => {
      expect(await env.eval(expr)).toEqual(expected);
    });

    test.each([
      // [`select "lang" { lang: filth }`, '"filth"'],
      [`//lang hello `, 'nil'],
      [`//lang { lang: filth } `, '"filth"'],
      [`//1 [ a, b, c ] `, '"b"'],
      [`//2 '( "a" "b" "c" )`, '"c"'],
      [`//2/name [ a, b, { name: bob } ]`, '"bob"'],
      [`//0/name ( { name: "alice" } "bob" "clive" )`, '"alice"']
    ])('%s should evalute to %s', async (expr, expected) => {
      expect(await env.eval(expr)).toEqual(expected);
    });

    // test.each([
    //   [
    //     `select //lang (update { lang: "typescript" } //lang "filth")`,
    //     `"typescript"`
    //   ]
    // ])('%s should evalute to %s', async (expr, expected) => {
    //   expect(await env.eval(expr)).toEqual(expected);
    // });
  });
});
