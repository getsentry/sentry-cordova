import { Integration, SentryEvent } from '@sentry/types';
import { getGlobalObject } from '@sentry/utils/misc';
import { addGlobalEventProcessor, getCurrentHub } from '@sentry/core';

/** Default Breadcrumbs instrumentations */
export class Release implements Integration {
  /**
   * @inheritDoc
   */
  public name: string = Release.id;
  /**
   * @inheritDoc
   */
  public static id: string = 'Release';

  /**
   * @inheritDoc
   */
  public setupOnce(): void {
    addGlobalEventProcessor(async (event: SentryEvent) => {
      const self = getCurrentHub().getIntegration(Release);
      if (self) {
        const window: any = getGlobalObject();
        // __sentry_release & __sentry_dist will be picked up by our native integration.
        // It should live in extra, native will pic it up there and set it in the event.
        if (event.extra && event.extra.__sentry_release && !event.release) {
          event.release = `${event.extra.__sentry_release}`;
        }
        if (event.extra && event.extra.__sentry_dist && !event.dist) {
          event.dist = `${event.extra.__sentry_dist}`;
        }
        const release = window.SENTRY_RELEASE && window.SENTRY_RELEASE.id;
        if (release && !event.release) {
          event.release = release;
          event.extra = {
            ...event.extra,
            __sentry_release: release,
          };
        }
        return event;
      }
      return event;
    });
  }
}
