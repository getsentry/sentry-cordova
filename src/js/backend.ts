import { BrowserBackend, BrowserOptions } from '@sentry/browser';
import { Backend } from '@sentry/core';
import { Scope } from '@sentry/hub';
import { Breadcrumb, SentryEvent, SentryResponse, Status } from '@sentry/types';

const PLUGIN_NAME = 'Sentry';

declare var window: any;
declare var document: any;

/**
 * Configuration options for the Sentry Cordova SDK.
 * @see CordovaFrontend for more information.
 */
export interface CordovaOptions extends BrowserOptions {}

/** The Sentry Cordova SDK Backend. */
export class CordovaBackend implements Backend {
  private browserBackend: BrowserBackend;

  private deviceReadyCallback: any;

  /** Creates a new cordova backend instance. */
  public constructor(private readonly options: CordovaOptions = {}) {
    this.browserBackend = new BrowserBackend(options);
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
  public async sendEvent(event: SentryEvent): Promise<SentryResponse> {
    try {
      await this.nativeCall('sendEvent', event);
      // Otherwise this is from native response
      return { status: Status.Success };
    } catch (e) {
      return this.browserBackend.sendEvent(event);
    }
  }

  // CORDOVA --------------------
  public nativeCall(action: string, ...args: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      const exec = window && (window as any).Cordova && (window as any).Cordova.exec;
      if (!exec) {
        reject('Cordova.exec not available');
      } else {
        (window as any).Cordova.exec(resolve, reject, PLUGIN_NAME, action, args);
      }
    });
  }

  private runNativeInstall(): void {
    document.removeEventListener('deviceready', this.deviceReadyCallback);
    if (this.options.dsn && this.options.enabled !== false) {
      this.nativeCall('install', this.options.dsn, this.options);
    }
  }

  private isCordova(): boolean {
    return window.cordova !== undefined || window.Cordova !== undefined;
  }

  /**
   * @inheritDoc
   */
  public storeBreadcrumb(breadcrumb: Breadcrumb): boolean {
    this.nativeCall('addBreadcrumb', breadcrumb);
    return true;
  }

  /**
   * @inheritDoc
   */
  public storeScope(scope: Scope): void {
    this.nativeCall('setExtraContext', scope.getExtra());
    this.nativeCall('setTagsContext', scope.getTags());
    this.nativeCall('setUserContext', scope.getUser());
  }
}
