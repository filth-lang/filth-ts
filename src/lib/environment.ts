import { EvaluationError, UndefinedSymbolError } from './error';
import { FilthExpr } from './types';

export type DefineOptions = {
  allowOverride?: boolean;
  skipEvaluateArgs?: boolean;
};

export type LookupResult = {
  options: DefineOptions;
  value: FilthExpr;
};

export type BindingValue = {
  options: DefineOptions;
  value: FilthExpr;
};

export class Environment {
  private bindings: Map<string, BindingValue> = new Map();
  private parent: Environment | null;

  constructor(parent: Environment | null = null) {
    this.parent = parent;
  }

  define(name: string, value: FilthExpr, options: DefineOptions = {}): void {
    const existing = this.bindings.get(name);
    if (existing && existing.options.allowOverride === false) {
      throw new EvaluationError(`Cannot override existing symbol: ${name}`);
    }

    this.bindings.set(name, {
      options,
      value
    });
  }

  getBindings(): Map<string, BindingValue> {
    const parentBindings = this.parent?.getBindings();
    if (parentBindings) {
      return new Map([...parentBindings, ...this.bindings]);
    }
    return this.bindings;
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
