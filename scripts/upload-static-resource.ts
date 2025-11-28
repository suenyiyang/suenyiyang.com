import OSSClient from 'ali-oss';
import assert from 'node:assert';
import glob from 'fast-glob';
import path from 'node:path';
import { BUILD_REGION_TO_OSS_CONFIG, OSSConfigItem } from '../config/build';
import { ENV_BUILD_REGION, ENV_OSS_ACCESS_KEY_ID, ENV_OSS_ACCESS_KEY_SECRET, ENV_OSS_PREFIX_PATH } from '../config/env';

assert(ENV_BUILD_REGION);

const createOSSClient = (config: OSSConfigItem) => {
  assert(ENV_OSS_ACCESS_KEY_ID);
  assert(ENV_OSS_ACCESS_KEY_SECRET);

  const client = new OSSClient({
    region: config.region,
    accessKeyId: ENV_OSS_ACCESS_KEY_ID,
    accessKeySecret: ENV_OSS_ACCESS_KEY_SECRET,
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

const OSS_CONFIG = BUILD_REGION_TO_OSS_CONFIG[ENV_BUILD_REGION];

assert(OSS_CONFIG);

const main = async () => {
  const outputFolder = path.resolve(import.meta.dirname, '../build');
  const filePathList = await getFilePathList(outputFolder);

  for (const config of OSS_CONFIG) {
    const client = createOSSClient(config);

    for (const filePath of filePathList) {
      const relativePath = filePath.replace(outputFolder, ENV_OSS_PREFIX_PATH);
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
