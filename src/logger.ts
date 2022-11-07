import { Logger, LogLevel } from '@vitalets/logger';

const level = (process.env.LOG_LEVEL || 'info') as LogLevel;

export const logger = new Logger({ level });
