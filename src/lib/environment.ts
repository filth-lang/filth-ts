import { EvaluationError, UndefinedSymbolError } from './error';
import { LispExpr } from './types';

export type DefineOptions = {
  allowOverride?: boolean;
  skipEvaluateArgs?: boolean;
};

export type LookupResult = {
  options: DefineOptions;
  value: LispExpr;
};

export type BindingValue = {
  options: DefineOptions;
  value: LispExpr;
};

export class Environment {
  private bindings: Map<string, BindingValue> = new Map();
  private parent: Environment | null;

  constructor(parent: Environment | null = null) {
    this.parent = parent;
  }

  define(name: string, value: LispExpr, options: DefineOptions = {}): void {
    const existing = this.bindings.get(name);
    if (existing && existing.options.allowOverride === false) {
      throw new EvaluationError(`Cannot override existing symbol: ${name}`);
    }

    this.bindings.set(name, {
      options,
      value
    });
  }

  lookup(name: string): LookupResult {
    const value = this.bindings.get(name);
    if (value !== undefined) {
      return value;
    }
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
