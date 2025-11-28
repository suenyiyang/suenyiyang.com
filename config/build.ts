import { ENV_BASE } from "./env";

export interface OSSConfigItem {
  region: string;
  bucket: string;
}

export const BUILD_REGION_TO_OSS_CONFIG: Record<string, OSSConfigItem[]> = {
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

export const BASE = ENV_BASE ? ENV_BASE : '/';
