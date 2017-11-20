import { IAdapter, Client, Event, IBreadcrumb, IUser } from '@sentry/core';
import { Browser, IBrowserOptions } from '@sentry/browser';

declare var window;

export namespace Cordova {
  export type Options = IBrowserOptions & {
    testOption?: boolean;
  };
}

export class Cordova extends Browser {
  private client: Client;
  private cordovaExec: any;
  private _isNativeExtensionAvailable = true;

  private PLUGIN_NAME = 'Sentry';

  constructor(client: Client, public options: Cordova.Options = {}) {
    super(client, options);
    this.client = client;
    return this;
  }

  private get isNativeExtensionAvailable() {
    if (<any>window && (<any>window).Cordova && (<any>window).Cordova.exec) {
      this.cordovaExec = (<any>window).Cordova.exec;
    } else {
      this.client.log(
        'Fallback to browser intragration due native integration not available'
      );
      this.cordovaExec = (...params) => {
        // eslint-disable-next-line
        this.client.log(params);
      };
      this._isNativeExtensionAvailable = false;
    }

    return this._isNativeExtensionAvailable;
  }

  install() {
    if (!this.isNativeExtensionAvailable) {
      return super.install();
    }
    super.setOptions(<Browser.Options>{
      allowDuplicates: true,
    });
    super.install();
    super.setBreadcrumbCallback(crumb => this.captureBreadcrumb(crumb));
    return new Promise<boolean>((resolve, reject) => {
      this.cordovaExec(
        result => resolve(result),
        error => reject(error),
        this.PLUGIN_NAME,
        'install',
        [this.client.dsn.getDsn(true), this.options]
      );
    });
  }

  setOptions(options: Cordova.Options) {
    Object.assign(this.options, options);
    return this;
  }

  captureBreadcrumb(crumb: IBreadcrumb) {
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

  send(event: Event) {
    if (!this.isNativeExtensionAvailable) {
      return super.send(event);
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

  setUserContext(user?: IUser) {
    if (!this.isNativeExtensionAvailable) {
      return super.setUserContext(user);
    }
    this.cordovaExec(null, null, this.PLUGIN_NAME, 'setUserContext', [user]);
    return this;
  }

  setTagsContext(tags?: { [key: string]: any }) {
    if (!this.isNativeExtensionAvailable) {
      return super.setTagsContext(tags);
    }
    this.cordovaExec(null, null, this.PLUGIN_NAME, 'setTagsContext', [tags]);
    return this;
  }

  setExtraContext(extra?: { [key: string]: any }) {
    if (!this.isNativeExtensionAvailable) {
      return super.setExtraContext(extra);
    }
    this.cordovaExec(null, null, this.PLUGIN_NAME, 'setExtraContext', [extra]);
    return this;
  }

  addExtraContext(key: string, value: any) {
    if (!this.isNativeExtensionAvailable) {
      return super.addExtraContext(key, value);
    }
    this.cordovaExec(null, null, this.PLUGIN_NAME, 'addExtraContext', [key, value]);
    return this;
  }

  clearContext() {
    if (!this.isNativeExtensionAvailable) {
      return super.clearContext();
    }
    this.cordovaExec(null, null, this.PLUGIN_NAME, 'clearContext', []);
    return this;
  }
}
