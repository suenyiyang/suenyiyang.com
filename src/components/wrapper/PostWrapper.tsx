import { FC, PropsWithChildren, useRef } from "react";
import { useLocation } from "react-router";
import { format } from "date-fns";
import { useMatchedPageLogic } from "~/logic/useMatchedPageLogic";
import { PageMetadata } from "../PageMetadata";
import { WalineComment } from "../WalineComment";
import { Tag } from "../Tag";
import { Toc } from "../Toc";
import { Lightbox } from "../Lightbox";

// Estimate read time based on content length (roughly 200 words per minute)
const estimateReadTime = (content: string): number => {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
};

export const PostWrapper: FC<PropsWithChildren> = (props) => {
  const { children } = props;
  const postBodyRef = useRef<HTMLDivElement>(null);

  const location = useLocation();
  const matchedPage = useMatchedPageLogic(location);

  // Check page type
  const isPost = matchedPage?.date;
  const date = matchedPage?.date ? new Date(matchedPage.date) : null;
  const formattedDate = date ? format(date, "MMMM d, yyyy") : null;
  const readTime = matchedPage?.content ? estimateReadTime(matchedPage.content) : null;
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
            <header className="text-center pb-7 mb-8 md:pb-8 md:mb-10 border-b border-[var(--reading-rule)]">
              {/* Meta info */}
              <div className="flex items-center justify-center gap-2.5 font-mono text-meta text-text-muted mb-5 tabular-nums">
                {formattedDate ? (
                  <time dateTime={matchedPage?.date}>{formattedDate}</time>
                ) : null}
                {formattedDate && readTime ? (
                  <span aria-hidden>&middot;</span>
                ) : null}
                {readTime ? (
                  <span>{readTime} min read</span>
                ) : null}
              </div>

              {/* Title */}
              <h1 className="post-title text-display text-text-primary dark:text-text-primary-dark mb-5">
                {matchedPage?.title}
              </h1>

              {/* Tags */}
              {tags.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-2">
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
