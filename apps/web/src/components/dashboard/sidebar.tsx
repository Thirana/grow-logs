'use client';

import { type JSX } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/common/logo';
import { IconPlus, IconChart, IconAll, IconFolder, IconSettings } from '@/components/common/icons';
import { useCategories } from '@/hooks/use-categories';
import { useAuthStore } from '@/stores/auth.store';
import { useUiStore } from '@/stores/ui.store';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', Icon: IconChart },
  { label: 'All entries', href: '/entries', Icon: IconAll },
  { label: 'Categories', href: '/categories', Icon: IconFolder },
] as const;

function userInitials(email: string): string {
  const parts = email.split('@')[0].split(/[._-]/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

export function Sidebar(): JSX.Element {
  const pathname = usePathname();
  const { data: categories, isLoading: catsLoading } = useCategories();
  const user = useAuthStore((s) => s.user);
  const openCreateEntry = useUiStore((s) => s.openCreateEntry);

  return (
    <aside className="no-scrollbar border-gl-border bg-gl-bg-subtle sticky top-0 flex h-screen w-[240px] shrink-0 flex-col border-r px-4 py-[22px]">
      <Link
        href="/"
        className="focus-visible:ring-gl-primary mb-6 flex items-center gap-2.5 rounded-lg px-2 py-1 outline-none focus-visible:ring-2"
        aria-label="Grow Logs home"
      >
        <Logo size={20} />
        <span className="text-gl-text text-[15px] font-bold tracking-[-0.015em]">Grow Logs</span>
      </Link>

      <button
        onClick={openCreateEntry}
        className="border-gl-primary text-gl-primary hover:bg-gl-primary-soft mb-4 flex w-full items-center justify-center gap-2 rounded-[9px] border py-2.5 text-[13.5px] font-semibold transition-colors duration-[120ms]"
      >
        <IconPlus size={13} /> Add entry
      </button>

      <nav aria-label="Primary navigation">
        <ul className="flex flex-col gap-0.5" role="list">
          {NAV_ITEMS.map(({ label, href, Icon }) => {
            const active = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-2.5 rounded-[7px] px-2.5 py-2 text-[13.5px] font-medium transition-colors duration-[120ms] ${
                    active
                      ? 'bg-gl-primary text-gl-primary-ink font-semibold'
                      : 'text-gl-text-muted hover:text-gl-text'
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

      <div className="mt-6">
        <p className="text-gl-text-faint mb-2.5 px-2.5 text-[10px] font-bold tracking-[0.12em] uppercase">
          Categories
        </p>
        {catsLoading ? (
          <div className="flex flex-col gap-0.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gl-border/40 mx-2.5 h-[28px] animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <ul className="flex flex-col gap-0.5" role="list">
            {(categories ?? []).map((c) => (
              <li key={c.id}>
                <a
                  href="#"
                  className="text-gl-text-muted hover:text-gl-text flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[12.5px] transition-colors"
                >
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: c.color }}
                    aria-hidden="true"
                  />
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="text-gl-text-faint font-mono text-[11px]">{c.entryCount}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-auto">
        <a
          href="#"
          className="text-gl-text-muted hover:text-gl-text flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors"
        >
          <IconSettings size={18} /> Settings
        </a>

        <div className="border-gl-border mt-2 flex items-center gap-2.5 border-t pt-3">
          <span className="bg-gl-primary text-gl-primary-ink inline-flex size-[30px] shrink-0 items-center justify-center rounded-full text-[12px] font-bold">
            {user ? userInitials(user.email) : '—'}
          </span>
          <div className="min-w-0">
            <div className="text-gl-text truncate text-[12.5px] leading-snug font-semibold">
              {user?.email.split('@')[0] ?? 'Loading…'}
            </div>
            <div className="text-gl-text-muted mt-0.5 truncate text-[11px]">
              {user?.email ?? ''}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
