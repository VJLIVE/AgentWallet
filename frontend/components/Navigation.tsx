'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Home, FileText, Send, Bot, ChevronRight } from 'lucide-react';
import WalletButton from './WalletButton';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/rules', label: 'Rules', icon: FileText },
    { href: '/payments', label: 'Payments', icon: Send },
    { href: '/agent', label: 'AI Agent', icon: Bot },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-neutral-200 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6 lg:px-8">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 shadow-sm transition-transform group-hover:scale-105">
              <Bot className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-semibold tracking-tight text-neutral-900">AgentWallet</span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">Payment Guardian</span>
            </div>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? 'text-blue-700'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={2} />
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-blue-600" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
        <WalletButton />
      </div>
    </nav>
  );
}
