import Logo from "@/assets/logo.svg";
import { t } from "@/locale";
import { SiteConfig } from "@/types/config";

export const siteConfig: SiteConfig = {
  logo: <Logo />,
  navItems: [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
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
    favicon: <Logo />,
  },
};
