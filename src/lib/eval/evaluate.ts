import { type Environment } from '@filth/env/env';
import { EvaluationError } from '@filth/error';
import { evalList } from '@filth/eval/list/index';
import {
  createFilthList,
  exprToString,
  isFilthBasicValue,
  isFilthFunction,
  isFilthJSON,
  isFilthList,
  isFilthObject,
  isFilthPointer,
  isFilthQuotedExpr,
  isFilthRange,
  isFilthRegex,
  isFilthString
} from '@filth/helpers';
import { FilthExpr } from '@filth/types';
import { createLog } from '@helpers/log';

import { evalFilthFunction } from '../fns/fn';

const log = createLog('filth/eval');

let depth = 0;

/**
 * Evaluate a Filth expression
 * @param expr - The Filth expression to evaluate
 * @param env - The environment to evaluate the expression in
 * @returns The evaluated Filth expression
 */
export const evaluate = async (
  env: Environment,
  expr: FilthExpr
): Promise<FilthExpr> => {
  // Add a debugger statement at the start of evaluation

  // log.debug(`[evaluate] 1 depth=${depth}, expr=${exprToString(expr)}`);

  if (isFilthBasicValue(expr) || expr === undefined) {
    // log.debug(`[evaluate] basic value=${expr}`);
    return expr;
  }

  if (isFilthString(expr)) {
    // log.debug(`[evaluate] string=${expr}`);
    // If the string is already a string value (not a symbol), return it as is
    if (expr.startsWith('"') && expr.endsWith('"')) {
      return expr;
    }
    // Otherwise, it's a symbol that needs to be looked up
    const { value } = env.lookup(expr);
    // log.debug(`[evaluate] symbol lookup ${expr} -> ${exprToString(value)}`);

    if (isFilthString(value)) {
      // If the value is another symbol, look it up recursively
      return evaluate(env, value);
    }
    return value;
  }

  if (isFilthObject(expr)) {
    if (isFilthQuotedExpr(expr)) {
      // log.debug(`[evaluate] quoted expr=${exprToString(expr.expr)}`);
      if (isFilthList(expr.expr)) {
        const result = await Promise.all(
          expr.expr.elements.map(async e => await evaluate(env, e))
        );
        return createFilthList(result);
      }
      return expr.expr;
    }

    if (isFilthList(expr)) {
      depth++;
      // log.debug(
      //   `[evaluate] entering list depth=${depth}, expr=${exprToString(expr)}`
      // );
      // log.debug(`😂 depth=${depth},`, exprToString(expr));
      const listResult = await evalList(env, expr);
      // log.debug(
      //   `🤦🏻‍♂️ depth=${depth}, ${exprToString(expr)} result ${isFilthFunction(listResult) ? 'fn' : 'list'} result=${exprToString(listResult)}`
      // );
      depth--;
      return listResult;
    }

    if (isFilthFunction(expr)) {
      // log.debug('[evaluate] eval fn', expr);
      return evalFilthFunction(env, expr);
    }
    // if (isFilthFunction(expr)) {
    //   // log.debug(`🥶 eval fn?`);
    // }

    // log.debug(`[evaluate] 3 onwards`);
    if (
      isFilthRange(expr) ||
      isFilthRegex(expr) ||
      isFilthJSON(expr) ||
      isFilthPointer(expr)
    ) {
      log.debug(`[evaluate] special type=${expr.type}`);
      return expr;
    }
  }

  throw new EvaluationError(
    `Cannot evaluate expression: ${exprToString(expr)}`
    // `Cannot evaluate expression: ${JSON.stringify(expr)}`
  );
};
