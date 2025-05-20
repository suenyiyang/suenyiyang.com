import { type RouteConfig } from "@react-router/dev/routes";
import { flatRoutes } from "@react-router/fs-routes";

export default flatRoutes({
  rootDirectory: "./",
  ignoredRouteFiles: ["root.tsx", "routes.ts", "entry.client.tsx"],
}) satisfies RouteConfig;
