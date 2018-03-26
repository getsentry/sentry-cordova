import { createAndBind } from '@sentry/core';
import { CordovaOptions } from './backend';
import { CordovaFrontend } from './frontend';
import { setExtraContext as shimSetExtraContext } from '@sentry/shim';

export { addBreadcrumb, setUserContext } from '@sentry/core';
export {
  captureEvent,
  captureException,
  captureMessage,
  clearScope,
  popScope,
  pushScope,
  setExtraContext,
  setTagsContext,
} from '@sentry/shim';

export function create(options: CordovaOptions): void {
  createAndBind(CordovaFrontend, options);
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
