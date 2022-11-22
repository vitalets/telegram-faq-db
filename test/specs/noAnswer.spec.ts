import fs from 'fs';
import { Tg } from '../../src/telegram/TgClient.js';
import { TgMessage } from '../../src/telegram/TgMessage.js';
import { message } from 'tdlib-types';
import { getMessageWeight, isNoAnswerMessage } from '../../src/noAnswer/helpers.js';

type JsonMessage = typeof import('../../samples/getMessage.json');
const jsonMessageStr = fs.readFileSync('samples/getMessage.json', 'utf8');

describe('noAnswer (utils)', () => {
  const tg = sinon.createStubInstance(Tg);

  function getMessage(fn?: (message: JsonMessage) => unknown) {
    const message = JSON.parse(jsonMessageStr) as JsonMessage;
    message.content.text.entities = [];
    fn?.(message);
    return new TgMessage(tg, message as unknown as message);
  }

  function getMessageWithText(text: string) {
    return getMessage(m => m.content.text.text = text);
  }

  describe('getMessageWeight', () => {
    it('weight 0', () => {
      const m = getMessageWithText('сообщение с весом 0');
      assert.equal(getMessageWeight(m), 0);
    });

    it('weight 1', () => {
      const m = getMessageWithText('Сообщение с весом 1');
      assert.equal(getMessageWeight(m), 1);
    });

    it('weight 3', () => {
      const m = getMessageWithText('Привет! Сообщение с весом 2');
      assert.equal(getMessageWeight(m), 3);
    });
  });

  describe('isNoAnswerMessage', () => {
    it('default: false', () => {
      const m = getMessage();
      assert.equal(isNoAnswerMessage(m), false);
    });

    it('msg with question and no links: true', () => {
      const m = getMessageWithText('Здравствуйте! Работают ли карты мир?');
      assert.equal(isNoAnswerMessage(m), true);
    });

    it('text without russian: false', () => {
      const m = getMessageWithText('bla bla?'.repeat(30));
      assert.equal(isNoAnswerMessage(m), false);
    });

    it('text with many smiles: false', () => {
      const m1 = getMessageWithText('Здравствуйте! Работают ли у кого-то карты мир?)');
      const m2 = getMessageWithText('Здравствуйте! Работают ли у кого-то карты мир?))');
      assert.equal(isNoAnswerMessage(m1), true);
      assert.equal(isNoAnswerMessage(m2), false);
    });

  });

});
