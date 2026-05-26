import { siteConfig } from "~/config";
import { NavLink, Link, useLocation } from "react-router";
import { useEffect, useRef, useState } from "react";
import { Logo } from "../Logo";
import { ThemeSwitch } from "../ThemeSwitch";

const linkClass = (isActive: boolean) =>
  `font-mono text-meta transition-colors ${
    isActive
      ? "font-medium text-text-primary dark:text-text-primary-dark"
      : "text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark"
  }`;

function NavItems({
  layout,
  onNavigate,
}: {
  layout: "inline" | "stack";
  onNavigate?: () => void;
}) {
  const wrapper =
    layout === "inline"
      ? "flex items-center gap-6 md:gap-8"
      : "flex flex-col items-stretch divide-y divide-border-light dark:divide-border-dark";
  const itemBase =
    layout === "stack"
      ? "px-4 py-3 text-body"
      : "";

  return (
    <nav className={wrapper}>
      {siteConfig.navItems.map((item, index) =>
        item.target === "_blank" ? (
          <a
            key={index}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onNavigate}
            className={`${linkClass(false)} ${itemBase}`}
          >
            {item.label}
          </a>
        ) : (
          <NavLink
            key={index}
            to={item.href}
            onClick={onNavigate}
            className={({ isActive }) => `${linkClass(isActive)} ${itemBase}`}
            end={item.href === "/"}
          >
            {item.label}
          </NavLink>
        )
      )}
    </nav>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { pathname } = useLocation();

  // Close the dropdown on route change (e.g. after picking a link).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Click-outside + Escape close the panel without trapping focus.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (buttonRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className="w-full py-4 px-4 md:py-5 md:px-16 text-text-secondary dark:text-text-secondary-dark sticky top-0 z-20 backdrop-blur-md bg-bg-light/85 dark:bg-bg-dark/85">
      <div className="flex items-center justify-between gap-4">
        <Link to="/" aria-label="Home" className="flex items-center">
          <Logo />
        </Link>

        <div className="flex items-center gap-4 md:gap-6">
          {/* Inline nav above the md breakpoint. */}
          <div className="hidden md:block">
            <NavItems layout="inline" />
          </div>

          {/* Theme switch stays visible at every breakpoint so it's never
              hidden behind the hamburger. */}
          <ThemeSwitch />

          {/* Hamburger on small screens. */}
          <button
            ref={buttonRef}
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="primary-nav"
            onClick={() => setOpen((v) => !v)}
            className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-md border border-border-light dark:border-border-dark text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark transition-colors"
          >
            <span
              aria-hidden
              className={`${
                open ? "icon-[line-md--close]" : "icon-[line-md--menu]"
              } w-5 h-5`}
            />
          </button>
        </div>
      </div>

      {/* Mobile dropdown — floats over the page so opening it doesn't push
          content down. Inherits the header's blur/translucent bg. */}
      <div
        ref={panelRef}
        id="primary-nav"
        aria-hidden={!open}
        className={`md:hidden absolute left-0 right-0 top-full px-4 pb-3 overflow-hidden transition-[max-height,opacity] duration-200 backdrop-blur-md bg-bg-light/85 dark:bg-bg-dark/85 ${
          open
            ? "max-h-96 opacity-100 pointer-events-auto"
            : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
        <div className="pt-3 border-t border-border-light dark:border-border-dark">
          <NavItems layout="stack" onNavigate={() => setOpen(false)} />
        </div>
      </div>
    </header>
  );
}
