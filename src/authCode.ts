/**
 * Reads auth code from s3 bucket folders
 */
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';

const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;

const REGION = 'ru-central1';
const ENDPOINT = 'https://storage.yandexcloud.net';
const BUCKET = 'tmp-objects';

export class AuthCode {
  client: S3Client;

  constructor() {
    this.client = new S3Client({
      region: REGION,
      endpoint: ENDPOINT,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID || '',
        secretAccessKey: AWS_SECRET_ACCESS_KEY || '',
      }
    });
  }

  async getCode() {
    const attempts = 30;
    for (let i = 0; i < attempts; i++) {
      console.log(`Checking auth key, attempt #${i}`);
      const keys = await this.listKeys();
      if (keys.length) {
        const key = keys[0].replace(/\D/g, '');
        console.log(`Got auth key: ${key}`);
        this.deleteKeys(keys).catch(e => console.log(e));
        return key;
      }
      await new Promise(r => setTimeout(r, 1000));
    }
    throw new Error(`Can't get auth code in ${attempts} attempts`)
  }

  protected async listKeys() {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: 'code'
    });
    const res = await this.client.send(command);
    return (res.Contents || [])
      .sort((a, b) => {
        return b.LastModified!.valueOf() - a.LastModified!.valueOf();
      })
      .map(r => r.Key!);
  }

  protected async deleteKeys(keys: string[]) {
    const Objects = keys.map(Key => ({ Key }));
    const command = new DeleteObjectsCommand({
      Bucket: BUCKET,
      Delete: { Objects }
    });
    await this.client.send(command);
  }
}
