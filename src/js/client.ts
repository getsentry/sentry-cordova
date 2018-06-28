import { BaseClient } from '@sentry/core';
import { SdkInfo } from '@sentry/types';

import { CordovaBackend, CordovaOptions } from './backend';

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
  public getSdkInfo(): SdkInfo {
    return {
      name: 'sentry-cordova',
      version: '0.10.2',
    };
  }
}
