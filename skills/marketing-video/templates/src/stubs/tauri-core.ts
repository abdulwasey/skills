// Alias target for '@tauri-apps/api/core'. Export whatever else the app imports from it.
import { mockCall } from '../mock';

export type InvokeArgs = Record<string, unknown> | undefined;

export function invoke<T>(cmd: string, args?: InvokeArgs): Promise<T> {
  try {
    return Promise.resolve(mockCall(cmd, args) as T);
  } catch (err) {
    return Promise.reject(err);
  }
}

export const isTauri = () => false;
export const convertFileSrc = (path: string) => path;
export const transformCallback = () => 0;

export class Channel<T = unknown> {
  id = 0;
  onmessage: (message: T) => void = () => undefined;
}
