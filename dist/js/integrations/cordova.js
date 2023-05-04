import { addGlobalEventProcessor, getCurrentHub } from '@sentry/core';
import { normalizeData } from '../normalize';
/** Default Breadcrumbs instrumentations */
export class Cordova {
    constructor() {
        /**
         * @inheritDoc
         */
        this.name = Cordova.id;
    }
    /**
     * @inheritDoc
     */
    setupOnce() {
        addGlobalEventProcessor((event) => {
            const self = getCurrentHub().getIntegration(Cordova);
            if (self) {
                return normalizeData(event);
            }
            return event;
        });
    }
}
/**
 * @inheritDoc
 */
Cordova.id = 'Cordova';
//# sourceMappingURL=cordova.js.map