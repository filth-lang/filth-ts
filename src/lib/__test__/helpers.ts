import { isFilthList } from '@lib/helpers';
import { FilthExpr, FilthList } from '@lib/types';

export const firstOrMany = <T>(array: T[]): T | T[] =>
  array.length === 1 ? array[0] : array;

export const exprToJson = (expr: FilthExpr): JSON => {
  if (isFilthList(expr)) {
    return listToJson(expr as FilthList);
  }
  return expr as unknown as JSON;
};

export const listToJson = (list: FilthList): JSON =>
  firstOrMany(list.elements.map(exprToJson)) as JSON;
