import {Adapter, Client, Options, Event, Breadcrumb, User} from '@sentry/core';
import {Browser} from '@sentry/browser';

declare var window;

export namespace Cordova {
  export type Options = Browser.Options & {
    testOption?: boolean;
  };
}

export class Cordova extends Browser {
  private client: Client;
  private cordovaExec: any;

  private PLUGIN_NAME = 'Sentry';

  constructor(client: Client, public options: Cordova.Options = {}) {
    super(client, options);
    this.client = client;
    if (<any>window && (<any>window).Cordova && (<any>window).Cordova.exec) {
      this.cordovaExec = (<any>window).Cordova.exec;
    } else {
      this.cordovaExec = (...params) => {
        // eslint-disable-next-line
        client.log(params);
      };
    }
    return this;
  }

  install() {
    super.setOptions(<Browser.Options>{
      allowDuplicates: true
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

  captureBreadcrumb(crumb: Breadcrumb) {
    return new Promise<Breadcrumb>((resolve, reject) => {
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

  setUserContext(user?: User) {
    this.cordovaExec(null, null, this.PLUGIN_NAME, 'setUserContext', [user]);
    return this;
  }

  setTagsContext(tags?: {[key: string]: any}) {
    this.cordovaExec(null, null, this.PLUGIN_NAME, 'setTagsContext', [tags]);
    return this;
  }

  setExtraContext(extra?: {[key: string]: any}) {
    this.cordovaExec(null, null, this.PLUGIN_NAME, 'setExtraContext', [extra]);
    return this;
  }

  addExtraContext(key: string, value: any) {
    this.cordovaExec(null, null, this.PLUGIN_NAME, 'addExtraContext', [key, value]);
    return this;
  }

  clearContext() {
    this.cordovaExec(null, null, this.PLUGIN_NAME, 'clearContext', []);
    return this;
  }
}
