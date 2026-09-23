import { FC, PropsWithChildren, useRef } from "react";
import { useLocation } from "react-router";
import { format } from "date-fns";
import { useMatchedPageLogic } from "~/logic/useMatchedPageLogic";
import { PageMetadata } from "../PageMetadata";
import { WalineComment } from "../WalineComment";
import { Tag } from "../Tag";
import { Toc } from "../Toc";
import { Lightbox } from "../Lightbox";

export const PostWrapper: FC<PropsWithChildren> = (props) => {
  const { children } = props;
  const postBodyRef = useRef<HTMLDivElement>(null);

  const location = useLocation();
  const matchedPage = useMatchedPageLogic(location);

  // Check page type
  const isPost = matchedPage?.date;
  const date = matchedPage?.date ? new Date(matchedPage.date) : null;
  const formattedDate = date ? format(date, "yyyy.MM.dd") : null;
  const description = matchedPage?.description;
  const tags = matchedPage?.tags
    ? matchedPage.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
    : [];

  const lang = matchedPage?.lang;

  return (
    <>
      <PageMetadata metadata={matchedPage} />

      {isPost ? (
        <div className="post-layout">
          <Toc variant="desktop" />
          <article className="flex-grow min-w-0" lang={lang}>
            {/* Article Header */}
            <header className="post-head">
              {formattedDate ? (
                <time
                  dateTime={matchedPage?.date}
                  className="block font-mono text-meta tracking-[0.02em] text-text-muted dark:text-text-muted-dark tabular-nums"
                >
                  {formattedDate}
                </time>
              ) : null}

              <h1 className="post-title text-display text-text-primary dark:text-text-primary-dark mt-3.5 md:mt-5">
                {matchedPage?.title}
              </h1>

              {description ? (
                <p className="text-base md:text-[1.0625rem] leading-[1.8] text-text-secondary dark:text-text-secondary-dark mt-3.5 md:mt-5 text-pretty">
                  {description}
                </p>
              ) : null}

              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-5">
                  {tags.map((tag: string) => (
                    <Tag key={tag} label={tag} />
                  ))}
                </div>
              ) : null}
            </header>

            {/* Article Content */}
            <div className="post-body" ref={postBodyRef}>
              <Toc variant="mobile" />
              {children}
            </div>
          </article>
          <Lightbox containerRef={postBodyRef} postTitle={matchedPage?.title ?? ""} />
        </div>
      ) : (
        <div className="not-prose flex-grow min-w-0">
          {children}
        </div>
      )}

      <WalineComment matchedPage={matchedPage} />
    </>
  );
};
