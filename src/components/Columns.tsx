import { Children, isValidElement, type CSSProperties, type ReactNode } from "react";
import type { PictureMetadata } from "~/types/image";

interface ColumnsProps {
  children: ReactNode;
  gap?: string;
}

const aspectRatio = (src: unknown): number => {
  if (src && typeof src === "object" && "img" in src) {
    const { w, h } = (src as PictureMetadata).img;
    if (w > 0 && h > 0) return w / h;
  }
  return 1;
};

export const Columns = ({ children, gap = "0.75rem" }: ColumnsProps) => {
  const items = Children.toArray(children).filter(isValidElement);

  return (
    <div className="post-columns" style={{ "--col-gap": gap } as CSSProperties}>
      {items.map((child, i) => {
        const grow = aspectRatio((child as { props?: { src?: unknown } }).props?.src);
        return (
          <div
            key={i}
            className="post-columns__item"
            style={{ "--col-grow": grow } as CSSProperties}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
};
