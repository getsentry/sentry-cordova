import { captureException } from '@sentry/core';
/**
 * Wrap the ionic error handler with this method so Sentry catches unhandled errors on ionic.
 * See the documentation for more details.
 */
const withSentryIonicErrorHandler = (IonicErrorHandler) => {
    class SentryIonicErrorHandler extends IonicErrorHandler {
        handleError(error) {
            var _a;
            super.handleError(error);
            captureException((_a = error.originalError) !== null && _a !== void 0 ? _a : error);
        }
    }
    return SentryIonicErrorHandler;
};
export { withSentryIonicErrorHandler };
//# sourceMappingURL=SentryIonicErrorHandler.js.map