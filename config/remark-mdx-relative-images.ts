import { Parser } from "acorn";
import { visit, SKIP } from "unist-util-visit";

const parseProgram = (code: string) =>
  Parser.parse(code, { ecmaVersion: "latest", sourceType: "module" }) as unknown;

const isRelative = (url: string | undefined): url is string =>
  !!url && (url.startsWith("./") || url.startsWith("../"));

export function remarkMdxRelativeImages() {
  return (tree: any) => {
    const importsByUrl = new Map<string, string>();
    let counter = 0;

    visit(tree, "image", (node: any, index: number | null, parent: any) => {
      if (parent == null || index == null) return;
      if (!isRelative(node.url)) return;

      let name = importsByUrl.get(node.url);
      if (!name) {
        name = `__mdxRelImg${counter++}`;
        importsByUrl.set(node.url, name);
      }

      parent.children[index] = {
        type: "mdxJsxFlowElement",
        name: "img",
        attributes: [
          {
            type: "mdxJsxAttribute",
            name: "src",
            value: {
              type: "mdxJsxAttributeValueExpression",
              value: name,
              data: { estree: parseProgram(name) },
            },
          },
          { type: "mdxJsxAttribute", name: "alt", value: node.alt ?? "" },
        ],
        children: [],
      };

      return SKIP;
    });

    if (importsByUrl.size === 0) return;

    const importNodes = Array.from(importsByUrl.entries()).map(([url, name]) => {
      const code = `import ${name} from ${JSON.stringify(url)};`;
      return {
        type: "mdxjsEsm",
        value: code,
        data: { estree: parseProgram(code) },
      };
    });

    tree.children.unshift(...importNodes);
  };
}
