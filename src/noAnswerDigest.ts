/**
 * Class representing single message containing no-answer questions.
 */
import { message, messageText } from 'tdlib-types';
import { logger } from './logger.js';
import { cutStr, groupBy, removeNewLines } from './utils.js';
import { chats } from './config.chats.js';
import { config } from './config.js';
import { Tg } from './tg.js';

const mainHeader = 'На эти вопросы никто не ответил. Возможно, вы сможете помочь:';
const mainFooter = 'Перешлите это сообщение друзьям, если они знают ответ 🙏';

export class NoAnswerDigest {
  protected logger = logger.withPrefix(`[${this.constructor.name}]:`);
  protected links = new Map<number, string>();
  protected messages: message[] = [];
  protected rawMessage?: message;

  constructor(protected tg: Tg) { }

  async initByQuestions(messages: message[]) {
    const tasks = messages.map(m => this.tg.getMessageLink(m.chat_id, m.id));
    const links = await Promise.all(tasks);
    this.messages = messages;
    this.fillLinksMap(links);
    return this;
  }

  async initByDigestMessage(m: message) {
    this.rawMessage = m;
    // todo: better check for message link
    const links = extractLinks(m).filter(link => isLinkToMessage(link));
    const tasks = links.map(link => this.tg.getMessageLinkInfo(link));
    this.messages = (await Promise.all(tasks)).map(r => r.message!);
    this.fillLinksMap(links);
    return this;
  }

  buildText() {
    const groups = groupBy(this.messages, m => m.chat_id);
    const groupStrings = Object.keys(groups).map(chatId => {
      return this.buildGroupText(Number(chatId), groups[ chatId ]);
    }).filter(Boolean);
    const text = groupStrings.length
      ? [ mainHeader, ...groupStrings, mainFooter ].join('\n\n')
      : '';
    return text;
  }

  containsMessageId(id: number) {
    return this.messages.some(m => m.id === id);
  }

  protected buildGroupText(chatId: number, messages: message[]) {
    if (!messages.length) return '';
    const chatInfo = chats.find(chat => chat.id === chatId)!;
    const groupHeader = `**${chatInfo.name}** ([вступить](${chatInfo.link}))`;
    const items = messages.map(m => this.buildQuestionText(m));
    return [ groupHeader, ...items ].join('\n\n');
  }

  protected buildQuestionText(m: message) {
    const content = m.content as messageText;
    const text = cutStr(removeNewLines(content.text.text), config.noAnswerMaxLength);
    const link = this.links.get(m.id);
    return hasReplies(m)
      ? `✅ [~~${text}~~](${link})`
      : `🔸 [${text}](${link})`;
  }

  protected fillLinksMap(links: string[]) {
    this.messages.forEach((m, i) => this.links.set(m.id, links[ i ]));
  }
}

export function isNoAnswerDigest(m: message) {
  return isTextMessage(m)
    && getText(m).includes(mainHeader);
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
  const text = getText(m);
  return text.includes('?') || /подскажите/i.test(text);
}

function hasLinks(m: message) {
  return (m.content as messageText).text.entities.some(e => {
    return e.type._ === 'textEntityTypeTextUrl'
      || e.type._ === 'textEntityTypeUrl'
      || e.type._ === 'textEntityTypeMention';
  });
}

/**
 * Содержит предложение написать в лс
 */
function isOfferLS(m: message) {
  return /\s(лс|личк[уе])([^а-яё]|\s|$)/i.test(getText(m));
}

function hasMinLength(m: message, length: number) {
  return getText(m).length >= length;
}

function getText(m: message) {
  return (m.content as messageText).text.text;
}

function isLinkToMessage(link: string) {
  return link.startsWith('https://t.me/c/');
}

function extractLinks(m: message) {
  if (!isTextMessage(m)) return [];
  return (m.content as messageText).text.entities.map(e => {
    return (e._ === 'textEntity' && e.type._ === 'textEntityTypeTextUrl')
      ? e.type.url
      : '';
  }).filter(Boolean);
}
