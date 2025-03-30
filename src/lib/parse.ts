import { createLog } from '@helpers/log';
import { ParseError } from './error';
import { isFilthList } from './helpers';
import { parse as peggyParse } from './parser';
import { FilthExpr } from './types';

const log = createLog('filth/parse');

// Wrapper around the Peggy parser that maintains the same interface
export const parse = (input: string): FilthExpr => {
  // try {
  const result = peggyParse(input, {});
  // log.debug('[parse] result', result);
  return result;
  // } catch (error: unknown) {
  //   if (error instanceof Error) {
  //     throw new ParseError(error.message);
  //   }
  //   throw new ParseError('Unknown parsing error');
  // }
};

// const isWhitespace = (token: string): boolean => token.trim() === '';

// const parseTokens = (tokens: string[]): FilthExpr => {
//   if (tokens.length === 0) {
//     throw new ParseError('Unexpected EOF');
//   }

//   // log.debug('[parseTokens] tokens', tokens);

//   const token = tokens.shift()!;

//   if (isWhitespace(token)) {
//     return parseTokens(tokens);
//   }

//   if (token === "'") {
//     return {
//       expr: parseTokens(tokens),
//       type: 'quoted'
//     };
//   }

//   if (token === '(') {
//     const elements: FilthExpr[] = [];
//     while (tokens[0] !== ')') {
//       if (tokens.length === 0) {
//         throw new ParseError('Missing closing parenthesis');
//       }
//       elements.push(parseTokens(tokens));
//     }
//     tokens.shift(); // Remove closing parenthesis
//     return { elements, type: 'list' };
//   }

//   if (token === ')') {
//     throw new ParseError('Unexpected )');
//   }

//   if (token === 'nil' || token === 'null') {
//     return null;
//   }

//   return parseAtom(token);
// };

// export const parseAtom = (
//   token: string
// ): number | string | boolean | FilthRange => {
//   // Handle ranges
//   if (token.includes('..')) {
//     const parts = token.split('..');
//     const elements: number[] = [];

//     // Parse the first part
//     const firstNum = Number(parts[0]);
//     if (Number.isNaN(firstNum)) {
//       throw new ParseError(`Invalid range start: ${parts[0]}`);
//     }
//     elements.push(firstNum);

//     // Check if there's a step value (using //)
//     const lastPart = parts.at(-1);
//     if (lastPart && lastPart.includes('//')) {
//       const [end, step] = lastPart.split('//');
//       const endNum = Number(end);
//       const stepNum = Number(step);

//       if (Number.isNaN(endNum) || Number.isNaN(stepNum)) {
//         throw new ParseError(`Invalid range end or step: ${lastPart}`);
//       }

//       elements.push(endNum);
//       return {
//         elements,
//         step: stepNum,
//         type: 'range'
//       };
//     }

//     // Handle multiple step points
//     for (let i = 1; i < parts.length; i++) {
//       const num = Number(parts[i]);
//       if (Number.isNaN(num)) {
//         throw new ParseError(`Invalid range element: ${parts[i]}`);
//       }
//       elements.push(num);
//     }

//     return {
//       elements,
//       type: 'range'
//     };
//   }

//   // Handle quoted strings
//   if (token.startsWith('"') && token.endsWith('"')) {
//     return token;
//   }

//   if (token === 'true') {
//     return true;
//   }

//   if (token === 'false') {
//     return false;
//   }

//   const num = Number(token);
//   return Number.isNaN(num) ? token : num;
// };

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
