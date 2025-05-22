import Logo from "@/assets/logo.svg";
import { SiteConfig } from "@/types/config";

export const siteConfig = {
  logo: <Logo />,
  navItems: [
    { label: "Home", href: "/" },
    {
      icon: "icon-[line-md--github-loop]",
      href: "https://github.com/suenyiyang",
      target: "_blank",
    },
  ],
} as SiteConfig;
