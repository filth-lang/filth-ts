import { createLog } from '@helpers/log';
import { createEnv, EvalEnvironment } from '@lib/create';
import { isFilthExpr, isFilthFunction, listExprToString } from '@lib/helpers';
import { FilthExpr, FilthFunction, FilthList } from '@lib/types';
import { addLogMessageAtom, addMessageAtom } from '@model/atoms';
import { Message } from '@model/types';
import { useSetAtom } from 'jotai';
import { useCallback, useEffect, useRef } from 'preact/hooks';
import SJSON from 'superjson';
import { evaluate } from '../../lib';
import { FilthArgumentError } from '../../lib/error';

const log = createLog('useFilthEnv');

export type FilthCanvas = {
  ftype: 'html:canvas';
  value: HTMLCanvasElement;
} & FilthFunction;

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

    env.current.define('log', (...args: FilthExpr[]) => {
      addLogMessage(args.map(arg => arg?.toString() ?? '').join(' '));
      return null;
    });

    defineCanvas(env.current);

    // env.current.eval('(log "Hello, world!")');
  }, [addMessage, addLogMessage]);

  const exec = useCallback(async (command: string): Promise<Message> => {
    try {
      const result = await env.current.eval(command);

      // log.debug('[exec] result', result);

      if (isFilthCanvas(result as FilthCanvas)) {
        const canvas = (result as FilthCanvas).value;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return {
            content: 'Failed to get canvas context',
            id: crypto.randomUUID(),
            type: 'error'
          };
        }
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        return {
          content: 'Canvas',
          id: crypto.randomUUID(),
          json: SJSON.stringify({
            height: canvas.height,
            imageData: {
              data: Array.from(imageData.data),
              height: imageData.height,
              width: imageData.width
            },
            width: canvas.width
          }),
          type: 'canvas'
        };
      }
      log.debug('[exec] result!!', listExprToString(result));
      if (isFilthExpr(result)) {
        return {
          content: listExprToString(result),
          hint: 'ListExpr',
          id: crypto.randomUUID(),
          type: 'output'
        };
      }

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

/**
 *
 * (define width 100)
 * (cdr '(10 10 width width)
 *
 * (canvas (250 250) ((fillStyle white) (fillRect '(10 10 100 100))))
 * (canvas (250 250) ((fillStyle white) (fillRect '(10 10 width width))))
 */
class CanvasEnv extends EvalEnvironment {
  canvas: HTMLCanvasElement | null = null;

  constructor(
    parent: EvalEnvironment | null = null,
    canvas: HTMLCanvasElement | null = null
  ) {
    super(parent);
    this.canvas = canvas;

    this.define(
      'fillRect',
      async (...args: FilthExpr[]) => {
        const evaluatedArgs = await Promise.all(
          args.map(async arg => await evaluate(this, arg))
        );

        log.debug('fillRect', evaluatedArgs);
        const props = evaluatedArgs[0] as FilthList;
        const [x, y, width, height] = props.elements;
        const ctx = this.canvas?.getContext('2d');
        if (ctx) {
          ctx.fillRect(
            x as number,
            y as number,
            width as number,
            height as number
          );
        }
        log.debug('fillRect', { height, width, x, y });

        return null;
      },
      { skipEvaluateArgs: true }
    );

    this.define(
      'fillStyle',
      (...args: FilthExpr[]) => {
        log.debug('fillStyle', args);

        const [color] = args;
        const ctx = this.canvas?.getContext('2d');
        if (ctx) {
          log.debug('setting fillStyle', color);
          ctx.fillStyle = color as string;
        } else {
          throw new FilthArgumentError('fillStyle must be called on a canvas');
        }

        return null;
      },
      { skipEvaluateArgs: true }
    );
  }
}

const defineCanvas = (env: EvalEnvironment) => {
  env.define(
    'canvas',
    async (...args: FilthExpr[]) => {
      // const [width = 100, height = 100] = args;

      const props = args[0] as FilthList;
      const body = args.slice(1);

      log.debug('[defineCanvas] props', props);
      log.debug('[defineCanvas] args', args);

      // if (body.length !== 1) {
      //   throw new FilthArgumentError('canvas must have exactly one body');
      // }

      const [width, height] = props.elements;

      const canvas = document.createElement('canvas');
      canvas.width = width as number;
      canvas.height = height as number;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'green'; // Match the input-bg color from app.css
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      const canvasEnv = new CanvasEnv(env, canvas);

      let result: FilthExpr | null = null;
      for (const expr of body) {
        result = await evaluate(canvasEnv, expr);
      }

      log.debug('[defineCanvas] canvasEnv', canvasEnv);

      return {
        body: body[0],
        env: canvasEnv,
        ftype: 'html:canvas',
        params: [],
        type: 'function',
        value: canvas
      };
    },
    { skipEvaluateArgs: true }
  );

  log.debug('defineCanvas', env);
};

const isFilthCanvas = (expr: FilthCanvas): expr is FilthCanvas =>
  isFilthFunction(expr) && expr.ftype === 'html:canvas';
