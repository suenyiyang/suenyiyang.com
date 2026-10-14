// Test-only static server: mirrors Cloudflare directory-index redirects, no SPA fallback.
import { createServer } from "node:http";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
const root = path.resolve("build/client");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};
createServer((req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    const file = path.resolve(root, "." + decodeURIComponent(url.pathname));
    if (file !== root && !file.startsWith(root + path.sep)) {
      res.writeHead(403);
      res.end();
      return;
    }
    const directory = statSync(file).isDirectory();
    if (directory && !url.pathname.endsWith("/")) {
      res.writeHead(301, { Location: url.pathname + "/" + url.search });
      res.end();
      return;
    }
    const target = directory ? path.join(file, "index.html") : file;
    res.writeHead(200, {
      "Content-Type": types[path.extname(target)] ?? "application/octet-stream",
    });
    res.end(readFileSync(target));
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}).listen(4387, "127.0.0.1", () =>
  console.log("Thoughts static test server http://127.0.0.1:4387")
);
