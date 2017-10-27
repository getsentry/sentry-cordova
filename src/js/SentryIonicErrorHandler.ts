import * as Sentry from '@sentry/core';
import { IonicErrorHandler } from 'ionic-angular';

export class SentryIonicErrorHandler extends IonicErrorHandler {
  handleError(error) {
    super.handleError(error);
    try {
      Sentry.getSharedClient().captureException(error.originalError || error);
    } catch (e) {
      console.error(e);
    }
  }
}
