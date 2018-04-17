import { initAndBind } from '@sentry/core';
import { CordovaOptions } from './backend';
import { CordovaFrontend } from './frontend';
import { setExtraContext as shimSetExtraContext } from '@sentry/shim';

export {
  addBreadcrumb,
  captureEvent,
  captureException,
  captureMessage,
  clearScope,
  popScope,
  pushScope,
  setExtraContext,
  setTagsContext,
  setUserContext,
} from '@sentry/shim';

export function create(options: CordovaOptions): void {
  initAndBind(CordovaFrontend, options);
}

export function setRelease(release: string): void {
  shimSetExtraContext({ __sentry_release: release });
}

export function setDist(dist: string): void {
  shimSetExtraContext({ __sentry_dist: dist });
}

export function setVersion(version: string): void {
  shimSetExtraContext({ __sentry_version: version });
}
