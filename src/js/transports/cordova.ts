import type { BaseTransportOptions, Envelope, PromiseBuffer , Transport, TransportMakeRequestResponse } from '@sentry/core';
import { makePromiseBuffer } from '@sentry/core';

import { NATIVE } from '../wrapper';

export type BaseNativeTransport = BaseTransportOptions;

/**
 * Uses the native transport if available.
 * @see NATIVE.SUPPORTS_NATIVE_TRANSPORT for platforms with native transport
 */
export class NativeTransport implements Transport {
  /** A simple buffer holding all requests. */
  protected readonly _buffer: PromiseBuffer<void> = makePromiseBuffer(30);

  /**
   * @inheritDoc
   */
  public send(envelope: Envelope): PromiseLike<TransportMakeRequestResponse> {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    return this._buffer.add(() => NATIVE.sendEnvelope(envelope));
  }

  /**
   * @inheritDoc
   */
  public flush(timeout?: number): PromiseLike<boolean> {
    return this._buffer.drain(timeout);
  }
}

/**
 * Creates a Native Transport.
 */
export function makeCordovaTransport(): NativeTransport {
  return new NativeTransport();
}
