import JSONPointer from 'json-pointer';

import { Environment } from '@filth/env/env';
import { EvaluationError } from '@filth/error';
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
import { FilthExpr } from '@filth/types';
import { createLog } from '@helpers/log';

const log = createLog('eval/select');

export const evalSelect = async (
  env: Environment,
  args: FilthExpr[]
): Promise<FilthExpr> => {
  if (args.length < 2) {
    throw new EvaluationError('select requires a pointer and a list');
  }
  // log.debug('[select] args', args);

  // const evaluatedArgs = await Promise.all(
  //   args.map(async arg => await evaluate(env, arg))
  // );
  let [pointer, value] = args; // evaluatedArgs;

  // log.debug('[select] pointer', pointer);
  // log.debug('[select] value', value);

  if (isFilthPointer(pointer)) {
    pointer = pointer.path;
  } else if (isFilthString(pointer)) {
    const dequotedArg = removeQuotes(pointer);
    pointer = dequotedArg.startsWith('/') ? dequotedArg : `/${dequotedArg}`;
  } else {
    throw new EvaluationError('select requires a string');
  }

  if (isFilthQuotedExpr(value)) {
    value = value.expr;
  }

  if (isFilthJSON(value)) {
    const result = JSONPointer.get(value.json, pointer);
    if (typeof result === 'string') {
      return addQuotes(result);
    }
    return result;
  }

  if (isFilthList(value)) {
    // log.debug('[select] list', unwrapFilthList(value));
    const result = JSONPointer.get(unwrapFilthList(value), pointer);
    if (typeof result === 'string') {
      return addQuotes(result);
    }
    return result;
  }

  throw new EvaluationError('Unsupported pointer value');
};
