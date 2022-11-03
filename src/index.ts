/**
 * Methods:
 * https://core.telegram.org/tdlib/docs/classtd_1_1td__api_1_1_function.html
 */

import { Client } from 'tdl';
import { TDLib } from 'tdl-tdlib-addon';
import { getTdjson } from 'prebuilt-tdlib';
import type { messageText } from 'tdlib-types';
import { AuthCode } from './authCode.js'

const tdlibPath = process.platform === 'linux'
  ? getTdjson()
  // ? './libtdjson/libtdjson.so.1.8.7'
  : '../td/tdlib/lib/libtdjson.dylib'; // local development

const dbPath = './tmp';

// chatid: -1001669191797

export type MyMessage = {
  id: number;
  to: number;
  text: string;
  toText?: string;
}

export class TgClient {
  protected client: Client;

  constructor() {
    const tdlib = new TDLib(tdlibPath);
    this.client = new Client(tdlib, {
      apiId: Number(process.env.TELEGRAM_APP_ID),
      apiHash: process.env.TELEGRAM_APP_HASH,
      databaseDirectory: `${dbPath}/_td_database`,
      filesDirectory: `${dbPath}/_td_files`,
    });
  }

  async login() {
    await this.client.login(() => {
      return {
        getPhoneNumber: async () => process.env.TELEGRAM_PHONE || '',
        getAuthCode: async () => new AuthCode().getCode(),
      };
    });
  }

  async close() {
    await this.client.close();
  }

  async getChatHistory(chatId: number, count: number) {
    // load chats first to avoid "Chat not found" error
    const chats = await this.client.invoke({
        _: 'getChats',
        chat_list: { _: 'chatListMain' },
        limit: 4000
      });
    console.log(chats);

    const res: MyMessage[] = [];
    let fromMessageId = 0;
    // todo: what if channel does not have count messages?
    while (res.length < count) {
      console.log(`Loading messages from: ${fromMessageId}`);
      const { messages } = await this.client.invoke({
        _: 'getChatHistory',
        chat_id: chatId,
        from_message_id: fromMessageId,
        offset: 0,
        limit: 100,
      });
      console.log(`Loaded: ${messages.length}`);
      messages
        .filter(m => m?.content._ === 'messageText')
        .forEach(m => m && res.push({
          id: m.id,
          to: m.reply_to_message_id,
          text: (m.content as messageText).text.text,
        }));
      fromMessageId = messages.slice(-1)[ 0 ]!.id;
    }
    return res.slice(0, count);
  }
}




// client
//   .on('update', update => {
//     //console.log('Got update:', JSON.stringify(update._, null, 2));
//     if (update._ === 'updateChatLastMessage') {
//       // console.log(JSON.stringify(update, null, 2));
//     }
//   })

// console.log('Me:', await client.invoke({ _: 'getMe' }));

// const chats = await client.invoke({
//     _: 'getChats',
//     chat_list: { _: 'chatListMain' },
//     limit: 4000
//   });
// console.log(chats);

// const info = await client.invoke({
//     _: 'getChat',
//     chat_id: -1001669191797
// })
// console.log(info)

// const r = await client.invoke({
//   _: 'openChat',
//   chat_id: -1001669191797
// })
// console.log(r)

// const msg = await client.invoke({
//     _: 'getMessage',
//     chat_id: -1001669191797,
//     message_id: 142683930624,
// });
// console.log(msg)

// await new Promise(r => setTimeout(r, 1000))

// const messages = await loadMessages(10);
// await loadQuestions(messages);

// console.log(messages);


/*


async function loadMessages(count: number) {
  const res: MyMessage[] = [];
  let fromMessageId = 0;
  while (res.length < count) {
    console.log(`Loading messages from: ${fromMessageId}`);
    const { messages } = await client.invoke({
      _: 'getChatHistory',
      chat_id: -1001669191797,
      from_message_id: fromMessageId,
      offset: 0,
      limit: 100,
    });
    console.log(`Loaded: ${messages.length}`);
    messages
      .filter(m => m?.content._ === 'messageText')
      .forEach(m => m && res.push({
        id: m.id,
        to: m.reply_to_message_id,
        text: (m.content as messageText).text.text
      }));
    fromMessageId = messages.slice(-1)[ 0 ]!.id;
  }
  return res.slice(0, count);
}

async function loadQuestions(messages: MyMessage[]) {
  for (const m of messages) {
    if (m.to) {
      const toMsg = await client.invoke({
        _: 'getMessage',
        chat_id: -1001669191797,
        message_id: m.to,
      });
      m.toText = (toMsg.content as messageText).text.text;
    }
  }
}
*/
