import { Integration, SentryEvent } from '@sentry/types';
import { addGlobalEventProcessor, getCurrentHub } from '@sentry/core';
import { normalizeData } from '../normalize';

/** Default Breadcrumbs instrumentations */
export class Cordova implements Integration {
  /**
   * @inheritDoc
   */
  public name: string = Cordova.id;

  /**
   * @inheritDoc
   */
  public static id: string = 'Cordova';

  /**
   * @inheritDoc
   */
  public setupOnce(): void {
    addGlobalEventProcessor(async (event: SentryEvent) => {
      const self = getCurrentHub().getIntegration(Cordova);
      if (self) {
        return normalizeData(event);
      }
      return event;
    });
  }
}
