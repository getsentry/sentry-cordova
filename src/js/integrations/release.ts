import { addGlobalEventProcessor, getCurrentHub } from '@sentry/core';
import { Event, Integration } from '@sentry/types';
import { getGlobalObject } from '@sentry/utils';

/** Default Release instrumentation */
export class Release implements Integration {
  /**
   * @inheritDoc
   */
  public static id: string = 'Release';

  /**
   * @inheritDoc
   */
  public name: string = Release.id;

  /**
   * @inheritDoc
   */
  public setupOnce(): void {
    addGlobalEventProcessor((event: Event) => {
      const self = getCurrentHub().getIntegration(Release);
      if (!self) {
        return event;
      }

      const options = getCurrentHub()
        .getClient()
        ?.getOptions();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const window: any = getGlobalObject<any>();

      /*
        __sentry_release and __sentry_dist is set by the user with setRelease and setDist. If this is used then this is the strongest.
        Otherwise we check for the release and dist in the options passed on init, as this is stronger than the release/dist from the native build.
      */
      if (typeof event.extra?.__sentry_release === 'string') {
        event.release = `${event.extra.__sentry_release}`;
      } else if (typeof options?.release === 'string') {
        event.release = options.release;
      }

      if (typeof event.extra?.__sentry_dist === 'string') {
        event.dist = `${event.extra.__sentry_dist}`;
      } else if (typeof options?.dist === 'string') {
        event.dist = options.dist;
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const release = window.SENTRY_RELEASE && window.SENTRY_RELEASE.id;
      if (release && !event.release) {
        event.release = release as string;
        event.extra = {
          ...event.extra,
          __sentry_release: release,
        };
      }
      return event;
    });
  }
}
