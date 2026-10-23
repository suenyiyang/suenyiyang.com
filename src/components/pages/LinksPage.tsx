import type { FC, PropsWithChildren } from "react";

export const LinksPage: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="not-prose">
      <section className="pb-10">
        <h1 className="post-title text-display text-text-primary dark:text-text-primary-dark">
          友链
        </h1>
      </section>
      <div className="post-body">{children}</div>
    </div>
  );
};
