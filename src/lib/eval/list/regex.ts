import { Environment } from '@filth/env/env';
import { evaluate } from '@filth/eval/evaluate';
import { matchRegex } from '@filth/fns/regex';
import { createFilthList, isFilthString } from '@filth/helpers';
import { FilthExpr, FilthRegex } from '@filth/types';
import { createLog } from '@helpers/log';

const log = createLog('eval/regex');

export const evalRegex = async (
  env: Environment,
  expr: FilthRegex,
  args: FilthExpr[]
): Promise<FilthExpr> => {
  const evaluatedArgs = await Promise.all(
    args.map(async arg => await evaluate(env, arg))
  );

  // log.debug('[eval] regex', expr, evaluatedArgs);

  let result: FilthExpr[] = [];

  if (expr.hasNamedGroups) {
    // const newEnv = env.create();

    for (const arg of evaluatedArgs) {
      if (isFilthString(arg)) {
        const match = expr.regex.exec(arg);
        if (match) {
          const groups = match.groups ?? {};

          for (const [name, value] of Object.entries(groups)) {
            // newEnv.define(name, value);
            result.push(name);
            result.push(value);
          }
        }
      }
    }

    // log.debug('[eval] regex result', result);
    return createFilthList(result);
  }

  for (const arg of evaluatedArgs) {
    if (isFilthString(arg)) {
      const matches = matchRegex(expr.regex, arg);
      // log.debug('[eval] regex arg:', arg, expr.regex, matches);
      if (matches) {
        result = [...result, ...matches];
        // result.push(matches as unknown as FilthExpr);
      }
    }
  }

  // log.debug('[eval] regex result', result.flat());

  return createFilthList(result.flat());
};
