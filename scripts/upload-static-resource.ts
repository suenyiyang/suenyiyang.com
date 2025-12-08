import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import glob from 'fast-glob';
import {
  ENV_R2_ACCOUNT_ID,
  ENV_R2_ACCESS_KEY_ID,
  ENV_R2_SECRET_ACCESS_KEY,
  ENV_R2_BUCKET_NAME,
  ENV_R2_PUBLIC_URL,
} from '../config/env';

const CONTENT_TYPE_MAP: Record<string, string> = {
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
  '.map': 'application/json',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
};

const getContentType = (filePath: string): string => {
  const ext = path.extname(filePath).toLowerCase();
  return CONTENT_TYPE_MAP[ext] || 'application/octet-stream';
};

const createR2Client = () => {
  assert(ENV_R2_ACCOUNT_ID, 'R2_ACCOUNT_ID is required');
  assert(ENV_R2_ACCESS_KEY_ID, 'R2_ACCESS_KEY_ID is required');
  assert(ENV_R2_SECRET_ACCESS_KEY, 'R2_SECRET_ACCESS_KEY is required');

  return new S3Client({
    region: 'auto',
    endpoint: `https://${ENV_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: ENV_R2_ACCESS_KEY_ID,
      secretAccessKey: ENV_R2_SECRET_ACCESS_KEY,
    },
  });
};

const getFilePathList = async (folder: string) => {
  return glob(`${folder}/**/*`, {
    absolute: true,
    dot: true,
    ignore: ['**/*.html'],
  });
};

const main = async () => {
  assert(ENV_R2_BUCKET_NAME, 'R2_BUCKET_NAME is required');
  assert(ENV_R2_PUBLIC_URL, 'R2_PUBLIC_URL is required');

  const outputFolder = path.resolve(import.meta.dirname, '../build/client');
  const filePathList = await getFilePathList(outputFolder);
  const client = createR2Client();

  console.log(`Uploading ${filePathList.length} files to Cloudflare R2...`);

  for (const filePath of filePathList) {
    const relativePath = filePath
      .replace(outputFolder, new URL(ENV_R2_PUBLIC_URL).pathname.replace(/(\/)?$/, ''));

    const fileContent = fs.readFileSync(filePath);
    const contentType = getContentType(filePath);

    await client.send(
      new PutObjectCommand({
        Bucket: ENV_R2_BUCKET_NAME,
        Key: relativePath.startsWith('/') ? relativePath.slice(1) : relativePath,
        Body: fileContent,
        ContentType: contentType,
      }),
    );

    console.log(`Uploaded: ${relativePath}`);
  }

  console.log('Upload complete!');
};

main().catch((error) => {
  console.error('Failed to upload static resource.', error);
  process.exit(1);
});
