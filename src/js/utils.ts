import { Severity } from '@sentry/types';

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
