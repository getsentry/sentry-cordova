import {
  addBreadcrumb,
  captureEvent,
  captureException,
  captureMessage,
  configureScope,
  CordovaOptions,
  CordovaClient,
  init,
  Integrations,
  getDefaultHub,
  SDK_NAME,
  SDK_VERSION,
  SentryEvent,
  setDist,
  setRelease,
} from '../sentry-cordova';

const dsn = 'https://1e7e9e1f2a51437a802724a538b7051d@sentry.io/304324';

const defaultOptions: CordovaOptions = {
  dsn,
};

let timeout: NodeJS.Timer;
function callDeviceReady(): void {
  timeout = setTimeout(() => {
    const e = document.createEvent('Events');
    e.initEvent('deviceready', true, false);
    document.dispatchEvent(e);
  }, 50);
}

describe('SentryCordova', () => {
  beforeEach(() => {
    (window as any).Cordova = {};
    (window as any).__SENTRY__ = {};
    (window as any).SENTRY_RELEASE = {};
  });

  afterEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
    jest.clearAllTimers();
    clearTimeout(timeout);
  });

  describe('Setup', () => {
    test('call install with cordovaExec', done => {
      expect.assertions(1);

      callDeviceReady();

      (window as any).Cordova.exec = jest.fn((...params: any[]) => {
        // params[0] == resolve
        // params[1] == reject
        // params[3] == function send/install .....
        expect(params[3]).toBe('install');
        params[0](false);
        done();
      });

      init(defaultOptions);
    });
  });

  describe('Capture', () => {
    test('exception', done => {
      expect.assertions(2);
      callDeviceReady();

      (window as any).Cordova.exec = jest.fn(
        (resolve: (result: any) => void, reject: (error: any) => void, plugin: string, action: string, value: any) => {
          if (action === 'sendEvent') {
            const event = value[0]; // this is an event
            expect(event.exception.values[0].type).toBe('Error');
            expect(event.exception.values[0].value).toBe('yo');
            done();
          }
        }
      );
      init(defaultOptions);
      captureException(new Error('yo'));
    });

    test('send with browser fallback', done => {
      expect.assertions(3);
      callDeviceReady();

      (window as any).Cordova.exec = jest.fn((...params: any[]) => {
        // params[0] == resolve
        // params[1] == reject
        // params[3] == function send/install .....
        if (params[3] === 'sendEvent') {
          params[1]('not implemented');
        }
      });

      init({
        ...defaultOptions,
        shouldSend: (event: SentryEvent) => {
          expect(event.sdk!.name).toEqual(SDK_NAME);
          expect(event.sdk!.version).toEqual(SDK_VERSION);
          expect(event.sdk!.packages).toHaveLength(2);
          done();
          return false;
        },
      });
      getDefaultHub().pushScope();
      captureMessage('hey');
      getDefaultHub().popScope();
    });

    test('message', done => {
      expect.assertions(2);

      callDeviceReady();

      (window as any).Cordova.exec = jest.fn((...params: any[]) => {
        // params[0] == resolve
        // params[1] == reject
        // params[3] == function send/install .....
        // raven._originalConsole.log(params);
        if (params[3] === 'sendEvent') {
          const event = params[4][0]; // this is an event
          expect(event.message).toBe('bread');
          expect(event.platform).toBe('javascript');
          params[0](false);
          done();
        } else if (params[3] === 'install') {
          params[0](false);
        }
      });
      init(defaultOptions);
      captureMessage('bread');
    });
  });

  describe('Breadcrumbs', () => {
    test('addBreadcrumb', done => {
      expect.assertions(2);
      (window as any).Cordova.exec = jest.fn((...params: any[]) => {
        if (params[3] === 'sendEvent') {
          params[0](false);
        } else if (params[3] === 'install') {
          params[0](true);
        }
      });

      callDeviceReady();
      init({
        ...defaultOptions,
        afterSend: (event: SentryEvent) => {
          expect(event.message).toBe('knife');
          expect(event.breadcrumbs![0].message).toBe('bread');
          done();
        },
      });
      addBreadcrumb({ message: 'bread' });
      captureMessage('knife');
    });
  });

  describe('General', () => {
    beforeEach(() => {
      (window as any).Cordova.exec = jest.fn((...params: any[]) => {
        if (params[3] === 'sendEvent') {
          params[0](false);
        } else if (params[3] === 'install') {
          params[0](true);
        }
      });
      callDeviceReady();
    });

    test('setRelease from window', done => {
      expect.assertions(1);

      init({
        ...defaultOptions,
        integrations: () => [new Integrations.Release()],
        afterSend: (event: SentryEvent) => {
          expect((event.extra! as any).__sentry_release).toBe('abc');
          done();
        },
      });

      (window as any).SENTRY_RELEASE = {};
      (window as any).SENTRY_RELEASE.id = 'abc';

      captureMessage('knife');
    });

    test('cordova integration', done => {
      expect.assertions(1);

      init({
        ...defaultOptions,
        integrations: () => [new Integrations.Cordova()],
        afterSend: (event: SentryEvent) => {
          expect(event.exception!.values[0].stacktrace!.frames![1].filename).toContain('app://');
          done();
        },
      });
      captureException(new Error('yo'));
    });

    test('setRelease from window but event should be stronger', done => {
      expect.hasAssertions();

      init({
        ...defaultOptions,
        integrations: () => [new Integrations.Release()],
        afterSend: (event: SentryEvent) => {
          expect(event.release).toBe('xyz');
          done();
        },
      });

      (window as any).SENTRY_RELEASE = {};
      (window as any).SENTRY_RELEASE.id = 'abc';

      captureEvent({ message: 'test', release: 'xyz' });
      getDefaultHub().popScope();
    });

    test('setRelease/setDist', done => {
      expect.assertions(2);
      getDefaultHub().pushScope();
      getDefaultHub().bindClient(
        new CordovaClient({
          afterSend: (event: SentryEvent) => {
            expect((event.extra! as any).__sentry_release).toBe('xxx');
            expect((event.extra! as any).__sentry_dist).toBe('dist');
            done();
          },
          dsn,
        })
      );
      setRelease('xxx');
      setDist('dist');
      captureMessage('knife');
      getDefaultHub().popScope();
    });

    test('setRelease setDist on prefilled event', done => {
      expect.assertions(4);
      getDefaultHub().pushScope();
      getDefaultHub().bindClient(
        new CordovaClient({
          afterSend: (event: SentryEvent) => {
            expect((event.extra! as any).__sentry_release).toBe('xxx');
            expect((event.extra! as any).__sentry_dist).toBe('dist');
            expect(event.dist).toBe('1');
            expect(event.release).toBe('b');
            done();
          },
          dsn,
        })
      );
      setRelease('xxx');
      setDist('dist');
      captureEvent({ dist: '1', release: 'b' });
      getDefaultHub().popScope();
    });

    test('setRelease setDist on empty event', done => {
      expect.assertions(4);

      init({
        ...defaultOptions,
        integrations: () => [new Integrations.Release()],
        afterSend: (event: SentryEvent) => {
          expect((event.extra! as any).__sentry_release).toBe('xxx');
          expect((event.extra! as any).__sentry_dist).toBe('dist');
          expect(event.dist).toBe('dist');
          expect(event.release).toBe('xxx');
          done();
        },
      });

      setRelease('xxx');
      setDist('dist');
      captureMessage('test');
    });

    test('setTagsContext', async done => {
      expect.assertions(1);
      getDefaultHub().pushScope();
      getDefaultHub().bindClient(
        new CordovaClient({
          afterSend: (event: SentryEvent) => {
            expect(event.tags).toEqual({ jest: 'yo' });
            done();
          },
          dsn,
        })
      );
      configureScope(scope => scope.setTag('jest', 'yo'));
      captureMessage('knife');
      getDefaultHub().popScope();
    });

    test('setUserContext', async done => {
      expect.assertions(1);
      getDefaultHub().pushScope();
      getDefaultHub().bindClient(
        new CordovaClient({
          afterSend: (event: SentryEvent) => {
            expect(event.user).toEqual({ id: '4433' });
            done();
          },
          dsn,
        })
      );
      configureScope(scope => scope.setUser({ id: '4433' }));
      captureMessage('knife');
      getDefaultHub().popScope();
    });

    test('setUserContext', async done => {
      expect.assertions(1);
      getDefaultHub().pushScope();
      getDefaultHub().bindClient(
        new CordovaClient({
          afterSend: (event: SentryEvent) => {
            expect((event.extra as any).id).toBe('44335');
            done();
          },
          dsn,
        })
      );
      configureScope(scope => scope.setExtra('id', '44335'));
      captureMessage('knife');
      getDefaultHub().popScope();
    });

    test('clearScope', async done => {
      expect.assertions(1);
      getDefaultHub().pushScope();
      getDefaultHub().bindClient(
        new CordovaClient({
          afterSend: (event: SentryEvent) => {
            expect((event.extra as any).id).toBeUndefined();
            done();
          },
          dsn,
        })
      );
      configureScope(scope => scope.setExtra('id', '44335'));
      configureScope(scope => scope.clear());
      captureMessage('knife');
      getDefaultHub().popScope();
    });
  });
});
