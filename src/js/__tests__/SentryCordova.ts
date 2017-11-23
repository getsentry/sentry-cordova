import { Browser } from '@sentry/browser';
import * as Sentry from '@sentry/core';
import { SentryCordova } from '../SentryCordova';

const dsn = 'https://username:password@domain/path';

beforeEach(() => {
  jest.resetAllMocks();
  (window as any).Cordova = {};
});

function callDeviceReady() {
  setTimeout(() => {
    const e = document.createEvent('Events');
    e.initEvent('deviceready', true, false);
    document.dispatchEvent(e);
  }, 50);
}

describe('SentryCordova', () => {
  test('Fail setup cause cordova exec', async () => {
    callDeviceReady();
    return expect(
      Sentry.create(dsn)
        .use(SentryCordova, { browser: Browser })
        .install()
    ).rejects.toEqual('deviceready fired, cordovaExec still not available');
  });

  test('Call install with cordovaExec', async done => {
    expect.assertions(2);
    const raven = Browser.getRaven();
    raven._globalOptions.instrument = false;
    raven._globalOptions.autoBreadcrumbs = false;

    callDeviceReady();

    (window as any).Cordova.exec = (...params) => {
      expect(params[2]).toBe('Sentry');
      expect(params[3]).toBe('install');
      done();
    };

    await Sentry.create(dsn)
      .use(SentryCordova, { browser: Browser })
      .install();
  });

  test('captureException', async done => {
    expect.assertions(3);
    const raven = Browser.getRaven();
    raven._globalOptions.instrument = false;
    raven._globalOptions.autoBreadcrumbs = false;
    callDeviceReady();

    (window as any).Cordova.exec = (...params) => {
      if (params[3] === 'sendEvent') {
        const event = params[4][0]; // this is an event
        // raven._originalConsole.log(event.exception.values[0].type);
        expect(event.exception.values[0].type).toBe('Error');
        expect(event.exception.values[0].value).toBe('yo');
        expect(
          event.exception.values[0].stacktrace.frames[0].filename.indexOf('app:///')
        ).toBe(0);
      }
      params[0](true); // to resolve it
    };

    await Sentry.create(dsn)
      .use(SentryCordova, { browser: Browser })
      .install();

    Sentry.getSharedClient().captureException(new Error('yo'));

    done();
  });
});
