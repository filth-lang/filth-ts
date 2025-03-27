# Filth

Filth is a Lisp-like language implementation in TypeScript. It provides a simple and extensible environment for evaluating Lisp-like expressions.

## Installation

```bash
npm install filth
```

## Usage

```typescript
import { createEnv, evaluate, parse } from 'filth';

// Create a new evaluation environment
const env = createEnv();

// Evaluate expressions
const result = await env.eval('(+ 1 2 3)'); // 6
const parsed = parse('(+ 1 2)'); // Parse without evaluating
const evaluated = evaluate(env, parsed); // Evaluate parsed expression
```

## API

### `createEnv()`
Creates a new evaluation environment with built-in functions and operators.

### `evaluate(env, expr)`
Evaluates a parsed expression in the given environment.

### `parse(expr)`
Parses a string expression into an AST.

## Built-in Functions

- Arithmetic: `+`, `-`, `*`, `/`
- List operations: `list?`, `nil?`, `len`
- Comparison: `equal?`
- Logging: `log`
- Async: `wait`

## License

MIT

