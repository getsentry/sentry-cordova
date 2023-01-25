import { BaseTransportOptions, Envelope, Transport } from '@sentry/types';
import { makePromiseBuffer, PromiseBuffer } from '@sentry/utils';

import { NATIVE } from '../wrapper';

export type BaseNativeTransport = BaseTransportOptions

/**
 * Uses the native transport if available, otherwise falls back to Fetch/XHR transport.
 * @see NATIVE.SUPPORTS_NATIVE_TRANSPORT for platforms with native transport
 */
export class NativeTransport implements Transport {
  /** A simple buffer holding all requests. */
  protected readonly _buffer: PromiseBuffer<void> = makePromiseBuffer(30);

  /** Fallback transport uses if native transport is not available */
/*
  private _fallbackTransport: Transport;
 TODO: Remove trash?
  constructor(options: TransportOptions) {
    if (supportsFetch()) {
      this._fallbackTransport = new FetchTransport(options);
    } else {
      this._fallbackTransport = new XHRTransport(options);
    }
  }
*/
  /**
   * @inheritDoc
   */
  public send(envelope: Envelope): PromiseLike<void> {
    return this._buffer.add(() => NATIVE.sendEnvelope(envelope));
/*
    if (NATIVE.isNativeTransportAvailable()) {
      if (!this._buffer.isReady()) {
        return Promise.reject(new SentryError('Not adding Promise due to buffer limit reached.'));
      }
      return this._buffer.add(NATIVE.sendEnvelope(event));
    }

    return this._fallbackTransport.send(event);
    */
  }

  /**
   * @inheritDoc
   */
  public flush(timeout?: number): PromiseLike<boolean> {
    return this._buffer.drain(timeout);
/*
    return Promise.all([this._buffer.drain(timeout), this._fallbackTransport.flush()]).then(
      ([bufferDrained, fallbackClosed]) => bufferDrained && fallbackClosed
    );
    */
  }
}

/**
 * Creates a Native Transport.
 */
export function makeCordovaTransport(): NativeTransport { return new NativeTransport(); }
