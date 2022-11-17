import { Tg } from './tg.js';
import { S3 } from './s3.js';
import { logger } from './logger.js';
import { message } from 'tdlib-types';
import { NoAnswerDigest, isNoAnswerMessage, isNoAnswerDigest } from './noAnswerDigest.js';
import { config } from './config.js';
import { ChatConfig, chats, digestChatId } from './config.chats.js';
import { cutStr, removeNewLines } from './utils.js';

type TimeRange = {
  since: number;
  to: number;
}

export class App {
  logger = logger.withPrefix(`[${this.constructor.name}]:`);
  s3 = new S3(config.bucket);
  tg!: Tg;
  digestList: NoAnswerDigest[] = [];

  async run() {
    this.logger.log(`Running app. isProduction: ${config.isProduction}`);
    await this.downloadDb();
    this.tg = new Tg();
    try {
      await this.tg.login();
      await this.updateDigestHistory();
      await this.postNewDigest();
    } finally {
      await this.tg.close();
      await this.uploadDb();
      config.dryRun && this.logger.log('DRY RUN.');
    }
  }

  async postNewDigest() {
    const questions = await this.loadNewNoAnswerMessages();
    if (questions.length === 0) return;
    const digest = await new NoAnswerDigest(this.tg).initByQuestions(questions);
    const text = digest.buildText();
    this.logger.log(`Text built:\n${text}`);
    if (!config.dryRun) {
      const targetChatId = config.isProduction ? digestChatId : config.testChatId;
      await this.tg.sendMessage(targetChatId, text);
    }
    this.logger.log(`Digest posted.`);
  }

  // eslint-disable-next-line max-statements
  async updateDigestHistory() {
    const since = getTimeWithMinutesOffset(config.digestUpdateMinutesOffset);
    const targetChatId = config.isProduction ? digestChatId : config.testChatId;
    this.logger.log(`Digest history loading since: ${new Date(since * 1000)}`);
    const messages = await this.tg.loadMessages(targetChatId, since);
    this.logger.log(`Digest history loaded: ${messages.length}`);

    for (const message of messages) {
      if (!isNoAnswerDigest(message)) continue;
      const digest = await new NoAnswerDigest(this.tg).initByDigestMessage(message);
      this.digestList.push(digest);
      // todo dryRun
      const text = digest.buildText();
      this.logger.log(`Updating digest: ${message.id}`);
      await this.tg.editMessageText(message, text);
    }

    this.logger.log(`Digest history updated.`);
  }

  async loadNewNoAnswerMessages() {
    const timeRange = this.getMessagesTimeRange();
    const totalMessages: message[] = [];
    for (const chatConfig of chats) {
      const messages = await this.loadNoAnswerMessagesForChat(chatConfig, timeRange);
      totalMessages.push(...messages);
    }
    this.logger.log(`Loaded no-answer messages: ${totalMessages.length}`);
    const newMessages = totalMessages
      .filter(m => !this.isAlreadyPostedMessage(m))
      .slice(0, config.noAnswerMaxCount);
    this.logger.log(`New no-answer messages: ${newMessages.length}`);
    return newMessages;
  }

  protected async loadNoAnswerMessagesForChat(chat: ChatConfig, { since, to }: TimeRange) {
    this.logger.log(`Loading messages for: ${chat.name}`);
    const messages = await this.tg.loadMessages(chat.id, since);
    const rangeMessages = messages.filter(m => m.date < to);
    const noAnswerMessages = rangeMessages.filter(m => isNoAnswerMessage(m));
    this.logger.log([
      `Loaded messages: ${messages.length},`,
      `in time range: ${rangeMessages.length},`,
      `no answer: ${noAnswerMessages.length}`
    ].join(' '));
    if (messages.length) {
      const { content } = messages[0];
      const text = content._ === 'messageText' ? content.text.text : content._;
      this.logger.log(`Last message: ${cutStr(removeNewLines(text), 50)}`);
    }
    return noAnswerMessages;
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

  protected isAlreadyPostedMessage(m: message) {
    return this.digestList.some(digest => digest.containsMessageId(m.id));
  }

  protected getMessagesTimeRange() {
    const { since, to } = config.noAnswerMessagesTimeRange;
    return {
      since: getTimeWithMinutesOffset(since),
      to: getTimeWithMinutesOffset(to),
    };
  }
}

/**
 * Shift current time by minutes and return value in seconds.
 */
function getTimeWithMinutesOffset(minutes: number) {
  const date = new Date();
  date.setMinutes(date.getMinutes() + minutes);
  return Math.round(date.valueOf() / 1000);
}
