import { siteConfig } from "~/config";

export function thoughtMeta(
  title: string,
  description: string,
  pathname: string
) {
  const fullTitle = `${title} - ${siteConfig.metadata.title}`;
  const url = `${siteConfig.metadata.url}${pathname}/`;
  return [
    { title: fullTitle },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: url },
    { property: "og:title", content: fullTitle },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:type", content: "website" },
    {
      property: "og:image",
      content: `${siteConfig.metadata.url}${siteConfig.metadata.ogImage}`,
    },
    { name: "twitter:card", content: "summary_large_image" },
  ];
}
