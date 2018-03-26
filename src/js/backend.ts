import { Backend, Frontend, SentryEvent } from '@sentry/core';
import { BrowserBackend, BrowserOptions } from '@sentry/browser';

import { normalizeData } from './normalize';

const PLUGIN_NAME = 'Sentry';

declare var window: any;
declare var document: any;

/**
 * Configuration options for the Sentry Cordova SDK.
 * @see CordovaFrontend for more information.
 */
export interface CordovaOptions extends BrowserOptions {
  autoBreadcrumbs?: boolean;
  instrument?: boolean;
}

/** The Sentry Cordova SDK Backend. */
export class CordovaBackend implements Backend {
  /** Handle to the SDK frontend for callbacks. */
  private readonly frontend: Frontend<CordovaOptions>;

  private browserBackend: BrowserBackend;

  private deviceReadyCallback: any;

  /** Creates a new cordova backend instance. */
  public constructor(frontend: Frontend<CordovaOptions>) {
    this.frontend = frontend;
    this.browserBackend = new BrowserBackend(this.frontend);
  }

  /**
   * @inheritDoc
   */
  public install(): boolean {
    this.browserBackend.install();

    if (this.isCordova()) {
      this.deviceReadyCallback = () => this.runNativeInstall();
      document.addEventListener('deviceready', this.deviceReadyCallback);
    }

    return true;
  }

  /**
   * @inheritDoc
   */
  public async eventFromException(exception: any): Promise<SentryEvent> {
    return this.browserBackend.eventFromException(exception);
  }

  /**
   * @inheritDoc
   */
  public async eventFromMessage(message: string): Promise<SentryEvent> {
    return this.browserBackend.eventFromMessage(message);
  }

  /**
   * @inheritDoc
   */
  public async sendEvent(event: SentryEvent): Promise<number> {
    const mergedEvent = {
      ...normalizeData(event),
    };
    return this.nativeCall('sendEvent', mergedEvent);
  }

  // CORDOVA --------------------
  public nativeCall(action: string, ...args: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      const exec =
        window && (window as any).Cordova && (window as any).Cordova.exec;
      if (!exec) {
        reject('Cordova.exec not available');
      } else {
        (window as any).Cordova.exec(
          resolve,
          reject,
          PLUGIN_NAME,
          action,
          args,
        );
      }
    }).catch(e => {
      if (
        (e === 'not implemented' || e === 'Cordova.exec not available') &&
        (this.browserBackend as any)[action]
      ) {
        // This is our fallback to the browser implementation
        return (this.browserBackend as any)[action](...args);
      }
    });
  }

  private runNativeInstall(): void {
    document.removeEventListener('deviceready', this.deviceReadyCallback);
    if (this.frontend.getDSN()) {
      this.nativeCall(
        'install',
        this.frontend.getDSN()!.toString(),
        this.frontend.getOptions(),
      );
    }
  }

  private isCordova(): boolean {
    return window.cordova !== undefined || window.Cordova !== undefined;
  }
}
