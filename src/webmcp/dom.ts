import type { PageContext } from "./types";

/** DOM-side facts about the page the user is on. Null during SSG/prerender. */
export function readPageContext(): PageContext | null {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return null;
  }

  const main = document.querySelector("main") ?? document.body;
  const headings = [...main.querySelectorAll("h1, h2, h3")]
    .map((heading) => ({
      level: Number(heading.tagName.slice(1)) || 1,
      text: (heading.textContent ?? "").replace(/\s+/g, " ").trim(),
      id: heading.id || undefined,
    }))
    .filter((heading) => heading.text.length > 0)
    .slice(0, 60);

  const text = (main.textContent ?? "").replace(/\s+/g, " ").trim();
  const description = document
    .querySelector('meta[name="description"]')
    ?.getAttribute("content");

  return {
    path: window.location.pathname,
    url: window.location.href,
    title: document.title,
    description: description || undefined,
    headings,
    characters: text.length,
    excerpt: text.slice(0, 320),
  };
}
