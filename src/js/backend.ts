import { BrowserOptions } from '@sentry/browser';
import { BrowserBackend } from '@sentry/browser/dist/backend';
import { BaseBackend, getCurrentHub } from '@sentry/core';
import { Event, EventHint, Severity } from '@sentry/types';
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
      // tslint:disable:no-unsafe-any
      const scope = getCurrentHub().getScope();
      if (scope) {
        scope.addScopeListener(internalScope => {
          this._nativeCall('setExtraContext', (internalScope as any)._extra).catch(() => {
            // We do nothing since scope is handled and attached to the event.
            // This only applies to android.
          });
          this._nativeCall('setTagsContext', (internalScope as any)._tags).catch(() => {
            // We do nothing since scope is handled and attached to the event.
            // This only applies to android.
          });
          this._nativeCall('setUserContext', (internalScope as any)._user).catch(() => {
            // We do nothing since scope is handled and attached to the event.
            // This only applies to android.
          });
          this._nativeCall('addBreadcrumb', (internalScope as any)._breadcrumbs.pop()).catch(() => {
            // We do nothing since scope is handled and attached to the event.
            // This only applies to android.
          });
        });
      }
      // tslint:enable:no-unsafe-any
    }
  }

  /**
   * Has cordova on window?
   */
  private _isCordova(): boolean {
    // tslint:disable-next-line: no-unsafe-any
    return getGlobalObject<any>().cordova !== undefined || getGlobalObject<any>().Cordova !== undefined;
  }
}
