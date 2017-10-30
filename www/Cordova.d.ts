import { Client, Event, Breadcrumb, User } from '@sentry/core';
import { Browser } from '@sentry/browser';
export declare namespace Cordova {
    type Options = Browser.Options & {
        testOption?: boolean;
    };
}
export declare class Cordova extends Browser {
    options: Cordova.Options;
    private client;
    private cordovaExec;
    private PLUGIN_NAME;
    constructor(client: Client, options?: Cordova.Options);
    install(): Promise<boolean>;
    setOptions(options: Cordova.Options): this;
    captureBreadcrumb(crumb: Breadcrumb): Promise<Breadcrumb>;
    send(event: Event): Promise<Event>;
    setUserContext(user?: User): this;
    setTagsContext(tags?: {
        [key: string]: any;
    }): this;
    setExtraContext(extra?: {
        [key: string]: any;
    }): this;
    addExtraContext(key: string, value: any): this;
    clearContext(): this;
}
