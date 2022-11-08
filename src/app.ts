import { Tg } from './tg.js';
import { S3 } from './s3.js';
import { logger } from './logger.js';
import { message } from 'tdlib-types';
import { NoAnswerDigest, isNoAnswerMessage } from './noAnswerDigest.js';
import { config } from './config.js';

export class App {
  logger = logger.withPrefix(`[${this.constructor.name}]:`);
  s3 = new S3(config.bucket);
  tg!: Tg;

  async run() {
    await this.downloadDb();
    this.tg = new Tg();
    try {
      await this.tg.login();
      await this.handleNewMessages();
    } finally {
      await this.tg.close();
      await this.uploadDb();
    }
  }

  async handleNewMessages() {
    const messages = await this.loadNoAnswerMessages();
    if (!messages.length) return;
    const links = await this.loadLinks(messages);
    const text = new NoAnswerDigest(messages, links).buildText();
    await this.tg.sendMessage(config.digestChatId, text);
    this.logger.log(`Digest sent.`);
  }

  async loadNoAnswerMessages() {
    const { since, to } = this.getMessagesTimeRange();
    this.logger.log(`Loading messages since: ${new Date(since * 1000)}`);
    const messages = await this.tg.loadMessages(config.sourceChatId, since);
    this.logger.log(`Loaded messages: ${messages.length}`);
    // @ts-ignore
    this.logger.log(`Last message: ${messages[0].content.text.text}`);
    const naMessages = messages
      .filter(m => m.date < to)
      .filter(m => isNoAnswerMessage(m));
    this.logger.log(`No answer messages: ${naMessages.length}`);
    return naMessages;
  }

  async loadLinks(questions: message[]) {
    const tasks = questions.map(m => this.tg.getMesssageLink(m.chat_id, m.id));
    const links = await Promise.all(tasks);
    this.logger.log(`Loaded links ${links.length}`);
    return links;
  }

  async downloadDb() {
    if (config.isCI) {
      await this.s3.downloadDir(config.tdlibDbPath, config.tdlibDbPath);
    }
  }

  async uploadDb() {
    if (config.isCI) {
      await this.s3.uploadDir(config.tdlibDbPath, config.tdlibDbPath);
    }
  }

  getMessagesTimeRange() {
    const { since, to } = config.noAnswerMessagesTimeRange;
    return {
      since: getTimeWithMinutesOffset(since),
      to: getTimeWithMinutesOffset(to),
    };
  }
}

function getTimeWithMinutesOffset(minutes: number) {
  const date = new Date();
  date.setMinutes(date.getMinutes() + minutes);
  return Math.round(date.valueOf() / 1000);
}
