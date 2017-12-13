import { ISentryBrowserOptions, SentryBrowser } from '@sentry/browser';
import { Client, Event, IAdapter, IBreadcrumb, IUser } from '@sentry/core';

declare var window: any;
declare var document: any;

const CORDOVA_DEVICE_RDY_TIMEOUT = 10000;

export interface ISentryBrowserConstructable<T> {
  new (client: Client, options?: ISentryBrowserOptions): T;
}

export interface ISentryCordovaOptions {
  testOption?: boolean;
  sentryBrowser?: ISentryBrowserConstructable<SentryBrowser>;
}

export class SentryCordova implements IAdapter {
  private browser: SentryBrowser;
  private client: Client;
  private deviceReadyCallback: any;
  private internalOptions: { [key: string]: string } = {};

  private PLUGIN_NAME = 'Sentry';
  private PATH_STRIP_RE = /^.*\/[^\.]+(\.app|CodePush|.*(?=\/))/;

  constructor(client: Client, public options: ISentryCordovaOptions = {}) {
    this.client = client;
    if (!options.sentryBrowser) {
      throw new Error(
        'must pass SentryBrowser as an option { sentryBrowser: SentryBrowser }'
      );
    }
    this.browser = new options.sentryBrowser(client);
    return this;
  }

  public async install() {
    this.browser.setOptions({
      allowDuplicates: true,
    });
    await this.browser.install();
    // This will prefix frames in raven with app://
    // this is just a fallback if native is not available
    this.setupNormalizeFrames();

    let gResolve: (value?: boolean | PromiseLike<boolean> | undefined) => void = () => {
      this.client.log('resolve not set');
    };
    let gReject: (reason?: any) => void = (reason?: any) => {
      this.client.log(reason);
    };

    const promise = new Promise<boolean>((resolve, reject) => {
      gResolve = resolve;
      gReject = reject;
    });

    if (document) {
      if (this.isCordova()) {
        const deviceReadyTimeout = setTimeout(() => {
          gReject(`deviceready wasn't called for ${CORDOVA_DEVICE_RDY_TIMEOUT} ms`);
        }, CORDOVA_DEVICE_RDY_TIMEOUT);
        this.deviceReadyCallback = () =>
          this.runInstall(gResolve, gReject, deviceReadyTimeout);
        document.addEventListener('deviceready', this.deviceReadyCallback);
      } else {
        // We are in a browser
        this.runInstall(gResolve, gReject);
      }
    } else {
      gReject('document not available');
    }

    return promise
      .then(success => {
        if (success && this.isCordova()) {
          // We only want to register the breadcrumbcallback on success and running on
          // Cordova otherwise we will get an endless loop
          this.browser.setBreadcrumbCallback(crumb => this.captureBreadcrumb(crumb));
        }
        this.tryToSetSentryRelease();
        return Promise.resolve(success);
      })
      .catch(reason => Promise.reject(reason));
  }

  public getBrowser(): any {
    return this.browser as any;
  }

  public setOptions(options: ISentryCordovaOptions) {
    Object.assign(this.options, options);
    return this;
  }

  public captureException(exception: Error) {
    return this.browser.captureException(exception);
  }

  public captureMessage(message: string) {
    return this.browser.captureMessage(message);
  }

  public captureBreadcrumb(crumb: IBreadcrumb) {
    return this.nativeCall('captureBreadcrumb', crumb);
  }

  public send(event: Event) {
    return this.nativeCall('send', event);
  }

  public setUserContext(user?: IUser) {
    this.nativeCall('setUserContext', user);
    return this;
  }

  public setTagsContext(tags?: { [key: string]: any }) {
    this.nativeCall('setTagsContext', tags);
    return this;
  }

  public setExtraContext(extra?: { [key: string]: any }) {
    this.nativeCall('setExtraContext', extra);
    return this;
  }

  public clearContext() {
    this.nativeCall('clearContext');
    return this;
  }

  public setRelease(release: string) {
    this.setInternalOption('release', release);
  }

  public setDist(dist: string) {
    this.setInternalOption('dist', dist);
  }

  public setVersion(version: string) {
    this.setInternalOption('version', version);
  }

  // Private helpers

  private setInternalOption(key: string, value: string) {
    this.setExtraContext({
      [`__sentry_${key}`]: value,
    });
  }

  private tryToSetSentryRelease() {
    if (window.sentryRelease !== undefined && window.sentryRelease.id !== undefined) {
      this.setRelease(window.sentryRelease.id);
      this.browser.getRaven().setRelease(window.sentryRelease.id);
      this.client.log('received release from w.sentryRelease');
    }
  }

  // ---------------------------------------

  // CORDOVA --------------------
  private isCordova() {
    return window.cordova !== undefined || window.Cordova !== undefined;
  }

  private nativeCall(action: string, ...args: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      const exec = window && (window as any).Cordova && (window as any).Cordova.exec;
      if (!exec) {
        reject('Cordova.exec not available');
      } else {
        (window as any).Cordova.exec(resolve, reject, this.PLUGIN_NAME, action, args);
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
    deviceReadyTimeout?: NodeJS.Timer
  ) {
    if (deviceReadyTimeout) {
      document.removeEventListener('deviceready', this.deviceReadyCallback);
      clearTimeout(deviceReadyTimeout);
    }
    this.nativeCall('install', this.client.dsn.getDsn(true), this.options)
      .then(resolve)
      .catch(reject);
  }

  // ----------------------------------------------------------
  // Raven

  private wrappedCallback(callback: any) {
    function dataCallback(data: any, original: any) {
      const normalizedData = callback(data) || data;
      if (original) {
        return original(normalizedData) || normalizedData;
      }
      return normalizedData;
    }
    return dataCallback;
  }

  private setupNormalizeFrames() {
    const raven = this.browser.getRaven();
    raven.setDataCallback(
      this.wrappedCallback((data: any) => {
        data = this.normalizeData(data);
        // TODO
        // if (internalDataCallback) {
        //   internalDataCallback(data);
        // }
      })
    );
  }

  private normalizeUrl(url: string, pathStripRe: RegExp) {
    return 'app://' + url.replace(/^file\:\/\//, '').replace(pathStripRe, '');
  }

  private normalizeData(data: any, pathStripRe?: RegExp) {
    if (!pathStripRe) {
      pathStripRe = this.PATH_STRIP_RE;
    }
    if (data.culprit) {
      data.culprit = this.normalizeUrl(data.culprit, pathStripRe);
    }
    // NOTE: if data.exception exists, exception.values and exception.values[0] are
    // guaranteed to exist
    const stacktrace =
      data.stacktrace || (data.exception && data.exception.values[0].stacktrace);
    if (stacktrace) {
      stacktrace.frames.forEach((frame: any) => {
        if (frame.filename !== '[native code]' && pathStripRe) {
          frame.filename = this.normalizeUrl(frame.filename, pathStripRe);
        }
      });
    }
    return data;
  }

  // -----------------------------------------------------------
}
