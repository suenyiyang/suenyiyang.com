import App from "@/App";
import { siteConfig } from "@/config";
import { initLocale } from "@/locale";
import { useEffect } from "react";
import { Links, Scripts } from "react-router";

export function ErrorBoundary({ error }: { error: { status: number } }) {
  console.log(
    "%capp/root.tsx:7 error",
    "color: white; background-color: #26bfa5;",
    error
  );
  if (error.status === 404) {
    return <div>404</div>;
  }
  return <div>500</div>;
}

export default function Root() {
  useEffect(() => {
    initLocale();
  }, []);

  return (
    <html className="bg-white dark:bg-neutral-950 font-sans">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="utf-8" />
        <title>{siteConfig.metadata.title}</title>
        <meta name="description" content={siteConfig.metadata.description} />
        <Links />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={siteConfig.metadata.url} />
        <meta property="og:title" content={siteConfig.metadata.title} />
        <meta
          property="og:description"
          content={siteConfig.metadata.description}
        />
        <meta property="og:image" content="" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={siteConfig.metadata.url} />
        <meta name="twitter:title" content={siteConfig.metadata.title} />
        <meta
          name="twitter:description"
          content={siteConfig.metadata.description}
        />
        <meta
          name="twitter:image"
          content="https://your-domain.com/path-to-social-preview-image.jpg"
        />

        {/* Additional SEO tags */}
        <meta name="robots" content="index, follow" />
        <meta name="keywords" content={siteConfig.metadata.keywords} />
        <link rel="canonical" href={siteConfig.metadata.url} />
      </head>
      <body className="relative">
        <App />
        <Scripts />
      </body>
    </html>
  );
}
