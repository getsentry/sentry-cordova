import { BaseClient, Scope } from '@sentry/core';
import { Event, EventHint } from '@sentry/types';
import { SyncPromise } from '@sentry/utils';

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
  protected _prepareEvent(event: Event, scope?: Scope, hint?: EventHint): SyncPromise<Event | null> {
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

    return super._prepareEvent(event, scope, hint);
  }
}
