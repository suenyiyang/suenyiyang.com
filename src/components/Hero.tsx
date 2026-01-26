import { FC } from "react";

export interface HeroProps {
  tags: string;
  headline: string;
  description: string;
}

export const Hero: FC<HeroProps> = ({ tags, headline, description }) => {
  return (
    <section className="flex flex-col gap-6 py-3 md:py-8">
      <p className="font-mono text-[13px] tracking-[2px] text-text-muted dark:text-text-secondary">
        {tags}
      </p>
      <h1 className="font-display text-4xl md:text-[56px] italic font-normal text-text-primary dark:text-text-primary-dark tracking-tight leading-[1.15]">
        {headline}
      </h1>
      <p className="text-lg text-text-secondary dark:text-text-secondary-dark leading-[1.6]">
        {description}
      </p>
    </section>
  );
};
