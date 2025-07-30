/* eslint-disable max-lines */
// import { Severity } from '@sentry/types';
import { logger } from '@sentry/core';

import { NATIVE } from '../wrapper';

declare global {
  // eslint-disable-next-line no-var
  var Cordova: {
    exec: any;
  };
}

const setupGlobals = (): void => {
  // @ts-ignore Global
  global.Cordova = {
    exec: jest.fn((resolve) => resolve()),
  };

  // @ts-ignore Global
  global.cordova = {
    platformId: 'ios',
  };
};

beforeEach(() => {
  setupGlobals();

  NATIVE._nativeInitialized = false;
  NATIVE.enableNative = true;
});

describe('Tests Native Wrapper', () => {
  describe('startWithOptions', () => {
    test('calls native module', async () => {
      await NATIVE.startWithOptions({ dsn: 'test', enableNative: true });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(global.Cordova.exec).toBeCalledWith(
        expect.any(Function),
        expect.any(Function),
        NATIVE.PLUGIN_NAME,
        'startWithOptions',
        [{ dsn: 'test', enableNative: true }]
      );
    });

    test('warns if there is no dsn', async () => {
      logger.warn = jest.fn();

      await NATIVE.startWithOptions({ enableNative: true });

      expect(global.Cordova.exec).not.toBeCalled();

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(logger.warn).toHaveBeenLastCalledWith(
        'Warning: No DSN was provided. The Sentry SDK will be disabled. Native SDK will also not be initialized.'
      );
    });

    test('does not call native module with enableNative: false', async () => {
      await NATIVE.startWithOptions({
        dsn: 'test',
        enableNative: false,
      });

      expect(global.Cordova.exec).not.toBeCalled();
    });

    test('does not call native module on browser platform', async () => {
      global.cordova.platformId = 'browser';

      await NATIVE.startWithOptions({
        dsn: 'test',
        enableNative: true,
      });

      expect(global.Cordova.exec).not.toBeCalled();
    });
  });

  describe('crash', () => {
    test('calls the native crash', () => {
      NATIVE.enableNative = true;
      NATIVE._nativeInitialized = true;

      NATIVE.crash();

      expect(global.Cordova.exec).toBeCalledWith(
        expect.any(Function),
        expect.any(Function),
        NATIVE.PLUGIN_NAME,
        'crash',
        []
      );
    });
  });

  describe('setUser', () => {
    test('serializes all user object keys', async () => {
      NATIVE._nativeInitialized = true;

      NATIVE.setUser({
        email: 'hello@sentry.io',
        // @ts-ignore Intentional incorrect type to simulate using a double as an id (We had a user open an issue because this didn't work before) https://github.com/getsentry/sentry-react-native/pull/926
        id: 3.14159265359,
        unique: 123,
      });

      expect(global.Cordova.exec).toBeCalledWith(
        expect.any(Function),
        expect.any(Function),
        NATIVE.PLUGIN_NAME,
        'setUser',
        [
          {
            email: 'hello@sentry.io',
            id: '3.14159265359',
          },
          {
            unique: '123',
          },
        ]
      );
    });

    test('Calls native setUser with empty object as second param if no unique keys', async () => {
      NATIVE._nativeInitialized = true;

      NATIVE.setUser({
        id: 'Hello',
      });

      expect(global.Cordova.exec).toBeCalledWith(
        expect.any(Function),
        expect.any(Function),
        NATIVE.PLUGIN_NAME,
        'setUser',
        [
          {
            id: 'Hello',
          },
          {},
        ]
      );
    });
  });
});
