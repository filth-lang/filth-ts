import { createLog } from '@helpers/log';
import { ParseError } from './error';
import { isList } from './helpers';
import { LispExpr } from './types';

const log = createLog('filth/parse');

// Enhanced parser with quote support
export function parse(input: string): LispExpr {
  // First, protect spaces within quoted strings
  const tokens: string[] = [];
  let currentToken = '';
  let inQuotes = false;
  let inComment = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (inQuotes) {
      currentToken += char;
      if (char === '"') {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (inComment) {
      if (char === '\n') {
        inComment = false;
      }
      continue;
    }

    if (char === ';') {
      inComment = true;
      continue;
    }

    if (char === '\n') {
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      currentToken += char;
    } else if (char === ' ') {
      if (currentToken) {
        tokens.push(currentToken);
        currentToken = '';
      }
    } else if (char === '(') {
      if (currentToken) {
        tokens.push(currentToken);
        currentToken = '';
      }
      tokens.push('(');
    } else if (char === ')') {
      if (currentToken) {
        tokens.push(currentToken);
        currentToken = '';
      }
      tokens.push(')');
    } else {
      currentToken += char;
    }
  }

  if (currentToken) {
    tokens.push(currentToken);
  }

  // Handle multiple top-level expressions
  const expressions: LispExpr[] = [];
  while (tokens.length > 0) {
    expressions.push(parseTokens(tokens));
  }

  // If there's only one expression, return it directly
  if (expressions.length === 1) {
    return expressions[0];
  }

  // log.debug('[parse] expressions', expressions);
  // Otherwise, wrap all expressions in a list
  return {
    elements: expressions,
    type: 'list'
  };
}

const isWhitespace = (token: string): boolean => {
  return token.trim() === '';
};

const parseTokens = (tokens: string[]): LispExpr => {
  if (tokens.length === 0) {
    throw new ParseError('Unexpected EOF');
  }

  const token = tokens.shift()!;

  if (isWhitespace(token)) {
    return parseTokens(tokens);
  }

  if (token === "'") {
    return {
      type: 'quoted',
      value: parseTokens(tokens)
    };
  }

  if (token === '(') {
    const elements: LispExpr[] = [];
    while (tokens[0] !== ')') {
      if (tokens.length === 0) {
        throw new ParseError('Missing closing parenthesis');
      }
      elements.push(parseTokens(tokens));
    }
    tokens.shift(); // Remove closing parenthesis
    return { elements, type: 'list' };
  }

  if (token === ')') {
    throw new ParseError('Unexpected )');
  }

  if (token === 'nil' || token === 'null') {
    return null;
  }

  return parseAtom(token);
};

export const parseAtom = (token: string): number | string | boolean => {
  if (token.startsWith('"') && token.endsWith('"')) {
    return token.slice(1, -1);
  }

  if (token === 'true') {
    return true;
  }

  if (token === 'false') {
    return false;
  }

  const num = Number(token);
  return Number.isNaN(num) ? token : num;
};

export const parseLambdaParams = (params: LispExpr): string[] => {
  if (!isList(params)) {
    throw new ParseError('Lambda parameters must be a list');
  }

  return params.elements.map(param => {
    if (typeof param !== 'string') {
      throw new ParseError('Lambda parameters must be symbols');
    }
    return param;
  });
};
