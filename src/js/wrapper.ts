/* eslint-disable max-lines */
import { getCurrentHub } from '@sentry/hub';
import { Event, Response, Severity } from '@sentry/types';
import { getGlobalObject, logger, SentryError } from '@sentry/utils';

import { CordovaOptions } from './backend';
import { CordovaDevicePlatform } from './types';

/**
 * Our internal interface for calling native functions
 */
export const NATIVE = {
  PLUGIN_NAME: 'Sentry',
  SUPPORTS_NATIVE_TRANSPORT: [CordovaDevicePlatform.Ios],
  /**
   * Starts native with the provided options.
   * @param options CordovaOptions
   */
  async startWithOptions(_options: CordovaOptions): Promise<boolean> {
    const options = {
      enableNative: true,
      ..._options,
    };

    this.enableNative = options.enableNative;

    if (!options.enableNative) {
      return false;
    }
    if (!options.dsn) {
      logger.warn(
        'Warning: No DSN was provided. The Sentry SDK will be disabled. Native SDK will also not be initialized.'
      );
      return false;
    }

    // filter out all the options that would crash native.
    /* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars */
    const { beforeSend, beforeBreadcrumb, integrations, defaultIntegrations, transport, ...filteredOptions } = options;
    /* eslint-enable @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars */

    return this._nativeCall('startWithOptions', filteredOptions)
      .then(() => {
        this._setupScopeListeners();

        this._nativeInitialized = true;

        return true;
      })
      .catch(() => false);
  },

  /**
   * Sending the event over the bridge to native
   * @param event Event
   */
  async sendEvent(event: Event): Promise<Response> {
    // TODO: Android version, currently Android uses browser's transport.

    if (!this.isNativeClientAvailable()) {
      throw this._NativeClientError;
    }

    // Process and convert deprecated levels
    event.level = event.level ? this._processLevel(event.level) : undefined;

    const header = {
      event_id: event.event_id,
      sdk: event.sdk,
    };

    const payload = {
      ...event,
      message: {
        message: event.message,
      },
    };

    // Serialize and remove any instances that will crash the native bridge such as Spans
    const serializedPayload = JSON.parse(JSON.stringify(payload));

    // The envelope item is created (and its length determined) on the iOS side of the native bridge.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this._nativeCall('captureEnvelope', {
      header,
      payload: serializedPayload,
    });
  },

  /**
   * Uses exec to call cordova functions
   * @param action name of the action
   * @param args Arguments
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async _nativeCall(action: string, ...args: any[]): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new Promise<any>((resolve, reject) => {
      if (!this.enableNative) {
        reject('enableNative = false, using browser transport');
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const _window = getGlobalObject<any>();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const exec = _window && _window.Cordova && _window.Cordova.exec;
      if (!exec) {
        reject('Cordova.exec not available');
      } else {
        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          _window.Cordova.exec(resolve, reject, this.PLUGIN_NAME, action, args);
        } catch (e) {
          reject('Cordova.exec not available');
        }
      }
    });
  },

  /**
   * Setups scope listeners
   * Note: This only works on iOS.
   * TODO: Update this to be an extended scope like on React Native
   */
  _setupScopeListeners(): void {
    /* eslint-disable  @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */
    const scope = getCurrentHub().getScope();
    if (scope) {
      scope.addScopeListener(internalScope => {
        this._nativeCall('setExtraContext', (internalScope as any)._extra).catch(() => {
          // We do nothing since scope is handled and attached to the event.
          // This only applies to android.
        });
        this._nativeCall('setTagsContext', (internalScope as any)._tags).catch(() => {
          // We do nothing since scope is handled and attached to the event.
          // This only applies to android.
        });
        this._nativeCall('setUserContext', (internalScope as any)._user).catch(() => {
          // We do nothing since scope is handled and attached to the event.
          // This only applies to android.
        });
        this._nativeCall('addBreadcrumb', (internalScope as any)._breadcrumbs.pop()).catch(() => {
          // We do nothing since scope is handled and attached to the event.
          // This only applies to android.
        });
      });
    }
    /* eslint-enable  @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */
  },

  /**
   * Convert js severity level which has critical and log to more widely supported levels.
   * @param level
   * @returns More widely supported Severity level strings
   */
  _processLevel(level: Severity): Severity {
    if (level === Severity.Critical) {
      return Severity.Fatal;
    }
    if (level === Severity.Log) {
      return Severity.Debug;
    }

    return level;
  },

  /**
   * Returns whether the native client is available.
   */
  isNativeClientAvailable(): boolean {
    return this.enableNative && this._nativeInitialized;
  },

  /**
   * Returns whether the native transport is available. Only returns true after `getPlatform` has been called.
   */
  isNativeTransportAvailable(): boolean {
    return this._didGetPlatform && this.SUPPORTS_NATIVE_TRANSPORT.includes(this.platform);
  },

  /**
   * Tries to get the platform if known, otherwise is 'unknown'.
   * Cordova does not have a global method of getting the current platform like React Native, so we need to implement this ourselves.
   */
  async getPlatform(): Promise<CordovaDevicePlatform> {
    this.platform = CordovaDevicePlatform.Unknown;

    try {
      if (this.enableNative) {
        this.platform = await this._nativeCall('getPlatform');
      }
    } catch (e) {
      // Do nothing
    }

    this._didGetPlatform = true;

    return this.platform;
  },

  _NativeClientError: new SentryError('Native Client is not available.'),

  enableNative: true,
  _nativeInitialized: false,

  /** Current platform that the SDK is running on, if detectable. Always `unknown` if `enableNative` = false */
  platform: CordovaDevicePlatform.Unknown,
  /** true if `getPlatform` has been called */
  _didGetPlatform: false,
};
