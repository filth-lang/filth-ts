import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { Message } from './types';

export const inputHistoryAtom = atomWithStorage<string[]>(
  'filth:input-history',
  []
);

export const addToHistoryAtom = atom(null, (get, set, command: string) => {
  set(inputHistoryAtom, [...get(inputHistoryAtom), command]);
});

export const messagesAtom = atomWithStorage<Message[]>('filth:messages', []);

export const addMessageAtom = atom(null, (get, set, message: Message) => {
  set(messagesAtom, [...get(messagesAtom), message]);
});

export const addLogMessageAtom = atom(null, (get, set, message: string) => {
  const logMessage: Message = {
    content: message,
    id: crypto.randomUUID(),
    type: 'log'
  };
  set(messagesAtom, [...get(messagesAtom), logMessage]);
});

export const addErrorMessageAtom = atom(null, (get, set, error: Error) => {
  const errorMessage: Message = {
    content: error instanceof Error ? error.message : 'Unknown error',
    id: crypto.randomUUID(),
    type: 'error'
  };
  set(messagesAtom, [...get(messagesAtom), errorMessage]);
});

export const addSystemMessageAtom = atom(
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
