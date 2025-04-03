import { createLog } from '@helpers/log';
import { UndefinedSymbolError } from './error';
import { isFilthFunction } from './helpers';
import { FilthExpr } from './types';

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

// export const lookupBinding = (
//   bindings: Map<string, BindingList>,
//   name: string,
//   args: FilthExpr[]
// ) => {
//   const list = bindings.get(name);

//   const binding = findBinding(list, args);
//   if (binding) {
//     return binding;
//   }
// }

export const findBinding = (
  bindings: BindingList | undefined,
  args: FilthExpr[] | undefined
) => {
  // log.debug('[findBinding]', args);
  if (!bindings || !args) {
    return null;
  }

  for (const binding of bindings) {
    if (isFilthFunction(binding.value)) {
      if (compareParams(binding.value.params, args)) {
        return binding;
      }
    }
  }
};

const compareParams = (params: string[], args: FilthExpr[]) => {
  if (params.length !== args.length) {
    return false;
  }
  for (let ii = 0; ii < params.length; ii++) {
    if (params[ii] !== args[ii]) {
      return false;
    }
  }
  return true;
};
