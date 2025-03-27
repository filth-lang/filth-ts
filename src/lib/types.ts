import { Environment } from './environment';

// Base types
export type LispBasicValue = number | boolean | null;
export type LispValue = number | string | boolean | null;

// List types
export type LispList = {
  elements: LispExpr[];
  type: 'list';
};

// Quote type
export type QuotedExpr = {
  type: 'quoted';
  value: LispExpr;
};

// Function types
export type LispBuiltinFunction = (
  ...args: LispExpr[]
) => LispExpr | Promise<LispExpr>;

export type LispFunction = {
  body: LispExpr;
  env: Environment;
  params: string[];
  restParam?: string | null;
  type: 'function';
};

// Combined expression type
export type LispExpr =
  | LispValue
  | LispBuiltinFunction
  | LispList
  | QuotedExpr
  | LispFunction;
