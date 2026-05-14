'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/common/logo';
import { IconCalendar, IconChart, IconAll, IconFolder, IconSettings } from '@/components/common/icons';
import type { MockCategory } from '@/data/dashboard-mock';

interface SidebarProps {
  categories: MockCategory[];
}

const NAV_ITEMS = [
  { label: 'Today',       href: '/today',      Icon: IconCalendar },
  { label: 'Dashboard',   href: '/dashboard',  Icon: IconChart },
  { label: 'All entries', href: '/entries',    Icon: IconAll },
  { label: 'Categories',  href: '/categories', Icon: IconFolder },
];

export function Sidebar({ categories }: SidebarProps){
  const pathname = usePathname();

  return (
    <aside className="no-scrollbar sticky top-0 flex h-screen w-[240px] shrink-0 flex-col border-r border-gl-border bg-gl-bg-subtle px-4 py-[22px]">
      {/* Brand */}
      <Link
        href="/"
        className="mb-6 flex items-center gap-2.5 rounded-lg px-2 py-1 outline-none focus-visible:ring-2 focus-visible:ring-gl-primary"
        aria-label="Grow Logs home"
      >
        <Logo size={20} />
        <span className="text-[15px] font-bold tracking-[-0.015em] text-gl-text">Grow Logs</span>
      </Link>

      {/* Primary nav */}
      <nav aria-label="Primary navigation">
        <ul className="flex flex-col gap-0.5" role="list">
          {NAV_ITEMS.map(({ label, href, Icon }) => {
            const active = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-2.5 rounded-lg border px-2.5 py-2 text-[13.5px] font-medium transition-colors duration-[120ms] ${
                    active
                      ? 'border-gl-border bg-gl-surface font-semibold text-gl-text'
                      : 'border-transparent text-gl-text-muted hover:text-gl-text'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Categories */}
      <div className="mt-6">
        <p className="mb-2.5 px-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-gl-text-faint">
          Categories
        </p>
        <ul className="flex flex-col gap-0.5" role="list">
          {categories.map((c) => (
            <li key={c.id}>
              <a
                href="#"
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[12.5px] text-gl-text-muted transition-colors hover:text-gl-text"
              >
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: c.swatchColor }}
                  aria-hidden="true"
                />
                <span className="flex-1 truncate">{c.name}</span>
                <span className="font-mono text-[11px] text-gl-text-faint">{c.entryCount}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto">
        {/* Settings */}
        <a
          href="#"
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-gl-text-muted transition-colors hover:text-gl-text"
        >
          <IconSettings size={18} /> Settings
        </a>

        {/* User */}
        <div className="mt-2 flex items-center gap-2.5 border-t border-gl-border pt-3">
          <span className="inline-flex size-[30px] shrink-0 items-center justify-center rounded-full bg-gl-primary text-[12px] font-bold text-gl-primary-ink">
            SE
          </span>
          <div className="min-w-0">
            <div className="truncate text-[12.5px] font-semibold leading-snug text-gl-text">Software engineer</div>
            <div className="mt-0.5 text-[11px] text-gl-text-muted">3yr experience</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
