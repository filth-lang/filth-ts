import { isFilthList, isFilthNumber, isFilthRange } from '@filth/helpers';
import { FilthExpr, FilthRange } from '@filth/types';

export const createFilthRange = (
  start: number,
  end: number,
  step: number = 1
): FilthRange => ({
  elements: [start, end],
  step,
  type: 'range'
});

export const isFilthRangeEqual = (a: FilthExpr, b: FilthExpr): boolean => {
  if (!isFilthRange(a) || !isFilthRange(b)) {
    return false;
  }
  return (
    a.elements.length === b.elements.length &&
    a.elements.every((element, index) => element === b.elements[index]) &&
    a.step === b.step
  );
};

export const isFilthRangeIn = (a: FilthExpr, b: FilthExpr): boolean => {
  if (!isFilthRange(a)) {
    return false;
  }
  const [minA, maxA] = getRangeMinMax(a);

  if (isFilthRange(b)) {
    const [minB, maxB] = getRangeMinMax(b);
    return minA <= maxB && maxA >= minB;
  }
  if (isFilthList(b)) {
    return b.elements.every(
      item => isFilthNumber(item) && item >= minA && item <= maxA
    );
  }
  if (isFilthNumber(b)) {
    return b >= minA && b <= maxA;
  }
  return false;
};

const getRangeMinMax = (range: FilthRange): [number, number] =>
  range.elements.reduce(
    ([min, max], curr) => [Math.min(min, curr), Math.max(max, curr)],
    [Infinity, -Infinity]
  );
