import { BrowserBackend } from '@sentry/browser';
import { SentryEvent } from '@sentry/core';
import { CordovaOptions } from '../backend';
import { CordovaFrontend } from '../frontend';
import {
  addBreadcrumb,
  captureEvent,
  captureException,
  captureMessage,
  clearScope,
  create,
  popScope,
  pushScope,
  setDist,
  setExtraContext,
  setRelease,
  setTagsContext,
  setUserContext,
  setVersion,
} from '../sdk';

const dsn = 'https://1e7e9e1f2a51437a802724a538b7051d@sentry.io/304324';

const defaultOptions: CordovaOptions = {
  autoBreadcrumbs: false,
  dsn,
  instrument: false,
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

      create(defaultOptions);
    });
  });

  describe('Capture', () => {
    test('exception', done => {
      expect.assertions(3);
      callDeviceReady();

      (window as any).Cordova.exec = jest.fn(
        (
          resolve: (result: any) => void,
          reject: (error: any) => void,
          plugin: string,
          action: string,
          value: any,
        ) => {
          if (action === 'sendEvent') {
            const event = value[0]; // this is an event
            expect(event.exception[0].type).toBe('Error');
            expect(event.exception[0].value).toBe('yo');
            expect(
              event.exception[0].stacktrace.frames[0].filename.indexOf(
                'app://',
              ),
            ).toBe(0);
            done();
          }
        },
      );
      create(defaultOptions);
      captureException(new Error('yo'));
    });

    test('send with browser fallback', done => {
      expect.assertions(1);
      callDeviceReady();

      (window as any).Cordova.exec = jest.fn((...params: any[]) => {
        // params[0] == resolve
        // params[1] == reject
        // params[3] == function send/install .....
        if (params[3] === 'sendEvent') {
          params[1]('not implemented');
        }
      });

      const spy1 = jest.spyOn(BrowserBackend.prototype, 'sendEvent');
      pushScope(
        new CordovaFrontend({
          afterSend: (_: SentryEvent) => {
            expect(spy1).toHaveBeenCalledTimes(1);
            done();
          },
          dsn,
        }),
      );
      captureMessage('hey');
      popScope();
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
      create(defaultOptions);
      captureMessage('bread');
    });
  });

  describe('Breadcrumbs', () => {
    test('addBreadcrumb', done => {
      expect.assertions(2);

      callDeviceReady();

      pushScope(
        new CordovaFrontend({
          afterSend: (event: SentryEvent) => {
            expect(event.message).toBe('knife');
            expect(event.breadcrumbs![0].message).toBe('bread');
            done();
          },
          dsn,
        }),
      );

      addBreadcrumb({ message: 'bread' });
      captureMessage('knife');
      popScope();
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
      expect.hasAssertions();

      (window as any).SENTRY_RELEASE = {};
      (window as any).SENTRY_RELEASE.id = 'abc';

      pushScope(
        new CordovaFrontend({
          afterSend: (event: SentryEvent) => {
            expect((event.extra! as any).__sentry_release).toBe('abc');
            done();
          },
          dsn,
        }),
      );
      captureMessage('knife');
      popScope();
    });

    test('setRelease from window but event should be stronger', done => {
      expect.hasAssertions();

      (window as any).SENTRY_RELEASE = {};
      (window as any).SENTRY_RELEASE.id = 'abc';

      pushScope(
        new CordovaFrontend({
          afterSend: (event: SentryEvent) => {
            expect(event.release).toBe('xyz');
            done();
          },
          dsn,
        }),
      );
      captureEvent({ message: 'test', release: 'xyz' });
      popScope();
    });

    test('setRelease/setDist/setVersion', done => {
      expect.assertions(3);
      pushScope(
        new CordovaFrontend({
          afterSend: (event: SentryEvent) => {
            expect((event.extra! as any).__sentry_release).toBe('xxx');
            expect((event.extra! as any).__sentry_dist).toBe('dist');
            expect((event.extra! as any).__sentry_version).toBe('version');
            done();
          },
          dsn,
        }),
      );
      setRelease('xxx');
      setDist('dist');
      setVersion('version');
      captureMessage('knife');
      popScope();
    });

    test('setTagsContext', async done => {
      expect.assertions(1);
      pushScope(
        new CordovaFrontend({
          afterSend: (event: SentryEvent) => {
            expect(event.tags).toEqual({ jest: 'yo' });
            done();
          },
          dsn,
        }),
      );
      setTagsContext({ jest: 'yo' });
      captureMessage('knife');
      popScope();
    });

    test('setUserContext', async done => {
      expect.assertions(1);
      pushScope(
        new CordovaFrontend({
          afterSend: (event: SentryEvent) => {
            expect(event.user).toEqual({ id: '4433' });
            done();
          },
          dsn,
        }),
      );
      setUserContext({ id: '4433' });
      captureMessage('knife');
      popScope();
    });

    test('setUserContext', async done => {
      expect.assertions(1);
      pushScope(
        new CordovaFrontend({
          afterSend: (event: SentryEvent) => {
            expect((event.extra as any).id).toBe('44335');
            done();
          },
          dsn,
        }),
      );
      setExtraContext({ id: '44335' });
      captureMessage('knife');
      popScope();
    });

    test('clearScope', async done => {
      expect.assertions(1);
      pushScope(
        new CordovaFrontend({
          afterSend: (event: SentryEvent) => {
            expect((event.extra as any).id).toBeUndefined();
            done();
          },
          dsn,
        }),
      );
      setExtraContext({ id: '44335' });
      clearScope();
      captureMessage('knife');
      popScope();
    });
  });
});
