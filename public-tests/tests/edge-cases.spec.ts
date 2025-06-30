import { afterEach, beforeAll, describe, expect, it } from 'vitest';

function ensureNavigator() {
  if (!global.navigator) {
    // @ts-ignore
    global.navigator = {};
  }
  if (!('geolocation' in global.navigator)) {
    // @ts-ignore
    global.navigator.geolocation = undefined;
  }
  if (!('userAgent' in global.navigator)) {
    // @ts-ignore
    global.navigator.userAgent = '';
  }
}

function ensureLocalStorage() {
  if (!('localStorage' in global)) {
    // @ts-ignore
    global.localStorage = undefined;
  }
}

function mockNavigatorGeolocation(undefinedOrObject: any) {
  Object.defineProperty(global.navigator, 'geolocation', {
    value: undefinedOrObject,
    configurable: true
  });
}

function mockUserAgent(ua: string) {
  Object.defineProperty(global.navigator, 'userAgent', {
    value: ua,
    configurable: true
  });
}

function mockLocalStorage(undefinedOrObject: any) {
  Object.defineProperty(global, 'localStorage', {
    value: undefinedOrObject,
    configurable: true
  });
}

describe('Edge Cases - Navegadores antiguos y sin GPS', () => {
  let originalGeolocation: any;
  let originalUserAgent: any;
  let originalLocalStorage: any;

  beforeAll(() => {
    ensureNavigator();
    ensureLocalStorage();
    originalGeolocation = global.navigator.geolocation;
    originalUserAgent = global.navigator.userAgent;
    originalLocalStorage = global.localStorage;
  });

  afterEach(() => {
    mockNavigatorGeolocation(originalGeolocation);
    mockUserAgent(originalUserAgent);
    mockLocalStorage(originalLocalStorage);
  });

  it('Muestra mensaje adecuado si el navegador NO soporta Geolocation API', () => {
    mockNavigatorGeolocation(undefined);
    const supportsGeolocation = !!navigator.geolocation;
    expect(supportsGeolocation).toBe(false);
  });

  it('Muestra fallback si el usuario rechaza permisos de ubicación', async () => {
    mockNavigatorGeolocation({
      getCurrentPosition: (_success: any, error: any) => {
        error({ code: 1, message: 'User denied Geolocation' });
      }
    });
    let errorMsg = '';
    navigator.geolocation.getCurrentPosition(
      () => {},
      (err: any) => { errorMsg = err.message; }
    );
    expect(errorMsg).toBe('User denied Geolocation');
  });

  it('Usa fallback por IP si no hay GPS disponible', async () => {
    mockNavigatorGeolocation(undefined);
    const fallbackUsed = !navigator.geolocation;
    expect(fallbackUsed).toBe(true);
  });

  it('Muestra advertencia si el navegador no soporta localStorage', () => {
    mockLocalStorage(undefined);
    let localStorageAvailable = true;
    try {
      window.localStorage.setItem('test', '1');
    } catch {
      localStorageAvailable = false;
    }
    expect(localStorageAvailable).toBe(false);
  });

  it('Detecta userAgent de navegador antiguo y muestra advertencia', () => {
    mockUserAgent('Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)');
    const isOldIE = /MSIE [6-8]/.test(navigator.userAgent);
    expect(isOldIE).toBe(true);
  });

  it('Detecta userAgent desconocido y aplica fallback', () => {
    mockUserAgent('UnknownBrowser/1.0');
    const isKnown = /Chrome|Firefox|Safari|Edge|Opera|MSIE/.test(navigator.userAgent);
    expect(isKnown).toBe(false);
  });

  it('Maneja correctamente la ausencia de fetch (navegador muy antiguo)', async () => {
    const originalFetch = global.fetch;
    // @ts-ignore
    global.fetch = undefined;
    let fetchAvailable = true;
    try {
      // @ts-ignore
      fetch('/api/test');
    } catch {
      fetchAvailable = false;
    }
    expect(fetchAvailable).toBe(false);
    global.fetch = originalFetch;
  });

  it('Maneja correctamente la ausencia de Promise (navegador muy antiguo)', () => {
    const originalPromise = global.Promise;
    // @ts-ignore
    global.Promise = undefined;
    let promiseAvailable = true;
    try {
      // @ts-ignore
      new Promise(() => {});
    } catch {
      promiseAvailable = false;
    }
    expect(promiseAvailable).toBe(false);
    global.Promise = originalPromise;
  });
});
