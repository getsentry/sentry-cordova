import { addEventProcessor, getClient } from '@sentry/core';

import { SdkInfo } from '../../integrations/sdkinfo';
import { SDK_NAME, SDK_VERSION } from '../../version';

jest.mock('@sentry/core', () => ({
  addEventProcessor: jest.fn(),
  getClient: jest.fn(),
}));

describe('SdkInfo Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have correct id and name', () => {
    const sdkInfo = new SdkInfo();
    expect(SdkInfo.id).toBe('SdkInfo');
    expect(sdkInfo.name).toBe('SdkInfo');
  });

  it('should add an event processor', () => {
    (getClient as jest.Mock).mockReturnValue({
      getOptions: () => ({ sendDefaultPii: true }),
    });

    const sdkInfo = new SdkInfo();
    sdkInfo.setupOnce();

    expect(addEventProcessor).toHaveBeenCalled();
  });

  it('should patch event sdk info correctly with sendDefaultPii true', async () => {
    (getClient as jest.Mock).mockReturnValue({
      getOptions: () => ({ sendDefaultPii: true }),
    });

    const sdkInfo = new SdkInfo();
    sdkInfo.setupOnce();

    const eventProcessor = (addEventProcessor as jest.Mock).mock.calls[0][0];

    const event = { sdk: { packages: [] } };
    const processedEvent = await eventProcessor(event);

    expect(processedEvent.platform).toBe('javascript');
    expect(processedEvent.sdk.name).toBe(SDK_NAME);
    expect(processedEvent.sdk.version).toBe(SDK_VERSION);
    expect(processedEvent.sdk.packages).toContainEqual({
      name: 'npm:sentry-cordova',
      version: SDK_VERSION,
    });
    expect(processedEvent.sdk.settings?.infer_ip).toBe('auto');
  });

  it('should patch event sdk info correctly with sendDefaultPii false', async () => {
    (getClient as jest.Mock).mockReturnValue({
      getOptions: () => ({ sendDefaultPii: false }),
    });

    const sdkInfo = new SdkInfo();
    sdkInfo.setupOnce();

    const eventProcessor = (addEventProcessor as jest.Mock).mock.calls[0][0];

    const event = { sdk: {} };
    const processedEvent = await eventProcessor(event);

    expect(processedEvent.sdk.settings?.infer_ip).toBe('never');
  });

  it('should preserve existing sdk settings', async () => {
    (getClient as jest.Mock).mockReturnValue({
      getOptions: () => ({ sendDefaultPii: true }),
    });

    const sdkInfo = new SdkInfo();
    sdkInfo.setupOnce();

    const eventProcessor = (addEventProcessor as jest.Mock).mock.calls[0][0];

    const event = {
      sdk: {
        packages: [],
        settings: { debug: true },
      },
    };
    const processedEvent = await eventProcessor(event);

    expect(processedEvent.sdk.settings).toEqual({
      infer_ip: 'auto',
      debug: true,
    });
  });
});
