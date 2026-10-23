export const ROUTES = {
  home: "/",
  posts: "/posts",
  links: "/links",
  github: "https://github.com/nickolasclarke",
} as const;

export type Route = (typeof ROUTES)[keyof typeof ROUTES];

export const NAV_LINKS = [
  { label: "文章", href: ROUTES.posts },
  { label: "友链", href: ROUTES.links },
] as const;
