import { Environment } from './environment';

// Base types
export type FilthBasicValue = number | boolean | null;
export type FilthValue = number | string | boolean | null;

// List types
export type FilthList = {
  elements: FilthExpr[];
  type: 'list';
};

export type FilthRange = {
  elements: number[];
  step?: number;
  type: 'range';
};

export type FilthRegex = {
  hasNamedGroups?: boolean;
  regex: RegExp;
  type: 'regex';
};

export type FilthJSON = {
  json: JSON;
  type: 'json';
};

export type FilthNil = {
  type: 'nil';
};

// Quote type
export type FilthQuotedExpr = {
  expr: FilthExpr;
  type: 'quoted';
};

// Function types
export type FilthBuiltinFunction = (
  ...args: FilthExpr[]
) => FilthExpr | Promise<FilthExpr>;

// lambda
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
  | FilthRange
  | FilthRegex
  | FilthJSON
  | FilthNil
  | FilthQuotedExpr
  | FilthFunction;
