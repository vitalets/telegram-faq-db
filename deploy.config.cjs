const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync(path.resolve(__dirname, './.env')));

module.exports = {
  useCliConfig: true,
  functionName: 'telegram-faq-db',
  deploy: {
    files: [ 'package*.json', 'dist/**', 'libtdjson/**' ],
    handler: 'dist/serverless/cjs/index.handler',
    runtime: 'nodejs16',
    timeout: 60,
    memory: 256,
    account: 'telegram-faq-db-sa',
    environment: {
      NODE_ENV: 'production',
      TELEGRAM_APP_ID: env.TELEGRAM_APP_ID,
      TELEGRAM_APP_HASH: env.TELEGRAM_APP_HASH,
    },
  },
  storage: {
    bucketName: 'tmp-objects',
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
};
