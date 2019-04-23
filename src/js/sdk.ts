import { defaultIntegrations } from '@sentry/browser';
import { initAndBind } from '@sentry/core';
import { configureScope } from '@sentry/minimal';
import { Scope } from '@sentry/types';

import { CordovaOptions } from './backend';
import { CordovaClient } from './client';
import { Cordova, Release } from './integrations';

/**
 * Inits the SDK
 */
export function init(options: CordovaOptions): void {
  if (options.defaultIntegrations === undefined) {
    options.defaultIntegrations = [...defaultIntegrations, new Cordova(), new Release()];
  }
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
