import OSSClient from 'ali-oss';
import assert from 'node:assert';
import glob from 'fast-glob';
import path from 'node:path';

interface OSSConfigItem {
  region: string;
  bucket: string;
}

assert(process.env.BUILD_REGION);

const BUILD_REGION_TO_OSS_CONFIG: Record<string, OSSConfigItem[]> = {
  cn: [
    {
      region: 'oss-cn-chengdu',
      bucket: 'static-resource-cn-cd',
    },
  ],
  jp: [
    {
      region: 'oss-ap-northeast-1',
      bucket: 'static-resource-jp',
    },
  ],
};

const createOSSClient = (config: OSSConfigItem) => {
  assert(process.env.OSS_ACCESS_KEY_ID);
  assert(process.env.OSS_ACCESS_KEY_SECRET);

  const client = new OSSClient({
    region: config.region,
    accessKeyId: process.env.OSS_ACCESS_KEY_ID,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
    bucket: config.bucket,
  });

  return client;
};

const getFilePathList = async (folder: string) => {
  const filePathList = glob(
    `${folder}/**/*`,
    {
      absolute: true,
      dot: true,
      ignore: ['**/*.html'],
    },
  );

  return filePathList;
};

const OSS_CONFIG = BUILD_REGION_TO_OSS_CONFIG[process.env.BUILD_REGION];

assert(OSS_CONFIG);

const main = async () => {
  const outputFolder = path.resolve(import.meta.dirname, '../build');
  const filePathList = await getFilePathList(outputFolder);

  for (const config of OSS_CONFIG) {
    const client = createOSSClient(config);

    for (const filePath of filePathList) {
      const relativePath = filePath.replace(outputFolder, '');
      await client.put(
        relativePath,
        filePath,
      );
    }
  }
};


main().catch(error => {
  console.error('Failed to upload static resource.', error);
});
