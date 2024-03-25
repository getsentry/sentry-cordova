import { getGlobalObject } from '@sentry/utils';

import type { CordovaOptions } from '../options';
import * as Sdk from '../sdk';
import { getPlatform } from '../utils';

const optionsTest: {
  current?: CordovaOptions;
} = {
  current: undefined,
};

jest.mock('@sentry/core', () => {
  const core = jest.requireActual('@sentry/core');

  return {
    ...core,
    initAndBind: jest.fn((_, options) => (optionsTest.current = options)),
    makeMain: jest.fn(),
  };
});

jest.mock('../utils', () => {
  const util = jest.requireActual('../utils');

  return {
    ...util,
    getPlatform: jest.fn().mockReturnValue('android'),
  };
});

describe('Tests SDK', () => {
  describe('init', () => {
    it('Uses SENTRY_RELEASE environment variable if present.', () => {
      const window = getGlobalObject<any>();
      window.SENTRY_RELEASE = {
        id: 'test-release',
      };

      Sdk.init({});

      expect(optionsTest.current?.release).toBe('test-release');
    });

    it('User release has precedence over SENTRY_RELEASE', () => {
      const window = getGlobalObject<any>();
      window.SENTRY_RELEASE = {
        id: 'test-release',
      };

      Sdk.init({
        release: 'user-release',
      });

      expect(optionsTest.current?.release).toBe('user-release');
    });

    describe('ios Options', () => {

      it('Should include iOS parameters when running on iOS', async () => {
        (getPlatform as jest.Mock).mockReturnValue('ios');

        const expectedOptions: CordovaOptions = {
          environment: 'abc',
          // iOS parameters
          enableAppHangTracking: true,
          appHangTimeoutInterval: 123
        };

        Sdk.init(expectedOptions);

        expect(optionsTest.current?.appHangTimeoutInterval).toEqual(expectedOptions.appHangTimeoutInterval);
        expect(optionsTest.current?.enableAppHangTracking).toEqual(expectedOptions.enableAppHangTracking);
      });

      it('Should not include iOS parameters when running on android', async () => {
        (getPlatform as jest.Mock).mockReturnValue('android');

        const expectedOption = {
          environment: 'abc'
        }
        const unexpectedOptions = {
          appHangTimeoutInterval: 123,
          enableAppHangTracking: true
        };

        Sdk.init({ ...unexpectedOptions, ...expectedOption });

        expect(optionsTest.current).not.toContain(unexpectedOptions);
        expect(optionsTest.current?.environment).toEqual(expectedOption.environment);
      });
    })

  });
});
