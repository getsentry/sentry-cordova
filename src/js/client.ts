import { BaseClient, Scope } from '@sentry/core';
import { SentryEvent, SentryEventHint } from '@sentry/types';
import { CordovaBackend, CordovaOptions } from './backend';
import { SDK_NAME, SDK_VERSION } from './version';

/**
 * The Sentry Cordova SDK Client.
 *
 * @see CordovaOptions for documentation on configuration options.
 * @see SentryClient for usage documentation.
 */
export class CordovaClient extends BaseClient<CordovaBackend, CordovaOptions> {
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
  protected async prepareEvent(event: SentryEvent, scope?: Scope, hint?: SentryEventHint): Promise<SentryEvent | null> {
    event.platform = event.platform || 'javascript';
    event.sdk = {
      ...event.sdk,
      name: SDK_NAME,
      packages: [
        ...((event.sdk && event.sdk.packages) || []),
        {
          name: 'npm:sentry-cordova',
          version: SDK_VERSION,
        },
      ],
      version: SDK_VERSION,
    };

    return super.prepareEvent(event, scope, hint);
  }
}
