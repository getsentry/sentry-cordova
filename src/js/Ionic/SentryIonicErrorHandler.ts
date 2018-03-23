class SentryIonicErrorHandler extends IonicErrorHandler {
  public handleError(error: any) {
    super.handleError(error);
    try {
      captureException(error.originalError || error);
    } catch (e) {
      console.error(e);
    }
  }
}
