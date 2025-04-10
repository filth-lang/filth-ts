import { Environment } from '@filth/env/env';
import { evaluate } from '@filth/eval/evaluate';
import {
  addQuotes,
  exprToString,
  isFilthList,
  isFilthNil,
  isFilthString,
  removeQuotes
} from '@filth/helpers';
import { parse } from '@filth/parser/index';
import { FilthExpr } from '@filth/types';
import { createLog } from '@helpers/log';

import { evalSelect } from '../eval/list/select';

const log = createLog('filth');

export class EvalEnvironment extends Environment {
  constructor(parent: Environment | null = null) {
    super(parent);
  }

  create(): EvalEnvironment {
    return new EvalEnvironment(this);
  }

  async eval(expr: string): Promise<FilthExpr> {
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

  // Conversions
  defineConversions(env);

  // Pointer functions
  definePointerFunctions(env);

  return env;
};

const definePointerFunctions = (env: EvalEnvironment) => {
  env.define('select', (...args: FilthExpr[]) => evalSelect(env, args), {
    skipEvaluateArgs: true
  });
};

const defineLogging = (env: EvalEnvironment) => {
  env.define(
    'log',
    (...args: FilthExpr[]) => {
      // eslint-disable-next-line no-console
      console.debug('[FILTH]', ...args);
      return null;
    },
    { skipEvaluateArgs: false }
  );
};

const definePromises = (env: EvalEnvironment) => {
  env.define(
    'wait',
    (ms: FilthExpr) =>
      new Promise<FilthExpr>(resolve =>
        setTimeout(() => resolve(null), ms as number)
      )
  );

  // env.define('sequence', async (...args: FilthExpr[]) => {
  //   for (const arg of args) {
  //     await env.eval(arg);
  //   }
  // });
};

const defineArithmetic = (env: EvalEnvironment) => {
  env.define('+', (...args: FilthExpr[]) => {
    const result = args.reduce((a, b) => {
      if (isFilthString(a)) {
        a = removeQuotes(a);
      }
      if (isFilthString(b)) {
        b = removeQuotes(b);
      }
      if (a === null) {
        a = 'nil';
      }
      if (b === null) {
        b = 'nil';
      }
      // log.debug('[defineArithmetic] a', a, 'b', b);
      return (a as number) + (b as number);
    });
    return typeof result === 'string' ? addQuotes(result) : result;
  });
  env.define('-', (...args: FilthExpr[]) => {
    if (args.length === 0) {
      return 0;
    }
    if (args.length === 1) {
      return -(args[0] as number);
    }
    return args.reduce((a, b) => (a as number) - (b as number));
  });
  env.define('*', (...args: FilthExpr[]) =>
    args.reduce((a, b) => (a as number) * (b as number), 1)
  );
  env.define('/', (...args: FilthExpr[]) => {
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
  env.define('list?', (x: FilthExpr) => isFilthList(x));
  env.define(
    'equal?',
    (a: FilthExpr, b: FilthExpr) => JSON.stringify(a) === JSON.stringify(b)
  );
  // env.define('nil?', (x: FilthExpr) => isFilthNil(x));
  env.define('nil?', (x: FilthExpr) => {
    // log.debug('[nil?] x', x);
    if (isFilthList(x) && x.elements.length === 0) {
      return true;
    }
    return isFilthNil(x);
  });

  env.define('len', (x: FilthExpr) => {
    // log.debug('[len] x', x);
    if (isFilthList(x)) {
      return x.elements.length;
    }
    if (isFilthString(x)) {
      return x.length;
    }
    return 0;
  });
};

const defineConversions = (env: EvalEnvironment) => {
  env.define('to_i', (x: FilthExpr) =>
    isFilthString(x) ? Number.parseInt(removeQuotes(x), 10) : x
  );
  env.define('to_s', (...x: FilthExpr[]) =>
    // log.debug('received', x);

    addQuotes(x.map(exprToString).map(removeQuotes).join(' '))
  );
  env.define('to_f', (x: FilthExpr) =>
    isFilthString(x) ? Number.parseFloat(removeQuotes(x)) : x
  );
  env.define('to_b', (x: FilthExpr) =>
    isFilthString(x) ? removeQuotes(x) === 'true' : x
  );
};
