import { addEventProcessor, getClient } from '@sentry/core';
import type { Integration, SdkInfo as SdkInfoType} from '@sentry/types';

import { SDK_NAME, SDK_VERSION } from '../version';

interface IpPatchedSdkInfo extends SdkInfoType {
  settings?: {
    infer_ip?: 'auto' | 'never';
  };
}

/** Default SdkInfo instrumentation */
export class SdkInfo implements Integration {
  /**
   * @inheritDoc
   */
  public static id: string = 'SdkInfo';

  /**
   * @inheritDoc
   */
  public name: string = SdkInfo.id;

  /**
   * @inheritDoc
   */
  public setupOnce(): void {

    let defaultPii: boolean | undefined = undefined;

    const client = getClient();
    if (client) {
      const options = client.getOptions();
      defaultPii = options.sendDefaultPii;
    }

    addEventProcessor(async (event) => {
      event.platform = event.platform || 'javascript';
      const sdk = (event.sdk || {}) as IpPatchedSdkInfo;

      sdk.name = sdk.name || SDK_NAME;
      sdk.packages = [
        ...((event.sdk && event.sdk.packages) || []),
        {
          name: 'npm:sentry-cordova',
          version: SDK_VERSION,
        },
      ];
      sdk.version = SDK_VERSION;

      // Patch missing infer_ip.
      sdk.settings = {
        infer_ip: defaultPii ? 'auto' : 'never',
        // purposefully allowing already passed settings to override the default
        ...sdk.settings
      };

      event.sdk = sdk;

      return event;
    });
  }
}
