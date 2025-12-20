import Header from "~/components/layout/Header";
import { Links, Meta, Outlet, Scripts } from "react-router";
import { MDXProvider } from "@mdx-js/react";
import components from "~/mdx-components";
import { GoogleAnalytics } from "~/components/GoogleAnalytics";

import { siteConfig } from "~/config";
import stylesheet from "~/index.css?url";

export function ErrorBoundary({ error }: { error: { status: number } }) {
  if (error.status === 404) {
    return <div>404</div>;
  }
  return <div>500</div>;
}

export function links() {
  return [
    { rel: "preload", href: stylesheet, as: "style" },
    { rel: "stylesheet", href: stylesheet },
    { rel: "canonical", href: siteConfig.metadata.url },
    { rel: "icon", href: siteConfig.metadata.favicon },
  ];
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="utf-8" />
        <Links />
        <Meta />
        {__INJECTED_GA_ID__ ? (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${__INJECTED_GA_ID__}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${__INJECTED_GA_ID__}', { send_page_view: false });
                `,
              }}
            />
          </>
        ) : null}
        {/* Set dark mode based on system preference */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
            (() => {
              const prefersDark =
                  window.matchMedia &&
                  window.matchMedia("(prefers-color-scheme: dark)").matches;
              const colorScheme = localStorage.getItem("color-scheme") || "auto";

              if (colorScheme === "dark" || (prefersDark && colorScheme !== "light")) {
                document.documentElement.classList.toggle("dark", true);
              }
            })()
              `,
          }}
        />
      </head>
      <body className="relative bg-white dark:bg-neutral-950 font-sans">
        <div className="flex flex-col min-h-screen bg-primary-white">
          <Header />
          <main className="flex flex-col flex-grow w-full max-w-4xl min-w-xs mx-auto p-8 prose dark:prose-invert dark:text-neutral-300 prose-h1:text-3xl">
            <MDXProvider components={components}>{children}</MDXProvider>
          </main>
        </div>
        <GoogleAnalytics gaId={__INJECTED_GA_ID__} />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  return <Outlet />;
}
