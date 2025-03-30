import { Environment } from '@filth/environment';
import { FilthExpr } from '@filth/types';
import { createLog } from '@helpers/log';
import { LambdaError } from '../../error';
import { parseLambdaParams } from '../../parse';

const log = createLog('eval/apply');

export const evalLambda = async (
  env: Environment,
  args: FilthExpr[]
): Promise<FilthExpr> => {
  if (args.length < 2) {
    throw new LambdaError('Lambda requires parameters and body');
  }
  const [params, ...body] = args;
  const parameters = parseLambdaParams(params);
  return {
    body:
      body.length === 1
        ? body[0]
        : { elements: ['begin', ...body], type: 'list' },
    env: env.create(),
    params: parameters,
    type: 'function'
  };
};
