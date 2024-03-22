import type { BrowserOptions } from '@sentry/browser';

/**
 * Configuration options for the Sentry Cordova SDK.
 * @see CordovaFrontend for more information.
 */
export interface CordovaOptions
  extends Omit<BrowserOptions, 'autoSessionTracking'> {
  /**
   * Enables crash reporting for native crashes.
   * Defaults to `true`.
   */
  enableNative?: boolean;

  /** Should the native nagger alert be shown or not. */
  enableNativeNagger?: boolean;

  /**
   * Should sessions be tracked to Sentry Health or not.
   * Defaults to `true`.
   *
   * NOTE: Currently only supported on Android and iOS. Browser not yet supported.
   */
  enableAutoSessionTracking?: boolean;

  /** The interval to end a session if the App goes to the background. */
  sessionTrackingIntervalMillis?: number;

  /** Enable scope sync from Java to NDK on Android */
  enableNdkScopeSync?: boolean;

  /** When enabled, all the threads are automatically attached to all logged events on Android */
  attachThreads?: boolean;

  /**
  * Enables Out of Memory Tracking for iOS and macCatalyst.
  * See the following link for more information and possible restrictions:
  * https://docs.sentry.io/platforms/apple/guides/ios/configuration/out-of-memory/
  *
  * @default true
  * */
  enableWatchdogTerminationTracking?: boolean;

  /**
  * Enables Out of Memory Tracking for iOS and macCatalyst.
  * See the following link for more information and possible restrictions:
  * https://docs.sentry.io/platforms/apple/guides/ios/configuration/out-of-memory/
  *
  * @default true
  * @deprecated The method will be removed on a major update, instead, use enableWatchdogTerminationTracking for the same result.
  * */
  enableOutOfMemoryTracking?: boolean;

 /**
  * When enabled, the SDK tracks when the application stops responding for a specific amount of
  * time defined by the `appHangTimeoutInterval` option.
  *
  * iOS only
  *
  * @default true
  */
 enableAppHangTracking?: boolean;

 /**
  * The minimum amount of time an app should be unresponsive to be classified as an App Hanging.
  * The actual amount may be a little longer.
  * Avoid using values lower than 100ms, which may cause a lot of app hangs events being transmitted.
  * Value should be in seconds.
  *
  * iOS only
  *
  * @default 2
  */
 appHangTimeoutInterval?: number;
}
