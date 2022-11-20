/**
 * List of NoAnswerDigest instances.
 */

import { logger } from '../helpers/logger.js';
import { formatDate, offsetMinutes } from '../helpers/utils.js';
import { noAnswerConfig } from './armenia.config.js';
import { Tg } from '../telegram/TgClient.js';
import { TgMessage } from '../telegram/TgMessage.js';
import { isNoAnswerDigest, NoAnswerDigest } from './Digest.js';
import { notifyError } from '../app.js';

export class NoAnswerDigestList {
  protected logger = logger.withPrefix(`[${this.constructor.name}]:`);
  protected items: NoAnswerDigest[] = [];

  constructor(protected tg: Tg, protected chatId: number) { }

  async load() {
    const since = offsetMinutes(noAnswerConfig.digestUpdateOffsetSince);
    this.logger.log(`Digest list loading since: ${formatDate(since)}`);
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
      try {
        await digest.update();
      } catch (e) {
        e.message += digest.getInfoString();
        this.logger.error(e);
        notifyError(this.tg, e);
      }
    }
    this.logger.log(`Digest list updated.`);
  }

  containsMessage(m: TgMessage) {
    return this.items.some(digest => digest.containsMessage(m));
  }

  getLastDigest() {
    return this.items[0];
  }
}
