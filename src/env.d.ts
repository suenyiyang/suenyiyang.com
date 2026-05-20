declare const __INJECTED_WALINE_SERVER_URL__: string;
declare const __INJECTED_GA_ID__: string;

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

declare module "*.png" {
  const src: string;
  export default src;
}

declare module "*.jpg" {
  const src: string;
  export default src;
}

declare module "*.jpeg" {
  const src: string;
  export default src;
}

declare module "*.gif" {
  const src: string;
  export default src;
}

declare module "*.webp" {
  const src: string;
  export default src;
}
