export { addGlobalEventProcessor, addBreadcrumb, captureException, captureEvent, captureMessage, configureScope, withScope, getHubFromCarrier, getCurrentHub, setUser, setContext, setExtra, setExtras, setTag, setTags, startTransaction, Hub, Scope, } from '@sentry/core';
import { Integrations as BrowserIntegrations } from '@sentry/browser';
export { init, nativeCrash } from './sdk';
export { SDK_NAME, SDK_VERSION } from './version';
import * as Integrations from './integrations';
export { Integrations };
export { BrowserIntegrations };
export { withSentryIonicErrorHandler } from './Ionic/SentryIonicErrorHandler';
//# sourceMappingURL=sentry-cordova.js.map