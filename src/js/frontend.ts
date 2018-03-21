import {
  Breadcrumb,
  FrontendBase,
  Scope,
  SdkInfo,
  SentryEvent,
  User,
} from '@sentry/core';
import {
  addBreadcrumb as shimAddBreadcrumb,
  bindClient,
  getCurrentClient,
  setExtraContext as shimSetExtraContext,
  setUserContext as shimSetUserContext,
} from '@sentry/shim';
// tslint:disable-next-line:no-submodule-imports
import { forget } from '@sentry/utils/dist/lib/async';
import { CordovaBackend, CordovaOptions } from './backend';

export {
  captureEvent,
  captureException,
  captureMessage,
  popScope,
  pushScope,
  setExtraContext,
  setTagsContext,
} from '@sentry/shim';

declare var window: any;

/**
 * The Sentry Cordova SDK Frontend.
 *
 * @see CordovaOptions for documentation on configuration options.
 * @see SentryClient for usage documentation.
 */
export class CordovaFrontend extends FrontendBase<
  CordovaBackend,
  CordovaOptions
> {
  /**
   * Creates a new Cordova SDK instance.
   * @param options Configuration options for this SDK.
   */
  public constructor(options: CordovaOptions) {
    super(CordovaBackend, options);
  }

  /**
   * @inheritDoc
   */
  protected getSdkInfo(): SdkInfo {
    return {
      name: 'sentry-cordova',
      version: '0.7.0',
    };
  }

  /**
   * @inheritDoc
   */
  protected async prepareEvent(
    event: SentryEvent,
    scope: Scope,
  ): Promise<SentryEvent> {
    if (
      window.SENTRY_RELEASE !== undefined &&
      window.SENTRY_RELEASE.id !== undefined
    ) {
      scope.context = {
        ...{ extra: { __sentry_release: window.SENTRY_RELEASE.id } },
        ...scope.context.extra,
      };
    }
    const prepared = await super.prepareEvent(event, scope);
    return prepared;
  }
}

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
// tslint:disable-next-line:variable-name
export function create(options: CordovaOptions): void {
  if (!getCurrentClient()) {
    const client = new CordovaFrontend(options);
    forget(client.install());
    bindClient(client);
  }
}

/**
 * TODO
 * @param breadcrumb
 */
export function addBreadcrumb(breadcrumb: Breadcrumb): void {
  shimAddBreadcrumb(breadcrumb);
}

/**
 * TODO
 * @param breadcrumb
 */
export function setUserContext(user: User): void {
  shimSetUserContext(user);
}

/**
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
