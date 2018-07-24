import { defaultIntegrations } from '@sentry/browser';
import { initAndBind } from '@sentry/core';
import { CordovaOptions } from './backend';
import { CordovaClient } from './client';
import { Cordova, Release, SDKInformation } from './integrations';
import { Scope } from '@sentry/hub';
import { configureScope } from '@sentry/minimal';

export function init(options: CordovaOptions): void {
  initAndBind(CordovaClient, options, [...defaultIntegrations, new Cordova(), new Release(), new SDKInformation()]);
}

export function setRelease(release: string): void {
  configureScope((scope: Scope) => {
    scope.setExtra('__sentry_release', release);
  });
}

export function setDist(dist: string): void {
  configureScope((scope: Scope) => {
    scope.setExtra('__sentry_dist', dist);
  });
}
