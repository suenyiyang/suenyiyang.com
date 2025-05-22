import Logo from "@/assets/logo.svg";
import { SiteConfig } from "@/types/config";

export const siteConfig = {
  logo: <Logo />,
  navItems: [
    { label: "Home", href: "/" },
    { icon: "GitHub", href: "https://github.com/suenyiyang" },
  ],
} satisfies SiteConfig;
