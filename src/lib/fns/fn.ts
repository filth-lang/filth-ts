import { Environment, matchExprs } from '@filth/env/env';
import { LambdaError, ParseError } from '@filth/error';
import { evaluate } from '@filth/eval';
import {
  createFilthList,
  exprToString,
  isFilthList,
  unwrapFilthList
} from '@filth/helpers';
import { FilthExpr, FilthFunction } from '@filth/types';
import { createLog } from '@helpers/log';

const log = createLog('fns');

export const createFilthFunction = (
  env: Environment,
  params: string[],
  body: FilthExpr
): FilthFunction => ({
  body,
  env,
  params,
  type: 'function'
});

export const evalFilthFunction = async (
  env: Environment,
  fn: FilthFunction,
  args: FilthExpr[] = []
): Promise<FilthExpr> => {
  // note: the fn.env is the environment in which the lambda was defined
  // but we want the lambda to be evaluated in the current environment
  // const newEnv = fn.env.create();
  const newEnv = env.create();
  // log.debug(
  //   '[evaluate] lambda bindings',
  //   Array.from(newEnv.getBindings().keys())
  // );

  // bind regular parameters
  const evaluatedArgs = await Promise.all(
    args.map(async arg => await evaluate(env, arg))
  );

  // log.debug('[evaluate] lambda params', fn.params, 'with args', args);
  // log.debug(
  //   '[evaluate] lambda params',
  //   fn.params,
  //   'with evaluatedArgs',
  //   evaluatedArgs.flatMap(unwrapFilthList)
  // );

  const match = matchExprs(fn.params, evaluatedArgs.flatMap(unwrapFilthList));
  // log.debug('[evaluate] match', match);

  if (match) {
    for (const [key, value] of Object.entries(match)) {
      // log.debug('[evaluate] lambda define', key, value);
      if (Array.isArray(value)) {
        newEnv.define(key, createFilthList(value));
      } else {
        newEnv.define(key, value);
      }
    }
  }

  log.debug('[evaluate] body', exprToString(fn.body), fn.body);

  return evaluate(newEnv, fn.body);
};

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
    body: body.length === 1 ? body[0] : { elements: body, type: 'list' },
    env: env.create(),
    params: parameters,
    type: 'function'
  };
};

export const parseLambdaParams = (params: FilthExpr): string[] => {
  if (!isFilthList(params)) {
    throw new ParseError('Lambda parameters must be a list');
  }

  return params.elements.map(param => {
    if (typeof param !== 'string') {
      throw new ParseError('Lambda parameters must be symbols');
    }
    return param;
  });
};
