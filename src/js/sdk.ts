import { defaultIntegrations as defaultBrowserIntegrations } from '@sentry/browser';
import { Hub, initAndBind, makeMain } from '@sentry/core';
import { configureScope } from '@sentry/minimal';
import { Scope } from '@sentry/types';

import { CordovaOptions } from './backend';
import { CordovaClient } from './client';
import { Cordova, Release } from './integrations';
import { CordovaScope } from './scope';
import { NATIVE } from './wrapper';

const DEFAULT_INTEGRATIONS = [...defaultBrowserIntegrations, new Cordova(), new Release()];

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
  const options = {
    ...DEFAULT_OPTIONS,
    ..._options,
  };

  // Initialize a new hub using our scope with native sync
  const cordovaHub = new Hub(undefined, new CordovaScope());
  makeMain(cordovaHub);

  initAndBind(CordovaClient, options);
}

/**
 * Sets the release on the event.
 */
export function setRelease(release: string): void {
  configureScope((scope: Scope) => {
    scope.setExtra('__sentry_release', release);
  });
}

/**
 * Sets the dist on the event.
 */
export function setDist(dist: string): void {
  configureScope((scope: Scope) => {
    scope.setExtra('__sentry_dist', dist);
  });
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
