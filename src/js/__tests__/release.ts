import { captureMessage, CordovaClient, CordovaOptions, Event, getCurrentHub, Integrations } from '../sentry-cordova';

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

describe('General', () => {
  beforeEach(() => {
    getCurrentHub().pushScope();
    (window as any).Cordova = {};
    (window as any).Cordova.exec = jest.fn((...params: any[]) => {
      if (params[3] === 'sendEvent') {
        params[0](false);
      } else if (params[3] === 'install') {
        params[0](true);
      }
    });
    callDeviceReady();
  });

  afterEach(() => {
    getCurrentHub().popScope();
    jest.clearAllTimers();
    clearTimeout(timeout);
  });

  test('setRelease from window', done => {
    expect.assertions(1);

    getCurrentHub().bindClient(
      new CordovaClient({
        ...defaultOptions,
        integrations: [new Integrations.Release()],
        beforeSend: (event: Event) => {
          expect((event.extra as any).__sentry_release).toBe('abc');
          done();
          return null;
        },
      })
    );

    (window as any).SENTRY_RELEASE = {};
    (window as any).SENTRY_RELEASE.id = 'abc';

    captureMessage('knife');
  });
});
