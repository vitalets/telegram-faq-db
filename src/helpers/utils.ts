/**
 * Utils
 */
import fs from 'fs';

export function cutStr(s: string, length: number) {
  return s.length > length ? `${s.slice(0, length)}...` : s;
}

export function removeNewLines(s: string) {
  return s.replace(/\n+/g, ' ');
}

export function groupBy<T>(arr: T[], getKey: (item: T) => unknown) {
  const res: Record<string, T[]> = {};
  arr.forEach(item => {
    const key = String(getKey(item));
    res[key] = res[key] || [];
    res[key].push(item);
  });
  return res;
}

export function removeDuplicates<T>(items: T[], getKey: (item: T) => unknown) {
  const set = new Set();
  return items.filter(item => {
    const key = getKey(item);
    if (!set.has(key)) {
      set.add(key);
      return true;
    }
  });
}

export type TimeRange = {
  since: number;
  to: number;
}

/**
 * Shift current time by minutes and return value in seconds.
 */
export function offsetMinutes(minutes: number, date = new Date()) {
  const dateClone = new Date(date);
  dateClone.setMinutes(dateClone.getMinutes() + minutes);
  return Math.round(dateClone.valueOf() / 1000);
}

/**
 * Format date.
 * @param timestamp in seconds!
 */
export function formatDate(timestamp: number | Date) {
  const date = typeof timestamp === 'number'
    ? new Date(timestamp * 1000)
    : timestamp;
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'long',
    timeZone: 'Asia/Yerevan',
  }).format(date);
}

export function loadJson(relPath: string) {
  // import.meta does not work in jest-esm
  // see: https://github.com/kulshekhar/ts-jest/issues/1174
  return JSON.parse(fs.readFileSync(relPath, 'utf8'));
}
