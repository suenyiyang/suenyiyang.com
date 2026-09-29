import { FC, PropsWithChildren } from "react";
import { siteConfig } from "~/config";

/**
 * Deliberately no avatar in the hero: the header mark is the same illustration
 * and is on screen (sticky) the whole time, so a second copy right below it
 * reads as the same badge twice. The page is type-only — the portrait is the
 * site's chrome, not the page's content.
 */
export const AboutPage: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="not-prose">
      {/* Profile Section */}
      <section className="pb-10 md:pb-12">
        <h1 className="post-title text-display text-text-primary dark:text-text-primary-dark mb-4">
          About Me
        </h1>
        <div className="flex items-center gap-4">
          {siteConfig.socialLinks?.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark transition-colors"
              aria-label={link.label}
            >
              <span className={`${link.icon} w-5 h-5`} />
            </a>
          ))}
        </div>
      </section>

      {/* Bio Section — reuses .post-body rules so it matches article body */}
      {children ? (
        <section className="pb-10 md:pb-12">
          <div className="post-body">
            {children}
          </div>
        </section>
      ) : null}
    </div>
  );
};
