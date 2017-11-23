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
  private client: Client;
  private browser: Browser;
  private cordovaExec: any;

  private PLUGIN_NAME = 'Sentry';
  private PATH_STRIP_RE = /^.*\/[^\.]+(\.app|CodePush|.*(?=\/))/;

  constructor(client: Client, public options: ICordovaOptions = {}) {
    this.client = client;
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
      document.addEventListener(
        'deviceready',
        this.deviceReady(deviceReadyTimeout, gResolve, gReject)
      );
    } else {
      gReject('document not available');
    }

    return promise;
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
    if (!this.isNativeExtensionAvailable()) {
      return this.browser.captureBreadcrumb(crumb);
    }
    return new Promise<IBreadcrumb>((resolve, reject) => {
      this.cordovaExec(
        result => resolve(result),
        error => reject(error),
        this.PLUGIN_NAME,
        'captureBreadcrumb',
        [crumb]
      );
    });
  }

  public send(event: Event) {
    if (!this.isNativeExtensionAvailable()) {
      return this.browser.send(event);
    }
    return new Promise<Event>((resolve, reject) => {
      this.cordovaExec(
        result => resolve(result),
        error => reject(error),
        this.PLUGIN_NAME,
        'sendEvent',
        [event]
      );
    });
  }

  public setUserContext(user?: IUser) {
    if (!this.isNativeExtensionAvailable()) {
      return this.browser.setUserContext(user);
    }
    this.cordovaExec(null, null, this.PLUGIN_NAME, 'setUserContext', [user]);
    return this;
  }

  public setTagsContext(tags?: { [key: string]: any }) {
    if (!this.isNativeExtensionAvailable()) {
      return this.browser.setTagsContext(tags);
    }
    this.cordovaExec(null, null, this.PLUGIN_NAME, 'setTagsContext', [tags]);
    return this;
  }

  public setExtraContext(extra?: { [key: string]: any }) {
    if (!this.isNativeExtensionAvailable()) {
      return this.browser.setExtraContext(extra);
    }
    this.cordovaExec(null, null, this.PLUGIN_NAME, 'setExtraContext', [extra]);
    return this;
  }

  public addExtraContext(key: string, value: any) {
    if (!this.isNativeExtensionAvailable()) {
      return this.browser.addExtraContext(key, value);
    }
    this.cordovaExec(null, null, this.PLUGIN_NAME, 'addExtraContext', [key, value]);
    return this;
  }

  public clearContext() {
    if (!this.isNativeExtensionAvailable()) {
      return this.browser.clearContext();
    }
    this.cordovaExec(null, null, this.PLUGIN_NAME, 'clearContext', []);
    return this;
  }

  // CORDOVA --------------------

  private isNativeExtensionAvailable() {
    let result = true;
    if ((window as any) && (window as any).Cordova && (window as any).Cordova.exec) {
      this.cordovaExec = (window as any).Cordova.exec;
    } else {
      this.client.log(
        'Fallback to browser intragration due native integration not available'
      );
      this.cordovaExec = (...params) => {
        // eslint-disable-next-line
        // TODO
        // this.client.log(params);
      };
      result = false;
    }
    return result;
  }

  private deviceReady(
    deviceReadyTimeout: NodeJS.Timer,
    resolve: (value?: boolean | PromiseLike<boolean>) => void,
    reject: (reason?: any) => void
  ) {
    document.removeEventListener('deviceready', this.deviceReady);
    clearTimeout(deviceReadyTimeout);
    if (!this.isNativeExtensionAvailable()) {
      reject('deviceready fired, cordovaExec still not available');
      return;
    }
    this.browser.setBreadcrumbCallback(crumb => this.captureBreadcrumb(crumb));
    this.cordovaExec(
      result => resolve(result),
      error => reject(error),
      this.PLUGIN_NAME,
      'install',
      [this.client.dsn.getDsn(true), this.options]
    );
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
    const raven = Browser.getRaven();
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
