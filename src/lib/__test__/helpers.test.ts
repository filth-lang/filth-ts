import { isFilthExpr } from '@filth/helpers';
import { describe, expect, it } from 'vitest';

describe('Filth', () => {
  describe('helpers', () => {
    describe('isFilthExpr', () => {
      it('should return true for a list', () => {
        const expr = { elements: [], type: 'list' };
        expect(isFilthExpr(expr)).toBe(true);
      });
    });
  });
});
