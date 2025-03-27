import { createLog } from '@helpers/log';
import { createEnv, EvalEnvironment } from '@lib/create';
import { isLispExpr, isLispFunction, listExprToString } from '@lib/helpers';
import { LispExpr, LispFunction } from '@lib/types';
import { addLogMessageAtom, addMessageAtom } from '@model/atoms';
import { Message } from '@model/types';
import { useSetAtom } from 'jotai';
import { useCallback, useEffect, useRef } from 'preact/hooks';
import SJSON from 'superjson';

const log = createLog('useFilthEnv');

export type FilthCanvas = {
  ftype: 'html:canvas';
  value: HTMLCanvasElement;
} & LispFunction;

export const useFilthEnv = () => {
  const addMessage = useSetAtom(addMessageAtom);
  const addLogMessage = useSetAtom(addLogMessageAtom);
  const isInitialized = useRef(false);
  const env = useRef(createEnv());

  useEffect(() => {
    if (isInitialized.current) {
      return;
    }
    isInitialized.current = true;

    // set up filth global
    (window as unknown as { filth: EvalEnvironment }).filth = env.current;

    env.current.define('log', (...args: LispExpr[]) => {
      addLogMessage(args.map(arg => arg?.toString() ?? '').join(' '));
      return null;
    });

    defineCanvas(env.current);

    // env.current.eval('(log "Hello, world!")');
  }, [addMessage, addLogMessage]);

  const exec = useCallback(async (command: string): Promise<Message> => {
    try {
      const result = await env.current.eval(command);

      log.debug('[exec] result', result);

      if (isLispExpr(result)) {
        return {
          content: listExprToString(result),
          hint: 'ListExpr',
          id: crypto.randomUUID(),
          type: 'output'
        };
      }

      // if (isFilthCanvas(result)) {
      //   return {
      //     content: 'Canvas',
      //     id: crypto.randomUUID(),
      //     type: 'canvas'
      //   };
      // }

      return {
        id: crypto.randomUUID(),
        json: SJSON.stringify(result),
        type: 'output'
      };
    } catch (error) {
      log.error(error);
      return {
        content: error instanceof Error ? error.message : 'Unknown error',
        id: crypto.randomUUID(),
        type: 'error'
      };
    }
  }, []);

  return { exec };
};

const defineCanvas = (env: EvalEnvironment) => {
  env.define('canvas', (...args: LispExpr[]) => {
    const [width, height] = args;

    const canvas = document.createElement('canvas');
    canvas.width = width as number;
    canvas.height = height as number;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'green';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    return {
      body: null,
      env: env.create(),
      ftype: 'html:canvas',
      params: [],
      type: 'function',
      value: canvas
    };
  });
};

const isFilthCanvas = (expr: FilthCanvas): expr is FilthCanvas =>
  isLispFunction(expr) && expr.ftype === 'html:canvas';
