import { Browser } from '@sentry/browser';
import { Client, Event, IAdapter, IBreadcrumb, IUser } from '@sentry/core';

declare var window;
declare var document;

const CORDOVA_DEVICE_RDY_TIMEOUT = 10000;

export interface ICordovaOptions {
  testOption?: boolean;
  browser?: Browser;
}

export class SentryCordova implements IAdapter {
  private browser: Browser;
  private client: Client;
  private deviceReadyCallback: any;

  private PLUGIN_NAME = 'Sentry';
  private PATH_STRIP_RE = /^.*\/[^\.]+(\.app|CodePush|.*(?=\/))/;

  constructor(client: Client, public options: ICordovaOptions = {}) {
    this.client = client;
    if (!options.browser) {
      throw new Error('must pass Browser as an option { browser: Browser }');
    }
    this.browser = new options.browser(client);
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

    let gResolve = null;
    let gReject = null;

    const promise = new Promise<boolean>((resolve, reject) => {
      gResolve = resolve;
      gReject = reject;
    });

    if (document) {
      const deviceReadyTimeout = setTimeout(() => {
        gReject(`deviceready wasn't called for ${CORDOVA_DEVICE_RDY_TIMEOUT} ms`);
      }, CORDOVA_DEVICE_RDY_TIMEOUT);
      this.deviceReadyCallback = () =>
        this.deviceReady(deviceReadyTimeout, gResolve, gReject);
      document.addEventListener('deviceready', this.deviceReadyCallback);
    } else {
      gReject('document not available');
    }

    return promise
      .then(success => {
        if (success) {
          // We only want to register the breadcrumbcallback on success
          // otherwise we will get an endless loop
          this.browser.setBreadcrumbCallback(crumb => this.captureBreadcrumb(crumb));
        }
        return Promise.resolve(success);
      })
      .catch(reason => Promise.reject(reason));
  }

  public getBrowser(): any {
    return this.browser as any;
  }

  public setOptions(options: ICordovaOptions) {
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

  // TODO catch do nothing ---- or rewrite to also be a promise
  public setUserContext(user?: IUser) {
    this.nativeCall('setUserContext', user);
    return this;
  }

  public setTagsContext(tags?: { [key: string]: any }) {
    this.nativeCall('setExtraContext', tags);
    return this;
  }

  public setExtraContext(extra?: { [key: string]: any }) {
    this.nativeCall('setExtraContext', extra);
    return this;
  }

  public addExtraContext(key: string, value: any) {
    this.nativeCall('addExtraContext', key, value);
    return this;
  }

  public clearContext() {
    this.nativeCall('clearContext');
    return this;
  }
  // ---------------------------------------

  // CORDOVA --------------------
  private nativeCall(action: string, ...args: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      const exec = window && (window as any).Cordova && (window as any).Cordova.exec;
      if (!exec) {
        reject('Cordova.exec not available');
      } else {
        // console.log((window as any).Cordova.exec);
        // console.log(exec);
        (window as any).Cordova.exec(resolve, reject, this.PLUGIN_NAME, action, args);
      }
    }).catch(e => {
      if (e === 'not implemented' || e === 'Cordova.exec not available') {
        // This is our fallback to the browser implementation
        // console.log('catch errror', e);
        return this.browser[action](...args);
      }
      throw e;
    });
  }

  private deviceReady(
    deviceReadyTimeout: NodeJS.Timer,
    resolve: (value?: boolean | PromiseLike<boolean>) => void,
    reject: (reason?: any) => void
  ) {
    document.removeEventListener('deviceready', this.deviceReadyCallback);
    clearTimeout(deviceReadyTimeout);
    this.nativeCall('install', this.client.dsn.getDsn(true), this.options)
      .then(resolve)
      .catch(reject);
  }
  // ----------------------------------------------------------
  // Raven

  private wrappedCallback(callback) {
    function dataCallback(data, original) {
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
      this.wrappedCallback(data => {
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
      stacktrace.frames.forEach(frame => {
        if (frame.filename !== '[native code]') {
          frame.filename = this.normalizeUrl(frame.filename, pathStripRe);
        }
      });
    }
    return data;
  }

  // -----------------------------------------------------------
}
