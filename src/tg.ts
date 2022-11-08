/**
 * Methods:
 * https://core.telegram.org/tdlib/docs/classtd_1_1td__api_1_1_function.html
 */

import { Client } from 'tdl';
import { TDLib } from 'tdl-tdlib-addon';
import { getTdjson } from 'prebuilt-tdlib';
import timers from 'timers/promises';
import type { messageText, message, Update, updateMessageSendSucceeded } from 'tdlib-types';
import { getAuthCode } from './authCode.js'
import { logger } from './logger.js';
import { config } from './config.js';

const tdlibPath = process.platform === 'linux'
  ? getTdjson()
  : config.tdlibJsonPathLocal;

export class Tg {
  protected logger = logger.withPrefix(`[${this.constructor.name}]:`);
  client: Client;
  protected listeners = new Map<(u: Update) => unknown, (u: Update) => void>();

  constructor() {
    this.client = this.createClient();
    this.client.on('update', update => this.onUpdate(update));
  }

  async login() {
    await this.client.login(() => {
      return {
        getPhoneNumber: async () => config.telegramPhone,
        getAuthCode: async () => getAuthCode(),
      };
    });
    this.logger.log('logged in');
  }

  async close() {
    await this.client.close();
  }

  async loadMessages(chatId: number, since: number) {
    // avoid "Chat not found" error
    await this.getChats();

    // open chat to load latest messages
    await this.openChat(chatId);

    // here delay is important to load latest messages
    // todo: better logic!
    await timers.setTimeout(1000);

    const totalMessages: message[] = [];
    let fromMessageId = 0;
    while (true) {
      const messages = await this.getChatHistory(chatId, fromMessageId, 100);
      if (!messages.length) break;
      fromMessageId = messages[messages.length - 1].id;
      for (const m of messages) {
        if (m.date < since) return totalMessages;
        totalMessages.push(m);
      }
    }
    return totalMessages;
  }

  async getChatHistory(chatId: number, fromMessageId = 0, limit = 100) {
    this.logger.log(`getChatHistory loading from messageId: ${fromMessageId}`);
    const { messages } = await this.client.invoke({
      _: 'getChatHistory',
      chat_id: chatId,
      from_message_id: fromMessageId,
      offset: 0,
      limit,
    });
    this.logger.log(`getChatHistory loading: ${messages.length}`);
    return (messages || []).filter(Boolean) as message[];
  }

  async getChats() {
    return this.client.invoke({
      _: 'getChats',
      chat_list: { _: 'chatListMain' },
      limit: 100
    });
  }

  async openChat(chatId: number) {
    return this.client.invoke({
      _: 'openChat',
      chat_id: chatId
    });
  }

  async sendMessage(chatId: number, text: string) {
    const parsed = this.client.execute({
      _: 'parseMarkdown',
      text: { _: 'formattedText', text }
    });

    if (parsed?._ !== 'formattedText') {
      throw new Error(`Error in markdown: ${text}`);
    }

    const { id } = await this.client.invoke({
      _: 'sendMessage',
      chat_id: chatId,
      input_message_content: {
        _: 'inputMessageText',
        text: parsed
      }
    });

    const { message } = await this.waitForEvent(u => {
      return u._ === 'updateMessageSendSucceeded' && u.old_message_id === id;
    }, { timeout: 2000 }) as updateMessageSendSucceeded;

    return message;
  }

  async waitForEvent(fn: (u: Update) => unknown, { timeout = 0 } = {}) {
    return new Promise<Update>((resolve, reject) => {
      this.listeners.set(fn, resolve);
      timeout && setTimeout(() => {
        this.listeners.delete(fn);
        reject(new Error(`Timeout ${timeout}ms for fn: ${fn}`));
      }, timeout);
    });
  }

  async getMesssageLink(chatId: number, messageId: number) {
    const { link } = await this.client.invoke({
      _: 'getMessageLink',
      chat_id: chatId,
      message_id: messageId,
    });

    return link;
  }

  protected createClient() {
    const tdlib = new TDLib(tdlibPath);
    return new Client(tdlib, {
      apiId: config.telegramAppId,
      apiHash: config.telegramAppHash,
      databaseDirectory: `${config.tdlibDbPath}/_td_database`,
      filesDirectory: `${config.tdlibDbPath}/_td_files`,
    });
  }

  protected onUpdate(update: Update) {
    for (const [ fn, resolve ] of this.listeners) {
      if (fn(update)) {
        this.listeners.delete(fn);
        resolve(update);
      }
    }
  }
}
