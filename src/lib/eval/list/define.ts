import { Environment } from '@filth/env/env';
import { EvaluationError } from '@filth/error';
import { evaluate } from '@filth/eval/evaluate';
import { getFilthType, isFilthList, isFilthString } from '@filth/helpers';
import { FilthExpr, FilthFunction } from '@filth/types';
import { createLog } from '@helpers/log';

const log = createLog('eval/define');

/**
 * Evaluate a define expression
 *
 * the following forms are supported
 * (def name value)
 * (def name fn)
 * (def name params body)
 *
 *
 * @param env - The environment to evaluate the expression in
 * @param args - The arguments to evaluate the expression with
 * @returns The evaluated expression
 */
export const evalDefine = async (env: Environment, args: FilthExpr[]) => {
  // Handle both forms of define
  const [name, valueOrFn, ...body] = args;

  // log.debug('[evalDefine] name', name);
  // log.debug('[evalDefine] valueOrFn', valueOrFn);
  // log.debug('[evalDefine] body', body);

  if (!isFilthString(name)) {
    throw new EvaluationError(
      `First argument to define must be a symbol, received ${getFilthType(name)}`
    );
  }

  if (body.length === 0) {
    const evaluatedValue = await evaluate(env, valueOrFn);
    env.define(name, evaluatedValue);
    return null;
  }

  // const params = isFilthList(valueOrFn) ? valueOrFn.elements : [];

  // if (body.length === 0) {
  //   throw new EvaluationError(`def expects exactly one value, received ${body.length}`
  //   );
  // }

  // log.debug('[define] nameOrList', nameOrList);
  // log.debug('[define] body', body);

  // first arg is a symbol, the rest is the body
  // eg: (define x 10)
  // if (!isFilthList(nameOrList)) {
  //   if (!isFilthString(nameOrList)) {
  //     throw new EvaluationError(
  //       `First argument to define must be a symbol, received ${getFilthType(nameOrList)}`
  //     );
  //   }
  //   if (body.length !== 1) {
  //     throw new EvaluationError(
  //       `def expects exactly one value, received ${body.length}`
  //     );
  //   }

  //   const evaluatedValue = await evaluate(env, body[0]);
  //   // log.debug('[define] defining ', nameOrList, evaluatedValue);
  //   env.define(nameOrList, evaluatedValue);
  //   return null;
  // }

  // Function definition form: (define (name params...) body...)
  // const fnName = nameOrList.elements[0];
  // const params = nameOrList.elements.slice(1);

  // // log.debug('[define] fnName', fnName);
  // // log.debug('[define] params', params);

  // if (!isFilthString(fnName)) {
  //   throw new EvaluationError(
  //     `Function name must be a symbol, received ${getFilthType(fnName)}`
  //   );
  // }

  const params = paramsToArray(valueOrFn);

  // const { hasRest, parameters, restParam } = checkRestParams(params);

  // log.debug('[define] params', params);

  // log.debug('[define] body', body);

  // Create lambda expression
  const lambda: FilthFunction = {
    body:
      body.length === 1
        ? body[0]
        : {
            elements: [...body],
            type: 'list'
          },
    env,
    params,
    restParam: null,
    type: 'function'
  };

  // log.debug('[define] lambda', fnName);
  env.define(name, lambda);
  return null;
};

const paramsToArray = (params: FilthExpr): FilthExpr[] => {
  if (isFilthList(params)) {
    return params.elements;
  }
  if (Array.isArray(params)) {
    return params;
  }
  return [params];
};
