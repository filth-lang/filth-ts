import { EvaluationError, UndefinedSymbolError } from '@filth/error';
import {
  addQuotes,
  isFilthFunction,
  isFilthQuotedString,
  isFilthRange,
  isFilthRegex,
  isFilthString
} from '@filth/helpers';
import { FilthExpr } from '@filth/types';
import { createLog } from '@helpers/log';

import { isFilthRangeIn } from '../fns/range';
import { matchRegexWithNamedGroups } from '../fns/regex';

const log = createLog('environment');

export type DefineOptions = {
  allowOverride?: boolean;
  skipEvaluateArgs?: boolean;
};

export type LookupResult = {
  options: DefineOptions;
  value: FilthExpr;
};

export type BindingList = BindingValue[];

export type BindingValue = {
  options: DefineOptions;
  value: FilthExpr;
};

export class Environment {
  private bindings: Map<string, BindingList> = new Map();
  private parent: Environment | null;

  constructor(parent: Environment | null = null) {
    this.parent = parent;
  }

  define(name: string, value: FilthExpr, options: DefineOptions = {}): void {
    const existing = this.bindings.get(name) ?? [];
    // if (existing && existing.options.allowOverride === false) {
    //   throw new EvaluationError(`Cannot override existing symbol: ${name}`);
    // }

    // TODO: check for existing binding
    // if (isFilthFunction(existing)) {

    // }

    const newBindingList: BindingList = [
      ...existing,
      {
        options,
        value
      }
    ];

    this.bindings.set(name, newBindingList);
  }

  getBindings(): Map<string, BindingList> {
    const parentBindings = this.parent?.getBindings();
    if (parentBindings) {
      return new Map([...parentBindings, ...this.bindings]);
    }
    return this.bindings;
  }

  lookup(name: string, args?: FilthExpr[]): LookupResult {
    const list = this.bindings.get(name);

    const binding = findBinding(list, args);
    if (binding) {
      // log.debug('[lookup] found binding', binding);
      return binding;
    }

    if (list && list.length > 0) {
      const value = list.at(-1);
      if (value) {
        return value;
      }
    }

    // if (value !== undefined) {
    //   return value;
    // }
    if (this.parent) {
      return this.parent.lookup(name);
    }

    // console.debug('[lookup] bindings', this.bindings);
    throw new UndefinedSymbolError(name);
    // log.debug('[lookup] undefined symbol', name);
  }

  create(): Environment {
    return new Environment(this);
  }
}

export const findBinding = (
  bindings: BindingList | undefined,
  args: FilthExpr[] | undefined
) => {
  if (!bindings || !args) {
    return null;
  }
  // log.debug('[findBinding]', args);

  for (const binding of bindings) {
    if (isFilthFunction(binding.value)) {
      const result = matchExprs(binding.value.params, args);
      // log.debug('[findBinding] comparing', binding.value.params, args, result);
      if (result) {
        return binding;
      }
    }
  }
};

export const matchExprs = (
  params: FilthExpr[],
  args: FilthExpr[]
): Record<string, FilthExpr | FilthExpr[]> | false => {
  const hasRest = params.includes('...');
  if (!hasRest && params.length !== args.length) {
    // log.debug('[matchExprs] params and args length mismatch', params, args);
    return false;
  }

  const result: Record<string, FilthExpr> = {};

  for (let ii = 0; ii < params.length; ii++) {
    const param = params[ii];

    if (param === '...') {
      // log.debug('[matchExprs] param is .', params, args);

      const rest: FilthExpr[] = [];
      const restParam = params[ii + 1];
      if (!restParam) {
        throw new EvaluationError('Expected rest parameter after ...');
      }

      const restArgs = args.slice(ii);
      const restMap: Record<string, FilthExpr> = {};
      for (const arg of restArgs) {
        // log.debug('[matchExprs] rest arg', restParam, arg);
        if (matchParam(restMap, restParam, arg, true)) {
          rest.push(arg);
        }
        // log.debug('[matchExprs] rest map', restMap);
      }

      const restKey = typeof restParam === 'string' ? restParam : ':tail';

      if (Object.keys(restMap).length > 0) {
        return {
          ...result,
          ...restMap
        };
      }
      return {
        ...result,
        [restKey]: rest
      };
    }

    if (!matchParam(result, params[ii], args[ii])) {
      return false;
    }
  }

  // log.debug('[matchExprs] no match', params, args);
  return result;
};

export const matchParam = (
  result: Record<string, FilthExpr | FilthExpr[]>,
  param: FilthExpr,
  arg: FilthExpr,
  dontAddToResult: boolean = false
) => {
  if (isFilthQuotedString(param)) {
    return param === arg;
  }
  if (isFilthRange(param)) {
    return isFilthRangeIn(param, arg);

    // return param.start <= arg && arg <= param.end;
  }
  if (isFilthRegex(param) && isFilthString(arg)) {
    if (!param.hasNamedGroups) {
      if (param.regex.test(arg)) {
        return true;
      }
    } else {
      const matches = matchRegexWithNamedGroups(param.regex, arg);
      if (matches) {
        for (const [name, value] of Object.entries(matches)) {
          let existing: FilthExpr | FilthExpr[] | undefined = result[name];
          if (existing) {
            if (!Array.isArray(existing)) {
              existing = [existing];
            }
            result[name] = [...existing, addQuotes(value)];
          } else {
            result[name] = addQuotes(value);
          }
        }

        return true;
      }
    }
  }

  if (typeof param === 'string') {
    if (!dontAddToResult) {
      result[param] = arg;
    }
    return true;
  }

  if (typeof param === typeof arg && param === arg) {
    // result[param] = arg;
    return true;
  }

  return false;
};
