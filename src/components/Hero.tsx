import { FC } from "react";

export interface HeroProps {
  tags: string;
  headline: string;
  description: string;
}

export const Hero: FC<HeroProps> = ({ tags, headline, description }) => {
  return (
    <section className="flex flex-col gap-6 pt-2 pb-6 md:pt-6 md:pb-10">
      <p className="font-mono text-meta tracking-[2px] text-text-muted dark:text-text-secondary">
        {tags}
      </p>
      <h1 className="font-display italic font-normal text-text-primary dark:text-text-primary-dark text-display-xl leading-[var(--lh-display)] tracking-[-0.025em]">
        {headline}
      </h1>
      <p className="text-[1.125rem] leading-[1.55] text-text-secondary dark:text-text-secondary-dark">
        {description}
      </p>
    </section>
  );
};
