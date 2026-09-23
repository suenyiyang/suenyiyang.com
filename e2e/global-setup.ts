/**
 * Global setup: pre-warm the Vite dev server by fetching every route so the
 * first test doesn't block while Vite compiles bundles on demand.
 *
 * Playwright starts the webServer before globalSetup, so the dev server is
 * already up when this runs.
 */
export default async function globalSetup() {
  const baseURL = "http://localhost:5173";

  // Pre-warm every route the test suite touches. Vite compiles per-route
  // bundles lazily; without this, parallel workers race on first-request
  // compilation, causing flaky timeouts.
  const routes = ["/", "/posts", "/about", "/links"];
  console.log("[global-setup] pre-warming routes...");
  await Promise.all(
    routes.map(async (route) => {
      try {
        const res = await fetch(`${baseURL}${route}`);
        console.log(`[global-setup] ${route} → ${res.status}`);
      } catch (err) {
        console.log(`[global-setup] ${route} not reachable: ${err}`);
      }
    })
  );

  // Settle window for any post-response async compilation.
  await new Promise((resolve) => setTimeout(resolve, 2000));
  console.log("[global-setup] done warming");
}
