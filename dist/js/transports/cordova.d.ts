import type { BaseTransportOptions, Envelope, Transport } from '@sentry/types';
import type { PromiseBuffer } from '@sentry/utils';
export declare type BaseNativeTransport = BaseTransportOptions;
/**
 * Uses the native transport if available.
 * @see NATIVE.SUPPORTS_NATIVE_TRANSPORT for platforms with native transport
 */
export declare class NativeTransport implements Transport {
    /** A simple buffer holding all requests. */
    protected readonly _buffer: PromiseBuffer<void>;
    /**
     * @inheritDoc
     */
    send(envelope: Envelope): PromiseLike<void>;
    /**
     * @inheritDoc
     */
    flush(timeout?: number): PromiseLike<boolean>;
}
/**
 * Creates a Native Transport.
 */
export declare function makeCordovaTransport(): NativeTransport;
//# sourceMappingURL=cordova.d.ts.map