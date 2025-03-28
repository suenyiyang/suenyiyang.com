export interface Route {
  href: string;
  label: string;
}

export const routes: Route[] = [
  {
    href: "/",
    label: "home",
  },
  {
    href: "/posts",
    label: "posts",
  },
  {
    href: "/projects",
    label: "projects",
  },
];
