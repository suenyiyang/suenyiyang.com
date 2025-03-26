'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!document.startViewTransition) return;
    
    // Enable view transitions for navigation
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A') {
        e.preventDefault();
        const href = target.getAttribute('href');
        if (href) {
          document.startViewTransition(() => {
            window.location.href = href;
          });
        }
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const pathname = usePathname();
  
  const navItems = [
    { name: 'Work', href: '/work' },
    { name: 'Blog', href: '/posts' },
    { name: 'Projects', href: '/projects' }
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Sidebar - shows at bottom on mobile, left on desktop */}
      <nav className="md:w-64 md:border-r md:fixed md:h-full p-4 bg-white dark:bg-black">
        <ul className="flex md:flex-col gap-4 md:gap-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block py-2 px-4 rounded hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors
                  ${pathname === item.href ? 'font-bold' : ''}`}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Main content area */}
      <main className="flex-1 md:ml-64 p-4">
        {children}
      </main>
    </div>
  );
}
