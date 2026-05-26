/**
 * Global setup: pre-warm the Vite dev server by fetching pages that trigger
 * lazy bundle compilation (Three.js + React Three Fiber). Without this,
 * the first test that hits /courtyard blocks for 30-60 s while Vite compiles
 * the heavy 3D dependencies on demand.
 *
 * Playwright starts the webServer before globalSetup, so the dev server is
 * already up when this runs.
 */
export default async function globalSetup() {
  const baseURL = "http://localhost:5173";

  // Pre-warm every route the test suite touches. Vite compiles per-route
  // bundles lazily; without this, parallel workers race on first-request
  // compilation, causing flaky timeouts (especially for /courtyard which
  // pulls in Three.js + R3F).
  const routes = ["/", "/posts", "/about", "/links", "/courtyard"];
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

  // Settle window for any post-response async compilation (Three.js / R3F).
  await new Promise((resolve) => setTimeout(resolve, 8000));
  console.log("[global-setup] done warming");
}
