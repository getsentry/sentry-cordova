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
  getCurrentHub,
  SDK_NAME,
  SDK_VERSION,
  SentryEvent,
  setDist,
  setRelease,
} from '../sentry-cordova';

const dsn = 'https://123@sentry.io/123';

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
        (
          _resolve: (result: any) => void,
          _reject: (error: any) => void,
          _plugin: string,
          action: string,
          value: any
        ) => {
          if (action === 'sendEvent') {
            const event = value[0]; // this is an event
            expect(event.exception.values[0].type).toBe('Error');
            expect(event.exception.values[0].value).toBe('yo');
            done();
          }
        }
      );

      captureException(new Error('yo'));
    });

    test('send with browser fallback', done => {
      expect.assertions(2);
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
        beforeSend: (event: SentryEvent) => {
          expect(event.sdk!.name).toEqual(SDK_NAME);
          expect(event.sdk!.version).toEqual(SDK_VERSION);
          done();
          return null;
        },
      });

      getCurrentHub().pushScope();
      captureMessage('hey');
      getCurrentHub().popScope();
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
        beforeSend: (event: SentryEvent) => {
          expect(event.message).toBe('knife');
          expect(event.breadcrumbs![0].message).toBe('bread');
          done();
          return null;
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
        integrations: [new Integrations.Release()],
        beforeSend: (event: SentryEvent) => {
          expect((event.extra! as any).__sentry_release).toBe('abc');
          done();
          return null;
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
        beforeSend: (event: SentryEvent) => {
          expect(event.exception!.values![0].stacktrace!.frames![1].filename).toContain('app://');
          done();
          return null;
        },
      });
      captureException(new Error('yo'));
    });

    test('setRelease from window but event should be stronger', done => {
      expect.hasAssertions();

      init({
        ...defaultOptions,
        integrations: () => [new Integrations.Release()],
        beforeSend: (event: SentryEvent) => {
          expect(event.release).toBe('xyz');
          done();
          return null;
        },
      });

      (window as any).SENTRY_RELEASE = {};
      (window as any).SENTRY_RELEASE.id = 'abc';

      captureEvent({ message: 'test', release: 'xyz' });
      getCurrentHub().popScope();
    });

    test('setRelease/setDist', done => {
      expect.assertions(2);
      getCurrentHub().pushScope();
      getCurrentHub().bindClient(
        new CordovaClient({
          beforeSend: (event: SentryEvent) => {
            expect((event.extra! as any).__sentry_release).toBe('xxx');
            expect((event.extra! as any).__sentry_dist).toBe('dist');
            done();
            return null;
          },
          dsn,
        })
      );
      setRelease('xxx');
      setDist('dist');
      captureMessage('knife');
      getCurrentHub().popScope();
    });

    test('setRelease setDist on prefilled event', done => {
      expect.assertions(4);
      getCurrentHub().pushScope();
      getCurrentHub().bindClient(
        new CordovaClient({
          beforeSend: (event: SentryEvent) => {
            expect((event.extra! as any).__sentry_release).toBe('xxx');
            expect((event.extra! as any).__sentry_dist).toBe('dist');
            expect(event.dist).toBe('1');
            expect(event.release).toBe('b');
            done();
            return null;
          },
          dsn,
        })
      );
      setRelease('xxx');
      setDist('dist');
      captureEvent({ dist: '1', release: 'b' });
      getCurrentHub().popScope();
    });

    test('setRelease setDist on empty event', done => {
      expect.assertions(4);

      init({
        ...defaultOptions,
        integrations: () => [new Integrations.Release()],
        beforeSend: (event: SentryEvent) => {
          expect((event.extra! as any).__sentry_release).toBe('xxx');
          expect((event.extra! as any).__sentry_dist).toBe('dist');
          expect(event.dist).toBe('dist');
          expect(event.release).toBe('xxx');
          done();
          return null;
        },
      });

      setRelease('xxx');
      setDist('dist');
      captureMessage('test');
    });

    test('setTagsContext', async done => {
      expect.assertions(1);
      getCurrentHub().pushScope();
      getCurrentHub().bindClient(
        new CordovaClient({
          beforeSend: (event: SentryEvent) => {
            expect(event.tags).toEqual({ jest: 'yo' });
            done();
            return null;
          },
          dsn,
        })
      );
      configureScope(scope => scope.setTag('jest', 'yo'));
      captureMessage('knife');
      getCurrentHub().popScope();
    });

    test('setUserContext', async done => {
      expect.assertions(1);
      getCurrentHub().pushScope();
      getCurrentHub().bindClient(
        new CordovaClient({
          beforeSend: (event: SentryEvent) => {
            expect(event.user).toEqual({ id: '4433' });
            done();
            return null;
          },
          dsn,
        })
      );
      configureScope(scope => scope.setUser({ id: '4433' }));
      captureMessage('knife');
      getCurrentHub().popScope();
    });

    test('setUserContext', async done => {
      expect.assertions(1);
      getCurrentHub().pushScope();
      getCurrentHub().bindClient(
        new CordovaClient({
          beforeSend: (event: SentryEvent) => {
            expect((event.extra as any).id).toBe('44335');
            done();
            return null;
          },
          dsn,
        })
      );
      configureScope(scope => scope.setExtra('id', '44335'));
      captureMessage('knife');
      getCurrentHub().popScope();
    });

    test('clearScope', async done => {
      expect.assertions(1);
      getCurrentHub().pushScope();
      getCurrentHub().bindClient(
        new CordovaClient({
          beforeSend: (event: SentryEvent) => {
            expect((event.extra as any).id).toBeUndefined();
            done();
            return null;
          },
          dsn,
        })
      );
      configureScope(scope => scope.setExtra('id', '44335'));
      configureScope(scope => scope.clear());
      captureMessage('knife');
      getCurrentHub().popScope();
    });
  });
});
