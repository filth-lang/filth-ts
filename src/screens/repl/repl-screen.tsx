import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'preact/hooks';
import './repl-screen.css';
import { createLog } from '@helpers/log';
import { useFilthEnv } from '@hooks/use-filth-env';
import {
  addMessageAtom,
  addToHistoryAtom,
  clearMessagesAtom,
  inputHistoryAtom,
  messagesAtom
} from '@model/atoms';
import { Message } from '@model/types';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  createSystemMessage,
  getClosingBrackets,
  getMessageContent,
  getMessagePrompt
} from './helpers';

const packageVersion = __APP_VERSION__;

const log = createLog('repl');

export const ReplScreen = () => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const history = useAtomValue(inputHistoryAtom);
  const addToHistory = useSetAtom(addToHistoryAtom);
  const messages = useAtomValue(messagesAtom);
  const addMessage = useSetAtom(addMessageAtom);
  const clearMessages = useSetAtom(clearMessagesAtom);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { exec } = useFilthEnv();

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = useCallback(
    async (e: Event) => {
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
    },
    [exec, input, addMessage, addToHistory, clearMessages, isLoading]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isLoading) {
        return;
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        const closingBrackets = getClosingBrackets(input);
        if (closingBrackets) {
          setInput(prev => prev + closingBrackets);
          // Move cursor to end
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.selectionStart = inputRef.current.selectionEnd =
                inputRef.current.value.length;
            }
          }, 0);
        }
        return;
      }

      if (e.key === 'ArrowUp') {
        const textarea = e.target as HTMLTextAreaElement;

        // Only navigate history if cursor is at the end of first line or there are no newlines
        if (textarea.selectionStart === 0) {
          e.preventDefault();
          if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setInput(history[history.length - 1 - newIndex]);
          }
        }
      } else if (e.key === 'ArrowDown') {
        const textarea = e.target as HTMLTextAreaElement;

        // Only navigate history if cursor is at the end of first line or there are no newlines
        if (input.length === textarea.selectionEnd) {
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
      }
    },
    [history, historyIndex, input, isLoading, handleSubmit]
  );

  // Focus input on mount and after messages update
  useEffect(() => {
    inputRef.current?.focus();
  }, [messages]);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) {
      return;
    }

    const adjustHeight = () => {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 20 * 24)}px`; // 20em max height
    };

    // Adjust height on input changes
    textarea.addEventListener('input', adjustHeight);
    // Initial adjustment
    adjustHeight();

    return () => {
      textarea.removeEventListener('input', adjustHeight);
    };
  }, [input]); // Add input as a dependency to trigger on state changes

  const displayMessages = useMemo(
    () => [
      createSystemMessage(`ODGN Filth REPL v${packageVersion}`, {
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
          <div class="input-wrapper">
            <textarea
              class="input-field"
              disabled={isLoading}
              onInput={e => setInput((e.target as HTMLTextAreaElement).value)}
              onKeyDown={handleKeyDown}
              placeholder="Ready"
              ref={inputRef}
              rows={1}
              value={input}
            />
            {getClosingBrackets(input) && (
              <span class="closing-brackets">{getClosingBrackets(input)}</span>
            )}
          </div>
          <button class="send-button" disabled={isLoading} type="submit">
            Run
          </button>
        </form>
      </div>
    </div>
  );
};
