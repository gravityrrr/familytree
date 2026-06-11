'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ToastProvider } from '@/components/ui/Toast';
import { Users, Search, Settings, Map, Network } from 'lucide-react';
import { InstallPrompt } from '@/components/ui/InstallPrompt';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const getActiveTab = () => {
    if (pathname.startsWith('/tree')) return 'tree';
    if (pathname.startsWith('/people')) return 'people';
    if (pathname.startsWith('/search')) return 'search';
    if (pathname.startsWith('/relationship-finder')) return 'finder';
    if (pathname.startsWith('/settings')) return 'settings';
    return 'tree';
  };

  const activeTab = getActiveTab();

  return (
    <ProtectedRoute>
      <ToastProvider>
        <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex flex-col relative overflow-hidden">
          
          {/* Main Page Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {children}
          </div>

          {/* Persistent Floating Bottom Navigation Dock */}
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 safe-bottom no-print pb-2">
            <nav className="flex items-center justify-around p-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-black/40">
              {[
                { id: 'tree', icon: Network, label: 'Tree', href: '/tree' },
                { id: 'people', icon: Users, label: 'People', href: '/people' },
                { id: 'finder', icon: Map, label: 'Relations', href: '/relationship-finder' },
                { id: 'settings', icon: Settings, label: 'Settings', href: '/settings' },
              ].map(({ id, icon: Icon, label, href }) => {
                const isActive = activeTab === id;
                return (
                  <Link
                    key={id}
                    href={href}
                    prefetch={true}
                    className={`relative flex flex-col items-center justify-center w-16 h-14 rounded-full transition-all duration-300 active:scale-95 ${
                      isActive
                        ? 'text-blue-600 dark:text-blue-400 font-extrabold'
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-blue-50/80 dark:bg-blue-500/15 rounded-full -z-10 animate-scale-in" />
                    )}
                    <Icon className="w-5 h-5 mb-0.5" />
                    <span className="text-[9px] font-semibold tracking-wide">{label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* PWA Install Prompt */}
          <InstallPrompt />
        </div>
      </ToastProvider>
    </ProtectedRoute>
  );
}
