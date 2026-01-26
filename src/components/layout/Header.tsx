import { siteConfig } from "~/config";
import { NavLink, Link } from "react-router";
import { Logo } from "../Logo";

export default function Header() {
  return (
    <header className="w-full py-5 px-16 text-text-secondary dark:text-text-secondary-dark sticky top-0 bg-bg-light dark:bg-bg-dark z-10 border-b border-border-light dark:border-border-dark">
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <Logo />
        </Link>
        <nav className="flex items-center gap-8">
          {siteConfig.navItems.map((item, index) => (
            item.target === "_blank" ? (
              <a
                key={index}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[13px] text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark transition-colors"
              >
                {item.label}
              </a>
            ) : (
              <NavLink
                key={index}
                to={item.href}
                className={({ isActive }) =>
                  `font-mono text-[13px] transition-colors ${
                    isActive
                      ? "font-medium text-text-primary dark:text-text-primary-dark"
                      : "text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark"
                  }`
                }
                end={item.href === "/"}
              >
                {item.label}
              </NavLink>
            )
          ))}
        </nav>
      </div>
    </header>
  );
}
