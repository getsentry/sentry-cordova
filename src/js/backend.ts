import { BrowserOptions } from '@sentry/browser';
import { BrowserBackend } from '@sentry/browser/dist/backend';
import { BaseBackend } from '@sentry/core';
import { Breadcrumb, Event, EventHint, Scope, Severity } from '@sentry/types';
import { forget, getGlobalObject, logger, SyncPromise } from '@sentry/utils';

const PLUGIN_NAME = 'Sentry';

/**
 * Configuration options for the Sentry Cordova SDK.
 * @see CordovaFrontend for more information.
 */
export interface CordovaOptions extends BrowserOptions {
  /**
   * Enables crash reporting for native crashes.
   * Defaults to `true`.
   */
  enableNative?: boolean;
}

/** The Sentry Cordova SDK Backend. */
export class CordovaBackend extends BaseBackend<BrowserOptions> {
  private readonly _browserBackend: BrowserBackend;

  private readonly _deviceReadyCallback?: () => void;

  /** Creates a new cordova backend instance. */
  public constructor(protected readonly _options: CordovaOptions = {}) {
    super(_options);
    this._browserBackend = new BrowserBackend(_options);

    if (this._isCordova() && _options.enableNative !== false) {
      this._deviceReadyCallback = () => {
        this._runNativeInstall();
      };
      getGlobalObject<Window>().document.addEventListener('deviceready', this._deviceReadyCallback);
    }
  }

  /**
   * @inheritDoc
   */
  public eventFromException(exception: any, hint?: EventHint): SyncPromise<Event> {
    return this._browserBackend.eventFromException(exception, hint);
  }

  /**
   * @inheritDoc
   */
  public eventFromMessage(message: string, level: Severity = Severity.Info, hint?: EventHint): SyncPromise<Event> {
    return this._browserBackend.eventFromMessage(message, level, hint);
  }

  /**
   * @inheritDoc
   */
  public sendEvent(event: Event): void {
    this._nativeCall('sendEvent', event).catch(e => {
      logger.warn(e);
      this._browserBackend.sendEvent(event);
    });
  }

  // CORDOVA --------------------
  /**
   * Uses exec to call cordova functions
   * @param action name of the action
   * @param args Arguments
   */
  private async _nativeCall(action: string, ...args: any[]): Promise<void> {
    return new Promise<any>((resolve, reject) => {
      if (this._options.enableNative === false) {
        reject('enableNative = false, using browser transport');
        return;
      }

      const _window = getGlobalObject<any>();
      // tslint:disable-next-line: no-unsafe-any
      const exec = _window && _window.Cordova && _window.Cordova.exec;
      if (!exec) {
        reject('Cordova.exec not available');
      } else {
        try {
          // tslint:disable-next-line: no-unsafe-any
          _window.Cordova.exec(resolve, reject, PLUGIN_NAME, action, args);
        } catch (e) {
          reject('Cordova.exec not available');
        }
      }
    });
  }

  /**
   * Calling into native install function
   */
  private _runNativeInstall(): void {
    if (this._deviceReadyCallback) {
      getGlobalObject<Window>().document.removeEventListener('deviceready', this._deviceReadyCallback);
      if (this._options.dsn && this._options.enabled !== false) {
        forget(this._nativeCall('install', this._options.dsn, this._options));
      }
    }
  }

  /**
   * Has cordova on window?
   */
  private _isCordova(): boolean {
    // tslint:disable-next-line: no-unsafe-any
    return getGlobalObject<any>().cordova !== undefined || getGlobalObject<any>().Cordova !== undefined;
  }

  /**
   * @inheritDoc
   */
  public storeBreadcrumb(breadcrumb: Breadcrumb): boolean {
    forget(this._nativeCall('addBreadcrumb', breadcrumb));
    return true;
  }

  /**
   * @inheritDoc
   */
  public storeScope(scope: Scope): void {
    forget(this._nativeCall('setExtraContext', (scope as any).extra));
    forget(this._nativeCall('setTagsContext', (scope as any).tags));
    forget(this._nativeCall('setUserContext', (scope as any).user));
  }
}
