import { useEffect } from "react";
import { readModelContext, registerTools } from "./model-context";
import type { WebMcpTool } from "./types";

/**
 * Register tools for the lifetime of a component.
 *
 * Native support registers immediately. When the API is missing we wait for an
 * idle slot before pulling the polyfill chunk, so regular readers never pay for
 * it on the critical path.
 */
export function useWebMcpTools(tools: WebMcpTool[]): void {
  useEffect(() => {
    const controller = new AbortController();
    const start = () => {
      void registerTools(tools, controller.signal);
    };

    let cancel: () => void = () => {};
    if (readModelContext()) {
      start();
    } else {
      cancel = scheduleIdle(start);
    }

    return () => {
      cancel();
      controller.abort();
    };
  }, [tools]);
}

function scheduleIdle(task: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  if (typeof window.requestIdleCallback === "function") {
    const handle = window.requestIdleCallback(() => task(), { timeout: 3000 });
    return () => window.cancelIdleCallback(handle);
  }

  const handle = window.setTimeout(task, 1200);
  return () => window.clearTimeout(handle);
}
