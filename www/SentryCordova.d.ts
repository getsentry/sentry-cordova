import { ISentryBrowserOptions, SentryBrowser } from '@sentry/browser';
import { Client, Event, IAdapter, IBreadcrumb, IUser } from '@sentry/core';
export interface ISentryBrowserConstructable<T> {
    new (client: Client, options?: ISentryBrowserOptions): T;
}
export interface ISentryCordovaOptions {
    deviceReadyTimeout?: number;
    sentryBrowser?: ISentryBrowserConstructable<SentryBrowser>;
}
export declare class SentryCordova implements IAdapter {
    options: ISentryCordovaOptions;
    private browser;
    private client;
    private deviceReadyCallback;
    private internalOptions;
    private PLUGIN_NAME;
    private PATH_STRIP_RE;
    constructor(client: Client, options?: ISentryCordovaOptions);
    install(): Promise<boolean>;
    getBrowser(): any;
    setOptions(options: ISentryCordovaOptions): Promise<this>;
    captureException(exception: Error): Promise<Event>;
    captureMessage(message: string): Promise<Event>;
    captureBreadcrumb(crumb: IBreadcrumb): Promise<any>;
    send(event: Event): Promise<any>;
    setUserContext(user?: IUser): Promise<this>;
    setTagsContext(tags?: {
        [key: string]: any;
    }): Promise<this>;
    setExtraContext(extra?: {
        [key: string]: any;
    }): Promise<this>;
    clearContext(): Promise<any>;
    setRelease(release: string): Promise<this>;
    setDist(dist: string): Promise<this>;
    setVersion(version: string): Promise<this>;
    private setInternalOption(key, value);
    private tryToSetSentryRelease();
    private isCordova();
    private nativeCall(action, ...args);
    private runInstall(resolve, reject, deviceReadyTimeout?);
    private wrappedCallback(callback);
    private setupNormalizeFrames();
    private normalizeUrl(url, pathStripRe);
    private normalizeData(data, pathStripRe?);
}
