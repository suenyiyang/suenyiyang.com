import Footer from "~/components/layout/Footer";
import Header from "~/components/layout/Header";
import { Links, Meta, Outlet, Scripts } from "react-router";
import stylesheet from "./index.css?url";
import { MDXProvider } from "@mdx-js/react";
import components from "~/mdx-components";

export function ErrorBoundary({ error }: { error: { status: number } }) {
  if (error.status === 404) {
    return <div>404</div>;
  }
  return <div>500</div>;
}

export function HydrateFallback() {
  return <div>Loading...</div>;
}

export function links() {
  return [
    { rel: "preload", href: stylesheet, as: "style" },
    { rel: "stylesheet", href: stylesheet },
  ];
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html className="bg-white dark:bg-neutral-950 font-sans">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="utf-8" />
        <Links />
        <Meta />
      </head>
      <body className="relative">
        <div className="flex flex-col min-h-screen bg-primary-white">
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8 prose dark:prose-invert">
            <MDXProvider components={components}>{children}</MDXProvider>
          </main>
          <Footer />
        </div>
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  return <Outlet />;
}
