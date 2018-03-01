import { SentryBrowser, SentryBrowserOptions } from '@sentry/browser';
import {
  Adapter,
  Breadcrumb,
  Client,
  Context,
  SentryEvent,
  User,
} from '@sentry/core';

declare var window: any;
declare var document: any;

const CORDOVA_DEVICE_RDY_TIMEOUT = 10000;

export interface ISentryBrowserConstructable<T> {
  new (client: Client, options?: SentryBrowserOptions): T;
}

export interface SentryCordovaOptions extends SentryBrowserOptions {
  deviceReadyTimeout?: number;
  sentryBrowser?: ISentryBrowserConstructable<SentryBrowser>;
}

export class SentryCordova implements Adapter {
  private browser: SentryBrowser;
  private client: Client;
  private deviceReadyCallback: any;
  private internalOptions: { [key: string]: string } = {};

  private PLUGIN_NAME = 'Sentry';
  private PATH_STRIP_RE = /^.*\/[^\.]+(\.app|CodePush|.*(?=\/))/;

  constructor(client: Client, public options: SentryCordovaOptions = {}) {
    this.client = client;
    if (!options.sentryBrowser) {
      throw new Error(
        'must pass SentryBrowser as an option { sentryBrowser: SentryBrowser }',
      );
    }
    this.browser = new options.sentryBrowser(client);
    return this;
  }

  public async install(): Promise<boolean> {
    await this.browser.install();
    // This will prefix frames in raven with app://
    // this is just a fallback if native is not available
    this.setupNormalizeFrames();

    return new Promise<boolean>((resolve, reject) => {
      if (this.isCordova()) {
        const timeout =
          this.options.deviceReadyTimeout || CORDOVA_DEVICE_RDY_TIMEOUT;
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
      .then(success => {
        this.tryToSetSentryRelease();
        return Promise.resolve(success);
      })
      .catch(reason => Promise.reject(reason));
  }

  public getBrowser(): any {
    return this.browser as any;
  }

  public async setOptions(options: SentryCordovaOptions): Promise<void> {
    Object.assign(this.options, options);
    return;
  }

  public captureException(exception: Error): Promise<SentryEvent> {
    return this.browser.captureException(exception);
  }

  public captureMessage(message: string): Promise<SentryEvent> {
    return this.browser.captureMessage(message);
  }

  public captureBreadcrumb(crumb: Breadcrumb): Promise<Breadcrumb> {
    return this.nativeCall('captureBreadcrumb', crumb);
  }

  public send(event: SentryEvent): Promise<void> {
    return this.nativeCall('send', event);
  }

  public async getContext(): Promise<Context> {
    return this.nativeCall('getContext');
  }

  public async setContext(context: Context): Promise<void> {
    if (context.extra) {
      await this.nativeCall('setExtraContext', context.extra);
    }
    if (context.user) {
      await this.nativeCall('setUserContext', context.user);
    }
    if (context.tags) {
      await this.nativeCall('setTagsContext', context.tags);
    }
  }

  public async clearContext(): Promise<any> {
    return this.nativeCall('clearContext');
  }

  public async setRelease(release: string): Promise<void> {
    return this.setInternalOption('release', release);
  }

  public async setDist(dist: string): Promise<void> {
    return this.setInternalOption('dist', dist);
  }

  public async setVersion(version: string): Promise<void> {
    return this.setInternalOption('version', version);
  }

  // Private helpers

  private setInternalOption(key: string, value: string): Promise<void> {
    return this.setContext({
      extra: {
        [`__sentry_${key}`]: value,
      },
    });
  }

  private tryToSetSentryRelease(): void {
    if (
      window.SENTRY_RELEASE !== undefined &&
      window.SENTRY_RELEASE.id !== undefined
    ) {
      this.setRelease(window.SENTRY_RELEASE.id);
      this.browser.getRaven().setRelease(window.SENTRY_RELEASE.id);
      this.client.log('received release from window.SENTRY_RELEASE');
    }
  }

  // ---------------------------------------

  // CORDOVA --------------------
  private isCordova(): boolean {
    return window.cordova !== undefined || window.Cordova !== undefined;
  }

  private nativeCall(action: string, ...args: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      const exec =
        window && (window as any).Cordova && (window as any).Cordova.exec;
      if (!exec) {
        reject('Cordova.exec not available');
      } else {
        (window as any).Cordova.exec(
          resolve,
          reject,
          this.PLUGIN_NAME,
          action,
          args,
        );
      }
    }).catch(e => {
      if (e === 'not implemented' || e === 'Cordova.exec not available') {
        // This is our fallback to the browser implementation
        const browserCast = this.browser as any;
        return browserCast[action](...args);
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
    this.nativeCall('install', this.client.dsn.toString(true), this.options)
      .then(resolve)
      .catch(reject);
  }

  // ----------------------------------------------------------
  // Raven

  private wrappedCallback(callback: any): (data: any, original: any) => void {
    function dataCallback(data: any, original: any): void {
      const normalizedData = callback(data) || data;
      if (original) {
        return original(normalizedData) || normalizedData;
      }
      return normalizedData;
    }
    return dataCallback;
  }

  private setupNormalizeFrames(): void {
    const raven = this.browser.getRaven();
    raven.setDataCallback(
      this.wrappedCallback((data: any) => {
        data = this.normalizeData(data);
      }),
    );
  }

  private normalizeUrl(url: string, pathStripRe: RegExp): string {
    return 'app://' + url.replace(/^file\:\/\//, '').replace(pathStripRe, '');
  }

  private normalizeData(data: any, pathStripRe?: RegExp): any {
    if (data.culprit) {
      data.culprit = this.normalizeUrl(data.culprit, this.PATH_STRIP_RE);
    }
    // NOTE: if data.exception exists, exception.values and exception.values[0] are
    // guaranteed to exist
    const stacktrace =
      data.stacktrace ||
      (data.exception && data.exception.values[0].stacktrace);
    if (stacktrace) {
      stacktrace.frames.forEach((frame: any) => {
        if (frame.filename !== '[native code]') {
          frame.filename = this.normalizeUrl(
            frame.filename,
            this.PATH_STRIP_RE,
          );
        }
      });
    }
    return data;
  }

  // -----------------------------------------------------------
}
