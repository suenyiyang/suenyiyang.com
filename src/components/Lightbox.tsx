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
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

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

  const total = galleryRef.current.length;
  const go = (delta: number) => {
    if (activeIndex === null || total === 0) return;
    setActiveIndex(((activeIndex + delta) % total + total) % total);
  };

  useEffect(() => {
    if (activeIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveIndex(null);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "Tab") {
        const root = document.querySelector(".lightbox-backdrop");
        if (!root) return;
        const focusables = Array.from(
          root.querySelectorAll<HTMLElement>("button:not([disabled])")
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // go closes over activeIndex/total; effect re-registers when activeIndex changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  useEffect(() => {
    if (activeIndex === null) return;
    const container = containerRef.current;
    if (!container) return;
    container.setAttribute("inert", "");
    return () => container.removeAttribute("inert");
  }, [activeIndex, containerRef]);

  useEffect(() => {
    if (activeIndex === null) return;
    closeRef.current?.focus();
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
        ref={closeRef}
        type="button"
        className="lightbox-close"
        aria-label="Close image preview"
        onClick={() => setActiveIndex(null)}
      >
        ×
      </button>
      {total > 1 ? (
        <>
          <button
            type="button"
            className="lightbox-nav lightbox-prev"
            aria-label="Previous image"
            onClick={() => go(-1)}
          >
            ‹
          </button>
          <button
            type="button"
            className="lightbox-nav lightbox-next"
            aria-label="Next image"
            onClick={() => go(1)}
          >
            ›
          </button>
        </>
      ) : null}
      <article
        className="lightbox-card"
        onTouchStart={(e) => {
          const t = e.changedTouches[0];
          touchStartRef.current = { x: t.clientX, y: t.clientY };
        }}
        onTouchEnd={(e) => {
          const start = touchStartRef.current;
          if (!start) return;
          const t = e.changedTouches[0];
          const dx = t.clientX - start.x;
          const dy = t.clientY - start.y;
          touchStartRef.current = null;
          if (Math.abs(dx) > 50 && Math.abs(dy) < 30) {
            go(dx < 0 ? 1 : -1);
          } else if (dy > 80 && Math.abs(dx) < 60) {
            setActiveIndex(null);
          }
        }}
      >
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
