import { useEffect, useRef, useState } from 'preact/hooks';
import './app.css';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

const inputHistoryAtom = atomWithStorage<string[]>('filth:input-history', []);

const addToHistoryAtom = atom(null, (get, set, command: string) => {
  set(inputHistoryAtom, [...get(inputHistoryAtom), command]);
});

const messagesAtom = atomWithStorage<Message[]>('filth:messages', []);

const addMessageAtom = atom(null, (get, set, message: Message) => {
  set(messagesAtom, [...get(messagesAtom), message]);
});

type Message = {
  content: string;
  id: string;
  type: 'input' | 'output' | 'error';
};

export const App = () => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const history = useAtomValue(inputHistoryAtom);
  const addToHistory = useSetAtom(addToHistoryAtom);
  const messages = useAtomValue(messagesAtom);
  const addMessage = useSetAtom(addMessageAtom);

  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!input.trim() || isLoading) {
      return;
    }

    const command = input.trim();
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

    // TODO: Add actual API call here
    // Simulating API response
    setTimeout(() => {
      const outputMessage: Message = {
        content: 'ok: 42',
        id: crypto.randomUUID(),
        type: 'output'
      };
      addMessage(outputMessage);
      setIsLoading(false);
    }, 1000);
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
            <span class="content">{message.content}</span>
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
