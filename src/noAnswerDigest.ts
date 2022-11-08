/**
 * Build/parse no answers digest message
 */
import { message, messageText } from 'tdlib-types';
import { logger } from './logger.js';
import { cutStr, removeNewLines } from './utils.js';

const header = [
  'На эти вопросы никто не ответил в течение часа.',
  'Возможно вы сможете помочь:',
].join(' ');
const maxQuestionLength = 150;

export class NoAnswerDigest {
  protected logger = logger.withPrefix(`[${this.constructor.name}]:`);

  /**
   * Creates digest instance from existing message in channel.
   */
  static fromMessage(m: message) {
    // todo
  }

  constructor(protected questions: message[], protected links: string[]) { }

  buildText() {
    const items = this.questions.map((m, i) => {
      const content = m.content as messageText;
      const text = cutStr(removeNewLines(content.text.text), maxQuestionLength);
      return `🔹 [${text}](${this.links[i]})`;
    });
    const text = [ `**${header}**`, ...items ].join('\n\n');
    this.logger.log(`Text built:\n${text}`);
    return text;
  }
}

export function isNoAnswerMessage(m: message) {
  return !isReply(m)
    && !hasReplies(m)
    && isQuestion(m)
    && !hasLinks(m)
    && !isOfferLS(m);
}

function isReply(m: message) {
  return Boolean(m.reply_to_message_id);
}

function hasReplies(m: message) {
  return Boolean(m.interaction_info?.reply_info?.reply_count);
}

function isQuestion(m: message) {
  if (m.content._ !== 'messageText') return false;
  const { text } = m.content.text;
  return text.includes('?') || /подскажите/i.test(text);
}

function hasLinks(m: message) {
  if (m.content._ !== 'messageText') return false;
  return m.content.text.entities.some(e => {
    return e.type._ === 'textEntityTypeTextUrl'
      || e.type._ === 'textEntityTypeUrl'
      || e.type._ === 'textEntityTypeMention';
  });
}

/**
 * Содержит предложение написать в лс
 */
function isOfferLS(m: message) {
  if (m.content._ !== 'messageText') return false;
  const { text } = m.content.text;
  return /\sлс([^а-яё]|\s|$)/i.test(text);
}
