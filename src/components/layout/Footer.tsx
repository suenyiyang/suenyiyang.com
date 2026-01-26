import { ToggleDark } from "../ToggleDark";
import { siteConfig } from "~/config";

export default function Footer() {
  return (
    <footer className="w-full py-6 px-5 md:py-8 md:px-16 mt-auto">
      <div className="flex flex-col items-center justify-between gap-4 max-w-6xl mx-auto md:flex-row md:gap-0">
        <span className="font-mono text-[10px] md:text-[11px] text-text-muted dark:text-text-secondary">
          © 2026 · Built with curiosity
        </span>
        <div className="flex items-center gap-4 md:gap-6">
          {siteConfig.socialLinks?.map((link, index) => (
            <a
              key={index}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[11px] md:text-[12px] text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark transition-colors"
            >
              {link.label}
            </a>
          ))}
          <ToggleDark />
        </div>
      </div>
    </footer>
  );
}
