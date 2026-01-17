export const ROUTES = {
  home: "/",
  posts: "/posts",
  links: "/links",
  github: "https://github.com/nickolasclarke",
} as const;

export type Route = (typeof ROUTES)[keyof typeof ROUTES];

export const NAV_LINKS = [
  { label: "Posts", href: ROUTES.posts },
  { label: "Links", href: ROUTES.links },
] as const;
