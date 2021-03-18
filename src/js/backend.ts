import { BrowserOptions } from '@sentry/browser';
import { BrowserBackend } from '@sentry/browser/dist/backend';
import { BaseBackend, NoopTransport } from '@sentry/core';
import { Event, EventHint, Severity, Transport } from '@sentry/types';
import { forget, getGlobalObject } from '@sentry/utils';

import { CordovaTransport } from './transports/cordova';
import { NATIVE } from './wrapper';

/**
 * Configuration options for the Sentry Cordova SDK.
 * @see CordovaFrontend for more information.
 */
export interface CordovaOptions extends BrowserOptions {
  /**
   * Enables crash reporting for native crashes.
   * Defaults to `true`.
   */
  enableNative: boolean;

  /**
   * Should sessions be tracked to Sentry Health or not.
   * Defaults to `true`.
   *
   * NOTE: Currently only supported on Android and iOS. Browser not yet supported.
   */
  enableAutoSessionTracking: boolean;

  /** The interval to end a session if the App goes to the background. */
  sessionTrackingIntervalMillis?: number;

  /** Enable scope sync from Java to NDK on Android */
  enableNdkScopeSync: boolean;

  /** When enabled, all the threads are automatically attached to all logged events on Android */
  attachThreads: boolean;
}

/** The Sentry Cordova SDK Backend. */
export class CordovaBackend extends BaseBackend<BrowserOptions> {
  private readonly _browserBackend: BrowserBackend;

  private readonly _deviceReadyCallback?: () => void;

  /** Creates a new cordova backend instance. */
  public constructor(protected readonly _options: CordovaOptions) {
    super(_options);
    this._browserBackend = new BrowserBackend(_options);

    if (this._isCordova() && _options.enableNative !== false) {
      this._deviceReadyCallback = () => {
        this._startOnNative();
      };
      getGlobalObject<Window>().document.addEventListener('deviceready', this._deviceReadyCallback);
    }
  }

  /**
   * @inheritDoc
   */
  public eventFromException(exception: unknown, hint?: EventHint): PromiseLike<Event> {
    return this._browserBackend.eventFromException(exception, hint);
  }

  /**
   * @inheritDoc
   */
  public eventFromMessage(message: string, level: Severity = Severity.Info, hint?: EventHint): PromiseLike<Event> {
    return this._browserBackend.eventFromMessage(message, level, hint);
  }

  /**
   * @inheritDoc
   */
  protected _setupTransport(): Transport {
    if (!this._options.dsn) {
      // We return the noop transport here in case there is no Dsn.
      return new NoopTransport();
    }

    const transportOptions = {
      ...this._options.transportOptions,
      dsn: this._options.dsn,
    };

    if (this._options.transport) {
      return new this._options.transport(transportOptions);
    }

    return new CordovaTransport(transportOptions);
  }

  // CORDOVA --------------------

  /**
   * Calling into native install function
   */
  private _startOnNative(): void {
    if (this._deviceReadyCallback) {
      getGlobalObject<Window>().document.removeEventListener('deviceready', this._deviceReadyCallback);

      forget(NATIVE.startWithOptions(this._options));
    }
  }

  /**
   * Has cordova on window?
   */
  private _isCordova(): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    return getGlobalObject<any>().cordova !== undefined || getGlobalObject<any>().Cordova !== undefined;
  }
}
