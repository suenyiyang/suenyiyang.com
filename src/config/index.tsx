import { Logo } from "~/components/Logo";
import favicon from "~/assets/favicon.svg?url";
import { SiteConfig } from "~/types/config";

export const siteConfig: SiteConfig = {
  logo: <Logo />,
  navItems: [
    { label: "Home", href: "/" },
    { label: "Posts", href: "/posts" },
    { label: "About", href: "/about" },
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
    favicon,
  },
};
