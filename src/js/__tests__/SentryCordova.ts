import { Browser } from '@sentry/browser';
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
        .use(SentryCordova, { browser: Browser })
        .install()
    ).resolves.toEqual(true);
  });

  test('Call install with cordovaExec', async done => {
    expect.assertions(2);
    const raven = Raven;
    raven._globalOptions.instrument = false;
    raven._globalOptions.autoBreadcrumbs = false;

    callDeviceReady();

    (window as any).Cordova.exec = (...params) => {
      // raven._originalConsole.log(params);
      expect(params[2]).toBe('Sentry');
      expect(params[3]).toBe('install');
      done();
    };

    await Sentry.create(dsn)
      .use(SentryCordova, { browser: Browser })
      .install();
  });

  test('Call captureException', async done => {
    expect.assertions(3);
    const raven = Raven;
    raven._globalOptions.instrument = false;
    raven._globalOptions.autoBreadcrumbs = false;
    callDeviceReady();

    (window as any).Cordova.exec = (...params) => {
      if (params[3] === 'send') {
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

  test('Call send with browser fallback', async done => {
    expect.assertions(1);
    const raven = Raven;
    raven._globalOptions.instrument = false;
    raven._globalOptions.autoBreadcrumbs = false;
    callDeviceReady();

    (window as any).Cordova.exec = (...params) => {
      if (params[3] === 'send') {
        params[1]('not implemented');
      } else {
        params[0](true); // to resolve it
      }
    };

    await Sentry.create(dsn)
      .use(SentryCordova, { browser: Browser })
      .install();

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

    // done();
  });

  test('No Browser in options', async () => {
    return expect(() => {
      Sentry.create(dsn)
        .use(SentryCordova)
        .install();
    }).toThrow();
  });
});
