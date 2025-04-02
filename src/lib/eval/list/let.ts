import { Environment } from '@filth/environment';
import { evaluate } from '@filth/eval/evaluate';
import { isFilthList, isFilthString } from '@filth/helpers';
import { FilthExpr, FilthList } from '@filth/types';
import { createLog } from '@helpers/log';

const log = createLog('eval/apply');

export const evalLet = async (env: Environment, args: FilthExpr[]) => {
  const bindings = args[0] as FilthList;
  const body = args.slice(1);
  const newEnv = env.create();

  // log.debug('[let] bindings', bindings);
  // log.debug('[let] body', body);

  for (const binding of bindings.elements) {
    if (!isFilthList(binding)) {
      continue;
    }
    const [name, value] = binding.elements;
    if (isFilthString(name)) {
      const evaluatedValue = await evaluate(newEnv, value);
      newEnv.define(name, evaluatedValue);
    }
  }

  // log.debug('[let] newEnv', newEnv);

  let result: FilthExpr | null = null;
  for (const expr of body) {
    // log.debug('[let] expr', expr);
    result = await evaluate(newEnv, expr);
  }
  return result;
};
