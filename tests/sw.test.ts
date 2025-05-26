/* eslint-disable @typescript-eslint/no-dynamic-delete */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/* ---------------------------------------------------------------- *
 * Helpers: fake Cache Storage & fake Response
 * ---------------------------------------------------------------- */
type CacheMap = Map<string, any>;
const cacheStore: Record<string, CacheMap> = {};

const cachePutMock = vi.fn(async (key: any, res: any) => {
  if (!cacheStore['memo-app-cache-v3']) cacheStore['memo-app-cache-v3'] = new Map();
  cacheStore['memo-app-cache-v3'].set(typeof key === 'string' ? key : key.url, res);
});

function makeFakeCache(name: string) {
  if (!cacheStore[name]) cacheStore[name] = new Map();
  return {
    put: cachePutMock,
    match: vi.fn(async (req: Request | string) => {
      const k = typeof req === 'string' ? req : req.url;
      return cacheStore[name].get(k);
    }),
  };
}

// Simple Response stub that supports .json() / .clone()
function fakeJsonResponse(obj: unknown) {
  const body = JSON.stringify(obj);
  return {
    clone() {
      return this;
    },
    json: async () => JSON.parse(body),
    text: async () => body,
  } as unknown as Response;
}

function fakeTextResponse(text = 'ok') {
  return {
    clone() {
      return this;
    },
    text: async () => text,
  } as unknown as Response;
}

/* ---------------------------------------------------------------- *
 * Global mocks needed by sw.ts
 * ---------------------------------------------------------------- */
beforeEach(() => {
  vi.resetModules();
  cachePutMock.mockClear();

  // ---- mock global caches ----
  (globalThis as any).caches = {
    open: vi.fn(async (name: string) => makeFakeCache(name)),
    keys: vi.fn(async () => Object.keys(cacheStore)),
    delete: vi.fn(async (name: string) => {
      delete cacheStore[name];
      return true;
    }),
    match: vi.fn(), // not used directly in our tests
  };

  // ---- mock global fetch ----
  (globalThis as any).fetch = vi.fn(async (input: Request | string) => {
    const url = typeof input === 'string' ? input : input.url;

    if (url.endsWith('parcel-manifest.json')) {
      // asset manifest response
      return fakeJsonResponse({
        main: './main.js',
        style: './style.css',
      });
    }
    // any other request returns plain response
    return fakeTextResponse();
  });

  // ---- minimal ServiceWorker env ----
  Object.assign(globalThis, {
    self: globalThis,           // make "self" point to global object
    location: { href: 'http://localhost/' },
  });

  // very small event-listener implementation
  const listeners: Record<string, (evt: any) => void> = {};
  (globalThis as any).addEventListener = (type: string, cb: any) => {
    listeners[type] = cb;
  };
  (globalThis as any).__sw_listeners = listeners; // expose for tests
});

afterEach(() => {
  vi.clearAllMocks();
  Object.keys(cacheStore).forEach((k) => delete cacheStore[k]);
  delete (globalThis as any).caches;
  delete (globalThis as any).fetch;
  delete (globalThis as any).__sw_listeners;
  delete (globalThis as any).addEventListener;
});

/* ---------------------------------------------------------------- *
 * Utility to dispatch SW events
 * ---------------------------------------------------------------- */
class FakeExtendableEvent {
  private promises: Promise<unknown>[] = [];
  waitUntil(p: Promise<unknown>) {
    this.promises.push(p);
  }
  async done() {
    await Promise.all(this.promises);
  }
}

class FakeFetchEvent extends FakeExtendableEvent {
  _respondPromise: Promise<Response> | null = null;
  constructor(public request: any) {
    super();
  }
  respondWith(p: Promise<Response>) {
    this._respondPromise = p;
  }
  get response() {
    return this._respondPromise!;
  }
}

/* ---------------------------------------------------------------- *
 * Tests
 * ---------------------------------------------------------------- */
