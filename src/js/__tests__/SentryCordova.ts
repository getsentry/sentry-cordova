import { SentryBrowser } from '@sentry/browser';
import * as Sentry from '@sentry/core';
import { SentryCordova } from '../SentryCordova';
const Raven = require('raven-js');

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
  test('Successfully setup cordova', async () => {
    callDeviceReady();
    const raven = Raven;
    raven._globalOptions.instrument = false;
    raven._globalOptions.autoBreadcrumbs = false;

    return expect(
      Sentry.create(dsn)
        .use(SentryCordova, { sentryBrowser: SentryBrowser })
        .install()
    ).resolves.toBeTruthy();
  });

  test('Call install with cordovaExec', async done => {
    expect.assertions(2);
    const raven = Raven;
    raven._globalOptions.instrument = false;
    raven._globalOptions.autoBreadcrumbs = false;

    callDeviceReady();

    (window as any).Cordova.exec = (...params) => {
      // params[0] == resolve
      // params[1] == reject
      // params[3] == function send/install .....
      // raven._originalConsole.log(params);
      expect(params[2]).toBe('Sentry');
      expect(params[3]).toBe('install');
      done();
    };

    await Sentry.create(dsn)
      .use(SentryCordova, { sentryBrowser: SentryBrowser })
      .install();
  });

  test('Call captureException', async done => {
    expect.assertions(3);
    const raven = Raven;
    raven._globalOptions.instrument = false;
    raven._globalOptions.autoBreadcrumbs = false;
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
          event.exception.values[0].stacktrace.frames[0].filename.indexOf('app:///')
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
    const raven = Raven;
    raven._globalOptions.instrument = false;
    raven._globalOptions.autoBreadcrumbs = false;
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
      'send'
    );

    Sentry.getSharedClient()
      .send({ message: 'hey' })
      .then(() => {
        expect(spy1).toHaveBeenCalledTimes(1);
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
});
