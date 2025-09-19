declare module 'event-source-polyfill' {
  export class EventSourcePolyfill {
    constructor(url: string, init?: {
      headers?: Record<string, string>;
      withCredentials?: boolean;
      heartbeatTimeout?: number;
    });
    onopen: ((e: MessageEvent) => void) | null;
    onmessage: ((e: MessageEvent) => void) | null;
    onerror: ((e: any) => void) | null;
    addEventListener(type: string, listener: (e: any) => void): void;
    close(): void;
  }
}
