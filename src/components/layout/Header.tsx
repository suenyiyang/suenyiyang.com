import { siteConfig } from "~/config";
import { Link } from "react-router-dom";
import { ToggleDark } from "../ToggleDark";

export default function Header() {
  return (
    <header className="w-full p-8 text-neutral-700 dark:text-neutral-300 fill-neutral-700 dark:fill-neutral-300">
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/"
            className="text-xl font-bold w-12 h-12 my-5 mx-8 absolute left-0 top-0"
          >
            {siteConfig.logo}
          </Link>
        </div>
        <div className="space-x-6 flex flex-row items-center">
          {siteConfig.navItems.map((item, index) => (
            <Link
              key={index}
              to={item.href}
              className="inline-flex items-center gap-2"
              target={item.target}
            >
              {item.icon ? (
                <span
                  className={`${item.icon.toLowerCase()} w-6 h-6 text-light-grey`}
                />
              ) : null}
              {item.label ? <span>{item.label}</span> : null}
            </Link>
          ))}
          <ToggleDark />
        </div>
      </div>
    </header>
  );
}
