import { siteConfig } from "~/config";
import { NavLink, Link } from "react-router";
import { Logo } from "../Logo";
import { ThemeSwitch } from "../ThemeSwitch";

const linkClass = (isActive: boolean) =>
  `font-mono text-meta transition-colors ${
    isActive
      ? "text-text-primary dark:text-text-primary-dark"
      : "text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark"
  }`;

export default function Header() {
  return (
    <header className="w-full px-(--col-px) sticky top-0 z-20 backdrop-blur-md bg-bg-light/85 dark:bg-bg-dark/85">
      <div className="flex items-center justify-between gap-4 max-w-(--col-measure) mx-auto h-16 md:h-[5.5rem]">
        <Link to="/" aria-label="Home" className="flex items-center">
          <Logo />
        </Link>

        <div className="flex items-center gap-5 md:gap-6">
          <nav className="flex items-center gap-5 md:gap-6">
            {siteConfig.navItems.map((item) =>
              item.target === "_blank" ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass(false)}
                >
                  {item.label}
                </a>
              ) : (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) => linkClass(isActive)}
                  end={item.href === "/"}
                >
                  {item.label}
                </NavLink>
              )
            )}
          </nav>
          <ThemeSwitch />
        </div>
      </div>
    </header>
  );
}
