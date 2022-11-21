// Can't run this test because jest does not support ESM natively
// See: https://github.com/react-dnd/react-dnd/issues/3443

// import { loadJson } from '../../helpers/utils.js';
// import { message } from 'tdlib-types';
// import { Tg } from '../../telegram/TgClient.js';
// import { TgMessage } from '../../telegram/TgMessage.js';

// jest.mock('../../telegram/TgClient.js');

describe('helpers', () => {
  it('getMessageWeight', () => {
    // const message = loadJson('samples/getMessage.json') as typeof import('../../../samples/getMessage.json');
    // message.content.text.text = 'сообщение с весом 0';
    // const tgMessage = new TgMessage(new Tg(), message as unknown as message);
    // console.log(tgMessage.text)
    expect(1).toBe(1);
  });
});
