/**
 * Reads auth code from s3 bucket folder name
 */
import { config } from './config.js';
import { S3 } from './s3.js';

const prefix = 'code';
const attempts = 60;

export async function getAuthCode() {
  const s3 = new S3(config.bucket);
  for (let i = 0; i < attempts; i++) {
    console.log(`Checking auth key, attempt #${i}`);
    const keys = await s3.listKeys(prefix);
    if (keys.length) {
      const key = keys[0].replace(/\D/g, '');
      console.log(`Got auth key: ${key}`);
      s3.deleteKeys(keys).catch(e => console.log(e));
      return key;
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error(`Can't get auth code in ${attempts} attempts`);
}
