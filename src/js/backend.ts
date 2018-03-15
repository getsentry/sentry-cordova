import {
  Backend,
  Breadcrumb,
  Context,
  Frontend,
  Options,
  SentryError,
  SentryEvent,
} from '@sentry/core';

import { BrowserBackend } from '@sentry/browser';

import { normalizeData } from './normalize';

const CORDOVA_DEVICE_RDY_TIMEOUT = 10000;
const PLUGIN_NAME = 'Sentry';

declare var window: any;
declare var document: any;

function isCordova(): boolean {
  return window.cordova !== undefined || window.Cordova !== undefined;
}

/**
 * Configuration options for the Sentry Cordova SDK.
 * @see CordovaFrontend for more information.
 */
export interface CordovaOptions extends Options {
  // TOOD
  deviceReadyTimeout?: number;
}

/** The Sentry Cordova SDK Backend. */
export class CordovaBackend implements Backend {
  /** Handle to the SDK frontend for callbacks. */
  private readonly frontend: Frontend<CordovaOptions>;
  /** In memory store for breadcrumbs. */
  private breadcrumbs: Breadcrumb[] = [];
  /** In memory store for context infos. */
  private context: Context = {};

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
  public async install(): Promise<boolean> {
    // We are only called by the frontend if the SDK is enabled and a valid DSN
    // has been configured. If no DSN is present, this indicates a programming
    // error.
    const dsn = this.frontend.getDSN();
    if (!dsn) {
      throw new SentryError(
        'Invariant exception: install() must not be called when disabled',
      );
    }

    await this.browserBackend.install();

    return new Promise<boolean>((resolve, reject) => {
      if (isCordova()) {
        const timeout =
          this.frontend.getOptions().deviceReadyTimeout ||
          CORDOVA_DEVICE_RDY_TIMEOUT;
        const deviceReadyTimeout = setTimeout(() => {
          reject(`deviceready wasn't called for ${timeout} ms`);
        }, timeout);
        this.deviceReadyCallback = () =>
          this.runInstall(resolve, reject, deviceReadyTimeout);
        document.addEventListener('deviceready', this.deviceReadyCallback);
      } else {
        // We are in a browser
        this.runInstall(resolve, reject);
      }
    })
      .then(async success => {
        await this.tryToSetSentryRelease();
        return Promise.resolve(success);
      })
      .catch(reason => Promise.reject(reason));
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
  public async storeContext(context: Context): Promise<void> {
    this.context = { ...context };
    await this.nativeCall('storeContext', this.context);
  }

  /**
   * @inheritDoc
   */
  public async loadContext(): Promise<Context> {
    return { ...this.context, ...(await this.nativeCall('loadContext')) };
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

  /**
   * @inheritDoc
   */
  public async storeBreadcrumbs(breadcrumbs: Breadcrumb[]): Promise<void> {
    // TODO
    this.breadcrumbs = [...breadcrumbs];
  }

  /**
   * @inheritDoc
   */
  public async loadBreadcrumbs(): Promise<Breadcrumb[]> {
    return [...this.breadcrumbs];
  }

  // CORDOVA --------------------
  public async setInternalOption(key: string, value: string): Promise<void> {
    return this.storeContext({
      extra: {
        [`__sentry_${key}`]: value,
      },
    });
  }

  private nativeCall(action: string, ...args: any[]): Promise<any> {
    // TODO
    // action=store and loadcontext do nothing
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
      if (e === 'not implemented' || e === 'Cordova.exec not available') {
        // This is our fallback to the browser implementation
        return (this.browserBackend as any)[action](...args);
      }
      throw e;
    });
  }

  private runInstall(
    resolve: (value?: boolean | PromiseLike<boolean>) => void,
    reject: (reason?: any) => void,
    deviceReadyTimeout?: NodeJS.Timer,
  ): void {
    if (deviceReadyTimeout) {
      document.removeEventListener('deviceready', this.deviceReadyCallback);
      clearTimeout(deviceReadyTimeout);
    }
    this.nativeCall(
      'install',
      this.frontend.getDSN(),
      this.frontend.getOptions(),
    )
      .then(resolve)
      .catch(reject);
  }

  private async tryToSetSentryRelease(): Promise<void> {
    if (
      window.SENTRY_RELEASE !== undefined &&
      window.SENTRY_RELEASE.id !== undefined
    ) {
      await this.setInternalOption('release', window.SENTRY_RELEASE.id);
      this.frontend.setOptions({ release: window.SENTRY_RELEASE.id });
    }
  }
}
