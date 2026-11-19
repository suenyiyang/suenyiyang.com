import { NotFoundPage } from "~/components/pages";

/**
 * Exists so the 404 page can be prerendered. `buildEnd` in
 * react-router.config.ts copies the output to a flat `404.html`, which is what
 * Cloudflare Workers static assets serve for unmatched paths
 * (`not_found_handling = "404-page"`).
 */
export default function NotFoundRoute() {
  return <NotFoundPage />;
}
