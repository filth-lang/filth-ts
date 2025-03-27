import { describe, expect, it } from 'bun:test';
import { createEnv } from '../create';
import { Environment } from '../environment';

describe('Lisp Interpreter', () => {
  describe('Environment', () => {
    it('should define and lookup variables', () => {
      const env = new Environment();
      env.define('x', 42);
      expect(env.lookup('x')).toBe(42);
    });

    it('should handle nested environments', () => {
      const parent = new Environment();
      parent.define('x', 42);
      const child = new Environment(parent);
      expect(child.lookup('x')).toBe(42);
    });

    it('should throw on undefined variables', () => {
      const env = new Environment();
      expect(() => env.lookup('x')).toThrow('Undefined symbol: x');
    });
  });

  describe('Evaluator', () => {
    const env = createEnv();

    it('should evaluate basic arithmetic', async () => {
      expect(await env.eval('(+ 1 2 3)')).toBe(6);
      expect(await env.eval('(- 10 3 2)')).toBe(5);
      expect(await env.eval('(* 2 3 4)')).toBe(24);
      expect(await env.eval('(/ 24 2 3)')).toBe(4);
    });

    it('should evaluate list operations', async () => {
      expect(await env.eval("(car '(1 2 3))")).toBe(1);
      expect(await env.eval("(cdr '(1 2 3))")).toEqual({
        elements: [2, 3],
        type: 'list'
      });
      expect(await env.eval("(cons 1 '(2 3))")).toEqual({
        elements: [1, 2, 3],
        type: 'list'
      });
    });

    it('should evaluate conditional expressions', async () => {
      expect(await env.eval('(if true 1 2)')).toBe(1);
      expect(await env.eval('(if false 1 2)')).toBe(2);
    });

    it('should evaluate variable definitions', async () => {
      const testEnv = createEnv();
      await testEnv.eval('(define x 42)');
      const result = await testEnv.eval('x');
      expect(result).toBe(42);
    });

    it('should evaluate lambda expressions', async () => {
      const testEnv = createEnv();
      await testEnv.eval('(define double (lambda (x) (* x 2)))');
      expect(await testEnv.eval('(double 21)')).toBe(42);
    });

    it('should evaluate list predicates', async () => {
      expect(await env.eval("(list? '(1 2 3))")).toBe(true);
      expect(await env.eval("(null? '())")).toBe(true);
      expect(await env.eval("(null? '(1 2 3))")).toBe(false);
    });

    it('should evaluate equality checks', async () => {
      expect(await env.eval("(equal? '(1 2 3) '(1 2 3))")).toBe(true);
      expect(await env.eval("(equal? '(1 2) '(1 2 3))")).toBe(false);
    });

    it('should handle async functions', async () => {
      const start = Date.now();
      await env.eval('(wait 100)');
      const end = Date.now();
      expect(end - start).toBeGreaterThanOrEqual(100);
    });

    it('should handle rest parameters in define', async () => {
      const input = `
      ; Function that takes rest parameters
      (define (sum first . rest)
        (if (null? rest)
            first
            (+ first (apply sum rest))))

      ; Sum numbers
      (sum 1 2 3 4 5)
      `;
      const result = await env.eval(input);
      expect(result).toBe(15);
    });

    it('should handle rest apply', async () => {
      const input = `
      (define (sum x y z)
        (+ x y z))
      (apply sum '(1 2 3))
      `;
      expect(await env.eval(input)).toBe(6);

      // dont support common lisp syntax
      expect(async () => {
        await env.eval(`(apply 'sum 1 2 '(3))`);
      }).toThrowError(
        `First argument to apply must be a function, not string ("'sum")`
      );
    });
  });

  describe('begin', () => {
    it('should handle begin expressions', async () => {
      const env = createEnv();
      expect(
        await env.eval(`
        (begin 
          (+ 1 2) 
          (* 3 4) 
          (- 10 5))
      `)
      ).toBe(5);
    });

    it('should handle define with function with parameters', async () => {
      const env = createEnv();
      const result = await env.eval(`
        (define (print-and-square x)
          (begin
            (log "Calculating square...")
            (* x x)))

        (print-and-square 5)
      `);
      expect(result).toBe(25);
    });
  });

  describe('Promises', () => {
    it('should handle promises', async () => {
      const env = createEnv();
      await env.eval(
        `(define 
          wait-and-log 
          (lambda () 
            (wait 100) 
            (log "Hello, world!")))`
      );
      await env.eval('(wait-and-log)');
    });

    it('should handle begin expressions', async () => {
      const env = createEnv();
      // begin should execute expressions in sequence and return the last value
      expect(
        await env.eval(`
        (begin 
          (+ 1 2) 
          (* 3 4) 
          (- 10 5))`)
      ).toBe(5);

      // begin with a single expression should return that expression's value
      expect(
        await env.eval(`
        (begin 
          (* 2 3))`)
      ).toBe(6);

      // empty begin should return null
      expect(await env.eval('(begin)')).toBe(null);

      // begin should handle side effects
      await env.eval(`
        (begin 
          (define x 10) 
          (define y 20))`);
      expect(await env.eval('(+ x y)')).toBe(30);
    });

    it('should handle let expressions', async () => {
      const env = createEnv();
      // // basic let binding
      expect(
        await env.eval(`
        (let 
          ((x 5) 
            (y 3)) 
          (+ x y))`)
      ).toBe(8);

      // // let with multiple expressions in body
      expect(
        await env.eval(`
        (let 
          ((x 10)) 
          (let 
            ((y 20)) 
            (+ x y)))`)
      ).toBe(30);

      // // nested let expressions
      expect(
        await env.eval(`
        (let 
          ((x 5)) 
          (let 
            ((y (* x 2))) 
            (+ x y)))`)
      ).toBe(15);

      // // let should create a new scope
      await env.eval('(define x 100)');
      expect(await env.eval('(let ((x 5)) (+ x x))')).toBe(10);
      expect(await env.eval('x')).toBe(100); // outer x should remain unchanged
    });

    it('should handle async operations in sequence', async () => {
      const env = createEnv();
      const start = Date.now();

      // Test sequential waits using begin
      await env.eval('(begin (wait 50) (wait 50))');
      const end = Date.now();
      expect(end - start).toBeGreaterThanOrEqual(100);

      // Test wait inside let
      const startLet = Date.now();
      await env.eval('(let ((delay 50)) (wait delay))');
      const endLet = Date.now();
      expect(endLet - startLet).toBeGreaterThanOrEqual(50);

      // Test multiple sequential waits
      const startMulti = Date.now();
      await env.eval(`
        (begin
          (wait 25)
          (wait 25)
          (wait 25)
          (wait 25)
        )
      `);
      const endMulti = Date.now();
      expect(endMulti - startMulti).toBeGreaterThanOrEqual(100);
    });
  });
});
