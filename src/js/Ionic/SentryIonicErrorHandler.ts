class SentryIonicErrorHandler extends IonicErrorHandler {
  handleError(error) {
    super.handleError(error);
    try {
      captureException(error.originalError || error);
    } catch (e) {
      console.error(e);
    }
  }
}
