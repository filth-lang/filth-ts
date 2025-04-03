import { Environment } from '@filth/environment';
import { EvaluationError } from '@filth/error';
import { evaluate } from '@filth/eval/evaluate';
import {
  checkRestParams,
  getFilthType,
  isFilthList,
  isFilthString
} from '@filth/helpers';
import { FilthExpr, FilthFunction } from '@filth/types';
import { createLog } from '@helpers/log';

const log = createLog('eval/define');

export const evalDefine = async (env: Environment, args: FilthExpr[]) => {
  // Handle both forms of define
  const [nameOrList, ...body] = args;

  // log.debug('[define] nameOrList', nameOrList);
  // log.debug('[define] body', body);

  // first arg is a symbol, the rest is the body
  // eg: (define x 10)
  if (!isFilthList(nameOrList)) {
    if (!isFilthString(nameOrList)) {
      throw new EvaluationError(
        `First argument to define must be a symbol, received ${getFilthType(nameOrList)}`
      );
    }
    if (body.length !== 1) {
      throw new EvaluationError(
        `Define expects exactly one value, received ${body.length}`
      );
    }

    const evaluatedValue = await evaluate(env, body[0]);
    // log.debug('[define] eval body', body[0], evaluatedValue);
    env.define(nameOrList, evaluatedValue);
    return null;
  }

  // Function definition form: (define (name params...) body...)
  const fnName = nameOrList.elements[0];
  const params = nameOrList.elements.slice(1);

  if (!isFilthString(fnName)) {
    throw new EvaluationError(
      `Function name must be a symbol, received ${getFilthType(fnName)}`
    );
  }

  const { hasRest, parameters, restParam } = checkRestParams(params);

  // log.debug('[define] params', params);
  // log.debug('[define] hasRest', hasRest);
  // log.debug('[define] parameters', parameters);
  // log.debug('[define] restParam', restParam);
  // log.debug('[define] body', body);

  // Create lambda expression
  const lambda: FilthFunction = {
    body:
      body.length === 1
        ? body[0]
        : {
            elements: ['begin', ...body],
            type: 'list'
          },
    env,
    params: parameters,
    restParam: hasRest ? restParam : null,
    type: 'function'
  };

  // log.debug('[define] lambda', fnName);
  env.define(fnName, lambda);
  return null;
};
