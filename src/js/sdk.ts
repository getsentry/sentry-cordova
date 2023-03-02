import type { BrowserOptions } from '@sentry/browser';
import { defaultIntegrations, init as browserInit } from '@sentry/browser';
import { Hub, makeMain } from '@sentry/core';
import { getGlobalObject } from '@sentry/utils';

import { Cordova, EventOrigin, SdkInfo } from './integrations';
import type { CordovaOptions } from './options';
import { CordovaScope } from './scope';
import { makeCordovaTransport } from './transports/cordova';
import { NATIVE } from './wrapper';
const DEFAULT_OPTIONS: CordovaOptions = {
  enableNative: true,
  enableAutoSessionTracking: true,
  enableNdkScopeSync: false,
  attachThreads: false,
};

/**
 * Inits the SDK
 */
export function init(options: Partial<CordovaOptions>): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, deprecation/deprecation
  const window = getGlobalObject<{ SENTRY_RELEASE?: { id?: string } }>();

  const finalOptions = {
    enableAutoSessionTracking: true,
    enableOutOfMemoryTracking: true,
    ...DEFAULT_OPTIONS,
    release: window?.SENTRY_RELEASE?.id,
    ...options,
  };

  if (finalOptions.enabled === false ||
    NATIVE.platform === 'browser') {
    finalOptions.enableNative = false;
    finalOptions.enableNativeNagger = false;
  } else {
    // keep the original value if user defined it.
    if (finalOptions.enableNativeNagger === undefined) {
      finalOptions.enableNativeNagger = true;
    }
    if (finalOptions.enableNative === undefined) {
      finalOptions.enableNative = true;
    }
  }

  // Initialize a new hub using our scope with native sync
  const cordovaHub = new Hub(undefined, new CordovaScope());
  makeMain(cordovaHub);

  finalOptions.defaultIntegrations = [
    ...defaultIntegrations,
    new SdkInfo(),
    new EventOrigin(),
    new Cordova(),
  ];

  if (!options.transport && finalOptions.enableNative) {
    finalOptions.transport = options.transport || makeCordovaTransport;
  }

  const browserOptions = {
    ...finalOptions,
    autoSessionTracking:
      NATIVE.platform === 'browser' && finalOptions.enableAutoSessionTracking,
  } as BrowserOptions;

  const mobileOptions = {
    ...finalOptions,
    enableAutoSessionTracking:
      NATIVE.platform !== 'browser' && finalOptions.enableAutoSessionTracking,
  } as CordovaOptions;

  // We first initialize the NATIVE SDK to avoid the Javascript SDK to invoke any
  // feature from the NATIVE SDK without the options being set.
  void NATIVE.startWithOptions(mobileOptions);
  browserInit(browserOptions);
}

/**
 * If native client is available it will trigger a native crash.
 * Use this only for testing purposes.
 */
export function nativeCrash(): void {
  if (NATIVE.isNativeClientAvailable()) {
    NATIVE.crash();
  }
}
