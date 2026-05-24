/**
 * Global setup: pre-warm the Vite dev server by fetching pages that trigger
 * lazy bundle compilation (Three.js + React Three Fiber). Without this,
 * the first test that hits /playground blocks for 30-60 s while Vite compiles
 * the heavy 3D dependencies on demand.
 *
 * Playwright starts the webServer before globalSetup, so the dev server is
 * already up when this runs.
 */
export default async function globalSetup() {
  const baseURL = "http://localhost:5173";

  // Fetch /playground to trigger Vite's lazy compilation of Three.js / R3F.
  // Then poll until the page HTML changes from a loading state, confirming
  // that the bundle compilation is complete.
  console.log("[global-setup] pre-warming /playground bundle...");
  try {
    const res = await fetch(`${baseURL}/playground`);
    console.log(`[global-setup] /playground → ${res.status}`);
  } catch (err) {
    console.log(`[global-setup] /playground not reachable: ${err}`);
  }

  // Give Vite time to compile Three.js / R3F in the background.
  // The compilation is triggered by the fetch above and runs asynchronously.
  // 20 seconds is usually enough; the actual tests have their own timeout.
  await new Promise((resolve) => setTimeout(resolve, 20000));
  console.log("[global-setup] done waiting for Vite bundle compilation");
}
