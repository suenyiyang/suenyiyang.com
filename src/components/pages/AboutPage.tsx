import { FC, PropsWithChildren } from "react";
import { siteConfig } from "~/config";
import { Tag } from "../Tag";

export const AboutPage: FC<PropsWithChildren> = ({ children }) => {
  const { avatar, skills } = siteConfig.about ?? {};

  return (
    <div className="not-prose">
      {/* Profile Section */}
      <section className="pb-12">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Avatar */}
          {avatar ? (
            <img
              src={avatar}
              alt="Avatar"
              className="w-24 h-24 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-border-light dark:bg-border-dark flex-shrink-0" />
          )}

          {/* Info */}
          <div>
            <h1 className="font-display italic text-[36px] md:text-[42px] tracking-[-1px] text-text-primary dark:text-text-primary-dark mb-4">
              About Me
            </h1>
            <div className="flex items-center gap-4 mb-4">
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
          </div>
        </div>
      </section>

      {/* Bio Section */}
      {children ? (
        <section className="pb-12">
          <div className="prose prose-neutral dark:prose-invert max-w-none prose-p:text-text-body dark:prose-p:text-text-body-dark prose-p:leading-relaxed">
            {children}
          </div>
        </section>
      ) : null}

      {/* Skills Section */}
      {skills && skills.length > 0 ? (
        <section>
          <h2 className="text-xl font-medium text-text-primary dark:text-text-primary-dark mb-4">
            Interests & Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill: string) => (
              <Tag key={skill} label={skill} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
};
