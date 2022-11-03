import 'dotenv/config.js';
import { TgClient } from './index.js';

const client = new TgClient();

try {
  await client.login();
  console.log('logged in');
  const messages = await client.getChatHistory(-1001669191797, 10);
  console.log(messages);
} finally {
  await client.close();
}

