/**
 * Config
 */
const { env } = process;

const isProduction = env.GITHUB_EVENT_NAME === 'schedule';

export const config = {
  isProduction,
  logLevel: env.LOG_LEVEL || 'info',
  isCI: Boolean(env.CI),
  dryRun: false,
  telegramAppId: Number(env.TELEGRAM_APP_ID),
  telegramAppHash: env.TELEGRAM_APP_HASH || '',
  telegramPhone: env.TELEGRAM_PHONE || '',
  // todo: create separate service account and keys
  accessKeyId: env.AWS_ACCESS_KEY_ID || '',
  secretAccessKey: env.AWS_SECRET_ACCESS_KEY || '',
  bucket: env.BUCKET || '',
  // for local development use tdlibjson compiled for Apple M1
  tdlibJsonPathLocal: './libtdjson/libtdjson.dylib',
  tdlibDbPath: 'tmp',
  testChatId: 129444032,
  // Time range for messsages with no answer
  noAnswerMessagesTimeRange: { since: -60 * 2, to: -60 },
  noAnswerMaxCount: 15,
};
