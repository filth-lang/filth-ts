import { Environment } from '@filth/env/env';
import { EvaluationError } from '@filth/error';
import { evaluate } from '@filth/eval/evaluate';
import {
  createFilthList,
  isFilthBuiltinFunction,
  isFilthFunction
} from '@filth/helpers';
import { FilthExpr, FilthRange } from '@filth/types';
import { createLog } from '@helpers/log';

const log = createLog('eval/range');

export const evalRange = async (
  env: Environment,
  expr: FilthRange,
  args: FilthExpr[]
): Promise<FilthExpr> => {
  const evaluatedArgs = await Promise.all(
    args.map(async arg => await evaluate(env, arg))
  );
  // log.debug('[eval] range', fn);
  // log.debug('[eval] range args', evaluatedArgs);

  if (!evaluatedArgs.length) {
    throw new EvaluationError('range requires at least one argument');
  }
  const argFn = evaluatedArgs[0];

  const newEnv = env.create();
  const [start, end] = expr.elements;
  const result: FilthExpr[] = [];

  // if (isFilthFunction(argFn)) {
  //   log.debug('[eval] range argFn body', argFn.body);
  // }

  for (let i = start; i <= end; i++) {
    if (isFilthBuiltinFunction(argFn)) {
      result.push(await argFn(i));
    } else if (isFilthFunction(argFn)) {
      const params = argFn.params;
      newEnv.define(params[0] as string, i);
      result.push(await evaluate(newEnv, argFn.body));
    }
    // newEnv.define(i.toString(), i);
  }
  return createFilthList(result);
};
