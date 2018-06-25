import { Integrations } from '@sentry/browser';
import { initAndBind } from '@sentry/core';
import { CordovaOptions } from './backend';
import { CordovaClient } from './client';
import { Scope } from '@sentry/hub';
import { configureScope } from '@sentry/minimal';

export function init(options: CordovaOptions): void {
  initAndBind(CordovaClient, options, [
    new Integrations.OnError(),
    new Integrations.OnUnhandledRejection(),
    new Integrations.FunctionToString(),
    new Integrations.TryCatch(),
    new Integrations.Breadcrumbs(),
  ]);
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
