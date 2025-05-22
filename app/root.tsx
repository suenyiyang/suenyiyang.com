import App from "@/App";
import { useContext, useMemo } from "react";
import { Scripts, UNSAFE_FrameworkContext } from "react-router";

export function ErrorBoundary({ error }: { error: { status: number } }) {
  if (error.status === 404) {
    return <div>404</div>;
  }
  return <div>500</div>;
}

export default function Root() {
  const { criticalCss } = useContext(UNSAFE_FrameworkContext) ?? {};

  const css = useMemo(() => {
    if (!criticalCss) {
      return null;
    }
    if (typeof criticalCss === "string") {
      return <style>{criticalCss}</style>;
    }
    return <link {...criticalCss} />;
  }, [criticalCss]);

  return (
    <html className="bg-background">
      <head>{css}</head>
      <body className="relative">
        <App />
        <Scripts />
      </body>
    </html>
  );
}
