/**
 * Wrapper over tg message.
 */
import { message } from 'tdlib-types';
import { Tg } from './TgClient.js';

// export function isTextMessage(message?: message) {
//   return message?.content?._ === 'messageText';
// }

export class TgMessage {
  static async tryCreateFromLink(tg: Tg, link: string) {
    if (!isMessageLink(link)) return;
    const { message } = await tg.getMessageLinkInfo(link);
    if (message) {
      const textMessage = new TgMessage(tg, message);
      textMessage.link = link;
      return textMessage;
    }
  }

  link = '';

  constructor(protected tg: Tg, public raw: message) {}

  get id() {
    return this.raw.id;
  }

  get chatId() {
    return this.raw.chat_id;
  }

  get type() {
    return this.raw.content._;
  }

  get text() {
    return this.formattedText?.text || '';
  }

  get entities() {
    return this.formattedText?.entities || [];
  }

  get isReply() {
    return Boolean(this.raw.reply_to_message_id);
  }

  get repliesCount() {
    return this.raw.interaction_info?.reply_info?.reply_count || 0;
  }

  get isTextMessage() {
    return this.type === 'messageText';
  }

  async fillLink() {
    this.link = this.link || await this.tg.getMessageLink(this.chatId, this.id);
  }

  async updateText(text: string) {
    return this.tg.editMessageText(this.raw, text);
  }

  protected get formattedText() {
    const { content } = this.raw;
    switch (content._) {
      case 'messageText': return content.text;
      case 'messagePhoto':
      case 'messageAudio':
      case 'messageVideo': return content.caption;
    }
  }
}

export function isMessageLink(link: string) {
  return link.startsWith('https://t.me/c/');
}
