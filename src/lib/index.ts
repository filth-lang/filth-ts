/* eslint-disable no-case-declarations */

import { createLog } from '@helpers/log';
import { type Environment } from './environment';
import { EvaluationError, LambdaError } from './error';
import {
  checkRestParams,
  getLispType,
  isLispBasicValue,
  isLispFunction,
  isList,
  isString,
  isTruthy
} from './helpers';
import { parseLambdaParams } from './parse';
import { LispExpr, LispFunction, LispList } from './types';

const log = createLog('filth');

/**
 * Evaluate a Lisp expression
 * @param expr - The Lisp expression to evaluate
 * @param env - The environment to evaluate the expression in
 * @returns The evaluated Lisp expression
 */
export const evaluate = async (
  env: Environment,
  expr: LispExpr
): Promise<LispExpr> => {
  log.debug('[evaluate] expr', expr);
  if (expr === undefined || expr === null) {
    throw new EvaluationError('Cannot evaluate undefined or null expression');
  }

  if (isLispBasicValue(expr)) {
    return expr;
  }

  if (isString(expr)) {
    // If the string is already a string value (not a symbol), return it as is
    if (expr.startsWith('"') && expr.endsWith('"')) {
      return expr.slice(1, -1);
    }
    // Otherwise, it's a symbol that needs to be looked up
    try {
      const value = env.lookup(expr);
      if (isString(value)) {
        // If the value is another symbol, look it up recursively
        return evaluate(env, value);
      }
      return value;
    } catch {
      // If the symbol is not found, it's a string literal
      return expr;
    }
  }

  if ('type' in expr) {
    if (expr.type === 'quoted') {
      return expr.value;
    }

    if (expr.type === 'list') {
      // Handle multiple top-level expressions by treating them as a begin expression
      if (expr.elements.length > 0 && !isString(expr.elements[0])) {
        let result: LispExpr | null = null;
        for (const e of expr.elements) {
          result = await evaluate(env, e);
        }
        return result;
      }

      const [operator, ...args] = expr.elements;

      if (isString(operator)) {
        switch (operator) {
          case 'define': {
            // Handle both forms of define
            const [nameOrList, ...body] = args;

            if (!isList(nameOrList)) {
              if (!isString(nameOrList)) {
                throw new EvaluationError(
                  `First argument to define must be a symbol, received ${getLispType(nameOrList)}`
                );
              }
              if (body.length !== 1) {
                throw new EvaluationError(
                  `Define expects exactly one value, received ${body.length}`
                );
              }
              const evaluatedValue = await evaluate(env, body[0]);
              env.define(nameOrList, evaluatedValue);
              return null;
            }

            // Function definition form: (define (name params...) body...)
            const fnName = nameOrList.elements[0];
            const params = nameOrList.elements.slice(1);

            if (!isString(fnName)) {
              throw new EvaluationError(
                `Function name must be a symbol, received ${getLispType(fnName)}`
              );
            }

            const { hasRest, parameters, restParam } = checkRestParams(params);

            // log.debug('[define] params', params);
            // log.debug('[define] hasRest', hasRest);
            // log.debug('[define] parameters', parameters);
            // log.debug('[define] restParam', restParam);

            // Create lambda expression
            const lambda: LispFunction = {
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
          }

          case 'apply': {
            // log.debug('[apply] args', args);
            // log.debug('[apply] bindings', env.bindings);
            if (args.length < 2) {
              throw new EvaluationError(
                'apply requires at least two arguments'
              );
            }
            const fn = await evaluate(env, args[0]);
            const lastArg = await evaluate(env, args.at(-1) ?? null);

            const evaluatedArgs = await Promise.all(
              args
                .slice(1, args.length - 1)
                .map(async arg => await evaluate(env, arg))
            );

            if (!isList(lastArg)) {
              throw new EvaluationError(
                `last argument to apply must be a list, received ${getLispType(lastArg)}`
              );
            }

            const allArgs = [...evaluatedArgs, ...lastArg.elements];

            if (typeof fn === 'function') {
              return fn(...allArgs);
            } else if (isLispFunction(fn)) {
              const newEnv = fn.env.create();

              // bind parameters
              for (let ii = 0; ii < fn.params.length; ii++) {
                newEnv.define(fn.params[ii], allArgs[ii]);
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
                `First argument to apply must be a function, not ${getLispType(fn)} (${JSON.stringify(fn)})`
              );
            }
          }

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
                ...(isList(evaluatedCdr)
                  ? evaluatedCdr.elements
                  : [evaluatedCdr])
              ],
              type: 'list'
            };

          case 'car':
            const list = await evaluate(env, args[0]);
            if (!isList(list) || list.elements.length === 0) {
              throw new EvaluationError(
                'car: argument must be a non-empty list'
              );
            }
            return list.elements[0];

          case 'cdr':
            const lst = await evaluate(env, args[0]);
            if (!isList(lst) || lst.elements.length === 0) {
              throw new EvaluationError(
                'cdr: argument must be a non-empty list'
              );
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
            return isList(val) && val.elements.length === 0;

          case 'lambda':
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

          // begin is a special form used to execute a sequence of expressions in order,
          // returning the value of the last expression. It's primarily used to group
          // multiple expressions together where only one expression is expected.
          case 'begin': {
            let result: LispExpr | null = null;
            // console.debug('[begin] expr', args);
            for (const expr of args) {
              result = await evaluate(env, expr);
            }
            return result;
          }

          // let is a special form used to create local bindings. It introduces a new scope
          // where you can define variables that are only accessible within that scope
          case 'let': {
            const bindings = args[0] as LispList;
            const body = args.slice(1);
            const newEnv = env.create();

            for (const binding of bindings.elements) {
              if (!isList(binding)) {
                continue;
              }
              const [name, value] = binding.elements;
              if (isString(name)) {
                const evaluatedValue = await evaluate(newEnv, value);
                newEnv.define(name, evaluatedValue);
              }
            }
            let result: LispExpr | null = null;
            for (const expr of body) {
              result = await evaluate(newEnv, expr);
            }
            return result;
          }

          default:
            // For non-special forms, evaluate the operator and apply it
            const fn = env.lookup(operator);

            if (typeof fn === 'function') {
              // Handle built-in functions
              // console.debug('[operator] args', args);
              const evaluatedArgs = await Promise.all(
                args.map(async arg => await evaluate(env, arg))
              );
              return fn(...evaluatedArgs);
            } else if (isLispFunction(fn)) {
              // Handle lambda function application
              const newEnv = fn.env.create();

              // bind regular parameters
              const evaluatedArgs = args;
              // const evaluatedArgs = await Promise.all(
              //   args.map(async arg => await evaluate(env, arg))
              // );
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
            } else {
              throw new EvaluationError(
                `Cannot apply ${JSON.stringify(fn)} as a function`
              );
            }
        }
      } else {
        // If the operator is not a string, evaluate it and apply it
        const fn = await evaluate(env, operator);

        if (isLispBasicValue(fn)) {
          return fn;
        }

        // log.debug('[operator] evaluating operator', operator, 'result', null);
        if (isLispFunction(fn)) {
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
    }
  }

  throw new EvaluationError(
    `Cannot evaluate expression: ${JSON.stringify(expr)}`
  );
};
