/**
 * List of NoAnswerDigest instances.
 */

import { logger } from '../helpers/logger.js';
import { offsetMinutes } from '../helpers/utils.js';
import { noAnswerConfig } from '../no-answer.config.js';
import { Tg } from '../telegram/TgClient.js';
import { TgMessage } from '../telegram/TgMessage.js';
import { isNoAnswerDigest, NoAnswerDigest } from './Digest.js';

export class NoAnswerDigestList {
  protected logger = logger.withPrefix(`[${this.constructor.name}]:`);
  protected items: NoAnswerDigest[] = [];

  constructor(protected tg: Tg, protected chatId: number) { }

  async load() {
    const since = offsetMinutes(noAnswerConfig.digestUpdateOffsetSince);
    this.logger.log(`Digest list loading since: ${new Date(since * 1000)}`);
    const messages = await this.tg.loadMessages(this.chatId, since);
    for (const m of messages) {
      const tgMessage = new TgMessage(this.tg, m);
      if (!isNoAnswerDigest(tgMessage)) continue;
      const digest = await new NoAnswerDigest(this.tg).initByDigestMessage(tgMessage);
      this.items.push(digest);
    }
    this.logger.log(`Digest list loaded: ${this.items.length}`);
  }

  async updateAnswered() {
    for (const digest of this.items) {
      await digest.update();
    }
    this.logger.log(`Digest list updated.`);
  }

  containsMessage(m: TgMessage) {
    return this.items.some(digest => digest.containsMessage(m));
  }
}
