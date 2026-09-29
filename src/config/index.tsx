import { Logo } from "~/components/Logo";
import { SiteConfig } from "~/types/config";

export const siteConfig: SiteConfig = {
  logo: <Logo />,
  navItems: [
    { label: "Posts", href: "/posts" },
    { label: "About", href: "/about" },
    { label: "Links", href: "/links" },
  ],
  socialLinks: [
    {
      label: "GitHub",
      icon: "icon-[line-md--github-loop]",
      href: "https://github.com/suenyiyang",
    },
    {
      label: "Twitter",
      icon: "icon-[line-md--twitter-x]",
      href: "https://twitter.com/suenyiyang",
    },
    {
      label: "RSS",
      icon: "icon-[line-md--rss]",
      href: "/rss.xml",
    },
  ],
  metadata: {
    title: "Yiyang Suen",
    description:
      "Personal blog including frontend tech, life sharing, AI exploration and more.",
    keywords: "Yiyang Suen, Frontend, Tech",
    url: "https://suenyiyang.com",
    // Icons live in public/ so crawlers get stable, unhashed URLs
    // (/favicon.ico is what most of them probe first). Regenerate the whole set
    // from the avatar with `pnpm icons`.
    favicon: "/icon-192.webp",
    ogImage: "/og.jpg",
    twitter: "@suenyiyang",
  },
};
