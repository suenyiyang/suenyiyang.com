// Output shape of `vite-imagetools` when imported with `?as=picture`.
// sources: format → srcset string (one srcset per format)
// img: fallback <img> data with intrinsic dimensions
export interface PictureMetadata {
  sources: Record<string, string>;
  img: {
    src: string;
    w: number;
    h: number;
  };
}
