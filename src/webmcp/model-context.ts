/**
 * The only place that touches the WebMCP API surface.
 *
 * The spec moved twice already (`navigator.modelContext` + `provideContext()` →
 * `document.modelContext` + `registerTool()`), so every read goes through
 * `readModelContext()` and everything else talks to `WebMcpTool`.
 * Registration failures are logged, never thrown: a missing or changed API must
 * not break hydration for regular readers.
 */
import type { WebMcpTool } from "./types";

interface ModelContextLike {
  registerTool(
    tool: WebMcpTool,
    options?: { signal?: AbortSignal },
  ): Promise<void>;
  getTools(options?: { fromOrigins?: string[] }): Promise<unknown[]>;
  executeTool(
    tool: unknown,
    inputObject?: object,
    options?: { signal?: AbortSignal },
  ): Promise<unknown>;
  addEventListener(type: string, listener: (event: Event) => void): void;
}

type ModelContextScope = { modelContext?: ModelContextLike };

/** Native API if present, no polyfill side effects. */
export function readModelContext(): ModelContextLike | undefined {
  if (typeof document === "undefined") return undefined;

  try {
    const native = (document as unknown as ModelContextScope).modelContext;
    if (native) return native;
  } catch {
    // A failed polyfill construction can leave the getter throwing.
  }

  try {
    // Draft-era entry point, still installed by some polyfills.
    return (navigator as unknown as ModelContextScope).modelContext;
  } catch {
    return undefined;
  }
}

let polyfillPromise: Promise<void> | null = null;

function ensurePolyfill(): Promise<void> {
  polyfillPromise ??= import("@mcp-b/webmcp-polyfill")
    .then((module) => module.installWebMCP())
    .catch((error: unknown) => {
      console.info("[webmcp] polyfill unavailable:", error);
    });
  return polyfillPromise;
}

/** Names currently registered on this document, so StrictMode double-mounts stay quiet. */
const registered = new Map<string, AbortSignal | null>();

export async function registerTools(
  tools: WebMcpTool[],
  signal?: AbortSignal,
): Promise<void> {
  if (signal?.aborted) return;

  let context = readModelContext();
  if (!context) {
    await ensurePolyfill();
    context = readModelContext();
  }
  if (!context || signal?.aborted) return;

  for (const tool of tools) {
    if (registered.has(tool.name)) continue;

    const registration = signal ?? new AbortController().signal;
    try {
      await context.registerTool(withTelemetry(tool), { signal: registration });
      registered.set(tool.name, signal ?? null);
      registration.addEventListener("abort", () => registered.delete(tool.name), {
        once: true,
      });
    } catch (error) {
      if (!signal?.aborted) {
        console.warn(`[webmcp] could not register "${tool.name}":`, error);
      }
    }
  }
}

function withTelemetry(tool: WebMcpTool): WebMcpTool {
  return {
    ...tool,
    execute: async (input, options) => {
      const startedAt = Date.now();
      let ok = true;
      try {
        return await tool.execute(input ?? {}, options ?? {});
      } catch (error) {
        ok = false;
        throw error;
      } finally {
        trackToolCall(tool.name, ok, Date.now() - startedAt);
      }
    },
  };
}

/** GA event so we can tell whether agents actually call these tools. */
function trackToolCall(tool: string, ok: boolean, durationMs: number): void {
  if (typeof window === "undefined") return;
  const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag;
  gtag?.("event", "webmcp_tool_call", {
    tool_name: tool,
    ok,
    duration_ms: durationMs,
  });
}
