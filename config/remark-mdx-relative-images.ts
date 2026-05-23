import { Parser } from "acorn";
import { visit, SKIP } from "unist-util-visit";

const parseProgram = (code: string) =>
  Parser.parse(code, { ecmaVersion: "latest", sourceType: "module" }) as unknown;

const isRelative = (url: string | undefined): url is string =>
  !!url && (url.startsWith("./") || url.startsWith("../"));

const PICTURE_QUERY = "?w=480;960;1440&format=avif;webp;png&as=picture";
const LQIP_QUERY = "?w=20&format=webp";

interface ImportRecord {
  pictureName: string;
  lqipName: string;
}

export function remarkMdxRelativeImages() {
  return (tree: any) => {
    const importsByUrl = new Map<string, ImportRecord>();
    let counter = 0;

    visit(tree, "image", (node: any, index: number | null, parent: any) => {
      if (parent == null || index == null) return;
      if (!isRelative(node.url)) return;

      let record = importsByUrl.get(node.url);
      if (!record) {
        record = {
          pictureName: `__mdxRelImgPic${counter}`,
          lqipName: `__mdxRelImgLqip${counter}`,
        };
        importsByUrl.set(node.url, record);
        counter++;
      }

      const attributes: any[] = [
        {
          type: "mdxJsxAttribute",
          name: "src",
          value: {
            type: "mdxJsxAttributeValueExpression",
            value: record.pictureName,
            data: { estree: parseProgram(record.pictureName) },
          },
        },
        {
          type: "mdxJsxAttribute",
          name: "data-lqip",
          value: {
            type: "mdxJsxAttributeValueExpression",
            value: record.lqipName,
            data: { estree: parseProgram(record.lqipName) },
          },
        },
        { type: "mdxJsxAttribute", name: "alt", value: node.alt ?? "" },
      ];

      if (node.title) {
        attributes.push({
          type: "mdxJsxAttribute",
          name: "title",
          value: node.title,
        });
      }

      parent.children[index] = {
        type: "mdxJsxFlowElement",
        name: "img",
        attributes,
        children: [],
      };

      return SKIP;
    });

    if (importsByUrl.size === 0) return;

    const importNodes = Array.from(importsByUrl.entries()).flatMap(([url, record]) => {
      const pictureCode = `import ${record.pictureName} from ${JSON.stringify(url + PICTURE_QUERY)};`;
      const lqipCode = `import ${record.lqipName} from ${JSON.stringify(url + LQIP_QUERY)};`;
      return [
        {
          type: "mdxjsEsm",
          value: pictureCode,
          data: { estree: parseProgram(pictureCode) },
        },
        {
          type: "mdxjsEsm",
          value: lqipCode,
          data: { estree: parseProgram(lqipCode) },
        },
      ];
    });

    tree.children.unshift(...importNodes);
  };
}
