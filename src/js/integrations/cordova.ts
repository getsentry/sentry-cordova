import { addGlobalEventProcessor, getCurrentHub } from '@sentry/core';
import type { Event, Integration } from '@sentry/types';

import { normalizeData } from '../normalize';

/** Default Breadcrumbs instrumentations */
export class Cordova implements Integration {
  /**
   * @inheritDoc
   */
  public static id: string = 'Cordova';

  /**
   * @inheritDoc
   */
  public name: string = Cordova.id;

  /**
   * @inheritDoc
   */
  public setupOnce(): void {
    addGlobalEventProcessor((event: Event) => {
      const self = getCurrentHub().getIntegration(Cordova);
      if (self) {
        return normalizeData(event) as Event;
      }
      return event;
    });
  }
}
