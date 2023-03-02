import type { EventProcessor, Integration } from '@sentry/types';

/** Removes noise errors from Sentry Replay on the Browser */
export class ReplayBrowserFilter implements Integration {
  /**
   * @inheritDoc
   */
  public static id: string = 'ReplayBrowserFilter';

  /**
   * @inheritDoc
   */
  public name: string = ReplayBrowserFilter.id;

  /**
   * @inheritDoc
   */
  public setupOnce(addGlobalEventProcessor: (e: EventProcessor) => void): void {
    addGlobalEventProcessor(async event => {
        const exception = event.exception?.values;
      if (exception != undefined && exception[0].type == 'TypeError') {
        const stacktrace = exception[0].stacktrace;
        if (stacktrace?.frames != undefined
          && stacktrace.frames[stacktrace.frames.length - 1].function == 'getEventTarget'
          && stacktrace.frames[stacktrace.frames.length - 1].filename?.includes('sentry-cordova.bundle')) {
          return null;
        }
      }
      return event;
    });
  }
}
