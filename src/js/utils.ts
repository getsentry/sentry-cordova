import { Severity } from '@sentry/types';
import { getGlobalObject } from '@sentry/utils';

import { CordovaPlatformType } from './types';

/**
 * Serializes all values of root-level keys into strings.
 * @param data key-value map.
 * @returns An object where all root-level values are strings.
 */
export const serializeObject = (data: { [key: string]: unknown }): { [key: string]: string } => {
  const serialized: { [key: string]: string } = {};

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
export const processLevel = (level: Severity): Severity => {
  if (level === Severity.Critical) {
    return Severity.Fatal;
  }
  if (level === Severity.Log) {
    return Severity.Debug;
  }

  return level;
};

/**
 * Gets the platform
 * @returns The current platform the SDK is running on, defaults to Browser if unknown.
 */
export const getPlatform = (): CordovaPlatformType => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const _window = getGlobalObject<any>();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  let platform = _window?.cordova?.platformId;

  if (!platform || !Object.values(CordovaPlatformType).includes(platform)) {
    // Unsupported platform, default to browser
    platform = CordovaPlatformType.Browser;
  }

  return platform;
};
