export { CordovaOptions } from './backend';
export { CordovaClient } from './client';
export { init, setDist, setRelease, setVersion } from './sdk';

export { Hub, Scope } from '@sentry/hub';

export {
  addBreadcrumb,
  captureEvent,
  captureException,
  captureMessage,
  configureScope,
} from '@sentry/minimal';
