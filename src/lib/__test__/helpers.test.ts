import { describe, expect, it } from 'bun:test';
import { isFilthExpr } from '../helpers';

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
