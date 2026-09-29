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
    /** Link-preview card, served from public/. */
    ogImage: string;
    /** X/Twitter handle, e.g. "@suenyiyang". */
    twitter: string;
  };
  about?: {
    avatar?: string;
    skills?: string[];
  };
}
