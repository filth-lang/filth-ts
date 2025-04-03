import { createLog } from '@helpers/log';
import { Message } from '@model/types';
import { JSX } from 'preact/jsx-runtime';
import SJSON from 'superjson';

const log = createLog('repl/helpers');

export const createSystemMessage = (
  message: string,
  options: Partial<Message> = {}
): Message => ({
  content: message,
  id: crypto.randomUUID(),
  type: 'sys',
  ...options
});

export const getMessagePrompt = (message: Message): string => {
  switch (message.type) {
    case 'input':
      return '>';
    case 'error':
      return 'Error:';
    case 'log':
      return '; ';
    default:
      return '';
  }
};

export const getMessageContent = (message: Message): string | JSX.Element => {
  let content: string | JSX.Element = message.content ?? '';

  if (message.type === 'output') {
    if (message.json) {
      const json = SJSON.parse(message.json);
      content = JSON.stringify(json);
    }
  }

  if (message.type === 'canvas' && message.json) {
    const canvasData = SJSON.parse(message.json) as {
      height: number;
      imageData: {
        data: number[];
        height: number;
        width: number;
      } | null;
      width: number;
    };
    const imageData = canvasData.imageData;
    if (imageData && imageData.width > 0 && imageData.height > 0) {
      return (
        <canvas
          ref={el => {
            if (el) {
              el.width = canvasData.width;
              el.height = canvasData.height;
              const ctx = el.getContext('2d');
              if (ctx) {
                try {
                  const newImageData = new ImageData(
                    new Uint8ClampedArray(imageData.data),
                    imageData.width,
                    imageData.height
                  );
                  ctx.putImageData(newImageData, 0, 0);
                } catch (error) {
                  log.error('Failed to render canvas:', error);
                }
              }
            }
          }}
        />
      );
    }
  }

  if (message.hint) {
    content = <span title={message.hint}>{content}</span>;
  }

  if (message.link) {
    return <a href={message.link}>{content}</a>;
  }

  return content;
};

export const getClosingBrackets = (text: string): string => {
  const openBrackets: string[] = [];
  const bracketPairs: Record<string, string> = {
    '(': ')',
    '[': ']',
    '{': '}'
  };

  for (const char of text) {
    if (char in bracketPairs) {
      openBrackets.push(char);
    } else if (Object.values(bracketPairs).includes(char)) {
      const lastOpen = openBrackets.pop();
      if (lastOpen && bracketPairs[lastOpen] !== char) {
        // Mismatched brackets, return empty string
        return '';
      }
    }
  }

  return openBrackets
    .reverse()
    .map(bracket => bracketPairs[bracket])
    .join('');
};
