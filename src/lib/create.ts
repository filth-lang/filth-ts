import { createLog } from '@helpers/log';
import { Environment } from './environment';
import { isList } from './helpers';
import { evaluate } from './index';
import { parse } from './parse';
import { LispExpr } from './types';

const log = createLog('filth');

export class EvalEnvironment extends Environment {
  constructor(parent: Environment | null = null) {
    super(parent);
  }

  create(): EvalEnvironment {
    return new EvalEnvironment(this);
  }

  async eval(expr: string): Promise<LispExpr> {
    const parsed = parse(expr);
    // log.debug('[eval] parsed', expr, parsed);

    return evaluate(this, parsed);
  }
}

export const createEnv = (): EvalEnvironment => {
  const env = new EvalEnvironment();

  // Boolean literals
  env.define('true', true);
  env.define('false', false);

  // placeholder, handling is in evaluate
  env.define('apply', null);

  // Basic arithmetic operations
  defineArithmetic(env);

  // List predicates
  defineListPredicates(env);

  // Promises
  definePromises(env);

  // Logging
  defineLogging(env);

  return env;
};

const defineLogging = (env: EvalEnvironment) => {
  env.define(
    'log',
    (...args: LispExpr[]) => {
      // eslint-disable-next-line no-console
      console.debug('[FILTH]', ...args);
      return null;
    },
    { skipEvaluateArgs: true }
  );
};

const definePromises = (env: EvalEnvironment) => {
  env.define(
    'wait',
    (ms: LispExpr) =>
      new Promise<LispExpr>(resolve =>
        setTimeout(() => resolve(null), ms as number)
      )
  );

  // env.define('sequence', async (...args: LispExpr[]) => {
  //   for (const arg of args) {
  //     await env.eval(arg);
  //   }
  // });
};

const defineArithmetic = (env: EvalEnvironment) => {
  env.define('+', (...args: LispExpr[]) =>
    args.reduce((a, b) => (a as number) + (b as number), 0)
  );
  env.define('-', (...args: LispExpr[]) => {
    if (args.length === 0) {
      return 0;
    }
    if (args.length === 1) {
      return -(args[0] as number);
    }
    return args.reduce((a, b) => (a as number) - (b as number));
  });
  env.define('*', (...args: LispExpr[]) =>
    args.reduce((a, b) => (a as number) * (b as number), 1)
  );
  env.define('/', (...args: LispExpr[]) => {
    if (args.length === 0) {
      return 1;
    }
    if (args.length === 1) {
      return 1 / (args[0] as number);
    }
    return args.reduce((a, b) => (a as number) / (b as number));
  });
};

const defineListPredicates = (env: EvalEnvironment) => {
  env.define('list?', (x: LispExpr) => isList(x));
  env.define(
    'equal?',
    (a: LispExpr, b: LispExpr) => JSON.stringify(a) === JSON.stringify(b)
  );
};
