export type Message = {
  content?: string;
  hint?: string;
  id: string;
  json?: string;
  link?: string;
  type: 'input' | 'output' | 'error' | 'log' | 'sys' | 'canvas';
};
