import { siteConfig } from "@/config";
import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="w-full p-8">
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/"
            className="text-xl font-bold w-12 h-12 m-5 absolute left-0 top-0"
          >
            {siteConfig.logo}
          </Link>
        </div>
        <div className="space-x-6 flex flex-row items-center">
          {siteConfig.navItems.map((item, index) => (
            <Link
              key={index}
              to={item.href}
              className="hover:text-gray-600 inline-flex items-center gap-2"
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
        </div>
      </div>
    </header>
  );
}
