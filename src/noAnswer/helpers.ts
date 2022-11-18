import { textEntity } from 'tdlib-types';
import { TgMessage } from '../telegram/TgMessage.js';

// eslint-disable-next-line complexity
export function isNoAnswerMessage(m: TgMessage) {
  return m.isTextMessage
    && !m.isReply
    && m.repliesCount === 0
    && m.text.length >= 30
    && isQuestion(m.text)
    && !hasLinks(m.entities)
    && !isOfferLS(m.text)
    && hasRussianLetters(m.text);
}

function isQuestion(text: string) {
  return text.includes('?') || /подскажите/i.test(text);
}

function hasLinks(entities: textEntity[]) {
  return entities.some(e => {
    return e.type._ === 'textEntityTypeTextUrl'
      || e.type._ === 'textEntityTypeUrl'
      || e.type._ === 'textEntityTypeMention';
  });
}

/**
 * Содержит предложение написать в личку/лс
 */
function isOfferLS(text: string) {
  return /\s(лс|личк[уе])([^а-яё]|\s|$)/i.test(text);
}

function hasRussianLetters(text: string) {
  return /[а-яё]/i.test(text);
}

