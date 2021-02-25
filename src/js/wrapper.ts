/* eslint-disable max-lines */
import { Breadcrumb, Event, Response, User } from '@sentry/types';
import { getGlobalObject, logger, SentryError } from '@sentry/utils';

import { CordovaOptions } from './backend';
import { CordovaPlatformType } from './types';
import { getPlatform, processLevel, serializeObject } from './utils';

/**
 * Our internal interface for calling native functions
 */
export const NATIVE = {
  PLUGIN_NAME: 'Sentry',
  SUPPORTS_NATIVE_TRANSPORT: [CordovaPlatformType.Ios, CordovaPlatformType.Android],
  SUPPORTS_NATIVE_SCOPE_SYNC: [CordovaPlatformType.Ios],
  SUPPORTS_NATIVE_SDK: [CordovaPlatformType.Android, CordovaPlatformType.Ios],
  /**
   * Starts native with the provided options.
   * @param options CordovaOptions
   */
  async startWithOptions(_options: CordovaOptions): Promise<boolean> {
    if (this.SUPPORTS_NATIVE_SDK.includes(getPlatform())) {
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
      const {
        beforeSend,
        beforeBreadcrumb,
        integrations,
        defaultIntegrations,
        transport,
        ...filteredOptions
      } = options;
      /* eslint-enable @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars */

      return this._nativeCall('startWithOptions', filteredOptions)
        .then(() => {
          this._nativeInitialized = true;

          return true;
        })
        .catch(() => {
          this._nativeInitialized = false;

          logger.warn('Warning: Native SDK was not initialized.');

          return false;
        });
    }

    this._nativeInitialized = false;

    return false;
  },

  /**
   * Sending the event over the bridge to native
   * @param event Event
   */
  async sendEvent(event: Event): Promise<Response> {
    if (!this.isNativeClientAvailable()) {
      throw this._NativeClientError;
    }
    if (!this.isNativeTransportAvailable()) {
      throw this._NativeTransportError;
    }

    // Process and convert deprecated levels
    event.level = event.level ? processLevel(event.level) : undefined;

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

    if (getPlatform() === CordovaPlatformType.Android) {
      const headerString = JSON.stringify(header);

      const payloadString = JSON.stringify(payload);
      let length = payloadString.length;
      try {
        length = await this._nativeCall('getStringBytesLength', payloadString);
      } catch {
        // The native call failed, we do nothing, we have payload.length as a fallback
      }

      const item = {
        content_type: 'application/json',
        length,
        type: payload.type ?? 'event',
      };

      const itemString = JSON.stringify(item);

      const envelopeString = `${headerString}\n${itemString}\n${payloadString}`;

      return this._nativeCall('captureEnvelope', envelopeString);
    }

    // Serialize and remove any instances that will crash the native bridge such as Spans
    const serializedPayload = JSON.parse(JSON.stringify(payload));

    // The envelope item is created (and its length determined) on the iOS side of the native bridge.
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
   * Sets the user in the native scope.
   * Passing null clears the user.
   * @param key string
   * @param value string
   */
  setUser(user: User | null): void {
    if (!this.isNativeScopeSyncAvailable()) {
      return;
    }

    // separate and serialze all non-default user keys.
    let defaultUserKeys = null;
    let otherUserKeys = null;
    if (user) {
      const { id, ip_address, email, username, ...otherKeys } = user;
      defaultUserKeys = serializeObject({
        email,
        id,
        ip_address,
        username,
      });
      otherUserKeys = serializeObject(otherKeys);
    }

    void this._nativeCall('setUser', defaultUserKeys, otherUserKeys);
  },

  /**
   * Sets a tag in the native module.
   * @param key string
   * @param value string
   */
  setTag(key: string, value: string): void {
    if (!this.isNativeScopeSyncAvailable()) {
      return;
    }

    const stringifiedValue = typeof value === 'string' ? value : JSON.stringify(value);

    void this._nativeCall('setTag', key, stringifiedValue);
  },

  /**
   * Sets an extra in the native scope, will stringify
   * extra value if it isn't already a string.
   * @param key string
   * @param extra any
   */
  setExtra(key: string, extra: unknown): void {
    if (!this.isNativeScopeSyncAvailable()) {
      return;
    }
    // we stringify the extra as native only takes in strings.
    const stringifiedExtra = typeof extra === 'string' ? extra : JSON.stringify(extra);

    void this._nativeCall('setExtra', key, stringifiedExtra);
  },

  /**
   * Adds breadcrumb to the native scope.
   * @param breadcrumb Breadcrumb
   */
  addBreadcrumb(breadcrumb: Breadcrumb): void {
    if (!this.isNativeScopeSyncAvailable()) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    void this._nativeCall('addBreadcrumb', {
      ...breadcrumb,
      // Process and convert deprecated levels
      level: breadcrumb.level ? processLevel(breadcrumb.level) : undefined,
      data: breadcrumb.data ? serializeObject(breadcrumb.data) : undefined,
    });
  },

  /**
   * Clears breadcrumbs on the native scope.
   */
  clearBreadcrumbs(): void {
    if (!this.isNativeScopeSyncAvailable()) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    void this._nativeCall('clearBreadcrumbs');
  },

  /**
   * Sets context on the native scope. Not implemented in Android yet.
   * @param key string
   * @param context key-value map
   */
  setContext(key: string, context: { [key: string]: unknown } | null): void {
    if (!this.isNativeScopeSyncAvailable()) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    void this._nativeCall('setContext', key, context !== null ? serializeObject(context) : null);
  },

  /**
   * Triggers a native crash.
   * Use this only for testing purposes.
   */
  crash(): void {
    if (!this.enableNative) {
      return;
    }
    if (!this.isNativeClientAvailable()) {
      throw this._NativeClientError;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    void this._nativeCall('crash');
  },

  /**
   * Returns whether the native client is available.
   */
  isNativeClientAvailable(): boolean {
    return this.enableNative && this._nativeInitialized;
  },

  /**
   * Returns whether the native transport is available.
   */
  isNativeTransportAvailable(): boolean {
    return this.isNativeClientAvailable() && this.SUPPORTS_NATIVE_TRANSPORT.includes(getPlatform());
  },

  /**
   * Returns whether native bridge supports scope sync.
   */
  isNativeScopeSyncAvailable(): boolean {
    return this.isNativeClientAvailable() && this.SUPPORTS_NATIVE_SCOPE_SYNC.includes(getPlatform());
  },

  _NativeClientError: new SentryError('Native Client is not available.'),
  _NativeTransportError: new SentryError('Native Transport is not available.'),

  enableNative: true,
  _nativeInitialized: false,

  /** true if `getPlatform` has been called */
  _didGetPlatform: false,
};
