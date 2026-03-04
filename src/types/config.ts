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
  socialLinks?: {
    label: string;
    icon: string;
    href: string;
  }[];
  metadata: {
    title: string;
    description: string;
    keywords: string;
    url: string;
    favicon: string;
  };
  about?: {
    avatar?: string;
    skills?: string[];
  };
}
