import { useEffect, useRef, useState } from "react";
import type { PictureMetadata } from "~/types/image";

interface PostImageProps {
  src: PictureMetadata | string;
  "data-lqip"?: string;
  alt?: string;
}

export const PostImage = ({ src, "data-lqip": lqip, alt }: PostImageProps) => {
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

  if (typeof src === "string") {
    return (
      <figure className="post-figure" data-zoomable>
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
    <figure className="post-figure" data-zoomable>
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
