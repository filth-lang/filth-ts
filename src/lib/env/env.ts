import { UndefinedSymbolError } from '@filth/error';
import {
  isFilthFunction,
  isFilthQuotedString,
  isFilthRegex,
  isFilthString
} from '@filth/helpers';
import { FilthExpr } from '@filth/types';
import { createLog } from '@helpers/log';

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
      const result = compareParams(binding.value.params, args);
      // log.debug('[findBinding] comparing', binding.value.params, args, result);
      if (result) {
        return binding;
      }
    }
  }
};

export const compareParams = (params: FilthExpr[], args: FilthExpr[]) => {
  if (params.length !== args.length) {
    // log.debug('[compareParams] params and args length mismatch', params, args);
    return false;
  }
  for (let ii = 0; ii < params.length; ii++) {
    if (!compareParam(params[ii], args[ii])) {
      return false;
    }
  }

  // log.debug('[compareParams] no match', params, args);
  return true;
};

export const compareParam = (param: FilthExpr, arg: FilthExpr) => {
  if (isFilthQuotedString(param)) {
    return param === arg;
  }
  if (isFilthRegex(param) && isFilthString(arg)) {
    // log.debug('[compareParam] regex', param, arg, param.regex.test(arg));
    if (param.regex.test(arg)) {
      return true;
    }
  }
  if (typeof param === typeof arg && param === arg) {
    return true;
  }

  if (typeof param === 'string') {
    return true;
  }

  return false;
};
