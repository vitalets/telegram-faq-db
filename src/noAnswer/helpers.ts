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

function isPoliteMessage(text: string) {
  return /пожалуйста|здравствуйте|привет|добр(ый|ое)|спасибо/i.test(text);
}

function isStartedFromUpperCase(text: string) {
  return /^[А-Я]/.test(text);
}

/**
 * Calculate message weight to show polite messages first.
 */
export function getMessageWeight(m: TgMessage) {
  let w = 0;
  if (isPoliteMessage(m.text)) w +=2;
  if (isStartedFromUpperCase(m.text)) w +=1;
  return w;
}
