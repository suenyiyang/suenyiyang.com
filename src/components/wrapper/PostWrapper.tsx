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

  return (
    <>
      <PageMetadata metadata={matchedPage} />

      {isPost ? (
        <article className="flex-grow">
          {/* Article Header */}
          <header className="text-center pb-8 mb-8">
            {/* Meta info */}
            <div className="flex items-center justify-center gap-3 text-sm font-mono text-text-muted mb-4">
              {formattedDate ? (
                <time dateTime={matchedPage?.date}>{formattedDate}</time>
              ) : null}
              {formattedDate && readTime ? (
                <span>&middot;</span>
              ) : null}
              {readTime ? (
                <span>{readTime} min read</span>
              ) : null}
            </div>

            {/* Title */}
            <h1 className="font-display italic text-[36px] md:text-[48px] text-text-primary dark:text-text-primary-dark leading-[1.15] tracking-[-1px] mb-4">
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
          <div className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-medium prose-headings:text-text-primary dark:prose-headings:text-text-primary-dark prose-p:text-[17px] prose-p:leading-[1.75] prose-p:text-text-body dark:prose-p:text-text-body-dark prose-a:text-text-primary dark:prose-a:text-text-primary-dark prose-a:underline prose-a:underline-offset-2 prose-code:font-mono prose-code:text-[13px] prose-pre:bg-[#F5F1E8] prose-pre:text-text-primary dark:prose-pre:bg-[#1A1A1A] dark:prose-pre:text-bg-light">
            {children}
          </div>
        </article>
      ) : (
        <div className="not-prose flex-grow">
          {children}
        </div>
      )}

      <WalineComment matchedPage={matchedPage} />
    </>
  );
};
