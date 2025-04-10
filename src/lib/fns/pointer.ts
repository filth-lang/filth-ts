import JsonPointer from 'json-pointer';

import {
  addQuotes,
  isFilthJSON,
  isFilthList,
  isFilthPointer,
  isFilthQuotedExpr,
  isFilthString,
  removeQuotes,
  unwrapFilthList
} from '@filth/helpers';
import { FilthExpr, FilthPointer } from '@filth/types';
import { createLog } from '@helpers/log';

import { EvaluationError } from '../error';

const log = createLog('pointer');

export const createFilthPointer = (path: string): FilthPointer => ({
  path,
  type: 'pointer'
});

export const doesFilthPointerMatch = (
  pointer: FilthPointer,
  value: FilthExpr
): boolean => {
  // log.debug('[doesFilthPointerMatch] pointer', pointer);
  // log.debug('[doesFilthPointerMatch] value', value);
  if (isFilthPointer(value)) {
    // log.debug('[doesFilthPointerMatch] result', pointer.path === value.path);
    return pointer.path === value.path;
  }

  const result = evaluateFilthPointer(pointer, value);
  return result !== undefined;
};

export const evaluateFilthPointer = (
  pointerValue: FilthExpr,
  value: FilthExpr
) => {
  const pointer = toFilthPointer(pointerValue);

  if (isFilthQuotedExpr(value)) {
    value = value.expr;
  }

  if (isFilthJSON(value)) {
    const { data } = JsonPointerGet(value.json, pointer.path);
    // log.debug('[evaluateFilthPointer] pointer', pointer);
    // log.debug('[evaluateFilthPointer] value', data);
    if (data === undefined) {
      return undefined;
    }
    if (typeof data === 'string') {
      return addQuotes(data);
    }
    return data;
  }

  if (isFilthList(value)) {
    const { data } = JsonPointerGet(unwrapFilthList(value), pointer.path);
    // log.debug('[evaluateFilthPointer] pointer', pointer);
    // log.debug('[evaluateFilthPointer] value', unwrapFilthList(value));
    if (data === undefined) {
      return undefined;
    }
    if (isFilthString(data)) {
      return addQuotes(data);
    }
    return data;
  }

  return undefined;

  // throw new EvaluationError('Unsupported pointer value');
};

export const toFilthPointer = (pointer: FilthExpr): FilthPointer => {
  if (isFilthPointer(pointer)) {
    return pointer;
  }

  if (isFilthString(pointer)) {
    const dequotedArg = removeQuotes(pointer);
    return createFilthPointer(
      dequotedArg.startsWith('/') ? dequotedArg : `/${dequotedArg}`
    );
  }

  throw new EvaluationError('Unsupported pointer value');
};

export const JsonPointerGet = (
  value: JsonPointer.JsonObject,
  pointer: string
) => {
  try {
    const result = JsonPointer.get(value, pointer);
    return { data: result, error: undefined };
  } catch (error) {
    return { data: undefined, error };
  }
};
