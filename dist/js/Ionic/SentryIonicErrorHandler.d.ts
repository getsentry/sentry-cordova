/**
 * Wrap the ionic error handler with this method so Sentry catches unhandled errors on ionic.
 * See the documentation for more details.
 */
declare const withSentryIonicErrorHandler: <C extends new (...args: any[]) => any>(IonicErrorHandler: C) => C;
export { withSentryIonicErrorHandler };
//# sourceMappingURL=SentryIonicErrorHandler.d.ts.map