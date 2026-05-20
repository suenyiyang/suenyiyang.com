import { FC, PropsWithChildren } from "react";
import { useLocation } from "react-router";
import { format } from "date-fns";
import { useMatchedPageLogic } from "~/logic/useMatchedPageLogic";
import { PageMetadata } from "../PageMetadata";
import { WalineComment } from "../WalineComment";
import { Tag } from "../Tag";

// Estimate read time based on content length (roughly 200 words per minute)
const estimateReadTime = (content: string): number => {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
};

export const PostWrapper: FC<PropsWithChildren> = (props) => {
  const { children } = props;

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
        <article className="flex-grow min-w-0" lang={lang}>
          {/* Article Header */}
          <header className="text-center pb-9 mb-10 md:pb-10 md:mb-12 border-b border-border-light dark:border-border-dark">
            {/* Meta info */}
            <div className="flex items-center justify-center gap-2.5 text-[13px] font-mono text-text-muted mb-5 tabular-nums">
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
            <h1 className="post-title text-[2rem] leading-[1.18] md:text-[3rem] md:leading-[1.12] text-text-primary dark:text-text-primary-dark mb-5">
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
          <div className="post-body">
            {children}
          </div>
        </article>
      ) : (
        <div className="not-prose flex-grow min-w-0">
          {children}
        </div>
      )}

      <WalineComment matchedPage={matchedPage} />
    </>
  );
};
