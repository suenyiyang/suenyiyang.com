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
        <div className="space-x-6">
          {siteConfig.navItems.map((item, index) => (
            <Link
              key={index}
              to={item.href}
              className="hover:text-gray-600 inline-flex items-center gap-2"
            >
              {item.icon && (
                <span className={`icon-${item.icon.toLowerCase()}`} />
              )}
              {item.label && <span>{item.label}</span>}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