describe('Service Worker sw.ts', () => {
  it('caches assets listed in manifest on install', async () => {
    // import sw.ts (event listeners will be registered)
    await import('../src/sw');

    const { install } = (globalThis as any).__sw_listeners;
    const evt = new FakeExtendableEvent();

    // trigger the install listener
    install(evt);
    await evt.done(); // wait for all async work in waitUntil()

    // verify the manifest itself and index.html + CDN + two assets are cached
    expect(cachePutMock).toHaveBeenCalledWith(
      'http://localhost/main.js',
      expect.any(Object),
    );
    expect(cachePutMock).toHaveBeenCalledWith(
      'http://localhost/style.css',
      expect.any(Object),
    );
    expect(cachePutMock).toHaveBeenCalledWith(
      'http://localhost/index.html',
      expect.any(Object),
    );
    expect(cachePutMock).toHaveBeenCalledWith(
      'https://uicdn.toast.com/editor-plugin-code-syntax-highlight/latest/toastui-editor-plugin-code-syntax-highlight.min.css',
      expect.any(Object),
    );
  });

  it('removes outdated caches on activate', async () => {
    // seed an old cache name
    cacheStore['memo-app-cache-v2'] = new Map();
    cacheStore['memo-app-cache-v3'] = new Map();

    await import('../src/sw');
    const { activate } = (globalThis as any).__sw_listeners;

    const evt = new FakeExtendableEvent();
    activate(evt);
    await evt.done();

    // 'v2' should be deleted while latest cache remains
    expect(cacheStore['memo-app-cache-v2']).toBeUndefined();
    expect(cacheStore['memo-app-cache-v3']).toBeDefined();
  });

  it('handles a network-first navigation fetch', async () => {
    await import('../src/sw');
    const { fetch: fetchListener } = (globalThis as any).__sw_listeners;

    const request = {
      url: 'http://localhost/index.html',
      mode: 'navigate',
      destination: 'document',
    };
    const evt = new FakeFetchEvent(request);

    fetchListener(evt);
    const res = await evt.response; // promise set via respondWith

    // network fetch should be attempted
    expect(globalThis.fetch).toHaveBeenCalledWith(request);

    // asset should be cached via cache.put
    expect(cachePutMock).toHaveBeenCalledWith(request, expect.any(Object));

    expect(res).toBeDefined();
  });

  it('network-first fetch returns cached response when fetch fails and cache exists', async () => {
    // make fetch throw
    (globalThis as any).fetch = vi.fn(async () => { throw new Error('network error'); });
    // seed cache for this request
    const fakeResp = new Response('cached-network-first');
    cacheStore['memo-app-cache-v3'] = new Map([
      ['http://localhost/data.json', fakeResp],
    ]);
    (globalThis as any).caches.match = vi.fn(async (req) => {
      const url = typeof req === 'string' ? req : req.url;
      return cacheStore['memo-app-cache-v3'].get(url);
    });

    await import('../src/sw');
    const { fetch: fetchListener } = (globalThis as any).__sw_listeners;
    const request = {
      url: 'http://localhost/data.json',
      mode: 'cors',
      destination: 'script' as RequestDestination,
    };
    const evt = new FakeFetchEvent(request);
    fetchListener(evt);
    const res = await evt.response;

    expect(res).toBe(fakeResp);
    expect(globalThis.fetch).toHaveBeenCalledWith(request);
  });

  it('network-first fetch falls back to index.html when fetch fails, no cache, and navigate mode', async () => {
    // make fetch throw
    (globalThis as any).fetch = vi.fn(async () => { throw new Error('network error'); });
    // seed only index.html cache
    const fakeIndex = new Response('index-page');
    const indexUrl = new URL('./index.html', globalThis.location.href).toString();
    cacheStore['memo-app-cache-v3'] = new Map([[indexUrl, fakeIndex]]);
    (globalThis as any).caches.match = vi.fn(async (req) => {
      const url = typeof req === 'string' ? req : req.url;
      return cacheStore['memo-app-cache-v3'].get(url);
    });

    await import('../src/sw');
    const { fetch: fetchListener } = (globalThis as any).__sw_listeners;
    const request = {
      url: 'http://localhost/some/page',
      mode: 'navigate',
      destination: 'document' as RequestDestination,
    };
    const evt = new FakeFetchEvent(request);
    fetchListener(evt);
    const res = await evt.response;

    expect(res).toBe(fakeIndex);
  });

  it('serves cached response for cache-first fetch when available', async () => {
    // prepare a cached response and stub caches.match
    const fakeResp = new Response('from-cache');
    cacheStore['memo-app-cache-v3'] = new Map([
      ['http://localhost/static/file.png', fakeResp],
    ]);
    (globalThis as any).caches.match = vi.fn(async (req) => {
      const url = typeof req === 'string' ? req : req.url;
      return cacheStore['memo-app-cache-v3'].get(url);
    });

    await import('../src/sw');
    const { fetch: fetchListener } = (globalThis as any).__sw_listeners;
    const request = {
      url: 'http://localhost/static/file.png',
      mode: 'cors',
      destination: 'image',  // not in network-first types
    };
    const evt = new FakeFetchEvent(request);
    fetchListener(evt);
    const res = await evt.response;

    // should return the cached response without calling fetch()
    expect(res).toBe(fakeResp);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('falls back to 503 when fetch fails and no cache in cache-first fetch', async () => {
    // no cached entry
    (globalThis as any).caches.match = vi.fn(async () => undefined);
    // fetch throws an error
    (globalThis as any).fetch = vi.fn(async () => {
      throw new Error('network error');
    });

    await import('../src/sw');
    const { fetch: fetchListener } = (globalThis as any).__sw_listeners;
    const request = {
      url: 'http://localhost/missing.png',
      mode: 'cors',
      destination: 'image',
    };
    const evt = new FakeFetchEvent(request);
    fetchListener(evt);
    const res = await evt.response;

    expect(res.status).toBe(503);
    expect(res.statusText).toBe('Service Unavailable');
  });
});
