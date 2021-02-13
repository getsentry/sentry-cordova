import { FetchTransport, XHRTransport } from '@sentry/browser/dist/transports';
import { Event, Response, Transport, TransportOptions } from '@sentry/types';
import { logger, PromiseBuffer, SentryError, supportsFetch } from '@sentry/utils';

import { NATIVE } from '../wrapper';

/**
 * Uses the native transport if available, otherwise falls back to Fetch/XHR transport.
 * @see NATIVE.SUPPORTS_NATIVE_TRANSPORT for platforms with native transport
 */
export class CordovaTransport implements Transport {
  /** A simple buffer holding all requests. */
  protected readonly _buffer: PromiseBuffer<Response> = new PromiseBuffer(30);

  /** Fallback transport uses if native transport is not available */
  private _fallbackTransport: Transport;

  constructor(options: TransportOptions) {
    if (supportsFetch()) {
      this._fallbackTransport = new FetchTransport(options);
    } else {
      this._fallbackTransport = new XHRTransport(options);
    }

    void this._checkNative();
  }

  /**
   * @inheritDoc
   */
  // @ts-ignore TODO: Need new JS version bump that uses PromiseLike instead of Promise otherwise this will error
  public sendEvent(event: Event): PromiseLike<Response> {
    // @ts-ignore TODO: For temporary debug purposes, DONT FORGET TO REMOVE!
    event.tags = {
      ...(event.tags ?? {}),
      isNativeTransportAvailable: `${NATIVE.isNativeTransportAvailable()}`,
    };

    if (NATIVE.isNativeTransportAvailable()) {
      if (!this._buffer.isReady()) {
        return Promise.reject(new SentryError('Not adding Promise due to buffer limit reached.'));
      }
      return this._buffer.add(NATIVE.sendEvent(event));
    }

    return this._fallbackTransport.sendEvent(event);
  }

  /**
   * @inheritDoc
   */
  // @ts-ignore TODO: Need new JS version bump that uses PromiseLike instead of Promise otherwise this will error
  public close(timeout?: number): PromiseLike<boolean> {
    return Promise.all([this._buffer.drain(timeout), this._fallbackTransport.close()]).then(responses =>
      responses.every(response => response)
    );
  }

  /**
   * Checks the platform to determine whether native transport is available.
   */
  private async _checkNative(): Promise<void> {
    await NATIVE.getPlatform();

    if (NATIVE.isNativeTransportAvailable()) {
      logger.log(`Native Transport is available, using Native Transport.`);
    } else {
      logger.log(`Native Transport is not available, using Browser Transport.`);
    }
  }
}
