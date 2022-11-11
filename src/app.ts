import { Tg } from './tg.js';
import { S3 } from './s3.js';
import { logger } from './logger.js';
import { message } from 'tdlib-types';
import { NoAnswerDigest, isNoAnswerMessage } from './noAnswerDigest.js';
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
      await this.handleNoAnswerMessages();
    } finally {
      await this.tg.close();
      await this.uploadDb();
    }
  }

  async handleNoAnswerMessages() {
    const messages = await this.loadNoAnswerMessages();
    if (!messages.length) return;
    const text = await new NoAnswerDigest(this.tg, messages).buildText();
    if (!config.dryRun) {
      const targetChatId = config.isProduction ? digestChatId : config.testChatId;
      await this.tg.sendMessage(targetChatId, text);
    }
    this.logger.log(`Digest sent.${config.dryRun ? ' (dry run)' : ''}`);
  }

  async updateNoAnswerDigest() {
    // load messages from digest channel
    // create instances, extract links
    // check link info
    // update info in digest
    // build text and edit message
  }

  async loadDigestList() {
    // this.logger.log(`Loading messages for: ${chat.name}`);
    // const since = getTimeWithMinutesOffset(-6 * 60);
    // const targetChatId = config.isProduction ? digestChatId : config.testChatId;
    // const messages = await this.tg.loadMessages(targetChatId, since);
    // this.digestList = messages
    //   .map(m => NoAnswerDigest.tryCreateFromMessage(m))
    //   .filter(Boolean);
    // for (const d of digestList) {
    //   await d.updateStatus();
    // }
    // const tasks = digestList.map(d => d.updateByLinks())
    // const digestMessages = messages.filter(m => m.date < to);
  }

  async loadNoAnswerMessages() {
    const timeRange = this.getMessagesTimeRange();
    const totalMessages: message[] = [];
    for (const chatConfig of chats) {
      const messages = await this.loadNoAnswerMessagesForChat(chatConfig, timeRange);
      totalMessages.push(...messages);
    }
    this.logger.log(`Total no answer messages: ${totalMessages.length}`);
    return totalMessages.slice(0, config.noAnswerMaxCount);
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
