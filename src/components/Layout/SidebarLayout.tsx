"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!document.startViewTransition) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");
      if (link && link.href) {
        e.preventDefault();

        document.startViewTransition(async () => {
          router.push(link.href);
        });
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [router]);

  const navItems = [
    { name: "Work", href: "/work" },
    { name: "Blog", href: "/posts" },
    { name: "Projects", href: "/projects" },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Sidebar - shows at bottom on mobile, left on desktop */}
      <nav className="md:w-64 md:fixed md:h-full p-4 bg-white dark:bg-black">
        <ul className="flex md:flex-col gap-4 md:gap-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block py-2 px-4 ${
                  pathname === item.href ? "font-bold" : ""
                }`}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Main content area */}
      <main className="flex-1 md:ml-64 p-4">{children}</main>
    </div>
  );
}
