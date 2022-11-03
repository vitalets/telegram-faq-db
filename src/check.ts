import 'dotenv/config.js';
import { TgClient } from './index.js';

const client = new TgClient();

try {
  await client.login();
  console.log('logged in');
} finally {
  await client.close();
}

