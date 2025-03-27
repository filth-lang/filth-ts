import { describe, expect, it } from 'bun:test';
import { parse } from '../parse';

describe('Filth', () => {
  describe('Parser', () => {
    it('should parse atoms', () => {
      expect(parse('123')).toBe(123);
      expect(parse('-10')).toBe(-10);
      expect(parse('+10')).toBe(10);
      expect(parse('15.234')).toBe(15.234);
      expect(parse('abc')).toBe('abc');
      expect(parse('nil')).toBe(null);
      expect(parse('true')).toBe(true);
      expect(parse('false')).toBe(false);
      expect(parse('"Hello, world!"')).toBe('"Hello, world!"');
    });

    it('should parse multi-line strings', () => {
      expect(parse('"Hello,\nworld!"')).toBe('"Hello, world!"');
    });

    it('should parse lists', () => {
      expect(parse('(1 2 3)')).toEqual({
        elements: [1, 2, 3],
        type: 'list'
      });
    });

    it('should parse lists with strings', () => {
      expect(parse('(1 hello 3)')).toEqual({
        elements: [1, 'hello', 3],
        type: 'list'
      });
    });

    it('should parse multi-line lists', () => {
      expect(parse('(1\n2\n3)')).toEqual({
        elements: [1, 2, 3],
        type: 'list'
      });
    });

    it('should parse quoted expressions', () => {
      expect(parse("'(1 2 3)")).toEqual({
        type: 'quoted',
        value: {
          elements: [1, 2, 3],
          type: 'list'
        }
      });
    });

    it('should parse nested structures', () => {
      expect(parse('(1 (2 3) 4)')).toEqual({
        elements: [1, { elements: [2, 3], type: 'list' }, 4],
        type: 'list'
      });
    });

    it('should parse multiple top level expressions', () => {
      const result = parse('(1 2 3) (4 5 6)');
      expect(result).toEqual({
        elements: [
          { elements: [1, 2, 3], type: 'list' },
          { elements: [4, 5, 6], type: 'list' }
        ],
        type: 'list'
      });
    });

    it('should handle comments', () => {
      const input = `
      ; This is a comment
      (1 2 3) ; also a comment
      `;
      const result = parse(input);
      expect(result).toEqual({
        elements: [1, 2, 3],
        type: 'list'
      });
    });
  });
});
