import { Tg } from './tg.js';
import { S3 } from './s3.js';
import { logger } from './logger.js';
import { message } from 'tdlib-types';
import { NoAnswerDigest, isQuestionWithoutAnswer } from './digest.js';

const SOURCE_CHAT_ID = Number(process.env.SOURCE_CHAT_ID);
const DIGEST_CHAT_ID = Number(process.env.DIGEST_CHAT_ID);
const minutesOffset = { since: -60 * 2, to: -10 };

export class App {
  logger = logger.withPrefix(`[${this.constructor.name}]:`);
  s3 = new S3('static-test'); // todo: use config
  tg!: Tg;

  async run() {
    await this.downloadDb();
    this.tg = new Tg();
    try {
      await this.tg.login();
      await this.handleMessages();
    } finally {
      await this.tg.close();
      await this.uploadDb();
    }
  }

  async handleMessages() {
    const questions = await this.loadQuestions();
    if (!questions.length) return;
    const links = await this.loadLinks(questions);
    const text = new NoAnswerDigest(questions, links).buildText();
    await this.tg.sendMessage(DIGEST_CHAT_ID, text);
    this.logger.log(`Digest sent.`);
  }

  async loadQuestions() {
    const { since, to } = this.getMessagesDateRange();
    this.logger.log(`Loading messages in range: ${new Date(since * 1000)} - ${new Date(to * 1000)}`);
    const messages = await this.tg.loadMessages(SOURCE_CHAT_ID, since);
    const questions = messages
      .filter(m => m.date < to)
      .filter(m => isQuestionWithoutAnswer(m));
    this.logger.log(`Found ${questions.length} question(s) from ${messages.length} message(s)`);
    return questions;
  }

  async loadLinks(questions: message[]) {
    const tasks = questions.map(m => this.tg.getMesssageLink(m.chat_id, m.id));
    const links = await Promise.all(tasks);
    this.logger.log(`Loaded links ${links.length}`);
    return links;
  }

  async downloadDb() {
    if (process.env.CI) {
      await this.s3.downloadDir('tmp', 'tmp');
    }
  }

  async uploadDb() {
    if (process.env.CI) {
      await this.s3.uploadDir('tmp', 'tmp');
    }
  }

  getMessagesDateRange() {
    return {
      since: getTimeWithMinutesOffset(minutesOffset.since),
      to: getTimeWithMinutesOffset(minutesOffset.to),
    };
  }
}

function getTimeWithMinutesOffset(minutes: number) {
  const date = new Date();
  date.setMinutes(date.getMinutes() + minutes);
  return Math.round(date.valueOf() / 1000);
}
