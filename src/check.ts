import 'dotenv/config.js';
import { TgClient } from './index.js';
import { S3 } from './s3.js';

const s3 = new S3('tmp-objects');

if (process.env.CI) {
  await s3.downloadDir('tmp', 'tmp');
}

const chatId = -1001669191797;
const client = new TgClient();

try {
  await client.login();
  console.log('logged in');
  const messages = await client.getChatHistory(chatId, 5);
  console.log(messages);
} finally {
  await client.close();
  if (process.env.CI) {
    await s3.uploadDir('tmp', 'tmp');
  }
}

