import { Integration, SentryEvent } from '@sentry/types';
import { getDefaultHub } from '@sentry/hub';
import { normalizeData } from '../normalize';

/** Default Breadcrumbs instrumentations */
export class Cordova implements Integration {
  /**
   * @inheritDoc
   */
  public name: string = 'Cordova';

  /**
   * @inheritDoc
   */
  public install(): void {
    getDefaultHub().addEventProcessor((event: SentryEvent) => normalizeData(event));
  }
}
