import * as core from '@sentry/core';

import { withSentryIonicErrorHandler } from '../../Ionic/SentryIonicErrorHandler';

const captureException = jest.spyOn(core, 'captureException');

describe('Global Ionic error handler', () => {
  const originalHandleError = jest.fn();
  class MockClass {
    // Class method so it can be called via super
    handleError(error: any) {
      originalHandleError(error);
    }
  }

  it('Calls captureException on error handler triggered', () => {
    const SentryIonicErrorHandler = withSentryIonicErrorHandler(MockClass);
    const errorHandler = new SentryIonicErrorHandler();

    const error = new Error('Test Error');
    errorHandler.handleError(error);

    expect(originalHandleError).toHaveBeenLastCalledWith(error);
    expect(captureException).toHaveBeenLastCalledWith(error);
  });

  it('Calls captureException with originalException if exists', () => {
    const SentryIonicErrorHandler = withSentryIonicErrorHandler(MockClass);
    const errorHandler = new SentryIonicErrorHandler();

    const error = new Error('Test Error');
    const originalError = new Error('Original Error');
    Object.assign(error, { originalError });

    errorHandler.handleError(error);

    expect(originalHandleError).toHaveBeenLastCalledWith(error);
    expect(captureException).toHaveBeenLastCalledWith(originalError);
  });
});
