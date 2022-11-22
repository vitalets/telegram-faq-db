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
    const message = JSON.parse(jsonMessageStr);
    fn?.(message);
    return new TgMessage(tg, message as unknown as message);
  }

  describe('getMessageWeight', () => {
    it('weight 0', () => {
      const m = getMessage(m => m.content.text.text = 'сообщение с весом 0');
      assert.equal(getMessageWeight(m), 0);
    });

    it('weight 1', () => {
      const m = getMessage(m => m.content.text.text = 'Сообщение с весом 1');
      assert.equal(getMessageWeight(m), 1);
    });

    it('weight 3', () => {
      const m = getMessage(m => m.content.text.text = 'Привет! Сообщение с весом 2');
      assert.equal(getMessageWeight(m), 3);
    });
  });

  describe('isNoAnswerMessage', () => {
    it('default: false', () => {
      const m = getMessage();
      assert.equal(isNoAnswerMessage(m), false);
    });

    it('msg with question and no links: true', () => {
      const m = getMessage(m => {
        m.content.text.text = 'Здравствуйте! Работают ли карты мир?';
        m.content.text.entities = [];
      });
      assert.equal(isNoAnswerMessage(m), true);
    });

    it('text without russian: false', () => {
      const m = getMessage(m => {
        m.content.text.text = 'bla bla?'.repeat(30);
        m.content.text.entities = [];
      });
      assert.equal(isNoAnswerMessage(m), false);
    });
  });

});
