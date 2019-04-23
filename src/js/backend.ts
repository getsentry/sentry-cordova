import { BrowserOptions } from '@sentry/browser';
import { BrowserBackend } from '@sentry/browser/dist/backend';
import { BaseBackend } from '@sentry/core';
import { Breadcrumb, Event, EventHint, Scope, Severity } from '@sentry/types';
import { getGlobalObject, logger, SyncPromise } from '@sentry/utils';

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
  public constructor(options: CordovaOptions = {}) {
    super(options);
    this._browserBackend = new BrowserBackend(options);

    if (this._isCordova() && !options.enableNative) {
      this._deviceReadyCallback = () => {
        this._runNativeInstall();
      };
      getGlobalObject<Window>().document.addEventListener('deviceready', this._deviceReadyCallback);
    }
  }

  /**
   * @inheritDoc
   */
  public async eventFromException(exception: any, hint?: EventHint): SyncPromise<Event> {
    return this._browserBackend.eventFromException(exception, hint);
  }

  /**
   * @inheritDoc
   */
  public async eventFromMessage(
    message: string,
    level: Severity = Severity.Info,
    hint?: EventHint
  ): SyncPromise<Event> {
    return this._browserBackend.eventFromMessage(message, level, hint);
  }

  /**
   * @inheritDoc
   */
  public sendEvent(event: Event): void {
    try {
      this._nativeCall('sendEvent', event);
    } catch (e) {
      this._browserBackend.sendEvent(event);
    }
  }

  // CORDOVA --------------------
  /**
   * Uses exec to call cordova functions
   * @param action name of the action
   * @param args Arguments
   */
  private _nativeCall(action: string, ...args: any[]): void {
    new Promise<any>((resolve, reject) => {
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
    }).catch(e => {
      logger.error(e);
    });
  }

  /**
   * Calling into native install function
   */
  private _runNativeInstall(): void {
    if (this._deviceReadyCallback) {
      getGlobalObject<Window>().document.removeEventListener('deviceready', this._deviceReadyCallback);
      if (this._options.dsn && this._options.enabled !== false) {
        this._nativeCall('install', this._options.dsn, this._options);
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
    this._nativeCall('addBreadcrumb', breadcrumb);
    return true;
  }

  /**
   * @inheritDoc
   */
  public storeScope(scope: Scope): void {
    this._nativeCall('setExtraContext', (scope as any).extra);
    this._nativeCall('setTagsContext', (scope as any).tags);
    this._nativeCall('setUserContext', (scope as any).user);
  }
}
