import { useEffect, useRef, useState } from "react";
import type { PictureMetadata } from "~/types/image";

interface PostImageProps {
  src: PictureMetadata | string;
  "data-lqip"?: string;
  /** Cap the rendered width (px). Comes from Obsidian's `![alt|320](x.png)` syntax. */
  "data-width"?: string | number;
  alt?: string;
}

// Tall screenshots would otherwise run the full content width. Keep the
// declared width as a max-width so narrow viewports still shrink them.
const parseWidth = (value: string | number | undefined): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const width = typeof value === "number" ? value : Number.parseInt(value, 10);
  return Number.isFinite(width) && width > 0 ? width : undefined;
};

export const PostImage = ({
  src,
  "data-lqip": lqip,
  "data-width": widthAttr,
  alt,
}: PostImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // On hydration, the <img> may already be cached and complete BEFORE the
  // onLoad listener attaches — in that case the event never fires and the
  // blur sticks. Check the ref synchronously after mount.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setLoaded(true);
    }
  }, []);

  const caption = alt?.trim();
  const width = parseWidth(widthAttr);
  const figureClass = width ? "post-figure post-figure--narrow" : "post-figure";
  const figureStyle = width ? { maxWidth: `${width}px` } : undefined;

  if (typeof src === "string") {
    return (
      <figure className={figureClass} style={figureStyle} data-zoomable>
        <div className={`post-figure-media ${loaded ? "loaded" : ""}`}>
          <img
            ref={imgRef}
            src={src}
            alt={alt ?? ""}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
          />
        </div>
        {caption ? <figcaption>{caption}</figcaption> : null}
      </figure>
    );
  }

  return (
    <figure className={figureClass} style={figureStyle} data-zoomable>
      <div
        className={`post-figure-media ${loaded ? "loaded" : ""}`}
        style={lqip ? { backgroundImage: `url(${lqip})` } : undefined}
      >
        <picture>
          {Object.entries(src.sources).map(([format, srcset]) => (
            <source key={format} srcSet={srcset} type={`image/${format}`} />
          ))}
          <img
            ref={imgRef}
            src={src.img.src}
            width={src.img.w}
            height={src.img.h}
            alt={alt ?? ""}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
          />
        </picture>
      </div>
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
};
