/**
 * Class representing single message containing no-answer questions.
 */
import { config } from '../config.js';
import { logger } from '../helpers/logger.js';
import { cutStr, groupBy, removeNewLines } from '../helpers/utils.js';
import { noAnswerChats, noAnswerConfig } from '../no-answer.config.js';
import { Tg } from '../telegram/TgClient.js';
import { TgMessage } from '../telegram/TgMessage.js';

const mainHeader = 'На эти вопросы никто не ответил. Возможно, вы сможете помочь:';
const mainFooter = 'Перешлите это сообщение друзьям, если они знают ответ 🙏';
const chatHeader = '**{chatName}** ([вступить]({chatLink}))';
const question = '🔸 [{text}]({link})';
const questionAnswered = '✅ [~~{text}~~]({link})';

export class NoAnswerDigest {
  protected logger = logger.withPrefix(`[${this.constructor.name}]:`);
  protected messages: TgMessage[] = [];
  protected digestMessage?: TgMessage;

  constructor(protected tg: Tg) { }

  async initByNoAnswerMessages(noAnswerMessages: TgMessage[]) {
    this.messages = noAnswerMessages;
    await Promise.all(this.messages.map(m => m.fillLink()));
    return this;
  }

  async initByDigestMessage(digestMessage: TgMessage) {
    this.digestMessage = digestMessage;
    const links = extractLinks(digestMessage);
    const tasks = links.map(link => TgMessage.tryCreateFromLink(this.tg, link));
    this.messages = (await Promise.all(tasks)).filter(Boolean) as TgMessage[];
    return this;
  }

  async post(chatId: number) {
    const text = this.buildText();
    this.logger.log(`Text built:\n${text}`);
    if (!config.dryRun) await this.tg.sendMessage(chatId, text);
    this.logger.log(`Text posted.`);
  }

  async update() {
    if (!this.digestMessage) throw new Error(`Can't update digest`);
    const text = this.buildText();
    this.logger.log(`Text updating: ${this.digestMessage.id}`);
    if (!config.dryRun) await this.tg.editMessageText(this.digestMessage.raw, text);
    this.logger.log(`Text updated.`);
  }

  containsMessage(message: TgMessage) {
    return this.messages.some(m => m.id === message.id || m.text === message.text);
  }

  protected buildText() {
    const groups = groupBy(this.messages, m => m.chatId);
    const groupStrings = Object.keys(groups).map(chatId => {
      return this.buildGroupText(Number(chatId), groups[ chatId ]);
    }).filter(Boolean);
    const text = groupStrings.length
      ? [ mainHeader, ...groupStrings, mainFooter ].join('\n\n')
      : '';
    return text;
  }

  protected buildGroupText(chatId: number, messages: TgMessage[]) {
    if (!messages.length) return '';
    const chatInfo = noAnswerChats.find(chat => chat.id === chatId)!;
    const groupHeader = chatHeader
      .replace('{chatName}', chatInfo.name)
      .replace('{chatLink}', chatInfo.link);
    const items = messages.map(m => this.buildQuestionText(m));
    return [ groupHeader, ...items ].join('\n\n');
  }

  protected buildQuestionText(m: TgMessage) {
    const text = cutStr(removeNewLines(m.text), noAnswerConfig.digestItemMaxLength);
    const tpl = m.repliesCount > 0 ? questionAnswered : question;
    return tpl
      .replace('{text}', text)
      .replace('{link}', m.link);
  }
}

export function isNoAnswerDigest(m: TgMessage) {
  return m.isTextMessage && m.text.includes(mainHeader);
}

function extractLinks(m: TgMessage) {
  return m.entities.map(e => {
    return (e._ === 'textEntity' && e.type._ === 'textEntityTypeTextUrl')
      ? e.type.url
      : '';
  }).filter(Boolean);
}
