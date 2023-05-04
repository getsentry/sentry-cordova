import { makePromiseBuffer } from '@sentry/utils';
import { NATIVE } from '../wrapper';
/**
 * Uses the native transport if available.
 * @see NATIVE.SUPPORTS_NATIVE_TRANSPORT for platforms with native transport
 */
export class NativeTransport {
    constructor() {
        /** A simple buffer holding all requests. */
        this._buffer = makePromiseBuffer(30);
    }
    /**
     * @inheritDoc
     */
    send(envelope) {
        return this._buffer.add(() => NATIVE.sendEnvelope(envelope));
    }
    /**
     * @inheritDoc
     */
    flush(timeout) {
        return this._buffer.drain(timeout);
    }
}
/**
 * Creates a Native Transport.
 */
export function makeCordovaTransport() { return new NativeTransport(); }
//# sourceMappingURL=cordova.js.map