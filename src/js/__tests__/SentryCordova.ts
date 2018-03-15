import { BrowserBackend } from '@sentry/browser';
import { CordovaBackend } from '../backend';
import { CordovaFrontend, SentryClient } from '../frontend';
// tslint:disable-next-line
const Raven = require('raven-js');

const dsn =
  'https://1e7e9e1f2a51437a802724a538b7051d:0443033dd67e4c2ea615e884ea4edc7a@sentry.io/304324';

function disableRavenInstrument(): void {
  const raven = Raven;
  raven._globalOptions.instrument = false;
  raven._globalOptions.autoBreadcrumbs = false;
}

function callDeviceReady(): void {
  setTimeout(() => {
    const e = document.createEvent('Events');
    e.initEvent('deviceready', true, false);
    document.dispatchEvent(e);
  }, 50);
}

describe('SentryCordova', () => {
  beforeEach(() => {
    (window as any).Cordova = {};
    (window as any).SENTRY_RELEASE = {};
    disableRavenInstrument();
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllTimers();
  });

  test('Successfully setup cordova', async () => {
    callDeviceReady();
    return expect(SentryClient.create({ dsn })).resolves.toBeUndefined();
  });

  test('No Cordova env', async () => {
    callDeviceReady();
    (window as any).Cordova = undefined;
    return expect(SentryClient.create({ dsn })).resolves.toBeUndefined();
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

    SentryClient.create({ dsn });
  });

  test('Call captureException', async done => {
    expect.assertions(3);
    callDeviceReady();

    (window as any).Cordova.exec = jest.fn((...params: any[]) => {
      // params[0] == resolve
      // params[1] == reject
      // params[3] == function send/install .....
      if (params[3] === 'sendEvent') {
        const event = params[4][0]; // this is an event
        // raven._originalConsole.log(event.exception.values[0].type);
        expect(event.exception[0].type).toBe('Error');
        expect(event.exception[0].value).toBe('yo');
        expect(
          event.exception[0].stacktrace.frames[0].filename.indexOf('app:///'),
        ).toBe(0);
        done();
      }
      params[0](false); // we want to resolve it with false to not trigger capture breadcrumbs
    });

    SentryClient.create({ dsn });

    SentryClient.captureException(new Error('yo'));
  });

  test('Call send with browser fallback', async done => {
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

    const frontend = new CordovaFrontend({ dsn });
    await frontend.install();
    const backend = (frontend as any).getBackend() as CordovaBackend;
    const browser = (backend as any).browserBackend as BrowserBackend;

    const spy1 = jest.spyOn(browser, 'sendEvent');

    frontend.captureMessage('hey').then(() => {
      expect(spy1).toHaveBeenCalledTimes(1);
      done();
    });
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

    SentryClient.create({ dsn });

    SentryClient.captureMessage('hey').catch(e => {
      expect(e).toBe('some error');
      done();
    });
  });

  test('Call setRelease from window', async done => {
    expect.assertions(4);

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
        expect(params[3]).toBe('install');
      }
    });

    (window as any).SENTRY_RELEASE = {};
    (window as any).SENTRY_RELEASE.id = 'abc';

    SentryClient.create({ dsn });
  });

  test('Call setRelease/setDist/setVersion', async done => {
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

    const frontend = new CordovaFrontend({ dsn });
    await frontend.install();
    await frontend.setRelease('xxx');
    await frontend.setDist('dist');
    await frontend.setVersion('version');
  });

  test('Call setTagsContext', async done => {
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

    SentryClient.create({ dsn });

    await SentryClient.setContext({ tags: { jest: 'yo' } });
  });

  test('Call setUserContext', async done => {
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

    SentryClient.create({ dsn });

    await SentryClient.setContext({ user: { id: '4433' } });
  });

  test('Call getContext', async done => {
    expect.assertions(1);

    callDeviceReady();

    (window as any).Cordova.exec = jest.fn((...params: any[]) => {
      // params[0] == resolve
      // params[1] == reject
      // params[3] == function send/install .....
      // raven._originalConsole.log(params);

      if (params[3] === 'loadContext') {
        params[0](true);
        expect(true).toBeTruthy();
        done();
      } else if (params[3] === 'install') {
        params[0](false);
      }
    });

    SentryClient.create({ dsn });

    await SentryClient.getContext();
  });

  // test('Call captureBreadcrumb', async done => {
  //   expect.assertions(4);

  //   callDeviceReady();

  //   (window as any).Cordova.exec = (...params) => {
  //     // params[0] == resolve
  //     // params[1] == reject
  //     // params[3] == function send/install .....
  //     // raven._originalConsole.log(params);
  //
  //     if (params[3] === 'captureBreadcrumb') {
  //       expect(params[4][0].message).toBe('bread');
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

  //   await Sentry.getSharedClient().captureBreadcrumb({ message: 'bread' });
  // });

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

  test('Call captureMessage', async done => {
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
      } else if (params[3] === 'loadContext') {
        params[0]({});
      } else if (params[3] === 'install') {
        params[0](false);
      }
    });

    SentryClient.create({ dsn });

    await SentryClient.captureMessage('bread');
  });

  test('Call setOptions', async done => {
    expect.assertions(2);

    callDeviceReady();

    const frontend = new CordovaFrontend({ dsn });
    await frontend.install();

    expect(frontend.getOptions().deviceReadyTimeout).toBeUndefined();
    await frontend.setOptions({ deviceReadyTimeout: 1000 });
    expect(frontend.getOptions().deviceReadyTimeout).toBe(1000);
    done();
  });

  test('DeviceReady to slow should reject', async () => {
    const frontend = new CordovaFrontend({ dsn, deviceReadyTimeout: 1 });
    callDeviceReady();
    return expect(frontend.install()).rejects.toBe(
      "deviceready wasn't called for 1 ms",
    );
  });
});
