/**
 * Build/parse no answers digest message
 */
import { message, messageText } from 'tdlib-types';
import { logger } from './logger.js';

const header = [
  'На эти вопросы никто не ответил в течение часа.',
  'Возможно вы сможете помочь.',
].join(' ');

// todo: replace \n+ with space
// todo: cut long messages

export class NoAnswerDigest {
  protected logger = logger.withPrefix(`[${this.constructor.name}]:`);
  constructor(protected questions: message[], protected links: string[]) { }

  buildText() {
    const items = this.questions.map((m, i) => {
      const content = m.content as messageText;
      return `🔹 [${content.text.text}](${this.links[i]})`;
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
    && !hasLinks(m);
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
