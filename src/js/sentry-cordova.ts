export type {
  Breadcrumb,
  RequestEventData,
  SdkInfo,
  Event,
  Exception,
  SeverityLevel,
  StackFrame,
  Stacktrace,
  Thread,
  User,
} from '@sentry/core';

export {
  addEventProcessor,
  addBreadcrumb,
  captureException,
  captureEvent,
  captureMessage,
  // eslint-disable-next-line deprecation/deprecation
  getCurrentScope,
  // eslint-disable-next-line deprecation/deprecation
  getCurrentHub,
  // eslint-disable-next-line deprecation/deprecation
  Scope,
  setContext,
  setExtra,
  setExtras,
  setTag,
  setTags,
  setUser,
  // eslint-disable-next-line deprecation/deprecation
  startSpan,
  startSpanManual,
  startInactiveSpan,
  withScope,
} from '@sentry/core';

export { replayIntegration, browserTracingIntegration } from '@sentry/browser';

export type { CordovaOptions } from './options';
export { init, nativeCrash } from './sdk';
export { SDK_NAME, SDK_VERSION } from './version';

import * as Integrations from './integrations';
export { Integrations };

export { withSentryIonicErrorHandler } from './Ionic/SentryIonicErrorHandler';
