import { isFilthString } from '../helpers';
import { FilthExpr, FilthRegex } from '../types';

export const createFilthRegex = (regex: RegExp | string): FilthRegex => ({
  // eslint-disable-next-line @nkzw/no-instanceof
  regex: regex instanceof RegExp ? regex : new RegExp(regex),
  type: 'regex'
});

export const doesFilthRegexMatch = (
  regex: FilthRegex,
  value: FilthExpr
): boolean => {
  if (isFilthString(value)) {
    return regex.regex.test(value);
  }
  return false;
};
