import { Link } from "react-router";
import { YearSealDefs } from "~/components/YearSeal";
import { siteConfig } from "~/config";

/** 肆零肆, stacked the way a tall Chinese seal reads — one column, top down. */
const STAMP_CHARACTERS = ["肆", "零", "肆"] as const;

/**
 * The 404 stamp is a 1×3 tall block, not the 2×2 square year seal, so it needs
 * its own chip mask: feTurbulence is sampled in the element's bounding box, and
 * the square filter's noise stretches every chip into a stripe on a 1:2.35 box.
 * Same recipe, frequencies retuned for the tall shape. The ink pass
 * (displacement + streaks) is shared with the year seal.
 */
const StampDefs = () => (
  <svg aria-hidden focusable="false" className="not-found-defs">
    <defs>
      <filter
        id="not-found-seal-frame"
        x="-18%"
        y="-18%"
        width="136%"
        height="136%"
        colorInterpolationFilters="sRGB"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.06 0.16"
          numOctaves="3"
          seed="9"
          result="warp"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="warp"
          scale="4"
          xChannelSelector="R"
          yChannelSelector="G"
          result="rough"
        />
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.3 0.12"
          numOctaves="3"
          seed="21"
          result="chunks"
        />
        <feColorMatrix
          in="chunks"
          type="matrix"
          values="0 0 0 0 0
                  0 0 0 0 0
                  0 0 0 0 0
                  2.2 0 0 0 -0.78"
          result="holes"
        />
        <feComposite in="rough" in2="holes" operator="in" />
      </filter>
    </defs>
  </svg>
);

/**
 * No content, one impression. With no visible copy left, the stamp itself is
 * the way out: it links home, so the page is never a dead end. The heading and
 * the link label carry the meaning for screen readers.
 */
export const NotFoundPage = () => {
  return (
    <div className="not-found">
      <YearSealDefs />
      <StampDefs />

      <h1 className="sr-only">页面不存在</h1>
      <Link to="/" className="not-found-seal" aria-label="回到首页">
        <span className="not-found-seal-frame" aria-hidden="true">
          <span className="not-found-seal-frame-outer" />
          <span className="not-found-seal-frame-inner" />
        </span>
        <span className="not-found-seal-chars" aria-hidden="true">
          {STAMP_CHARACTERS.map((character, index) => (
            <span key={index}>{character}</span>
          ))}
        </span>
      </Link>

      <title>{`404 - ${siteConfig.metadata.title}`}</title>
      <meta name="robots" content="noindex" />
    </div>
  );
};
