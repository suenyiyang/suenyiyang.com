import { siteConfig } from "~/config";
import { NavLink, Link, useLocation } from "react-router";
import { useEffect, useRef, useState } from "react";
import { Logo } from "../Logo";
import { ThemeSwitch } from "../ThemeSwitch";

const linkClass = (isActive: boolean) =>
  `font-mono text-meta transition-colors ${
    isActive
      ? "text-text-primary dark:text-text-primary-dark"
      : "text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark"
  }`;

export default function Header() {
  const [open, setOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    const outside = (event: PointerEvent) => {
      if (!header.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", escape);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", escape);
      document.removeEventListener("pointerdown", outside);
    };
  }, [open]);

  return (
    <header
      ref={header}
      className="site-header w-full px-(--col-px) sticky top-0 z-20 backdrop-blur-md bg-bg-light/85 dark:bg-bg-dark/85"
    >
      <div className="flex items-center justify-between gap-3 max-w-(--col-measure) mx-auto h-[var(--site-header-height)]">
        <Link to="/" aria-label="Home" className="flex items-center shrink-0">
          <Logo />
        </Link>
        <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
          <button
            ref={toggle}
            type="button"
            className="nav-toggle"
            aria-label="Navigation menu"
            aria-expanded={open}
            aria-controls="site-navigation"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "Close" : "Menu"}
            <span aria-hidden="true">{open ? " −" : " +"}</span>
          </button>
          <nav
            id="site-navigation"
            aria-label="Main navigation"
            className={`site-navigation${open ? " is-open" : ""}`}
            onBlur={(event) => {
              if (
                open &&
                event.relatedTarget &&
                !header.current?.contains(event.relatedTarget as Node)
              )
                setOpen(false);
            }}
          >
            {siteConfig.navItems.map((item) =>
              item.target === "_blank" ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass(false)}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </a>
              ) : (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) => linkClass(isActive)}
                  end={item.href === "/"}
                  onClick={() => setOpen(false)}
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
