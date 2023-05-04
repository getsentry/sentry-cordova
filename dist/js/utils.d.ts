import type { SeverityLevel } from '@sentry/types';
import { CordovaPlatformType } from './types';
/**
 * Serializes all values of root-level keys into strings.
 * @param data key-value map.
 * @returns An object where all root-level values are strings.
 */
export declare const serializeObject: (data: {
    [key: string]: unknown;
}) => {
    [key: string]: string;
};
/**
 * Convert js severity level which has critical and log to more widely supported levels.
 * @param level
 * @returns More widely supported Severity level strings
 */
export declare const processLevel: (level: SeverityLevel) => SeverityLevel;
/**
 * Gets the platform
 * @returns The current platform the SDK is running on, defaults to Browser if unknown.
 */
export declare const getPlatform: () => CordovaPlatformType;
//# sourceMappingURL=utils.d.ts.map