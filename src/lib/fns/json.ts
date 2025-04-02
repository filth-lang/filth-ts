import { FilthJSON, FilthJSONArray, FilthJSONObject } from '../types';

export const createFilthJSON = (
  json: FilthJSONObject | FilthJSONArray
): FilthJSON => ({
  json,
  type: 'json'
});
