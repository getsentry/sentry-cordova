import { SentryBrowser } from '@sentry/browser';
import * as Sentry from '@sentry/core';
import { SentryCordova } from '../SentryCordova';
// tslint:disable-next-line:no-implicit-dependencies
const Raven = require('raven-js');

const dsn = 'https://username:password@domain/path';

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

beforeEach(() => {
  jest.resetAllMocks();
  (window as any).Cordova = {};
  (window as any).SENTRY_RELEASE = {};
  disableRavenInstrument();
});

describe('SentryCordova', () => {
  test('Successfully setup cordova', async () => {
    callDeviceReady();

    return expect(
      Sentry.create(dsn)
        .use(SentryCordova, { sentryBrowser: SentryBrowser })
        .install(),
    ).resolves.toBeTruthy();
  });

  test('No Cordova env', async () => {
    callDeviceReady();
    (window as any).Cordova = undefined;

    return expect(
      Sentry.create(dsn)
        .use(SentryCordova, { sentryBrowser: SentryBrowser })
        .install(),
    ).resolves.toBeTruthy();
  });

  test('Call install with cordovaExec', async done => {
    expect.assertions(2);

    callDeviceReady();

    (window as any).Cordova.exec = (...params) => {
      // params[0] == resolve
      // params[1] == reject
      // params[3] == function send/install .....
      expect(params[2]).toBe('Sentry');
      expect(params[3]).toBe('install');
      params[0](false);
      done();
    };

    await Sentry.create(dsn)
      .use(SentryCordova, { sentryBrowser: SentryBrowser })
      .install();
  });

  test('Call captureException', async done => {
    expect.assertions(3);
    callDeviceReady();

    (window as any).Cordova.exec = (...params) => {
      // params[0] == resolve
      // params[1] == reject
      // params[3] == function send/install .....
      if (params[3] === 'send') {
        const event = params[4][0]; // this is an event
        // raven._originalConsole.log(event.exception.values[0].type);
        expect(event.exception.values[0].type).toBe('Error');
        expect(event.exception.values[0].value).toBe('yo');
        expect(
          event.exception.values[0].stacktrace.frames[0].filename.indexOf(
            'app:///',
          ),
        ).toBe(0);
        done();
      }
      params[0](false); // we want to resolve it with false to not trigger capture breadcrumbs
    };

    await Sentry.create(dsn)
      .use(SentryCordova, { sentryBrowser: SentryBrowser })
      .install();

    Sentry.getSharedClient().captureException(new Error('yo'));
  });

  test('Call send with browser fallback', async done => {
    expect.assertions(1);
    callDeviceReady();

    (window as any).Cordova.exec = (...params) => {
      // params[0] == resolve
      // params[1] == reject
      // params[3] == function send/install .....
      if (params[3] === 'send') {
        params[1]('not implemented');
      } else {
        params[0](false); // to resolve it
      }
    };

    await Sentry.create(dsn)
      .use(SentryCordova, { sentryBrowser: SentryBrowser })
      .install();

    const browser = (Sentry.getSharedClient().getAdapter() as SentryCordova).getBrowser();
    browser.send = jest.fn();

    const spy1 = jest.spyOn(
      (Sentry.getSharedClient().getAdapter() as SentryCordova).getBrowser(),
      'send',
    );

    Sentry.getSharedClient()
      .send({ message: 'hey' })
      .then(() => {
        expect(spy1).toHaveBeenCalledTimes(1);
        done();
      });
  });

  test('Call reject native call', async done => {
    expect.assertions(1);
    callDeviceReady();

    (window as any).Cordova.exec = (...params) => {
      // params[0] == resolve
      // params[1] == reject
      // params[3] == function send/install .....
      if (params[3] === 'send') {
        params[1]('some error');
      } else {
        params[0](false); // to resolve it
      }
    };

    await Sentry.create(dsn)
      .use(SentryCordova, { sentryBrowser: SentryBrowser })
      .install();

    Sentry.getSharedClient()
      .send({ message: 'hey' })
      .catch(e => {
        expect(e).toBe('some error');
        done();
      });
  });

  test('No Browser in options', async () => {
    return expect(() => {
      Sentry.create(dsn)
        .use(SentryCordova)
        .install();
    }).toThrow();
  });

  test('Call setRelease from window', async done => {
    expect.assertions(4);
    (window as any).SENTRY_RELEASE = {};
    (window as any).SENTRY_RELEASE.id = 'abc';

    callDeviceReady();

    (window as any).Cordova.exec = (...params) => {
      // params[0] == resolve
      // params[1] == reject
      // params[3] == function send/install .....
      // raven._originalConsole.log(params);

      expect(params[2]).toBe('Sentry');
      if (params[3] === 'setExtraContext') {
        expect(params[4][0].__sentry_release).toBe('abc');
        done();
      } else if (params[3] === 'install') {
        params[0](false);
        expect(params[3]).toBe('install');
      }
    };

    await Sentry.create(dsn)
      .use(SentryCordova, { sentryBrowser: SentryBrowser })
      .install();
  });

  test('Call setRelease/setDist/setVersion', async done => {
    expect.assertions(9);

    callDeviceReady();

    (window as any).Cordova.exec = (...params) => {
      // params[0] == resolve
      // params[1] == reject
      // params[3] == function send/install .....
      // raven._originalConsole.log(params);
      expect(params[2]).toBe('Sentry');
      if (params[3] === 'setExtraContext') {
        if (params[4][0].__sentry_release) {
          expect(params[4][0].__sentry_release).toBe('xxx');
        }
        if (params[4][0].__sentry_dist) {
          expect(params[4][0].__sentry_dist).toBe('dist');
        }
        if (params[4][0].__sentry_version) {
          expect(params[4][0].__sentry_version).toBe('version');
          done();
        }
        params[0](true);
      } else if (params[3] === 'install') {
        params[0](false);
        expect(params[3]).toBe('install');
      }
    };

    await Sentry.create(dsn)
      .use(SentryCordova, { sentryBrowser: SentryBrowser })
      .install();

    const adapter = Sentry.getSharedClient().getAdapter() as SentryCordova;

    await adapter.setRelease('xxx');
    expect(adapter).toBeInstanceOf(SentryCordova);
    await adapter.setDist('dist');
    await adapter.setVersion('version');
  });

  test('Call setTagsContext', async done => {
    expect.assertions(4);

    callDeviceReady();

    (window as any).Cordova.exec = (...params) => {
      // params[0] == resolve
      // params[1] == reject
      // params[3] == function send/install .....
      // raven._originalConsole.log(params);
      expect(params[2]).toBe('Sentry');
      if (params[3] === 'setTagsContext') {
        expect(params[4][0].jest).toBe('yo');
        params[0](true);
        done();
      } else if (params[3] === 'install') {
        params[0](false);
        expect(params[3]).toBe('install');
      }
    };

    await Sentry.create(dsn)
      .use(SentryCordova, { sentryBrowser: SentryBrowser })
      .install();

    await Sentry.getSharedClient().setContext({ tags: { jest: 'yo' } });
  });

  test('Call setUserContext', async done => {
    expect.assertions(4);

    callDeviceReady();

    (window as any).Cordova.exec = (...params) => {
      // params[0] == resolve
      // params[1] == reject
      // params[3] == function send/install .....
      // raven._originalConsole.log(params);
      expect(params[2]).toBe('Sentry');
      if (params[3] === 'setUserContext') {
        expect(params[4][0].id).toBe('4433');
        params[0](true);
        done();
      } else if (params[3] === 'install') {
        params[0](false);
        expect(params[3]).toBe('install');
      }
    };

    await Sentry.create(dsn)
      .use(SentryCordova, { sentryBrowser: SentryBrowser })
      .install();

    await Sentry.getSharedClient().setContext({ user: { id: '4433' } });
  });

  test.only('Call getContext', async done => {
    expect.assertions(3);

    callDeviceReady();

    (window as any).Cordova.exec = (...params) => {
      // params[0] == resolve
      // params[1] == reject
      // params[3] == function send/install .....
      // raven._originalConsole.log(params);
      expect(params[2]).toBe('Sentry');
      if (params[3] === 'getContext') {
        params[0](true);
        done();
      } else if (params[3] === 'install') {
        params[0](false);
        expect(params[3]).toBe('install');
      }
    };

    await Sentry.create(dsn)
      .use(SentryCordova, { sentryBrowser: SentryBrowser })
      .install();

    await Sentry.getSharedClient().getContext();
  });

  test('Call captureBreadcrumb', async done => {
    expect.assertions(4);

    callDeviceReady();

    (window as any).Cordova.exec = (...params) => {
      // params[0] == resolve
      // params[1] == reject
      // params[3] == function send/install .....
      // raven._originalConsole.log(params);
      expect(params[2]).toBe('Sentry');
      if (params[3] === 'captureBreadcrumb') {
        expect(params[4][0].message).toBe('bread');
        params[0](true);
        done();
      } else if (params[3] === 'install') {
        params[0](false);
        expect(params[3]).toBe('install');
      }
    };

    await Sentry.create(dsn)
      .use(SentryCordova, { sentryBrowser: SentryBrowser })
      .install();

    await Sentry.getSharedClient().captureBreadcrumb({ message: 'bread' });
  });

  test('Call clearContext', async done => {
    expect.assertions(3);

    callDeviceReady();

    (window as any).Cordova.exec = (...params) => {
      // params[0] == resolve
      // params[1] == reject
      // params[3] == function send/install .....
      // raven._originalConsole.log(params);
      expect(params[2]).toBe('Sentry');
      if (params[3] === 'clearContext') {
        params[0](true);
        done();
      } else if (params[3] === 'install') {
        params[0](false);
        expect(params[3]).toBe('install');
      }
    };

    await Sentry.create(dsn)
      .use(SentryCordova, { sentryBrowser: SentryBrowser })
      .install();

    const adapter = Sentry.getSharedClient().getAdapter() as SentryCordova;
    await adapter.clearContext();
  });

  test('Call captureMessage', async done => {
    expect.assertions(3);

    callDeviceReady();

    (window as any).Cordova.exec = (...params) => {
      // params[0] == resolve
      // params[1] == reject
      // params[3] == function send/install .....
      // raven._originalConsole.log(params);
      if (params[3] === 'send') {
        const event = params[4][0]; // this is an event
        expect(event.message).toBe('bread');
        expect(event.platform).toBe('javascript');
        params[0](false);
        done();
      } else if (params[3] === 'install') {
        params[0](false);
        expect(params[3]).toBe('install');
      }
    };

    await Sentry.create(dsn)
      .use(SentryCordova, { sentryBrowser: SentryBrowser })
      .install();

    await Sentry.getSharedClient().captureMessage('bread');
  });

  test('Call setOptions', async done => {
    expect.assertions(5);

    callDeviceReady();

    (window as any).Cordova.exec = (...params) => {
      // params[0] == resolve
      // params[1] == reject
      // params[3] == function send/install .....
      // raven._originalConsole.log(params);
      expect(params[2]).toBe('Sentry');
      if (params[3] === 'install') {
        params[0](false);
        expect(params[3]).toBe('install');
      }
    };

    await Sentry.create(dsn)
      .use(SentryCordova, { sentryBrowser: SentryBrowser })
      .install();

    const adapater = Sentry.getSharedClient().getAdapter<SentryCordova>();
    expect(adapater).toBeInstanceOf(SentryCordova);
    expect(adapater.options.deviceReadyTimeout).toBeUndefined();
    adapater.setOptions({ deviceReadyTimeout: 1000 });
    expect(adapater.options.deviceReadyTimeout).toBe(1000);
    done();
  });

  test('DeviceReady to slow should reject', async () => {
    callDeviceReady();

    Sentry.create(dsn).use(SentryCordova, { sentryBrowser: SentryBrowser });

    Sentry.getSharedClient()
      .getAdapter<SentryCordova>()
      .setOptions({ deviceReadyTimeout: 1 });

    return expect(Sentry.getSharedClient().install()).rejects.toBe(
      "deviceready wasn't called for 1 ms",
    );
  });
});
