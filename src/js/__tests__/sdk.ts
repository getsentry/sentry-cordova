import { getGlobalObject } from '@sentry/utils';

import type { CordovaOptions } from '../options';
import * as Sdk from '../sdk';

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
  });
});
