import { __awaiter, __rest } from "tslib";
import { getGlobalObject, logger, SentryError } from '@sentry/utils';
import { CordovaPlatformType } from './types';
import { getPlatform, processLevel, serializeObject } from './utils';
import { utf8ToBytes } from './vendor';
/**
 * Our internal interface for calling native functions
 */
export const NATIVE = {
    PLUGIN_NAME: 'Sentry',
    SUPPORTS_NATIVE_TRANSPORT: [CordovaPlatformType.Ios, CordovaPlatformType.Android],
    SUPPORTS_NATIVE_SCOPE_SYNC: [CordovaPlatformType.Ios, CordovaPlatformType.Android],
    SUPPORTS_NATIVE_SDK: [CordovaPlatformType.Android, CordovaPlatformType.Ios],
    /**
     * Starts native with the provided options.
     * @param options CordovaOptions
     */
    startWithOptions(_options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (_options.enableNative && this.SUPPORTS_NATIVE_SDK.includes(getPlatform())) {
                const options = Object.assign({ enableNative: true }, _options);
                this.enableNative = options.enableNative;
                if (!options.enableNative) {
                    return false;
                }
                if (!options.dsn) {
                    logger.warn('Warning: No DSN was provided. The Sentry SDK will be disabled. Native SDK will also not be initialized.');
                    return false;
                }
                // filter out all the options that would crash native.
                /* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars */
                const { beforeSend, beforeBreadcrumb, integrations, defaultIntegrations, transport } = options, filteredOptions = __rest(options, ["beforeSend", "beforeBreadcrumb", "integrations", "defaultIntegrations", "transport"]);
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
        });
    },
    /**
     * Sending the event over the bridge to native
     * @param event Event
     */
    sendEnvelope(envelope) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.enableNative) {
                throw this._DisabledNativeError;
            }
            if (!this.isNativeClientAvailable()) {
                throw this._NativeClientError;
            }
            const [EOL] = utf8ToBytes('\n');
            const [envelopeHeader, envelopeItems] = envelope;
            const headerString = JSON.stringify(envelopeHeader);
            let envelopeBytes = utf8ToBytes(headerString);
            envelopeBytes.push(EOL);
            for (const rawItem of envelopeItems) {
                const [itemHeader, itemPayload] = this._processItem(rawItem);
                let bytesContentType;
                let bytesPayload = [];
                if (typeof itemPayload === 'string') {
                    bytesContentType = 'text/plain';
                    bytesPayload = utf8ToBytes(itemPayload);
                }
                else if (itemPayload instanceof Uint8Array) {
                    bytesContentType = typeof itemHeader.content_type === 'string'
                        ? itemHeader.content_type
                        : 'application/octet-stream';
                    bytesPayload = [...itemPayload];
                }
                else {
                    bytesContentType = 'application/json';
                    bytesPayload = utf8ToBytes(JSON.stringify(itemPayload));
                }
                // Content type is not inside BaseEnvelopeItemHeaders.
                itemHeader.content_type = bytesContentType;
                itemHeader.length = bytesPayload.length;
                const serializedItemHeader = JSON.stringify(itemHeader);
                envelopeBytes.push(...utf8ToBytes(serializedItemHeader));
                envelopeBytes.push(EOL);
                envelopeBytes = envelopeBytes.concat(bytesPayload);
                envelopeBytes.push(EOL);
            }
            yield this._nativeCall('captureEnvelope', { envelope: envelopeBytes });
        });
    },
    /**
     * Uses exec to call cordova functions
     * @param action name of the action
     * @param args Arguments
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _nativeCall(action, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return new Promise((resolve, reject) => {
                if (!this.enableNative) {
                    reject('enableNative = false, using browser transport');
                    return;
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any, deprecation/deprecation
                const _window = getGlobalObject();
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                const exec = _window && _window.Cordova && _window.Cordova.exec;
                if (!exec) {
                    reject('Cordova.exec not available');
                }
                else {
                    try {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                        _window.Cordova.exec(resolve, reject, this.PLUGIN_NAME, action, args);
                    }
                    catch (e) {
                        reject('Cordova.exec not available');
                    }
                }
            });
        });
    },
    /**
     * Sets the user in the native scope.
     * Passing null clears the user.
     * @param key string
     * @param value string
     */
    setUser(user) {
        if (!this.isNativeScopeSyncAvailable()) {
            return;
        }
        // separate and serialze all non-default user keys.
        let defaultUserKeys = null;
        let otherUserKeys = null;
        if (user) {
            const { id, ip_address, email, username } = user, otherKeys = __rest(user, ["id", "ip_address", "email", "username"]);
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
    setTag(key, value) {
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
    setExtra(key, extra) {
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
    addBreadcrumb(breadcrumb) {
        if (!this.isNativeScopeSyncAvailable()) {
            return;
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        void this._nativeCall('addBreadcrumb', Object.assign(Object.assign({}, breadcrumb), { 
            // Process and convert deprecated levels
            level: breadcrumb.level ? processLevel(breadcrumb.level) : undefined, data: breadcrumb.data ? serializeObject(breadcrumb.data) : undefined }));
    },
    /**
     * Clears breadcrumbs on the native scope.
     */
    clearBreadcrumbs() {
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
    setContext(key, context) {
        if (!this.isNativeScopeSyncAvailable()) {
            return;
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        void this._nativeCall('setContext', key, context !== null ? serializeObject(context) : null);
    },
    /**
   * Gets the event from envelopeItem and applies the level filter to the selected event.
   * @param data An envelope item containing the event.
   * @returns The event from envelopeItem or undefined.
   */
    _processItem(item) {
        if (NATIVE.platform === 'android') {
            const [itemHeader, itemPayload] = item;
            if (itemHeader.type == 'event' || itemHeader.type == 'transaction') {
                const event = this._processLevels(itemPayload);
                if ('message' in event) {
                    // @ts-ignore Android still uses the old message object, without this the serialization of events will break.
                    event.message = { message: event.message };
                }
                /*
              We do this to avoid duplicate breadcrumbs on Android as sentry-android applies the breadcrumbs
              from the native scope onto every envelope sent through it. This scope will contain the breadcrumbs
              sent through the scope sync feature. This causes duplicate breadcrumbs.
              We then remove the breadcrumbs in all cases but if it is handled == false,
              this is a signal that the app would crash and android would lose the breadcrumbs by the time the app is restarted to read
              the envelope.
              Since unhandled errors from Javascript are not going to crash the App, we can't rely on the
              handled flag for filtering breadcrumbs.
                */
                if (event.breadcrumbs) {
                    event.breadcrumbs = [];
                }
                return [itemHeader, event];
            }
        }
        return item;
    },
    /**
     * Gets the event from envelopeItem and applies the level filter to the selected event.
     * @param data An envelope item containing the event.
     * @returns The event from envelopeItem or undefined.
     */
    _getEvent(envelopeItem) {
        if (envelopeItem[0].type == 'event' || envelopeItem[0].type == 'transaction') {
            return this._processLevels(envelopeItem[1]);
        }
        return undefined;
    },
    /**
     * Convert js severity level in event.level and event.breadcrumbs to more widely supported levels.
     * @param event
     * @returns Event with more widely supported Severity level strings
     */
    _processLevels(event) {
        var _a;
        const processed = Object.assign(Object.assign({}, event), { level: event.level ? this._processLevel(event.level) : undefined, breadcrumbs: (_a = event.breadcrumbs) === null || _a === void 0 ? void 0 : _a.map(breadcrumb => (Object.assign(Object.assign({}, breadcrumb), { level: breadcrumb.level
                    ? this._processLevel(breadcrumb.level)
                    : undefined }))) });
        return processed;
    },
    /**
     * Convert js severity level which has critical and log to more widely supported levels.
     * @param level
     * @returns More widely supported Severity level strings
     */
    _processLevel(level) {
        if (level == 'log') {
            return 'debug';
        }
        else if (level == 'critical') {
            return 'fatal';
        }
        return level;
    },
    /**
     * Triggers a native crash.
     * Use this only for testing purposes.
     */
    crash() {
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
    isNativeClientAvailable() {
        return this.enableNative && this._nativeInitialized;
    },
    /**
     * Returns whether the native transport is available.
     */
    isNativeTransportAvailable() {
        return this.isNativeClientAvailable() && this.SUPPORTS_NATIVE_TRANSPORT.includes(getPlatform());
    },
    /**
     * Returns whether native bridge supports scope sync.
     */
    isNativeScopeSyncAvailable() {
        return this.isNativeClientAvailable() && this.SUPPORTS_NATIVE_SCOPE_SYNC.includes(getPlatform());
    },
    _NativeClientError: new SentryError('Native Client is not available.'),
    _DisabledNativeError: new SentryError('Native is disabled'),
    enableNative: true,
    _nativeInitialized: false,
    /** true if `getPlatform` has been called */
    _didGetPlatform: false,
    platform: getPlatform().toString(),
};
//# sourceMappingURL=wrapper.js.map