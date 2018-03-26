import * as Sentry from 'sentry-cordova';
import { IonicErrorHandler } from 'ionic-angular';

export class SentryIonicErrorHandler extends IonicErrorHandler {
  handleError(error) {
    super.handleError(error);
    try {
      Sentry.captureException(error.originalError || error);
    } catch (e) {
      console.error(e);
    }
  }
}
