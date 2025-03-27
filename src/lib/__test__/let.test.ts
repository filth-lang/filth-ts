import { describe, expect, it } from 'bun:test';
import { createEnv } from '../create';

describe('Filth', () => {
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
});
