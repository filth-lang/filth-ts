import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import './app.css';
import { createLog } from '@helpers/log';
import { createEnv } from '@lib/create';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import SJSON from 'superjson';

const log = createLog('app');

const inputHistoryAtom = atomWithStorage<string[]>('filth:input-history', []);

const addToHistoryAtom = atom(null, (get, set, command: string) => {
  set(inputHistoryAtom, [...get(inputHistoryAtom), command]);
});

const messagesAtom = atomWithStorage<Message[]>('filth:messages', []);

const addMessageAtom = atom(null, (get, set, message: Message) => {
  set(messagesAtom, [...get(messagesAtom), message]);
});

const clearMessagesAtom = atom(null, (get, set) => {
  set(messagesAtom, []);
});

type Message = {
  content?: string;
  id: string;
  json?: string;
  type: 'input' | 'output' | 'error';
};

const useFilthEnv = () => {
  const env = useRef(createEnv());

  const exec = useCallback(async (command: string): Promise<Message> => {
    try {
      const result = await env.current.eval(command);

      log.debug('[exec] result', result);

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

  return { env: env.current, exec };
};

export const App = () => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const history = useAtomValue(inputHistoryAtom);
  const addToHistory = useSetAtom(addToHistoryAtom);
  const messages = useAtomValue(messagesAtom);
  const addMessage = useSetAtom(addMessageAtom);
  const clearMessages = useSetAtom(clearMessagesAtom);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const { exec } = useFilthEnv();

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

  return (
    <div class="chat-container">
      <div class="messages-container">
        {messages.map(message => (
          <div class={`message ${message.type}`} key={message.id}>
            <span class="prompt">{message.type === 'input' ? '>' : ''}</span>
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
            placeholder="Enter command..."
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

const getMessageContent = (message: Message): string => {
  if (message.type === 'output') {
    if (message.json) {
      const json = SJSON.parse(message.json);
      return JSON.stringify(json);
    }
  }
  return message.content ?? '';
};
