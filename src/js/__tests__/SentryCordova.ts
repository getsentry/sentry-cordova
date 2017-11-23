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

    // console.log(raven);

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
});
