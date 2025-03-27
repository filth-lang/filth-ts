import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'preact/hooks';
import './app.css';
import { createLog } from '@helpers/log';
import { createEnv } from '@lib/create';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import SJSON from 'superjson';
import { LispExpr } from './lib/types';

const packageVersion = __APP_VERSION__;

const log = createLog('app');

const inputHistoryAtom = atomWithStorage<string[]>('filth:input-history', []);

const addToHistoryAtom = atom(null, (get, set, command: string) => {
  set(inputHistoryAtom, [...get(inputHistoryAtom), command]);
});

const messagesAtom = atomWithStorage<Message[]>('filth:messages', []);

const addMessageAtom = atom(null, (get, set, message: Message) => {
  set(messagesAtom, [...get(messagesAtom), message]);
});

const addLogMessageAtom = atom(null, (get, set, message: string) => {
  const logMessage: Message = {
    content: message,
    id: crypto.randomUUID(),
    type: 'log'
  };
  set(messagesAtom, [...get(messagesAtom), logMessage]);
});

const addErrorMessageAtom = atom(null, (get, set, error: Error) => {
  const errorMessage: Message = {
    content: error instanceof Error ? error.message : 'Unknown error',
    id: crypto.randomUUID(),
    type: 'error'
  };
  set(messagesAtom, [...get(messagesAtom), errorMessage]);
});

const addSystemMessageAtom = atom(
  null,
  (get, set, message: string, options: Partial<Message> = {}) => {
    const systemMessage: Message = {
      content: message,
      id: crypto.randomUUID(),
      type: 'sys',
      ...options
    };
    set(messagesAtom, [...get(messagesAtom), systemMessage]);
  }
);

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

type Message = {
  content?: string;
  id: string;
  json?: string;
  link?: string;
  type: 'input' | 'output' | 'error' | 'log' | 'sys';
};

const useFilthEnv = () => {
  const addMessage = useSetAtom(addMessageAtom);
  const addLogMessage = useSetAtom(addLogMessageAtom);
  const isInitialized = useRef(false);
  const env = useRef(createEnv());

  useEffect(() => {
    if (isInitialized.current) {
      return;
    }
    isInitialized.current = true;

    env.current.define('log', (...args: LispExpr[]) => {
      addLogMessage(args.map(arg => arg?.toString() ?? '').join(' '));
      return null;
    });

    // env.current.eval('(log "Hello, world!")');
  }, [addMessage, addLogMessage]);

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

  return { exec };
};

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
  let content = message.content ?? '';

  if (message.type === 'output') {
    if (message.json) {
      const json = SJSON.parse(message.json);
      content = JSON.stringify(json);
    }
  }

  if (message.link) {
    return <a href={message.link}>{content}</a>;
  }

  return content;
};
