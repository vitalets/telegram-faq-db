/**
 * Reads auth code from s3 bucket folder name
 */
 import timers from 'timers/promises';
import { config } from './config.js';
import { logger } from './logger.js';
import { S3 } from './s3.js';

const prefix = 'code';
const attempts = 60;

// eslint-disable-next-line max-statements
export async function getAuthCode() {
  const s3 = new S3(config.bucket);
  for (let i = 0; i < attempts; i++) {
    logger.log(`Checking auth key, attempt #${i}`);
    const keys = await s3.listKeys(prefix);
    if (keys.length) {
      const key = keys[0].replace(/\D/g, '');
      logger.log(`Got auth key: ${key}`);
      s3.deleteKeys(keys).catch(e => logger.error(e));
      return key;
    }
    await timers.setTimeout(1000);
  }
  throw new Error(`Can't get auth code in ${attempts} attempts`);
}
