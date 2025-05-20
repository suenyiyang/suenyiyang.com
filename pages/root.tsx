import Header from "@/components/layout/Header";
import { Outlet, Scripts } from "react-router";

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
