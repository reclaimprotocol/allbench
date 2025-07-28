'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin', label: 'Dashboard', exact: true },
    { href: '/admin/tasks', label: 'Tasks' },
    { href: '/admin/submissions', label: 'Submissions' },
    { href: '/admin/notifications', label: 'Notifications' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black font-light">
      <nav className="bg-white dark:bg-black border-b border-black dark:border-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-light text-black dark:text-white">AllBench Admin</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navItems.map((item) => {
                  const isActive = item.exact 
                    ? pathname === item.href 
                    : pathname.startsWith(item.href) && item.href !== '/admin';
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-light ${
                        isActive
                          ? 'border-black dark:border-white text-black dark:text-white'
                          : 'border-transparent text-black dark:text-white hover:border-gray-500 dark:hover:border-gray-500'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}