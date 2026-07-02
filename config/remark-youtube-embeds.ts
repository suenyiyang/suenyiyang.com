import { visit } from "unist-util-visit";

const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"]);

const getYouTubeId = (urlString: string): string | null => {
  try {
    const url = new URL(urlString.startsWith("http") ? urlString : `https://${urlString}`);

    if (!YOUTUBE_HOSTS.has(url.hostname)) {
      return null;
    }

    if (url.hostname === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] ?? null;
    }

    if (url.pathname === "/watch") {
      return url.searchParams.get("v");
    }

    const [, kind, id] = url.pathname.split("/");
    if (["embed", "shorts", "live", "v"].includes(kind)) {
      return id ?? null;
    }

    return null;
  } catch {
    return null;
  }
};

const getText = (node: any): string => {
  if (!node) {
    return "";
  }

  if (typeof node.value === "string") {
    return node.value;
  }

  if (typeof node.alt === "string") {
    return node.alt;
  }

  if (Array.isArray(node.children)) {
    return node.children.map(getText).join("");
  }

  return "";
};

const getStandaloneEmbed = (node: any): { url: string; caption?: string } | null => {
  if (node?.type !== "paragraph" || node.children?.length !== 1) {
    return null;
  }

  const child = node.children[0];

  if (child.type === "text") {
    return { url: child.value.trim() };
  }

  if (child.type === "image") {
    return { url: child.url, caption: child.alt?.trim() || undefined };
  }

  if (child.type === "link" && !child.title) {
    const caption = getText(child).trim();

    return {
      url: child.url,
      caption: caption && caption !== child.url ? caption : undefined,
    };
  }

  return null;
};

const createYouTubeEmbed = (id: string) => ({
  type: "mdxJsxFlowElement",
  name: "div",
  attributes: [{ type: "mdxJsxAttribute", name: "className", value: "embed-youtube" }],
  children: [
    {
      type: "mdxJsxFlowElement",
      name: "iframe",
      attributes: [
        { type: "mdxJsxAttribute", name: "src", value: `https://www.youtube-nocookie.com/embed/${id}` },
        { type: "mdxJsxAttribute", name: "title", value: "YouTube video player" },
        { type: "mdxJsxAttribute", name: "loading", value: "lazy" },
        {
          type: "mdxJsxAttribute",
          name: "allow",
          value: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
        },
        { type: "mdxJsxAttribute", name: "allowFullScreen", value: null },
      ],
      children: [],
    },
  ],
});

const createYouTubeFigure = (id: string, caption: string) => ({
  type: "mdxJsxFlowElement",
  name: "figure",
  attributes: [{ type: "mdxJsxAttribute", name: "className", value: "embed-youtube-figure" }],
  children: [
    createYouTubeEmbed(id),
    {
      type: "mdxJsxFlowElement",
      name: "figcaption",
      attributes: [],
      children: [{ type: "text", value: caption }],
    },
  ],
});

export const remarkYoutubeEmbeds = () => {
  return (tree: any) => {
    visit(tree, "paragraph", (node: any, index: number | undefined, parent: any) => {
      if (!parent || index === undefined) {
        return;
      }

      const embed = getStandaloneEmbed(node);
      if (!embed) {
        return;
      }

      const id = getYouTubeId(embed.url);
      if (!id) {
        return;
      }

      parent.children[index] = embed.caption ? createYouTubeFigure(id, embed.caption) : createYouTubeEmbed(id);
    });
  };
};
