import { Environment } from '@filth/env/env';
import { EvaluationError } from '@filth/error';
import { evaluateFilthPointer } from '@filth/fns/pointer';
import { wrapBasicValue } from '@filth/helpers';
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
  const [pointer, value] = args; // evaluatedArgs;

  // log.debug('[select] pointer', pointer);
  // log.debug('[select] value', value);

  return wrapBasicValue(evaluateFilthPointer(pointer, value));
};
