import Header from "@/components/layout/Header";
import { Outlet, Scripts } from "react-router";

export function ErrorBoundary({ error }: { error: { status: number } }) {
  if (error.status === 404) {
    return <div>404</div>;
  }
  return <div>500</div>;
}

export default function Root() {
  return (
    <html>
      <head />
      <body>
        <div>
          <Header />
          <Outlet />
        </div>
        <Scripts />
      </body>
    </html>
  );
}
