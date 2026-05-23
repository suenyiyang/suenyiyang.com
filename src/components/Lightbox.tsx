import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface LightboxProps {
  containerRef: React.RefObject<HTMLElement | null>;
  postTitle: string;
}

interface GalleryItem {
  pictureHtml: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
  originElement: HTMLElement;
}

export const Lightbox = ({ containerRef, postTitle }: LightboxProps) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const galleryRef = useRef<GalleryItem[]>([]);
  const lastTriggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const figures = Array.from(
      container.querySelectorAll<HTMLElement>("figure[data-zoomable]")
    );

    galleryRef.current = figures.map((figure) => {
      const picture = figure.querySelector("picture");
      const img = figure.querySelector("img");
      const figcaption = figure.querySelector("figcaption");
      return {
        pictureHtml: picture ? picture.outerHTML : img ? img.outerHTML : "",
        alt: img?.getAttribute("alt") ?? "",
        caption: figcaption?.textContent ?? "",
        width: Number(img?.getAttribute("width") ?? 0) || 0,
        height: Number(img?.getAttribute("height") ?? 0) || 0,
        originElement: figure,
      };
    });

    const handleClick = (event: Event) => {
      const target = event.target as HTMLElement;
      const figure = target.closest("figure[data-zoomable]") as HTMLElement | null;
      if (!figure) return;
      const idx = galleryRef.current.findIndex((item) => item.originElement === figure);
      if (idx === -1) return;
      lastTriggerRef.current = figure;
      setActiveIndex(idx);
    };

    container.addEventListener("click", handleClick);
    return () => container.removeEventListener("click", handleClick);
  }, [containerRef]);

  useEffect(() => {
    if (activeIndex === null) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      lastTriggerRef.current?.focus();
    };
  }, [activeIndex]);

  useEffect(() => {
    if (activeIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveIndex(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex]);

  if (!mounted || activeIndex === null) return null;
  const item = galleryRef.current[activeIndex];
  if (!item) return null;

  return createPortal(
    <div
      className="lightbox-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={item.alt || "Image preview"}
      onClick={(e) => {
        if (e.target === e.currentTarget) setActiveIndex(null);
      }}
    >
      <button
        type="button"
        className="lightbox-close"
        aria-label="Close image preview"
        onClick={() => setActiveIndex(null)}
      >
        ×
      </button>
      <article className="lightbox-card">
        <div
          className="lightbox-image"
          dangerouslySetInnerHTML={{ __html: item.pictureHtml }}
        />
        <div className="lightbox-meta">
          {item.caption ? <div className="lightbox-caption">{item.caption}</div> : null}
          <div className="lightbox-source">From “{postTitle}”</div>
        </div>
      </article>
    </div>,
    document.body
  );
};
