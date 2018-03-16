import { BrowserBackend } from '@sentry/browser';
import { SentryEvent } from '@sentry/core';
import { CordovaBackend, CordovaOptions } from '../backend';
import { CordovaFrontend, SentryClient } from '../frontend';

const dsn =
  'https://1e7e9e1f2a51437a802724a538b7051d:0443033dd67e4c2ea615e884ea4edc7a@sentry.io/304324';

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
    jest.resetAllMocks();
    jest.clearAllTimers();
    clearTimeout(timeout);
  });

  describe('Setup', () => {
    test('Success', async () => {
      callDeviceReady();
      return expect(
        SentryClient.create(defaultOptions),
      ).resolves.toBeUndefined();
    });

    test('No Cordova env', async () => {
      callDeviceReady();
      (window as any).Cordova = undefined;

      return expect(
        SentryClient.create(defaultOptions),
      ).resolves.toBeUndefined();
    });

    test('Call install with cordovaExec', async done => {
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

      SentryClient.create(defaultOptions);
    });
  });
  describe('Capture', () => {
    test('Exception', async done => {
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
            // raven._originalConsole.log(event.exception.values[0].type);
            expect(event.exception[0].type).toBe('Error');
            expect(event.exception[0].value).toBe('yo');
            expect(
              event.exception[0].stacktrace.frames[0].filename.indexOf(
                'app:///',
              ),
            ).toBe(0);
            done();
          }
          resolve(false); // we want to resolve it with false to not trigger capture breadcrumbs
        },
      );

      SentryClient.create(defaultOptions);

      SentryClient.captureException(new Error('yo'));
    });

    test('Send with browser fallback', async done => {
      expect.assertions(1);
      callDeviceReady();

      (window as any).Cordova.exec = jest.fn((...params: any[]) => {
        // params[0] == resolve
        // params[1] == reject
        // params[3] == function send/install .....
        if (params[3] === 'sendEvent') {
          params[1]('not implemented');
        } else {
          params[0](false); // to resolve it
        }
      });

      const frontend = new CordovaFrontend(defaultOptions);
      await frontend.install();
      const backend = (frontend as any).getBackend() as CordovaBackend;
      const browser = (backend as any).browserBackend as BrowserBackend;

      const spy1 = jest.spyOn(browser, 'sendEvent');

      frontend.captureMessage('hey').then(() => {
        expect(spy1).toHaveBeenCalledTimes(1);
        done();
      });
    });

    test('Message', async done => {
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
        } else if (params[3] === 'loadBreadcrumbs') {
          params[0]([]);
        } else if (params[3] === 'loadContext') {
          params[0]({});
        } else if (params[3] === 'install') {
          params[0](false);
        }
      });

      SentryClient.create(defaultOptions);

      await SentryClient.captureMessage('bread');
    });
  });

  describe('Breadcrumbs', () => {
    test('addBreadcrumb', async done => {
      expect.assertions(1);

      callDeviceReady();

      (window as any).Cordova.exec = jest.fn((...params: any[]) => {
        // params[0] == resolve
        // params[1] == reject
        // params[3] == function send/install .....
        // raven._originalConsole.log(params);

        if (params[3] === 'storeBreadcrumbs') {
          expect(params[4][0][0].message).toBe('bread');
          params[0](true);
          done();
        } else if (params[3] === 'loadBreadcrumbs') {
          params[0]([]);
        } else if (params[3] === 'install') {
          params[0](false);
        }
      });

      SentryClient.create(defaultOptions);

      await SentryClient.addBreadcrumb({ message: 'bread' });
    });

    test('add breadcrumbs to event', async done => {
      expect.assertions(3);

      callDeviceReady();

      (window as any).Cordova.exec = jest.fn((...params: any[]) => {
        // params[0] == resolve
        // params[1] == reject
        // params[3] == function send/install .....
        // raven._originalConsole.log(params);
        if (params[3] === 'storeBreadcrumbs') {
          expect(params[4][0][0].message).toBe('bread');
          params[0]();
        } else if (params[3] === 'sendEvent') {
          const event = params[4][0] as SentryEvent;
          expect(event.message).toBe('knife');
          // tslint:disable-next-line:no-non-null-assertion
          expect(event.breadcrumbs![0].message).toBe('bread');
          done();
        } else if (params[3] === 'loadContext') {
          params[0]({});
        } else if (params[3] === 'loadBreadcrumbs') {
          params[0]([]);
        } else if (params[3] === 'install') {
          params[0](false);
        }
      });

      SentryClient.create(defaultOptions);

      await SentryClient.addBreadcrumb({ message: 'bread' });
      await SentryClient.captureMessage('knife');
    });
  });

  // test('Call clearContext', async done => {
  //   expect.assertions(3);

  //   callDeviceReady();

  //   (window as any).Cordova.exec = (...params) => {
  //     // params[0] == resolve
  //     // params[1] == reject
  //     // params[3] == function send/install .....
  //     // raven._originalConsole.log(params);
  //
  //     if (params[3] === 'clearContext') {
  //       params[0](true);
  //       done();
  //     } else if (params[3] === 'install') {
  //       params[0](false);
  //       expect(params[3]).toBe('install');
  //     }
  //   };

  //   await Sentry.create(dsn)
  //     .use(SentryCordova, { sentryBrowser: SentryBrowser })
  //     .install();

  //   const adapter = Sentry.getSharedClient().getAdapter() as SentryCordova;
  //   await adapter.clearContext();
  // });
  describe('General', () => {
    test('setOptions', async done => {
      expect.assertions(2);

      callDeviceReady();

      const frontend = new CordovaFrontend(defaultOptions);
      await frontend.install();

      expect(frontend.getOptions().deviceReadyTimeout).toBeUndefined();
      await frontend.setOptions({ deviceReadyTimeout: 1000 });
      expect(frontend.getOptions().deviceReadyTimeout).toBe(1000);
      done();
    });

    test('getContext', async done => {
      callDeviceReady();

      (window as any).Cordova.exec = jest.fn((...params: any[]) => {
        // params[0] == resolve
        // params[1] == reject
        // params[3] == function send/install .....
        // raven._originalConsole.log(params);
        if (params[3] === 'loadContext') {
          params[0](true);
          done();
        } else if (params[3] === 'install') {
          params[0](false);
        }
      });

      SentryClient.create(defaultOptions);

      await SentryClient.getContext();
    });

    test('DeviceReady to slow should reject', async () => {
      const frontend = new CordovaFrontend({ dsn, deviceReadyTimeout: 1 });
      callDeviceReady();
      return expect(frontend.install()).rejects.toBe(
        "deviceready wasn't called for 1 ms",
      );
    });

    test('Call reject native call', async done => {
      expect.assertions(1);
      callDeviceReady();

      (window as any).Cordova.exec = jest.fn((...params: any[]) => {
        // params[0] == resolve
        // params[1] == reject
        // params[3] == function send/install .....
        if (params[3] === 'sendEvent') {
          params[1]('some error');
        } else {
          params[0](false); // to resolve it
        }
      });

      SentryClient.create(defaultOptions);

      SentryClient.captureMessage('hey').catch(e => {
        expect(e).toBe('some error');
        done();
      });
    });

    test('setRelease from window', async done => {
      expect.hasAssertions();

      callDeviceReady();

      (window as any).Cordova.exec = jest.fn((...params: any[]) => {
        // params[0] == resolve
        // params[1] == reject
        // params[3] == function send/install .....
        // raven._originalConsole.log(params);
        if (params[3] === 'storeContext') {
          expect(params[4][0].extra.__sentry_release).toBe('abc');
          done();
        } else if (params[3] === 'install') {
          params[0](false);
        }
      });

      (window as any).SENTRY_RELEASE = {};
      (window as any).SENTRY_RELEASE.id = 'abc';

      SentryClient.create(defaultOptions);
    });

    test('setRelease/setDist/setVersion', async done => {
      expect.assertions(4);

      callDeviceReady();

      (window as any).Cordova.exec = jest.fn((...params: any[]) => {
        // params[0] == resolve
        // params[1] == reject
        // params[3] == function send/install .....
        // raven._originalConsole.log(params);
        if (params[3] === 'storeContext') {
          if (params[4][0].extra.__sentry_release) {
            expect(params[4][0].extra.__sentry_release).toBe('xxx');
          }
          if (params[4][0].extra.__sentry_dist) {
            expect(params[4][0].extra.__sentry_dist).toBe('dist');
          }
          if (params[4][0].extra.__sentry_version) {
            expect(params[4][0].extra.__sentry_version).toBe('version');
            done();
          }
          params[0](true);
        } else if (params[3] === 'install') {
          params[0](false);
          expect(params[3]).toBe('install');
        }
      });

      const frontend = new CordovaFrontend(defaultOptions);
      await frontend.install();
      await frontend.setRelease('xxx');
      await frontend.setDist('dist');
      await frontend.setVersion('version');
    });

    test('setTagsContext', async done => {
      expect.assertions(1);

      callDeviceReady();

      (window as any).Cordova.exec = jest.fn((...params: any[]) => {
        // params[0] == resolve
        // params[1] == reject
        // params[3] == function send/install .....
        // raven._originalConsole.log(params);
        if (params[3] === 'storeContext') {
          expect(params[4][0].tags.jest).toBe('yo');
          params[0](true);
          done();
        } else if (params[3] === 'loadContext') {
          params[0]({});
        } else if (params[3] === 'install') {
          params[0](false);
        }
      });

      SentryClient.create(defaultOptions);

      await SentryClient.setContext({ tags: { jest: 'yo' } });
    });

    test('setUserContext', async done => {
      expect.assertions(1);

      callDeviceReady();

      (window as any).Cordova.exec = jest.fn((...params: any[]) => {
        // params[0] == resolve
        // params[1] == reject
        // params[3] == function send/install .....
        // raven._originalConsole.log(params);

        if (params[3] === 'storeContext') {
          expect(params[4][0].user.id).toBe('4433');
          params[0](true);
          done();
        } else if (params[3] === 'loadContext') {
          params[0]({});
        } else if (params[3] === 'install') {
          params[0](false);
        }
      });

      SentryClient.create(defaultOptions);

      await SentryClient.setContext({ user: { id: '4433' } });
    });
  });
});
