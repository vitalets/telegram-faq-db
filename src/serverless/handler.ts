/**
 * Запуск из серверлесс функции.
 */
import { Handler, TimerMessage, fixConsoleForLogging } from 'yandex-cloud-fn';
import { Tg } from '../tg.js';

fixConsoleForLogging();

export const handler: Handler<TimerMessage> = async event => {

  const tg = new Tg();

  try {
    console.log('logging in...');
    await tg.login();
    console.log('logged in');
  } finally {
    await tg.close();
  }
};

function attachEventToError(error: Error, event: TimerMessage) {
  error.stack += ` EVENT: ${JSON.stringify(event)}`;
  return error;
}
