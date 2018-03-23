import { FrontendBase, Scope, SdkInfo, SentryEvent } from '@sentry/core';

import { CordovaBackend, CordovaOptions } from './backend';

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
    let prepared = await super.prepareEvent(event, scope);

    // We add SENTRY_RELEASE from window
    const release = window.SENTRY_RELEASE && window.SENTRY_RELEASE.id;

    if (release && !prepared.release) {
      const extra = {
        ...{ __sentry_release: window.SENTRY_RELEASE.id },
        ...prepared.extra,
      };
      prepared = {
        release,
        ...prepared,
        extra,
      };
    }

    return prepared;
  }
}
