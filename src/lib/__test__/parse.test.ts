import { describe, expect, it, test } from 'bun:test';
import { parse } from '../parse';
import { FilthRange, FilthRegex } from '../types';
import { exprToJson } from './helpers';

describe('Filth', () => {
  describe('Parser', () => {
    describe('Atoms', () => {
      test.each([
        ['123', 123],
        ['-10', -10],
        ['+10', 10],
        ['15.234', 15.234],
        ['abc', 'abc'],
        ['nil', null],
        ['true', true],
        ['false', false],
        ['"Hello, world!"', '"Hello, world!"'],
        [`"Hello, \nworld!"`, '"Hello, world!"']
      ])(`should parse atom %s`, (input, expected) => {
        expect(parse(input)).toBe(expected);
      });
    });

    describe('Lists', () => {
      test.each([
        ['(1 2 3)', [1, 2, 3]],

        ['(1 "hello" 3)', [1, '"hello"', 3]],

        ['(1\n2\n3)', [1, 2, 3]],

        ['(1 (2 3) 4)', [1, [2, 3], 4]],

        [
          '(1 2 3 )  ( 4 5 6)',
          [
            [1, 2, 3],
            [4, 5, 6]
          ]
        ]
      ])('should parse list %s', (input, expected) => {
        expect(exprToJson(parse(input))).toEqual(expected as unknown as JSON);
      });
    });

    describe('Quoted', () => {
      it('should parse quoted expressions', () => {
        expect(parse("'(1 2 3)")).toEqual({
          expr: {
            elements: [1, 2, 3],
            type: 'list'
          },
          type: 'quoted'
        });
      });
    });

    describe('Comments', () => {
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

    describe('Ranges', () => {
      test.each([
        ['1..10', { elements: [1, 10], type: 'range' }],
        ['1..10..5', { elements: [1, 10, 5], type: 'range' }],
        ['1..10..5..2', { elements: [1, 10, 5, 2], type: 'range' }],
        ['1..10//2', { elements: [1, 10], step: 2, type: 'range' }],
        ['10..1//-2', { elements: [10, 1], step: -2, type: 'range' }],
        ['-10..-1//2', { elements: [-10, -1], step: 2, type: 'range' }]
      ])('should handle range %s', (input, expected) => {
        const result = parse(input);
        expect(result).toEqual(expected as FilthRange);
      });
    });

    describe('Regex', () => {
      test.each([
        ['/hello/', { regex: /hello/, type: 'regex' }],
        ['/hello/i', { regex: /hello/i, type: 'regex' }],
        [
          '/door:(?<state>open|closed|locked)/',
          { regex: /door:(?<state>open|closed|locked)/, type: 'regex' }
        ]
      ])('should handle regex %s', (input, expected) => {
        expect(parse(input)).toEqual(expected as FilthRegex);
      });
    });
  });
});
