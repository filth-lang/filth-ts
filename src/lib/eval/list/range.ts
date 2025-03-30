import { Environment } from '@filth/environment';
import { EvaluationError } from '@filth/error';
import { FilthExpr } from '@filth/types';
import { createLog } from '@helpers/log';

const log = createLog('eval/range');

export const evalRange = async (
  env: Environment,
  expr: FilthExpr
): Promise<FilthExpr> => {
  // const arg = await evaluate(env, expr);

  log.debug('[evalRange] expr', expr);

  throw new EvaluationError('Range is not implemented');
};
