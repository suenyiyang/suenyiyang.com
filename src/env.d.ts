declare module globalThis {
  export const __INJECTED_WALINE_SERVER_URL__: string;
  export const __INJECTED_R2_PUBLIC_URL__: string;
  export const __INJECTED_GA_ID__: string;
}

declare module "*.svg" {
  const content: string;
  export default content;
}

declare module "*.css?url" {
  const content: string;
  export default content;
}

declare module "*.svg?url" {
  const content: string;
  export default content;
}
