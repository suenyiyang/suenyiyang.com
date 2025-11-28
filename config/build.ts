import { ENV_BASE } from "./env";

export interface OSSConfigItem {
  region: string;
  bucket: string;
}

export const OSS_CONFIG: OSSConfigItem[] = [
  {
    region: 'oss-cn-chengdu',
    bucket: 'static-resource-cn-cd',
  },
  {
    region: 'oss-ap-northeast-1',
    bucket: 'static-resource-jp',
  },
];

export const BASE = ENV_BASE ? ENV_BASE : '/';
