import { siteConfig } from "~/config";
import { NavLink, Link } from "react-router";
import { Logo } from "../Logo";

export default function Header() {
  return (
    <header className="w-full py-4 px-4 md:py-5 md:px-16 text-text-secondary dark:text-text-secondary-dark sticky top-0 z-10 backdrop-blur-md bg-bg-light/85 dark:bg-bg-dark/85">
      <div className="flex items-center justify-between">
        <Link to="/" aria-label="Home" className="flex items-center">
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
                className="font-mono text-meta text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark transition-colors"
              >
                {item.label}
              </a>
            ) : (
              <NavLink
                key={index}
                to={item.href}
                className={({ isActive }) =>
                  `font-mono text-meta transition-colors ${
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
