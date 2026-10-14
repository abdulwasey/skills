// One switchboard for every stubbed backend call (Tauri invoke, fetch, Electron IPC, an API client).
// LiveApp swaps the handler each frame, so the app sees that frame's scripted data.
export type MockHandler = (name: string, args?: unknown) => unknown;

let handler: MockHandler = () => undefined;

export function setMockHandler(next: MockHandler) {
  handler = next;
}

export function mockCall(name: string, args?: unknown): unknown {
  return handler(name, args);
}
