import { EvaluationError } from './error';
import {
  LispBasicValue,
  LispBuiltinFunction,
  LispExpr,
  LispFunction,
  LispList,
  LispValue,
  QuotedExpr
} from './types';

export const getLispType = (expr: LispExpr): string => {
  if (isLispBasicValue(expr)) {
    return typeof expr;
  }
  return typeof expr === 'object' && 'type' in expr ? expr.type : typeof expr;
};
export const isPromise = (expr: LispExpr): boolean =>
  expr !== null &&
  typeof expr === 'object' &&
  'then' in expr &&
  typeof expr.then === 'function';

export const isString = (expr: LispExpr): expr is string =>
  typeof expr === 'string';

export const isList = (expr: LispExpr): expr is LispList =>
  expr !== null &&
  typeof expr === 'object' &&
  'type' in expr &&
  expr.type === 'list';

export const isLispFunction = (expr: LispExpr): expr is LispFunction =>
  expr !== null &&
  typeof expr === 'object' &&
  'type' in expr &&
  expr.type === 'function';

export const isQuotedExpr = (expr: LispExpr): expr is QuotedExpr =>
  expr !== null &&
  typeof expr === 'object' &&
  'type' in expr &&
  expr.type === 'quoted';

export const isLispBasicValue = (expr: LispExpr): expr is LispBasicValue =>
  expr === null || typeof expr === 'number' || typeof expr === 'boolean';

export const isLispValue = (expr: LispExpr): expr is LispValue =>
  typeof expr === 'number' ||
  typeof expr === 'string' ||
  typeof expr === 'boolean';

export const isLispBuiltinFunction = (
  expr: LispExpr
): expr is LispBuiltinFunction =>
  typeof expr === 'function' && 'type' in expr && expr.type === 'builtin';

export const isLispExpr = (expr: LispExpr): expr is LispExpr =>
  isLispBasicValue(expr) ||
  isLispValue(expr) ||
  isLispBuiltinFunction(expr) ||
  isLispFunction(expr) ||
  isQuotedExpr(expr);

export const isTruthy = (value: null | false | undefined | string | LispExpr) =>
  value !== null &&
  value !== false &&
  value !== undefined &&
  isLispValue(value) &&
  value !== 'false';

export const isFalsey = (value: null | false | undefined | string | LispExpr) =>
  value === null || value === false || value === undefined || value === 'false';

export const checkRestParams = (params: LispExpr[]) => {
  const parameters: string[] = [];
  let hasRest = false;
  let restParam = '';

  for (let ii = 0; ii < params.length; ii++) {
    const param = params[ii];
    if (param === '.' || param === '@rest' || param === '...') {
      hasRest = true;
      if (ii + 1 >= params.length) {
        throw new EvaluationError('rest parameter missing');
      }
      const nextParam = params[ii + 1];
      if (!isString(nextParam)) {
        throw new EvaluationError('rest parameter must be a symbol');
      }
      restParam = nextParam;
      break;
    }
    if (!isString(param)) {
      throw new EvaluationError('parameter must be a symbol');
    }
    parameters.push(param);
  }

  return { hasRest, parameters, restParam };
};

export const listExprToString = (expr: LispExpr): string => {
  if (isList(expr)) {
    return `( ${expr.elements.map(listExprToString).join(' ')} )`;
  }
  if (isLispFunction(expr)) {
    return `#<function ${expr.params.map(param => param).join(' ')}>`;
  }
  return JSON.stringify(expr);
};
