import { useState } from "react";
import type { PictureMetadata } from "~/types/image";

interface PostImageProps {
  src: PictureMetadata | string;
  "data-lqip"?: string;
  alt?: string;
  title?: string;
}

export const PostImage = ({ src, "data-lqip": lqip, alt, title }: PostImageProps) => {
  const [loaded, setLoaded] = useState(false);

  if (typeof src === "string") {
    return (
      <figure className="post-figure" data-zoomable>
        <div className={`post-figure-media ${loaded ? "loaded" : ""}`}>
          <img
            src={src}
            alt={alt ?? ""}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
          />
        </div>
        {title ? <figcaption>{title}</figcaption> : null}
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
      {title ? <figcaption>{title}</figcaption> : null}
    </figure>
  );
};
