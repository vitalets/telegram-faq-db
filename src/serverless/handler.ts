/**
 * Запуск из серверлесс функции.
 */
import { Handler, TimerMessage, fixConsoleForLogging } from 'yandex-cloud-fn';
import { TgClient } from '../index.js';

fixConsoleForLogging();

export const handler: Handler<TimerMessage> = async event => {

  const client = new TgClient();

  try {
    console.log('logging in...');
    await client.login();
    console.log('logged in');
  } finally {
    await client.close();
  }
};

function attachEventToError(error: Error, event: TimerMessage) {
  error.stack += ` EVENT: ${JSON.stringify(event)}`;
  return error;
}
