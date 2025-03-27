import { Environment } from './environment';

// Base types
export type FilthBasicValue = number | boolean | null;
export type FilthValue = number | string | boolean | null;

// List types
export type FilthList = {
  elements: FilthExpr[];
  type: 'list';
};

export type FilthNil = {
  type: 'nil';
};

// Quote type
export type QuotedExpr = {
  type: 'quoted';
  value: FilthExpr;
};

// Function types
export type FilthBuiltinFunction = (
  ...args: FilthExpr[]
) => FilthExpr | Promise<FilthExpr>;

export type FilthFunction = {
  body: FilthExpr;
  env: Environment;
  params: string[];
  restParam?: string | null;
  type: 'function';
};

// Combined expression type
export type FilthExpr =
  | FilthValue
  | FilthBuiltinFunction
  | FilthList
  | FilthNil
  | QuotedExpr
  | FilthFunction;
