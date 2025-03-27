import { EvaluationError } from './error';
import {
  FilthBasicValue,
  FilthBuiltinFunction,
  FilthExpr,
  FilthFunction,
  FilthList,
  FilthNil,
  FilthValue,
  QuotedExpr
} from './types';

export const getFilthType = (expr: FilthExpr): string => {
  if (isFilthBasicValue(expr)) {
    return typeof expr;
  }
  return typeof expr === 'object' && 'type' in expr ? expr.type : typeof expr;
};
export const isPromise = (expr: FilthExpr): boolean =>
  expr !== null &&
  typeof expr === 'object' &&
  'then' in expr &&
  typeof expr.then === 'function';

export const isString = (expr: FilthExpr): expr is string =>
  typeof expr === 'string';

export const isFilthNil = (expr: FilthExpr): expr is FilthNil =>
  expr === null ||
  expr === undefined ||
  (typeof expr === 'object' && 'type' in expr && expr.type === 'nil');

export const isFilthList = (expr: FilthExpr): expr is FilthList =>
  expr !== null &&
  typeof expr === 'object' &&
  'type' in expr &&
  expr.type === 'list';

export const isFilthFunction = (expr: FilthExpr): expr is FilthFunction =>
  expr !== null &&
  typeof expr === 'object' &&
  'type' in expr &&
  expr.type === 'function';

export const isQuotedExpr = (expr: FilthExpr): expr is QuotedExpr =>
  expr !== null &&
  typeof expr === 'object' &&
  'type' in expr &&
  expr.type === 'quoted';

export const isFilthBasicValue = (expr: FilthExpr): expr is FilthBasicValue =>
  expr === null || typeof expr === 'number' || typeof expr === 'boolean';

export const isFilthValue = (expr: FilthExpr): expr is FilthValue =>
  typeof expr === 'number' ||
  typeof expr === 'string' ||
  typeof expr === 'boolean';

export const isFilthBuiltinFunction = (
  expr: FilthExpr
): expr is FilthBuiltinFunction => typeof expr === 'function'; // && 'type' in expr && expr.type === 'builtin';

export const isFilthExpr = (expr: FilthExpr): expr is FilthExpr =>
  isFilthBasicValue(expr) ||
  isFilthValue(expr) ||
  isFilthList(expr) ||
  isFilthBuiltinFunction(expr) ||
  isFilthFunction(expr) ||
  isQuotedExpr(expr);

export const isTruthy = (
  value: null | false | undefined | string | FilthExpr
) =>
  value !== null &&
  value !== false &&
  value !== undefined &&
  isFilthValue(value) &&
  value !== 'false';

export const isFalsey = (
  value: null | false | undefined | string | FilthExpr
) =>
  value === null || value === false || value === undefined || value === 'false';

export const checkRestParams = (params: FilthExpr[]) => {
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

export const listExprToString = (expr: FilthExpr): string => {
  if (isFilthValue(expr)) {
    return expr + '';
  }
  if (isFilthNil(expr)) {
    return 'nil';
  }
  if (isFilthList(expr)) {
    return `( ${expr.elements.map(listExprToString).join(' ')} )`;
  }
  if (isFilthFunction(expr)) {
    return `( lambda (${expr.params.map(param => param).join(' ')}) ${listExprToString(expr.body)} )`;
  }
  if (isFilthBuiltinFunction(expr)) {
    return `#<builtin ${expr.name}>`;
  }
  return JSON.stringify(expr);
};
