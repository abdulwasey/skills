// Routes window.fetch through the mock switchboard as "METHOD /path". Same-origin requests the
// handler doesn't answer (bundled assets) pass through; anything else fails loudly so a render can
// never quietly hit a real API.
import { mockCall } from '../mock';

let installed = false;

export function installFetchMock() {
  if (installed) return;
  installed = true;
  const real = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const url = new URL(raw, window.location.href);
    const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
    let body: unknown = init?.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        /* keep the string */
      }
    }
    const data = mockCall(`${method} ${url.pathname}`, { query: Object.fromEntries(url.searchParams), body });
    if (data !== undefined) {
      return new Response(JSON.stringify(data), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    if (url.origin === window.location.origin) return real(input, init);
    console.error(`[mock] unhandled ${method} ${url.href}`);
    return new Response(JSON.stringify({ error: 'not mocked' }), { status: 599 });
  };
}
