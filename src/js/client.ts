import { BaseClient, Scope } from '@sentry/core';
import { SdkInfo, SentryEvent } from '@sentry/types';

import { CordovaBackend, CordovaOptions } from './backend';

declare var window: any;

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
  protected getSdkInfo(): SdkInfo {
    return {
      name: 'sentry-cordova',
      version: '0.10.2',
    };
  }

  /**
   * @inheritDoc
   */
  protected async prepareEvent(
    event: SentryEvent,
    scope?: Scope
  ): Promise<SentryEvent> {
    // We add SENTRY_RELEASE from window
    const release = window.SENTRY_RELEASE && window.SENTRY_RELEASE.id;

    if (release && !event.release) {
      if (scope) {
        const release = window.SENTRY_RELEASE && window.SENTRY_RELEASE.id;
        scope.setExtra('__sentry_release', release);
      }
      event = {
        release,
        ...event,
      };
    }

    return await super.prepareEvent(event, scope);
  }
}
