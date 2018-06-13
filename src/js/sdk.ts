import { initAndBind } from '@sentry/core';
import { CordovaOptions } from './backend';
import { CordovaClient } from './client';
import { Scope } from '@sentry/hub';
import { configureScope } from '@sentry/minimal';

export {
  addBreadcrumb,
  captureEvent,
  captureException,
  captureMessage,
  configureScope,
} from '@sentry/minimal';

export { Hub, Scope } from '@sentry/hub';

export function init(options: CordovaOptions): void {
  initAndBind(CordovaClient, options);
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

export function setVersion(version: string): void {
  configureScope((scope: Scope) => {
    scope.setExtra('__sentry_version', version);
  });
}
