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

export const matchRegex = (regex: RegExp, str: string): string[] | null => {
  if (regex.global) {
    const matches = str.matchAll(regex);
    return Array.from(matches).map(match => match[0]);
  }

  const match = str.match(regex);
  return match ? [match[0]] : null;
};

export const matchRegexWithNamedGroups = (
  regex: RegExp,
  str: string
): Record<string, string> | null => {
  if (!regex.global) {
    const match = str.match(regex);
    if (!match) {
      return null;
    }
    return match.groups ?? null;
  }

  const match = str.match(regex);
  if (!match) {
    return null;
  }

  const result: Record<string, string> = {};

  for (let ii = 0; ii < match.length; ii++) {
    const name = regex.lastIndex;
    const value = match[ii];
    result[name] = value;
  }

  return result;
};
