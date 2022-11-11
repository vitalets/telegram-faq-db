/**
 * Build/parse no answers digest message
 */
import { message, messageText } from 'tdlib-types';
import { logger } from './logger.js';
import { cutStr, groupBy, removeNewLines } from './utils.js';
import { chats } from './config.chats.js';
import { Tg } from './tg.js';

const mainHeader = [
  'На эти вопросы никто не ответил в течение часа.',
  'Возможно вы сможете помочь:',
].join(' ');
const mainFooter = 'Если ваши друзья знают ответ, перешлите им это сообщение 🙏';
const maxQuestionLength = 150;

export class NoAnswerDigest {
  /**
   * Creates digest instance from existing message in channel.
   */
  static tryCreateFromMessage(m: message) {
    if (!isTextMessage(m)) return;
    const { text } = (m.content as messageText).text;
    if (!text.includes(mainHeader)) return;
    // tbd
  }

  protected logger = logger.withPrefix(`[${this.constructor.name}]:`);
  protected links = new Map<number, string>();

  constructor(protected tg: Tg, protected messages: message[] = []) { }

  async buildText() {
    await this.loadLinksByMessages();
    const groups = groupBy(this.messages, m => m.chat_id);
    const groupStrings = Object.keys(groups).map(chatId => {
      return this.buildGroupText(Number(chatId), groups[ chatId ]);
    }).filter(Boolean);
    const text = [ mainHeader, ...groupStrings, mainFooter ].join('\n\n');
    this.logger.log(`Text built:\n${text}`);
    return text;
  }

  containsMessageId(id: number) {
    return this.messages.some(m => m.id === id);
  }

  protected buildGroupText(chatId: number, messages: message[]) {
    if (!messages.length) return '';
    const chatInfo = chats.find(chat => chat.id === chatId)!;
    const groupHeader = `**${chatInfo.name}** ([вступить](${chatInfo.link}))`;
    const items = messages.map(m => {
      const content = m.content as messageText;
      const text = cutStr(removeNewLines(content.text.text), maxQuestionLength);
      return `🔹 [${text}](${this.links.get(m.id)})`;
    });
    return [ groupHeader, ...items ].join('\n\n');
  }

  protected async loadLinksByMessages() {
    const tasks = this.messages.map(m => this.tg.getMessageLink(m.chat_id, m.id));
    const links = await Promise.all(tasks);
    this.messages.forEach((m, i) => this.links.set(m.id, links[ i ]));
  }

  // protected async loadMessagesByLinks(links: string[]) {
  //   const tasks = links.map(link => this.tg.);
  //   this.links.
  // }
}

// eslint-disable-next-line complexity
export function isNoAnswerMessage(m: message) {
  return isTextMessage(m)
    && hasMinLength(m, 30)
    && !isReply(m)
    && !hasReplies(m)
    && isQuestion(m)
    && !hasLinks(m)
    && !isOfferLS(m);
}

function isTextMessage(m: message) {
  return m.content._ === 'messageText';
}

function isReply(m: message) {
  return Boolean(m.reply_to_message_id);
}

function hasReplies(m: message) {
  return Boolean(m.interaction_info?.reply_info?.reply_count);
}

function isQuestion(m: message) {
  const { text } = (m.content as messageText).text;
  return text.includes('?') || /подскажите/i.test(text);
}

function hasLinks(m: message) {
  const { text } = m.content as messageText;
  return text.entities.some(e => {
    return e.type._ === 'textEntityTypeTextUrl'
      || e.type._ === 'textEntityTypeUrl'
      || e.type._ === 'textEntityTypeMention';
  });
}

/**
 * Содержит предложение написать в лс
 */
function isOfferLS(m: message) {
  const { text } = (m.content as messageText).text;
  return /\s(лс|личк[уе])([^а-яё]|\s|$)/i.test(text);
}

function hasMinLength(m: message, length: number) {
  const { text } = (m.content as messageText).text;
  return text.length >= length;
}
