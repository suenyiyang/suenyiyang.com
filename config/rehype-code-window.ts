import { visit, SKIP } from "unist-util-visit";

/**
 * Reads class tokens off a hast node. Tolerates both the hast-standard
 * `className` (string or array) and the raw `class` string that
 * @shikijs/rehype emits on its <pre>.
 */
const classNames = (node: any): string[] => {
  const raw = node?.properties?.className ?? node?.properties?.class;
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string") return raw.split(/\s+/).filter(Boolean);
  return [];
};

const dot = () => ({
  type: "element",
  tagName: "span",
  properties: { className: ["code-window__dot"] },
  children: [],
});

/**
 * Wraps each Shiki `<pre class="shiki">` in a window-chrome container so
 * code blocks render with a macOS-style title bar (red/yellow/green
 * traffic-light buttons). The chrome is a sibling of `<pre>`, not a
 * child, so horizontal scrolling stays contained to the code and the
 * header stays put.
 *
 * Must run after @shikijs/rehype, which produces the `pre.shiki` element.
 */
export function rehypeCodeWindow() {
  return (tree: any) => {
    visit(tree, "element", (node: any, index: number | null, parent: any) => {
      if (
        parent == null ||
        index == null ||
        node.tagName !== "pre" ||
        !classNames(node).includes("shiki") ||
        classNames(parent).includes("code-window")
      ) {
        return;
      }

      parent.children[index] = {
        type: "element",
        tagName: "div",
        properties: { className: ["code-window"] },
        children: [
          {
            type: "element",
            tagName: "div",
            properties: {
              className: ["code-window__chrome"],
              ariaHidden: "true",
            },
            children: [dot(), dot(), dot()],
          },
          node,
        ],
      };

      return SKIP;
    });
  };
}
