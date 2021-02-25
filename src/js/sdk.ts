import { defaultIntegrations } from '@sentry/browser';
import { Hub, initAndBind, makeMain } from '@sentry/core';
import { configureScope } from '@sentry/minimal';
import { Scope } from '@sentry/types';

import { CordovaOptions } from './backend';
import { CordovaClient } from './client';
import { Cordova, Release } from './integrations';
import { CordovaScope } from './scope';
import { NATIVE } from './wrapper';

/**
 * Inits the SDK
 */
export function init(_options: CordovaOptions): void {
  const options = {
    enableNative: true,
    defaultIntegrations: [...defaultIntegrations, new Cordova(), new Release()],
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
