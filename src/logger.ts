import { Logger, LogLevel } from '@vitalets/logger';
import { config } from './config.js';

export const logger = new Logger({
  level: config.logLevel as LogLevel
});
