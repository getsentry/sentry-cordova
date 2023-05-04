import type { AttachmentItem, Breadcrumb, ClientReportItem, Envelope, EnvelopeItem, Event, EventItem, SessionItem, SeverityLevel, User, UserFeedbackItem } from '@sentry/types';
import { SentryError } from '@sentry/utils';
import type { CordovaOptions } from './options';
import { CordovaPlatformType } from './types';
/**
 * Our internal interface for calling native functions
 */
export declare const NATIVE: {
    PLUGIN_NAME: string;
    SUPPORTS_NATIVE_TRANSPORT: CordovaPlatformType[];
    SUPPORTS_NATIVE_SCOPE_SYNC: CordovaPlatformType[];
    SUPPORTS_NATIVE_SDK: CordovaPlatformType[];
    /**
     * Starts native with the provided options.
     * @param options CordovaOptions
     */
    startWithOptions(_options: CordovaOptions): Promise<boolean>;
    /**
     * Sending the event over the bridge to native
     * @param event Event
     */
    sendEnvelope(envelope: Envelope): Promise<void>;
    /**
     * Uses exec to call cordova functions
     * @param action name of the action
     * @param args Arguments
     */
    _nativeCall(action: string, ...args: any[]): Promise<any>;
    /**
     * Sets the user in the native scope.
     * Passing null clears the user.
     * @param key string
     * @param value string
     */
    setUser(user: User | null): void;
    /**
     * Sets a tag in the native module.
     * @param key string
     * @param value string
     */
    setTag(key: string, value: string): void;
    /**
     * Sets an extra in the native scope, will stringify
     * extra value if it isn't already a string.
     * @param key string
     * @param extra any
     */
    setExtra(key: string, extra: unknown): void;
    /**
     * Adds breadcrumb to the native scope.
     * @param breadcrumb Breadcrumb
     */
    addBreadcrumb(breadcrumb: Breadcrumb): void;
    /**
     * Clears breadcrumbs on the native scope.
     */
    clearBreadcrumbs(): void;
    /**
     * Sets context on the native scope. Not implemented in Android yet.
     * @param key string
     * @param context key-value map
     */
    setContext(key: string, context: {
        [key: string]: unknown;
    } | null): void;
    /**
   * Gets the event from envelopeItem and applies the level filter to the selected event.
   * @param data An envelope item containing the event.
   * @returns The event from envelopeItem or undefined.
   */
    _processItem(item: EnvelopeItem): EnvelopeItem;
    /**
     * Gets the event from envelopeItem and applies the level filter to the selected event.
     * @param data An envelope item containing the event.
     * @returns The event from envelopeItem or undefined.
     */
    _getEvent(envelopeItem: EventItem | AttachmentItem | UserFeedbackItem | SessionItem | ClientReportItem): Event | undefined;
    /**
     * Convert js severity level in event.level and event.breadcrumbs to more widely supported levels.
     * @param event
     * @returns Event with more widely supported Severity level strings
     */
    _processLevels(event: Event): Event;
    /**
     * Convert js severity level which has critical and log to more widely supported levels.
     * @param level
     * @returns More widely supported Severity level strings
     */
    _processLevel(level: SeverityLevel): SeverityLevel;
    /**
     * Triggers a native crash.
     * Use this only for testing purposes.
     */
    crash(): void;
    /**
     * Returns whether the native client is available.
     */
    isNativeClientAvailable(): boolean;
    /**
     * Returns whether the native transport is available.
     */
    isNativeTransportAvailable(): boolean;
    /**
     * Returns whether native bridge supports scope sync.
     */
    isNativeScopeSyncAvailable(): boolean;
    _NativeClientError: SentryError;
    _DisabledNativeError: SentryError;
    enableNative: boolean;
    _nativeInitialized: boolean;
    /** true if `getPlatform` has been called */
    _didGetPlatform: boolean;
    platform: string;
};
//# sourceMappingURL=wrapper.d.ts.map