import { __awaiter } from "tslib";
import { SDK_NAME, SDK_VERSION } from '../version';
/** Default SdkInfo instrumentation */
export class SdkInfo {
    constructor() {
        /**
         * @inheritDoc
         */
        this.name = SdkInfo.id;
    }
    /**
     * @inheritDoc
     */
    setupOnce(addGlobalEventProcessor) {
        // eslint-disable-next-line @sentry-internal/sdk/no-async-await
        addGlobalEventProcessor((event) => __awaiter(this, void 0, void 0, function* () {
            event.platform = event.platform || 'javascript';
            event.sdk = Object.assign(Object.assign({}, event.sdk), { name: SDK_NAME, packages: [
                    ...((event.sdk && event.sdk.packages) || []),
                    {
                        name: 'npm:sentry-cordova',
                        version: SDK_VERSION,
                    },
                ], version: SDK_VERSION });
            return event;
        }));
    }
}
/**
 * @inheritDoc
 */
SdkInfo.id = 'SdkInfo';
//# sourceMappingURL=sdkinfo.js.map