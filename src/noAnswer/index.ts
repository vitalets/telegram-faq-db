import { config } from '../config.js';
import { logger } from '../helpers/logger.js';
import { offsetMinutes, removeDuplicates, TimeRange } from '../helpers/utils.js';
import { ChatConfig, noAnswerChats, noAnswerConfig } from '../no-answer.config.js';
import { Tg } from '../telegram/TgClient.js';
import { TgMessage } from '../telegram/TgMessage.js';
import { NoAnswerDigest } from './Digest.js';
import { NoAnswerDigestList } from './DigestList.js';
import { isNoAnswerMessage } from './helpers.js';

export class NoAnswer {
  protected logger = logger.withPrefix(`[${this.constructor.name}]:`);
  protected digestList: NoAnswerDigestList;

  constructor(protected tg: Tg) {
    this.digestList = new NoAnswerDigestList(this.tg, this.digestChatId);
  }

  get digestChatId() {
    return config.isProduction
      ? noAnswerConfig.digestChatId
      : config.testChatId;
  }

  async run() {
    await this.updateAnswered();
    await this.postNewDigest();
  }

  protected async updateAnswered() {
    await this.digestList.load();
    await this.digestList.updateAnswered();
  }

  protected async postNewDigest() {
    const messages = await this.loadNoAnswerMessages();
    const newMessages = this.extractNewMessages(messages);
    if (newMessages.length === 0) return;
    const digest = await new NoAnswerDigest(this.tg).initByNoAnswerMessages(newMessages);
    await digest.post(this.digestChatId);
  }

  protected async loadNoAnswerMessages() {
    const timeRange = this.getMessagesTimeRange();
    const messages: TgMessage[] = [];
    for (const chatConfig of noAnswerChats) {
      const chatMessages = await this.loadNoAnswerMessagesForChat(chatConfig, timeRange);
      messages.push(...chatMessages);
    }
    this.logger.log(`Loaded no-answer messages: ${messages.length}`);
    return messages;
  }

  protected async loadNoAnswerMessagesForChat(chat: ChatConfig, range: TimeRange) {
    this.logger.log(`Loading messages for: ${chat.name}`);
    const messages = await this.tg.loadMessages(chat.id, range.since);
    this.logger.log(`Loaded messages: ${messages.length}`);
    const noAnswerMessages = messages
      .filter(m => m.date < range.to)
      .map(m => new TgMessage(this.tg, m))
      .filter(m => isNoAnswerMessage(m));
    this.logger.log(`No-answer messages: ${noAnswerMessages.length}`);
    return noAnswerMessages;
  }

  protected extractNewMessages(messages: TgMessage[]) {
    const newMessages = removeDuplicates(messages, m => m.text)
      .filter(m => !this.isAlreadyPosted(m))
      .slice(0, noAnswerConfig.digestItemsMaxCount);
    this.logger.log(`New no-answer messages: ${newMessages.length}`);
    return newMessages;
  }

  protected isAlreadyPosted(m: TgMessage) {
    return this.digestList.containsMessage(m);
  }

  protected getMessagesTimeRange() {
    return {
      since: offsetMinutes(noAnswerConfig.noAnswerMessagesOffsetSince),
      to: offsetMinutes(noAnswerConfig.noAnswerMessagesOffsetTo),
    };
  }
}