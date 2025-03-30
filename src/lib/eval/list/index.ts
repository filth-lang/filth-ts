/* eslint-disable no-case-declarations */

import { type Environment } from '@filth/environment';
import { EvaluationError } from '@filth/error';
import { evaluate } from '@filth/eval/evaluate';
import {
  isFilthBasicValue,
  isFilthFunction,
  isFilthList,
  isString,
  isTruthy
} from '@filth/helpers';
import { FilthExpr, FilthList } from '@filth/types';
import { createLog } from '@helpers/log';
import { evalApply } from './apply';
import { evalDefine } from './define';
import { evalLambda } from './lambda';
import { evalLet } from './let';

const log = createLog('eval/list');

export const evalList = async (
  env: Environment,
  expr: FilthList
): Promise<FilthExpr> => {
  const [operator, ...args] = expr.elements;

  // Handle multiple top-level expressions by treating them as a begin expression
  // if (expr.elements.length > 0 && !isString(expr.elements[0])) {
  //   // log.debug('[evaluate] begin', expr);
  //   let result: FilthExpr | null = null;
  //   for (const e of expr.elements) {
  //     result = await evaluate(env, e);
  //   }
  //   return result;
  // }

  // log.debug('[evaluate] operator', operator, args);

  if (!operator) {
    return null;
  }

  if (isString(operator)) {
    switch (operator) {
      case 'def':
      case 'define':
        return evalDefine(env, args);

      case 'apply':
        return evalApply(env, args);

      case 'if':
        const [condition, consequent, alternate] = args;
        const evaluatedCondition = await evaluate(env, condition);

        return isTruthy(evaluatedCondition)
          ? evaluate(env, consequent)
          : evaluate(env, alternate);
      case 'cons':
        const [car, cdr] = args;
        const evaluatedCar = await evaluate(env, car);
        const evaluatedCdr = await evaluate(env, cdr);
        return {
          elements: [
            evaluatedCar,
            ...(isFilthList(evaluatedCdr)
              ? evaluatedCdr.elements
              : [evaluatedCdr])
          ],
          type: 'list'
        };

      case 'car':
        const list = await evaluate(env, args[0]);
        if (!isFilthList(list) || list.elements.length === 0) {
          throw new EvaluationError('car: argument must be a non-empty list');
        }
        return list.elements[0];

      case 'cdr':
        const lst = await evaluate(env, args[0]);
        if (!isFilthList(lst) || lst.elements.length === 0) {
          throw new EvaluationError('cdr: argument must be a non-empty list');
        }
        return {
          elements: lst.elements.slice(1),
          type: 'list'
        };
      case 'list': {
        const elements = await Promise.all(
          args.map(async arg => await evaluate(env, arg))
        );
        return {
          elements,
          type: 'list'
        };
      }

      case 'null?':
        const val = await evaluate(env, args[0]);
        return isFilthList(val) && val.elements.length === 0;

      case '=>':
      case 'lambda':
        return evalLambda(env, args);

      // begin is a special form used to execute a sequence of expressions in order,
      // returning the value of the last expression. It's primarily used to group
      // multiple expressions together where only one expression is expected.
      case 'begin': {
        let result: FilthExpr | null = null;
        // console.debug('[begin] expr', args);
        for (const expr of args) {
          result = await evaluate(env, expr);
        }
        return result;
      }

      // let is a special form used to create local bindings. It introduces a new scope
      // where you can define variables that are only accessible within that scope
      case 'let':
        return evalLet(env, args);

      default:
        // log.debug('[evaluate] operator', operator);
        // log.debug(
        //   '[evaluate] bindings',
        //   Array.from(env.getBindings().keys())
        // );
        // For non-special forms, evaluate the operator and apply it
        const { options, value: fn } = env.lookup(operator);

        if (typeof fn === 'function') {
          // Handle built-in functions
          // log.debug('[evaluate] built-in function', operator);

          if (options.skipEvaluateArgs) {
            return fn(...args);
          }

          const evaluatedArgs = await Promise.all(
            args.map(async arg => await evaluate(env, arg))
          );
          return fn(...evaluatedArgs);
        } else if (isFilthFunction(fn)) {
          // log.debug('[evaluate] lambda function', operator);
          // Handle lambda function application

          // note: the fn.env is the environment in which the lambda was defined
          // but we want the lambda to be evaluated in the current environment
          // const newEnv = fn.env.create();
          const newEnv = env.create();
          // log.debug(
          //   '[evaluate] lambda bindings',
          //   Array.from(newEnv.getBindings().keys())
          // );

          // bind regular parameters
          const evaluatedArgs = args;

          for (let ii = 0; ii < fn.params.length; ii++) {
            newEnv.define(fn.params[ii], evaluatedArgs[ii]);
          }

          // handle rest parameter if present
          if (fn.restParam) {
            const restArgs = evaluatedArgs.slice(fn.params.length);
            newEnv.define(fn.restParam, {
              elements: restArgs,
              type: 'list'
            });
          }

          return evaluate(newEnv, fn.body);
        } else if (isFilthBasicValue(fn)) {
          return fn;
        } else {
          throw new EvaluationError(
            `Cannot apply ${JSON.stringify(fn)} as a function`
          );
        }
    }
  } else {
    // log.debug('[evaluate] operator', operator);

    // If the operator is not a string, evaluate it and apply it
    const fn = await evaluate(env, operator);

    if (isFilthBasicValue(fn)) {
      let result: FilthExpr | null = null;
      for (const e of expr.elements) {
        result = await evaluate(env, e);
      }
      return result;
    }

    // log.debug('[operator] evaluating operator', operator, 'result', null);
    if (isFilthFunction(fn)) {
      // Handle lambda function application
      const newEnv = fn.env.create();
      const evaluatedArgs = await Promise.all(
        args.map(async arg => await evaluate(env, arg))
      );
      log.debug('[apply] lambda params', fn.params);
      fn.params.forEach((param: string, i: number) => {
        newEnv.define(param, evaluatedArgs[i]);
      });
      return evaluate(newEnv, fn.body);
    } else if (typeof fn === 'function') {
      // Handle built-in functions
      const evaluatedArgs = await Promise.all(
        args.map(async arg => await evaluate(env, arg))
      );
      return fn(...evaluatedArgs);
    } else {
      // log.debug(
      //   '[apply] fn',
      //   `Cannot apply ${JSON.stringify(fn)} as a function`
      // );
      throw new EvaluationError(
        `Cannot apply ${JSON.stringify(fn)} as a function`
      );
    }
  }
};
