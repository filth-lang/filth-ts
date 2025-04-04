import { Environment } from '@filth/env/env';
import { EvaluationError } from '@filth/error';
import { evaluate } from '@filth/eval/evaluate';
import { getFilthType, isFilthFunction, isFilthList } from '@filth/helpers';
import { FilthExpr } from '@filth/types';
import { createLog } from '@helpers/log';

const log = createLog('eval/apply');

export const evalApply = async (env: Environment, args: FilthExpr[]) => {
  // log.debug('[apply] args', args);
  // log.debug('[apply] bindings', env.bindings);
  if (args.length < 2) {
    throw new EvaluationError('apply requires at least two arguments');
  }
  const fn = await evaluate(env, args[0]);
  const lastArg = await evaluate(env, args.at(-1) ?? null);

  const evaluatedArgs = await Promise.all(
    args.slice(1, args.length - 1).map(async arg => await evaluate(env, arg))
  );

  if (!isFilthList(lastArg)) {
    throw new EvaluationError(
      `last argument to apply must be a list, received ${getFilthType(lastArg)}`
    );
  }

  const allArgs = [...evaluatedArgs, ...lastArg.elements];

  if (typeof fn === 'function') {
    return fn(...allArgs);
  } else if (isFilthFunction(fn)) {
    const newEnv = fn.env.create();

    // bind parameters
    for (let ii = 0; ii < fn.params.length; ii++) {
      newEnv.define(fn.params[ii] as string, allArgs[ii]);
    }

    // handle rest parameter if present
    if (fn.restParam) {
      const restArgs = allArgs.slice(fn.params.length);
      newEnv.define(fn.restParam, {
        elements: restArgs,
        type: 'list'
      });
    }

    return evaluate(newEnv, fn.body);
  } else {
    throw new EvaluationError(
      `First argument to apply must be a function, not ${getFilthType(fn)} (${JSON.stringify(fn)})`
    );
  }
};
