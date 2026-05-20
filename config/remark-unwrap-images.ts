import { visit, SKIP } from "unist-util-visit";

const isImageLike = (node: any): boolean =>
  node.type === "image" ||
  ((node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") &&
    node.name === "img");

const isInsignificantText = (node: any): boolean =>
  node.type === "text" && node.value.trim() === "";

/**
 * Lifts standalone images out of the paragraph MDX wraps them in.
 * Without this, the <img> component renders a <div> inside a <p>,
 * which is invalid HTML and triggers a React hydration error. It also
 * lets images break out of the paragraph measure to full content width.
 *
 * Runs after remark-mdx-relative-images, so it must handle both raw
 * `image` mdast nodes and the `mdxJsxFlowElement` named "img".
 */
export function remarkUnwrapImages() {
  return (tree: any) => {
    visit(tree, "paragraph", (node: any, index: number | null, parent: any) => {
      if (parent == null || index == null) return;

      const significant = node.children.filter(
        (child: any) => !isInsignificantText(child)
      );
      if (significant.length === 0) return;
      if (!significant.every(isImageLike)) return;

      parent.children.splice(index, 1, ...significant);
      return [SKIP, index];
    });
  };
}
