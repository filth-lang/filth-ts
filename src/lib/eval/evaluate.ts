import { type Environment } from '@filth/env/env';
import { EvaluationError } from '@filth/error';
import { evalList } from '@filth/eval/list/index';
import {
  createFilthList,
  isFilthBasicValue,
  isFilthJSON,
  isFilthList,
  isFilthObject,
  isFilthQuotedExpr,
  isFilthRange,
  isFilthRegex,
  isFilthString
} from '@filth/helpers';
import { FilthExpr } from '@filth/types';
import { createLog } from '@helpers/log';

const log = createLog('filth/eval');

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
  // log.debug('[evaluate]', exprToString(expr));

  if (isFilthBasicValue(expr)) {
    // a number, boolean, or null
    return expr;
  }

  if (isFilthString(expr)) {
    // log.debug('[evaluate]', expr);
    // If the string is already a string value (not a symbol), return it as is
    if (expr.startsWith('"') && expr.endsWith('"')) {
      // return expr.slice(1, -1);
      return expr;
    }
    // Otherwise, it's a symbol that needs to be looked up
    const { value } = env.lookup(expr);

    if (isFilthString(value)) {
      // If the value is another symbol, look it up recursively
      return evaluate(env, value);
    }
    return value;
  }

  if (isFilthObject(expr)) {
    if (isFilthQuotedExpr(expr)) {
      if (isFilthList(expr.expr)) {
        const result = await Promise.all(
          expr.expr.elements.map(async e => await evaluate(env, e))
        );
        return createFilthList(result);
      }
      return expr.expr;
    }

    if (isFilthList(expr)) {
      // log.debug('[evaluate] list', exprToString(expr));
      return evalList(env, expr);
    }

    if (isFilthRange(expr) || isFilthRegex(expr) || isFilthJSON(expr)) {
      return expr;
    }
  }

  throw new EvaluationError(
    `Cannot evaluate expression: ${JSON.stringify(expr)}`
  );
};
