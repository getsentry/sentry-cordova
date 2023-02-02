import { WINDOW } from '@sentry/browser';
import type { SeverityLevel } from '@sentry/types';

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
export const processLevel = (level: SeverityLevel): SeverityLevel => {
  if (level === 'log' as SeverityLevel) {
    return 'debug';
  }

  return level;
};

/**
 * Gets the platform
 * @returns The current platform the SDK is running on, defaults to Browser if unknown.
 */
export const getPlatform = (): CordovaPlatformType => {
  const _window = WINDOW;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  let platform = _window?.cordova?.platformId as CordovaPlatformType;

  if (!platform || !Object.values(CordovaPlatformType).includes(platform)) {
    // Unsupported platform, default to browser
    platform = CordovaPlatformType.Browser;
  }

  return platform;
};
