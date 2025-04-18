/* eslint-disable no-case-declarations */

import { matchExprs, type Environment } from '@filth/env/env';
import { EvaluationError } from '@filth/error';
import { evaluate } from '@filth/eval/evaluate';
import { evalFilthFunction, evalLambda } from '@filth/fns/fn';
import { doesFilthPointerMatch, evalFilthPointer } from '@filth/fns/pointer';
import { createFilthRange, isFilthRangeIn } from '@filth/fns/range';
import { doesFilthRegexMatch } from '@filth/fns/regex';
import {
  isFilthBasicValue,
  isFilthFunction,
  isFilthJSON,
  isFilthList,
  isFilthNumber,
  isFilthPointer,
  isFilthQuotedString,
  isFilthRange,
  isFilthRegex,
  isFilthString,
  isTruthy
} from '@filth/helpers';
import { FilthExpr, FilthList } from '@filth/types';
import { createLog } from '@helpers/log';

import { evalDefine } from './define';
import { evalJSON } from './json';
import { evalLet } from './let';
import { evalRange } from './range';
import { evalRegex } from './regex';

const log = createLog('eval/list');

export const evalList = async (
  env: Environment,
  expr: FilthList
): Promise<FilthExpr> => {
  if (!expr.elements.length) {
    return null;
  }

  const [operator, ...args] = expr.elements;

  if (isFilthRange(operator)) {
    return evalRange(env, operator, args);
  }

  if (isFilthRegex(operator)) {
    return evalRegex(env, operator, args);
  }

  if (isFilthJSON(operator)) {
    return evalJSON(env, operator, args);
  }

  if (isFilthPointer(operator)) {
    return evalFilthPointer(env, operator, args);
  }

  if (isFilthString(operator) && !isFilthQuotedString(operator)) {
    switch (operator) {
      case 'def':
        return evalDefine(env, args);

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

      case 'fn':
        // log.debug('[evalList] fn', args);
        return evalLambda(env, args);

      case '=': {
        const [a, b] = args;
        const evaluatedA = await evaluate(env, a);
        const evaluatedB = await evaluate(env, b);

        if (isFilthRange(evaluatedA)) {
          return isFilthRangeIn(evaluatedA, evaluatedB);
        }

        if (isFilthRegex(evaluatedA)) {
          return doesFilthRegexMatch(evaluatedA, evaluatedB);
        }

        if (isFilthPointer(evaluatedA)) {
          return doesFilthPointerMatch(evaluatedA, evaluatedB);
        }

        return evaluatedA === evaluatedB;
      }

      case '~': {
        const [a, b] = args;
        // log.debug('[eval] ~', a, b);

        if (!isFilthList(a) || !isFilthList(b)) {
          throw new EvaluationError('~ requires two lists');
        }

        const result = matchExprs(a.elements, b.elements);
        // log.debug('[eval] ~ result', result);

        return !!result;
      }

      case '..': {
        const [start, end, step] = args;
        const evaluatedStart = await evaluate(env, start);
        const evaluatedEnd = await evaluate(env, end);
        const evaluatedStep =
          step !== undefined ? await evaluate(env, step) : 1;

        if (!isFilthNumber(evaluatedStart) || !isFilthNumber(evaluatedEnd)) {
          throw new EvaluationError('range requires numeric arguments');
        }

        // log.debug('[eval] range', evaluatedStart, evaluatedEnd);
        return createFilthRange(
          evaluatedStart as number,
          evaluatedEnd as number,
          evaluatedStep as number
        );
      }

      // let is a special form used to create local bindings. It introduces a new scope
      // where you can define variables that are only accessible within that scope
      case 'let':
        return evalLet(env, args);

      default:
        // not a built-in operator, but might be an env defined operator

        // log.debug('[evaluate] operator', operator, args);
        // log.debug('[evaluate] bindings', Array.from(env.getBindings().keys()));
        // For non-special forms, evaluate the operator and apply it
        const { options, value: fn } = env.lookup(operator, args);

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
          return evalFilthFunction(env, fn, args);
        } else if (isFilthBasicValue(fn)) {
          return fn;
        } else {
          throw new EvaluationError(
            `Cannot apply ${JSON.stringify(fn)} as a function`
          );
        }
    }
  } //else {

  let result: FilthExpr | null = null;
  for (const e of expr.elements) {
    // log.debug('eval list el', exprToString(e));
    result = await evaluate(env, e);

    if (isFilthFunction(result)) {
      // log.debug('[evalList] fn', exprToString(expr));
      result = await evalFilthFunction(env, result);
    }
  }
  // debugger;
  return result;
  // }
  // else {
  //   log.debug('[evalList] operator eval', exprToString(operator));
  //   // If the operator is not a string, evaluate it and apply it
  //   const fn = await evaluate(env, operator);

  //   log.debug('[evalList] operator eval result', exprToString(fn));

  //   if (isFilthBasicValue(fn)) {
  //     let result: FilthExpr | null = null;
  //     for (const e of expr.elements) {
  //       result = await evaluate(env, e);
  //     }
  //     return result;
  //   }
  //   // log.debug('[evaluate] operator', operator);

  //   // log.debug('[operator] evaluating operator', operator, 'result', null);
  //   // if (isFilthFunction(fn)) {
  //   //   // Handle lambda function application
  //   //   const newEnv = fn.env.create();
  //   //   const evaluatedArgs = await Promise.all(
  //   //     args.map(async arg => await evaluate(env, arg))
  //   //   );
  //   //   log.debug('[apply] lambda params', fn.params);
  //   //   fn.params.forEach((param: FilthExpr, i: number) => {
  //   //     newEnv.define(param as string, evaluatedArgs[i]);
  //   //   });
  //   //   return evaluate(newEnv, fn.body);
  //   // }

  //   if (isFilthRange(fn)) {
  //     return evalRange(env, fn, args);
  //   }

  //   if (isFilthRegex(fn)) {
  //     return evalRegex(env, fn, args);
  //   }

  //   if (isFilthJSON(fn)) {
  //     return evalJSON(env, fn, args);
  //   }

  //   if (typeof fn === 'function') {
  //     // Handle built-in functions
  //     const evaluatedArgs = await Promise.all(
  //       args.map(async arg => await evaluate(env, arg))
  //     );
  //     return fn(...evaluatedArgs);
  //   }

  //   throw new EvaluationError(
  //     `Cannot apply ${JSON.stringify(fn)} as a function`
  //   );
  // }
};
