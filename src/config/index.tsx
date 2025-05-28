import Logo from "~/assets/logo.svg";
import favicon from "~/assets/favicon.svg?url";
import { t } from "~/locale";
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
    title: t("site.title"),
    description: t("site.description"),
    keywords: t("site.keywords"),
    url: "https://suenyiyang.com",
    favicon,
  },
};
