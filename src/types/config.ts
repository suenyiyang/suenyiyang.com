import { ReactNode } from "react";

export interface SiteConfig {
  logo: ReactNode;
  navItems: {
    label?: string;
    icon?: string;
    href: string;
    target?: string;
    component?: ReactNode;
  }[];
  metadata: {
    title: string;
    description: string;
    keywords: string;
    url: string;
    favicon: string;
  };
}
