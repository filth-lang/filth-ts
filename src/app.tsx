import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { JSX } from 'preact/jsx-runtime';
import './app.css';
import { createLog } from '@helpers/log';
import { useFilthEnv } from '@hooks/use-filth-env';
import {
  addMessageAtom,
  addSystemMessageAtom,
  addToHistoryAtom,
  inputHistoryAtom,
  messagesAtom
} from '@model/atoms';
import { Message } from '@model/types';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import SJSON from 'superjson';

const packageVersion = __APP_VERSION__;

const log = createLog('app');

const createSystemMessage = (
  message: string,
  options: Partial<Message> = {}
): Message => ({
  content: message,
  id: crypto.randomUUID(),
  type: 'sys',
  ...options
});

const clearMessagesAtom = atom(null, (_get, set) => {
  set(messagesAtom, []);
});

export const App = () => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const history = useAtomValue(inputHistoryAtom);
  const addToHistory = useSetAtom(addToHistoryAtom);
  const messages = useAtomValue(messagesAtom);
  const addMessage = useSetAtom(addMessageAtom);
  const addSystemMessage = useSetAtom(addSystemMessageAtom);
  const clearMessages = useSetAtom(clearMessagesAtom);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { exec } = useFilthEnv();

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // useEffect(() => {
  //   if (messages.length === 0) {
  //     addSystemMessage(`Filth REPL v${packageVersion}`);
  //   }
  //   log.debug('messages', messages, messages.length);
  // }, [addSystemMessage, messages]);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!input.trim() || isLoading) {
      return;
    }

    const command = input.trim();

    if (command === 'clear' || command === 'cls') {
      clearMessages();
      setInput('');
      return;
    }

    const userMessage: Message = {
      content: command,
      id: crypto.randomUUID(),
      type: 'input'
    };

    addMessage(userMessage);
    addToHistory(command);
    setHistoryIndex(-1);
    setInput('');
    setIsLoading(true);

    const result = await exec(command);

    addMessage(result);
    setIsLoading(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (isLoading) {
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]);
      } else {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  // Focus input on mount and after messages update
  useEffect(() => {
    inputRef.current?.focus();
  }, [messages]);

  const displayMessages = useMemo(
    () => [
      createSystemMessage(`Filth REPL v${packageVersion}`, {
        link: 'https://github.com/filth-lang/filthjs'
      }),
      ...messages
    ],
    [messages]
  );

  return (
    <div class="chat-container">
      <div class="messages-container" ref={messagesContainerRef}>
        {displayMessages.map(message => (
          <div class={`message ${message.type}`} key={message.id}>
            <span class="prompt">{getMessagePrompt(message)}</span>
            <span class="content">{getMessageContent(message)}</span>
          </div>
        ))}
        {isLoading && (
          <div class="message">
            <span class="prompt">&gt;</span>
            <span class="content">Processing...</span>
          </div>
        )}
      </div>
      <div class="input-container">
        <form class="input-form" onSubmit={handleSubmit}>
          <input
            class="input-field"
            disabled={isLoading}
            onInput={e => setInput((e.target as HTMLInputElement).value)}
            onKeyDown={handleKeyDown}
            placeholder="Ready"
            ref={inputRef}
            type="text"
            value={input}
          />
          <button class="send-button" disabled={isLoading} type="submit">
            Run
          </button>
        </form>
      </div>
    </div>
  );
};

const getMessagePrompt = (message: Message): string => {
  switch (message.type) {
    case 'input':
      return '>';
    case 'error':
      return 'Error:';
    case 'log':
      return '[log] ';
    default:
      return '';
  }
};

const getMessageContent = (message: Message): string | JSX.Element => {
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
