import Logo from "~/assets/logo.svg";
import favicon from "~/assets/favicon.svg?url";
import { SiteConfig } from "~/types/config";

export const siteConfig: SiteConfig = {
  logo: <Logo />,
  navItems: [
    { label: "Posts", href: "/posts" },
    {
      icon: "icon-[line-md--link]",
      href: "/links",
    },
    {
      icon: "icon-[line-md--github-loop]",
      href: "https://github.com/suenyiyang",
      target: "_blank",
    },
  ],
  metadata: {
    title: "Yiyang Suen",
    description:
      "Personal blog including frontend tech, life sharing, AI exploration and more.",
    keywords: "Yiyang Suen, Frontend, Tech, 孙轶扬, 前端, 技术",
    url: "https://suenyiyang.com",
    favicon,
  },
};
