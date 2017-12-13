class SentryIonicErrorHandler extends IonicErrorHandler {
  public handleError(error) {
    super.handleError(error);
    try {
      Sentry.getSharedClient().captureException(error.originalError || error);
    } catch (e) {
      console.error(e);
    }
  }
}
