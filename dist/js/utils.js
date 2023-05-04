import { WINDOW } from '@sentry/browser';
import { CordovaPlatformType } from './types';
/**
 * Serializes all values of root-level keys into strings.
 * @param data key-value map.
 * @returns An object where all root-level values are strings.
 */
export const serializeObject = (data) => {
    const serialized = {};
    Object.keys(data).forEach(dataKey => {
        const value = data[dataKey];
        serialized[dataKey] = typeof value === 'string' ? value : JSON.stringify(value);
    });
    return serialized;
};
/**
 * Convert js severity level which has critical and log to more widely supported levels.
 * @param level
 * @returns More widely supported Severity level strings
 */
export const processLevel = (level) => {
    if (level === 'log') {
        return 'debug';
    }
    return level;
};
/**
 * Gets the platform
 * @returns The current platform the SDK is running on, defaults to Browser if unknown.
 */
export const getPlatform = () => {
    var _a;
    const _window = WINDOW;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    let platform = (_a = _window === null || _window === void 0 ? void 0 : _window.cordova) === null || _a === void 0 ? void 0 : _a.platformId;
    if (!platform || !Object.values(CordovaPlatformType).includes(platform)) {
        // Unsupported platform, default to browser
        platform = CordovaPlatformType.Browser;
    }
    return platform;
};
//# sourceMappingURL=utils.js.map