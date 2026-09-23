import { siteConfig } from "~/config";

export default function Footer() {
  return (
    <footer className="w-full px-(--col-px) mt-auto">
      <div className="flex items-center justify-between gap-4 max-w-(--col-measure) mx-auto pt-7 pb-12 border-t border-[var(--reading-rule)] font-mono text-[0.75rem]">
        <span className="text-text-muted dark:text-text-muted-dark">
          © 2026 {siteConfig.metadata.title}
        </span>
        <div className="flex items-center gap-[1.125rem]">
          {siteConfig.socialLinks?.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
