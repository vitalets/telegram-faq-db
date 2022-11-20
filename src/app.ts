import { Tg } from './telegram/TgClient.js';
import { S3 } from './helpers/s3.js';
import { logger } from './helpers/logger.js';
import { config } from './config.js';
import { NoAnswer } from './noAnswer/index.js';

export class App {
  logger = logger.withPrefix(`[${this.constructor.name}]:`);
  s3 = new S3(config.bucket);
  tg!: Tg;

  async run() {
    this.logger.log(`Running app. isProduction: ${config.isProduction}`);
    await this.downloadDb();
    this.tg = new Tg();
    try {
      await this.tg.login();
      await new NoAnswer(this.tg).run();
    } catch (e) {
      this.logger.error(e);
    } finally {
      await this.tg.close();
      await this.uploadDb();
      this.logger.log(`Done. ${config.dryRun ? ' (DRY RUN)' : ''}`);
    }
  }

  async downloadDb() {
    if (config.isCI) {
      await this.s3.downloadDir(config.tdlibDbPath, config.tdlibDbPath);
      this.logger.log(`Db downloaded.`);
    }
  }

  async uploadDb() {
    if (config.isCI) {
      await this.s3.uploadDir(config.tdlibDbPath, config.tdlibDbPath);
      this.logger.log(`Db uploaded.`);
    }
  }
}
