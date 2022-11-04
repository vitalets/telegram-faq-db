/**
 * Object storage wrapper.
 */
import { Readable } from 'stream';
import path from 'path';
import { finished } from 'node:stream/promises';
import fs from 'node:fs';
import mime from 'mime';
import fg from 'fast-glob';
import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';

// todo: create separate service account
const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;

const REGION = 'ru-central1';
const ENDPOINT = 'https://storage.yandexcloud.net';

export class S3 {
  client: S3Client;

  constructor(protected bucket: string) {
    this.client = new S3Client({
      region: REGION,
      endpoint: ENDPOINT,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID || '',
        secretAccessKey: AWS_SECRET_ACCESS_KEY || '',
      }
    });
  }

  async listKeys(prefix = '') {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix
    });
    const res = await this.client.send(command);
    return (res.Contents || [])
      .sort((a, b) => {
        return b.LastModified!.valueOf() - a.LastModified!.valueOf();
      })
      .map(r => r.Key!);
  }

  async deleteKeys(keys: string[]) {
    const Objects = keys.map(Key => ({ Key }));
    const command = new DeleteObjectsCommand({
      Bucket: this.bucket,
      Delete: { Objects }
    });
    return this.client.send(command);
  }

  async uploadFile(file: string, key: string) {
    const ContentType = mime.getType(file) || 'application/octet-stream';
    console.log(`Uploading: ${file} -> ${key} (${ContentType})`);
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: fs.createReadStream(file),
      ContentType,
      CacheControl: 'no-cache',
    });
    await this.client.send(command);
  }

  async downloadFile(key: string, file: string) {
    console.log(`Downoading: ${key} -> ${file}`);
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    const { Body } = await this.client.send(command);
    if (!Body) throw new Error('Not found');
    const dir = path.dirname(file);
    !fs.existsSync(dir) && await fs.promises.mkdir(dir, { recursive: true });
    const outStream = fs.createWriteStream(file);
    // see: https://stackoverflow.com/questions/68373349/aws-sdk-v3-download-file-with-typescript
    (Body as Readable).pipe(outStream);
    await finished(outStream);
  }

  async uploadDir(dir: string, prefix: string) {
    const files = await fg(`${dir}/**`);
    for (const file of files) {
      const key = `${prefix}/${path.relative(dir, file)}`;
      await this.uploadFile(file, key);
    }
    console.log(`Upload dir complete.`);
  }

  async downloadDir(prefix: string, dir: string) {
    const keys = await this.listKeys(prefix);
    for (const key of keys) {
      const file = path.join(dir, path.relative(prefix, key));
      await this.downloadFile(key, file);
    }
    console.log(`Download dir complete.`);
  }
}
