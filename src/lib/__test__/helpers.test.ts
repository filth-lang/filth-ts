import { describe, expect, it } from 'bun:test';
import { isLispExpr } from '../helpers';

describe('Filth', () => {
  describe('helpers', () => {
    describe('isLispExpr', () => {
      it('should return true for a list', () => {
        const expr = { elements: [], type: 'list' };
        expect(isLispExpr(expr)).toBe(true);
      });
    });
  });
});
