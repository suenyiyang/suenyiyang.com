import { visit } from "unist-util-visit";

const TWITTER_HOSTS = new Set(["x.com", "www.x.com", "twitter.com", "www.twitter.com"]);

const getTweetUrl = (urlString: string): string | null => {
  try {
    const url = new URL(urlString.startsWith("http") ? urlString : `https://${urlString}`);

    if (!TWITTER_HOSTS.has(url.hostname)) {
      return null;
    }

    const [, username, kind, id] = url.pathname.split("/");
    if (!username || kind !== "status" || !id) {
      return null;
    }

    return `https://twitter.com/${username}/status/${id}`;
  } catch {
    return null;
  }
};

const getStandaloneUrl = (node: any): string | null => {
  if (node?.type !== "paragraph" || node.children?.length !== 1) {
    return null;
  }

  const child = node.children[0];

  if (child.type === "text") {
    return child.value.trim();
  }

  if (
    child.type === "link" &&
    !child.title &&
    child.children?.length === 1 &&
    child.children[0]?.type === "text" &&
    child.children[0].value === child.url
  ) {
    return child.url;
  }

  return null;
};

export const remarkTwitterEmbeds = () => {
  return (tree: any) => {
    let hasTweet = false;

    visit(tree, "paragraph", (node: any, index: number | undefined, parent: any) => {
      if (!parent || index === undefined) {
        return;
      }

      const url = getStandaloneUrl(node);
      if (!url) {
        return;
      }

      const tweetUrl = getTweetUrl(url);
      if (!tweetUrl) {
        return;
      }

      hasTweet = true;
      parent.children[index] = {
        type: "mdxJsxFlowElement",
        name: "blockquote",
        attributes: [
          { type: "mdxJsxAttribute", name: "className", value: "twitter-tweet" },
          { type: "mdxJsxAttribute", name: "data-width", value: "550" },
        ],
        children: [
          {
            type: "mdxJsxFlowElement",
            name: "a",
            attributes: [{ type: "mdxJsxAttribute", name: "href", value: tweetUrl }],
            children: [{ type: "text", value: tweetUrl }],
          },
        ],
      };
    });

    if (hasTweet) {
      tree.children.push({
        type: "mdxJsxFlowElement",
        name: "script",
        attributes: [
          { type: "mdxJsxAttribute", name: "async", value: null },
          { type: "mdxJsxAttribute", name: "src", value: "https://platform.twitter.com/widgets.js" },
          { type: "mdxJsxAttribute", name: "charSet", value: "utf-8" },
        ],
        children: [],
      });
    }
  };
};
