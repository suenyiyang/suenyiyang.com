import { ReactNode } from "react";

export interface SiteConfig {
  logo: ReactNode;
  navItems: {
    label?: string;
    icon?: string;
    href: string;
  }[];
}
