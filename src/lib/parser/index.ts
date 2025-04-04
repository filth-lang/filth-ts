import { ParseError } from '@filth/error';
import { isFilthList } from '@filth/helpers';
import { FilthExpr } from '@filth/types';
// import { createLog } from '@helpers/log';
import { parse as peggyParse } from './parser';

// const log = createLog('filth/parse');

// Wrapper around the Peggy parser that maintains the same interface
export const parse = (input: string): FilthExpr => peggyParse(input);

export const parseLambdaParams = (params: FilthExpr): string[] => {
  if (!isFilthList(params)) {
    throw new ParseError('Lambda parameters must be a list');
  }

  return params.elements.map(param => {
    if (typeof param !== 'string') {
      throw new ParseError('Lambda parameters must be symbols');
    }
    return param;
  });
};
