import { FrontendBase, Sdk, SdkInfo } from '@sentry/core';
import { CordovaBackend, CordovaOptions } from './backend';

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

  public async setRelease(release: string): Promise<void> {
    return this.getBackend().setInternalOption('release', release);
  }

  public async setDist(dist: string): Promise<void> {
    return this.getBackend().setInternalOption('dist', dist);
  }

  public async setVersion(version: string): Promise<void> {
    return this.getBackend().setInternalOption('version', version);
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
}

/**
 * The Sentry Cordova SDK Client.
 *
 * To use this SDK, call the {@link Sdk.create} function as early as possible
 * when loading the web page. To set context information or send manual events,
 * use the provided methods.
 *
 * @example
 * const { SentryClient } = require('@sentry/Cordova');
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
export const SentryClient = new Sdk(CordovaFrontend);
