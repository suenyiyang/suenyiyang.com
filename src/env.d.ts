declare module globalThis {
  export const __INJECTED_WALINE_SERVER_URL__: string;
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
