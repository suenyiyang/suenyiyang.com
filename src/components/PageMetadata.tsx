import { Page } from "content-collections/generated";
import { FC } from "react";
import { siteConfig } from "~/config";

/** Site origin without a trailing slash, for building absolute URLs. */
const siteUrl = siteConfig.metadata.url.replace(/\/+$/, "");

const absoluteUrl = (path: string) =>
  `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;

/**
 * Pages are served with a trailing slash (Cloudflare Pages redirects
 * /posts/x → /posts/x/), so the canonical URL keeps that form — an
 * og:url that redirects is a needless detour for every unfurler.
 */
const canonicalUrl = (path: string) =>
  path === "/" ? `${siteUrl}/` : `${siteUrl}${path.replace(/\/$/, "")}/`;

const isoDate = (date?: string) => {
  if (!date) return null;
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

export const PageMetadata: FC<{
  metadata: Page | null;
}> = (props) => {
  const { metadata } = props;

  const mergedMetadata = {
    ...siteConfig.metadata,
    ...metadata,
  };

  const title = [metadata?.title, siteConfig.metadata.title]
    .filter(Boolean)
    .join(" - ");

  const url = canonicalUrl(metadata?._meta.path ?? "/");
  const image = absoluteUrl(mergedMetadata.ogImage);
  const publishedTime = isoDate(metadata?.date);

  return (
    <>
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={mergedMetadata.description} />
      <meta name="keywords" content={mergedMetadata.keywords} />
      <link rel="canonical" href={url} />

      {/* Open Graph — what Feishu, iMessage and the rest of the unfurlers read */}
      <meta property="og:type" content={publishedTime ? "article" : "website"} />
      <meta property="og:site_name" content={siteConfig.metadata.title} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={mergedMetadata.description} />
      <meta
        property="og:locale"
        content={metadata?.lang === "en" ? "en_US" : "zh_CN"}
      />
      {publishedTime ? (
        <meta property="article:published_time" content={publishedTime} />
      ) : null}
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />

      {/* X reads twitter:* (with og:* as fallback) and needs the absolute image URL */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={siteConfig.metadata.twitter} />
      <meta name="twitter:creator" content={siteConfig.metadata.twitter} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={mergedMetadata.description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={title} />
    </>
  );
};
