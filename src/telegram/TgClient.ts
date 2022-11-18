/**
 * Methods:
 * https://core.telegram.org/tdlib/docs/classtd_1_1td__api_1_1_function.html
 */

/* eslint-disable max-lines */

import { Client } from 'tdl';
import { TDLib } from 'tdl-tdlib-addon';
import { getTdjson } from 'prebuilt-tdlib';
import timers from 'timers/promises';
import type { message, Update, updateMessageSendSucceeded } from 'tdlib-types';
import { logger } from '../helpers/logger.js';
import { config } from '../config.js';
import { AuthCode } from './AuthCode.js';
import { offsetMinutes } from '../helpers/utils.js';

const tdlibPath = process.platform === 'linux'
  ? getTdjson()
  : config.tdlibJsonPathLocal;

export class Tg {
  protected logger = logger.withPrefix(`[${this.constructor.name}]:`);
  protected listeners = new Map<(u: Update) => unknown, (u: Update) => void>();
  client: Client;

  constructor() {
    this.client = this.createClient();
    this.client.on('update', update => this.onUpdate(update));
  }

  async login() {
    await Promise.all([
      this.client.login(() => {
        return {
          getPhoneNumber: async () => config.telegramPhone,
          getAuthCode: async () => new AuthCode().getCode(),
        };
      }),
      this.waitForReady(),
    ]);
    this.logger.log('logged in');
  }

  async close() {
    await Promise.all([
      this.client.close(),
      this.waitForEvent(u => {
        return u._ === 'updateAuthorizationState'
          && u.authorization_state._ === 'authorizationStateClosed';
      }),
    ]);
  }

  // eslint-disable-next-line max-statements
  async loadMessages(chatId: number, since: number) {
    // since can be relative
    if (since <= 0) since = offsetMinutes(since);

    // open chat to load latest messages
    await this.openChat(chatId);

    // here delay is important to load latest messages
    // todo: better logic!
    await timers.setTimeout(2000);

    const totalMessages: message[] = [];
    let fromMessageId = 0;
    while (true) {
      const messages = await this.getChatHistory(chatId, fromMessageId, 100);
      if (!messages.length) break;
      fromMessageId = messages[messages.length - 1].id;
      for (const m of messages) {
        // eslint-disable-next-line max-depth
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
    this.logger.log(`getChatHistory loaded: ${messages.length}`);
    return (messages || []).filter(Boolean) as message[];
  }

  async getChats(limit = 100) {
    return this.client.invoke({
      _: 'getChats',
      chat_list: { _: 'chatListMain' },
      limit,
    });
  }

  async openChat(chatId: number) {
    return this.client.invoke({
      _: 'openChat',
      chat_id: chatId
    });
  }

  async sendMessage(chatId: number, text: string) {
    const { id } = await this.client.invoke({
      _: 'sendMessage',
      chat_id: chatId,
      input_message_content: {
        _: 'inputMessageText',
        text: this.parseMarkdown(text),
        disable_web_page_preview: true,
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

  async waitForReady() {
    await this.waitForEvent(u => {
      return u._ === 'updateConnectionState'
        && u.state._ === 'connectionStateReady';
    });
  }

  async getMessageLink(chatId: number, messageId: number) {
    const { link } = await this.client.invoke({
      _: 'getMessageLink',
      chat_id: chatId,
      message_id: messageId,
    });

    return link;
  }

  async getMessageLinkInfo(url: string) {
    return this.client.invoke({
      _: 'getMessageLinkInfo',
      url,
    });
  }

  async editMessageText(m: message, text: string) {
    return this.client.invoke({
      _: 'editMessageText',
      chat_id: m.chat_id,
      message_id: m.id,
      input_message_content: {
        _: 'inputMessageText',
        text: this.parseMarkdown(text),
        disable_web_page_preview: true,
      }
    });
  }

  parseMarkdown(text: string) {
    const parsed = this.client.execute({
      _: 'parseMarkdown',
      text: { _: 'formattedText', text }
    });

    if (parsed?._ !== 'formattedText') {
      throw new Error(`Error in markdown: ${text}`);
    }

    return parsed;
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
    this.logger.debug(update._);
    for (const [ fn, resolve ] of this.listeners) {
      if (fn(update)) {
        this.listeners.delete(fn);
        resolve(update);
      }
    }
  }
}
