import { defaultIntegrations as defaultBrowserIntegrations } from '@sentry/browser';
import { Hub, initAndBind, makeMain } from '@sentry/core';
import { getGlobalObject } from '@sentry/utils';

import { CordovaOptions } from './backend';
import { CordovaClient } from './client';
import { Cordova } from './integrations';
import { CordovaScope } from './scope';
import { NATIVE } from './wrapper';

const DEFAULT_INTEGRATIONS = [...defaultBrowserIntegrations, new Cordova()];

const DEFAULT_OPTIONS: CordovaOptions = {
  enableNative: true,
  defaultIntegrations: DEFAULT_INTEGRATIONS,
  enableAutoSessionTracking: true,
  enableNdkScopeSync: false,
  attachThreads: false,
};

/**
 * Inits the SDK
 */
export function init(_options: Partial<CordovaOptions>): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const window = getGlobalObject<{ SENTRY_RELEASE?: string }>();

  const options = {
    ...DEFAULT_OPTIONS,
    release: window?.SENTRY_RELEASE,
    ..._options,
  };

  // Initialize a new hub using our scope with native sync
  const cordovaHub = new Hub(undefined, new CordovaScope());
  makeMain(cordovaHub);

  initAndBind(CordovaClient, options);
}

/**
 * If native client is available it will trigger a native crash.
 * Use this only for testing purposes.
 */
export function nativeCrash(): void {
  if (NATIVE.isNativeClientAvailable()) {
    NATIVE.crash();
  }
}
