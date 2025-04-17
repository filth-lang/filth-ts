import { ParseError } from '@filth/error';
import { FilthExpr } from '@filth/types';
import { createLog } from '@helpers/log';

import { parse as peggyParse, PeggySyntaxError } from './parser';

const log = createLog('filth/parse');

// Wrapper around the Peggy parser that maintains the same interface
export const parse = (input: string): FilthExpr => {
  try {
    return peggyParse(input) as FilthExpr;
  } catch (error) {
    if (error instanceof PeggySyntaxError) {
      const { expected, location, message } = error;

      log.debug('location', location);
      log.debug('expected', expected);

      throw new ParseError(error.message);
    }
    throw error;
  }
};
