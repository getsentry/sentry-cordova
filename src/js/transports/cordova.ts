import type { BaseTransportOptions, Envelope, Transport } from '@sentry/types';
import type { PromiseBuffer } from '@sentry/utils';
import { makePromiseBuffer } from '@sentry/utils';

import { NATIVE } from '../wrapper';

export type BaseNativeTransport = BaseTransportOptions

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
  public send(envelope: Envelope): PromiseLike<void> {
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
export function makeCordovaTransport(): NativeTransport { return new NativeTransport(); }
