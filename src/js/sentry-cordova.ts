export {
  Breadcrumb,
  Request,
  SdkInfo,
  Event,
  Exception,
  Response,
  Severity,
  StackFrame,
  Stacktrace,
  Status,
  Thread,
  User,
} from '@sentry/types';

export {
  addGlobalEventProcessor,
  addBreadcrumb,
  captureException,
  captureEvent,
  captureMessage,
  configureScope,
  withScope,
  getHubFromCarrier,
  getCurrentHub,
  setUser,
  setContext,
  setExtra,
  setExtras,
  setTag,
  setTags,
  Hub,
  Scope,
} from '@sentry/core';

import { Integrations as BrowserIntegrations } from '@sentry/browser';
export { CordovaBackend, CordovaOptions } from './backend';
export { CordovaClient } from './client';
export { init, setDist, setRelease, nativeCrash } from './sdk';
export { SDK_NAME, SDK_VERSION } from './version';

import * as Integrations from './integrations';
export { Integrations };
export { BrowserIntegrations };

export { withSentryIonicErrorHandler } from './Ionic/SentryIonicErrorHandler';
