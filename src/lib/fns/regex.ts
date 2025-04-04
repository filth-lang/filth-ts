import { isFilthString } from '@filth/helpers';
import { FilthExpr, FilthRegex } from '@filth/types';

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

export const extractCaptureGroupNames = (regex: FilthRegex): string[] => {
  if (!regex.hasNamedGroups) {
    return [];
  }

  const captureGroupRegex = /\(\?<([A-Za-z][\dA-Za-z]*)>/g;
  const names: string[] = [];
  let match;

  while ((match = captureGroupRegex.exec(regex.regex.toString())) !== null) {
    names.push(match[1]);
  }

  return names;
};
