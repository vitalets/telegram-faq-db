/**
 * Reads auth code from s3 bucket folder name: code_XXXX
 */
import timers from 'timers/promises';
import { config } from '../config.js';
import { logger } from '../helpers/logger.js';
import { S3 } from '../helpers/s3.js';

export type AuthCodeOptions = {
  prefix?: string;
  attempts?: number;
  interval?: number;
}

const defaults: Required<AuthCodeOptions> = {
  prefix: 'code',
  attempts: 60,
  interval: 1000,
};

export class AuthCode {
  protected s3 = new S3(config.bucket);
  protected options: Required<AuthCodeOptions>;
  protected logger = logger.withPrefix(`[${this.constructor.name}]:`);

  constructor(options?: AuthCodeOptions) {
    this.options = Object.assign({}, defaults, options);
  }

  async getCode() {
    const { attempts, prefix, interval } = this.options;
    for (let i = 0; i < attempts; i++) {
      this.logger.log(`Checking auth code, attempt #${i}`);
      const keys = await this.s3.listKeys(prefix);
      if (keys.length) return this.extractCode(keys);
      await timers.setTimeout(interval);
    }
    throw new Error(`Can't get auth code in ${attempts} attempts`);
  }

  protected extractCode(keys: string[]) {
    const code = keys[0].replace(/\D/g, '');
    this.logger.log(`Got auth code: ${code}`);
    this.clearCodeKeys(keys);
    return code;
  }

  protected clearCodeKeys(keys: string[]) {
    this.s3.deleteKeys(keys).catch(e => this.logger.error(e));
  }
}
