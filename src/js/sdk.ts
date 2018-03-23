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

/**
 * The Sentry Cordova SDK Client.
 *
 * To use this SDK, call the {@link Sdk.create} function as early as possible
 * when loading the web page. To set context information or send manual events,
 * use the provided methods.
 *
 * @example
 * const { SentryClient } = require('@sentry/cordova');
 *
 * SentryClient.create({
 *   dsn: '__DSN__',
 *   // ...
 * });
 *
 * @example
 * SentryClient.setContext({
 *   extra: { battery: 0.7 },
 *   tags: { user_mode: 'admin' },
 *   user: { id: '4711' },
 * });
 *
 * @example
 * SentryClient.addBreadcrumb({
 *   message: 'My Breadcrumb',
 *   // ...
 * });
 *
 * @example
 * SentryClient.captureMessage('Hello, world!');
 * SentryClient.captureException(new Error('Good bye'));
 * SentryClient.captureEvent({
 *   message: 'Manual',
 *   stacktrace: [
 *     // ...
 *   ],
 * });
 *
 * @see CordovaOptions for documentation on configuration options.
 */
export function create(options: CordovaOptions): void {
  createAndBind(CordovaFrontend, options);
}

/*
 * TODO
 * @param breadcrumb
 */
export function setRelease(release: string): void {
  shimSetExtraContext({ __sentry_release: release });
}

/**
 * TODO
 * @param breadcrumb
 */
export function setDist(dist: string): void {
  shimSetExtraContext({ __sentry_dist: dist });
}

/**
 * TODO
 * @param breadcrumb
 */
export function setVersion(version: string): void {
  shimSetExtraContext({ __sentry_version: version });
}
