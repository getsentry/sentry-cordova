import { Client, Event, IBreadcrumb, IUser } from '@sentry/core';
import { Browser, IBrowserOptions } from '@sentry/browser';
export declare namespace Cordova {
    type Options = IBrowserOptions & {
        testOption?: boolean;
    };
}
export declare class Cordova extends Browser {
    options: Cordova.Options;
    private client;
    private cordovaExec;
    private _isNativeExtensionAvailable;
    private PLUGIN_NAME;
    constructor(client: Client, options?: Cordova.Options);
    private readonly isNativeExtensionAvailable;
    install(): any;
    setOptions(options: Cordova.Options): this;
    captureBreadcrumb(crumb: IBreadcrumb): Promise<IBreadcrumb>;
    send(event: Event): any;
    setUserContext(user?: IUser): any;
    setTagsContext(tags?: {
        [key: string]: any;
    }): any;
    setExtraContext(extra?: {
        [key: string]: any;
    }): any;
    addExtraContext(key: string, value: any): any;
    clearContext(): any;
}
