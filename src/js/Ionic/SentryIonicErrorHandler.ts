import { captureException } from '@sentry/core';

/**
 * Wrap the ionic error handler with this method so Sentry catches unhandled errors on ionic.
 * See the documentation for more details.
 */
const withSentryIonicErrorHandler = <C extends new (...args: any[]) => any>(IonicErrorHandler: C): C => {
  class SentryIonicErrorHandler extends IonicErrorHandler {
    handleError(error: any) {
      super.handleError(error);
      captureException(error.originalError ?? error);
    }
  }

  return SentryIonicErrorHandler;
};

export { withSentryIonicErrorHandler };
