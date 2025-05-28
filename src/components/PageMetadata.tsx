import { FC } from "react";
import { siteConfig } from "~/config";
import type { SiteConfig } from "~/types/config";

export const PageMetadata: FC<{
  metadata: Partial<SiteConfig["metadata"]>;
}> = (props) => {
  const { metadata } = props;

  const mergedMetadata = {
    ...siteConfig.metadata,
    ...metadata,
  };

  const title = [metadata.title, siteConfig.metadata.title]
    .filter(Boolean)
    .join(" - ");

  return (
    <>
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={mergedMetadata.description} />
      <meta name="keywords" content={mergedMetadata.keywords} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={mergedMetadata.url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={mergedMetadata.description} />
      <meta property="og:keywords" content={mergedMetadata.keywords} />

      {/* twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={mergedMetadata.url} />
      <meta property="twitter:title" content={title} />
      <meta
        property="twitter:description"
        content={mergedMetadata.description}
      />
      <meta property="twitter:keywords" content={mergedMetadata.keywords} />
    </>
  );
};
