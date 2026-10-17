import { FC } from "react";

const UPPERCASE_DIGITS = [
  "零",
  "壹",
  "贰",
  "叁",
  "肆",
  "伍",
  "陆",
  "柒",
  "捌",
  "玖",
] as const;

export const isNumericYear = (year: string): boolean => /^\d{4}$/.test(year);

/** 2026 → 贰零贰陆, using the formal (financial) Chinese numerals. */
export const toUppercaseYear = (year: string): string =>
  [...year].map((char) => UPPERCASE_DIGITS[Number(char)] ?? char).join("");

/**
 * Worn-seal filters used by <YearSeal>.
 *
 * Two passes, both driven by feTurbulence:
 * - ink:   gentle displacement plus a stretched noise mask, so characters
 *          look printed with dry ink instead of typeset.
 * - frame: a stronger displacement and a coarse patch mask, which bites
 *          visible gaps out of the double border.
 *
 * Render once per list. Filter ids are stable because only one PostList is
 * mounted at a time (home and /posts are separate routes).
 */
export const YearSealDefs: FC = () => (
  <svg aria-hidden focusable="false" className="pointer-events-none absolute h-0 w-0 overflow-hidden">
    <defs>
      <filter
        id="year-seal-ink"
        x="-15%"
        y="-15%"
        width="130%"
        height="130%"
        colorInterpolationFilters="sRGB"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.035 0.4"
          numOctaves="4"
          seed="12"
          result="warp"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="warp"
          scale="3"
          xChannelSelector="R"
          yChannelSelector="G"
          result="rough"
        />
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.04 0.55"
          numOctaves="2"
          seed="5"
          result="grain"
        />
        <feColorMatrix
          in="grain"
          type="matrix"
          values="0 0 0 0 0
                  0 0 0 0 0
                  0 0 0 0 0
                  1.55 0.3 0.15 0 -0.6"
          result="streaks"
        />
        <feComposite in="rough" in2="streaks" operator="in" />
      </filter>

      <filter
        id="year-seal-frame"
        x="-18%"
        y="-18%"
        width="136%"
        height="136%"
        colorInterpolationFilters="sRGB"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.02 0.28"
          numOctaves="3"
          seed="3"
          result="warp"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="warp"
          scale="6.5"
          xChannelSelector="R"
          yChannelSelector="G"
          result="rough"
        />
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.09"
          numOctaves="3"
          seed="7"
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
 * The year, stamped into the top-right of its group as a watermark.
 * Purely decorative — the readable year lives in a visually hidden heading.
 */
export const YearSeal: FC<{ year: string }> = ({ year }) => {
  const characters = toUppercaseYear(year);

  return (
    <div aria-hidden className="year-seal">
      <span className="year-seal-frame">
        <span className="year-seal-frame-outer" />
        <span className="year-seal-frame-inner" />
      </span>
      <span className="year-seal-chars">
        {[...characters].map((character, index) => (
          <span key={index}>{character}</span>
        ))}
      </span>
    </div>
  );
};
