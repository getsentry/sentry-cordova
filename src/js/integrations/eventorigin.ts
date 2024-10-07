import { addEventProcessor } from '@sentry/core';
import type { Integration } from '@sentry/types';

/** Default EventOrigin instrumentation */
export class EventOrigin implements Integration {
  /**
   * @inheritDoc
   */
  public static id: string = 'EventOrigin';

  /**
   * @inheritDoc
   */
  public name: string = EventOrigin.id;

  /**
   * @inheritDoc
   */
  public setupOnce(): void {
    addEventProcessor(event => {
      event.tags = event.tags ?? {};

      event.tags['event.origin'] = 'cordova';
      event.tags['event.environment'] = 'javascript';

      return event;
    });
  }
}
