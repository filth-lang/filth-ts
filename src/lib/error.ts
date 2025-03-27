export class FilthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FilthError';
  }
}

export class FilthArgumentError extends FilthError {
  constructor(message: string) {
    super(message);
    this.name = 'FilthArgumentError';
  }
}

export class ParseError extends FilthError {
  constructor(message: string) {
    super(message);
    this.name = 'ParseError';
  }
}

export class EvaluationError extends FilthError {
  constructor(message: string) {
    super(message);
    this.name = 'EvaluationError';
  }
}

export class TypeError extends FilthError {
  constructor(message: string) {
    super(message);
    this.name = 'TypeError';
  }
}

export class UndefinedSymbolError extends FilthError {
  constructor(symbol: string) {
    super(`Undefined symbol: ${symbol}`);
    this.name = 'UndefinedSymbolError';
  }
}

export class SyntaxError extends FilthError {
  constructor(message: string) {
    super(message);
    this.name = 'SyntaxError';
  }
}

export class LambdaError extends FilthError {
  constructor(message: string) {
    super(message);
    this.name = 'LambdaError';
  }
}
