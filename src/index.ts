import { App } from './app.js';
import { logger } from './logger.js';

// tdl throws this even in async methods
process.on('unhandledRejection', error => {
  logger.error('unhandledRejection', error);
});

new App().run();
