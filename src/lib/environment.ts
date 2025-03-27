import { UndefinedSymbolError } from './error';
import { LispExpr } from './types';

export class Environment {
  private bindings: Map<string, LispExpr> = new Map();
  private parent: Environment | null;

  constructor(parent: Environment | null = null) {
    this.parent = parent;
  }

  define(name: string, value: LispExpr): void {
    this.bindings.set(name, value);
  }

  lookup(name: string): LispExpr {
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
