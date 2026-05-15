'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/common/logo';
import { GlButton } from '@/components/common/gl-button';
import { IconArrow, IconMenu, IconClose } from '@/components/common/icons';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Stories', href: '#testimonials' },
  { label: 'Pricing', href: '#pricing' },
] as const;

export function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled ? 'border-gl-border bg-gl-bg/80 border-b backdrop-blur-2xl' : 'bg-transparent',
      )}
    >
      <nav className="flex items-center justify-between py-5 md:py-6" aria-label="Main navigation">
        {/* Logo + wordmark */}
        <Link
          href="/"
          className="group focus-visible:ring-gl-primary flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2"
          aria-label="Grow Logs home"
        >
          <Logo size={22} />
          <span className="text-gl-text text-[17px] font-bold tracking-[-0.015em]">Grow Logs</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-1 md:flex" role="list">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              role="listitem"
              className="text-gl-text-muted hover:text-gl-text focus-visible:ring-gl-primary rounded-lg px-3 py-2 text-[14px] font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="hidden items-center gap-1 md:flex">
          <span className="bg-gl-border mx-2 h-[18px] w-px" aria-hidden="true" />
          <Link
            href="/login"
            className="text-gl-text hover:text-gl-primary focus-visible:ring-gl-primary rounded-lg px-3 py-2 text-[14px] font-semibold transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none"
          >
            Log in
          </Link>
          <Link href="/register" tabIndex={-1}>
            <GlButton variant="primary" size="md" trailing={<IconArrow size={13} />}>
              Get started
            </GlButton>
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="text-gl-text-muted hover:text-gl-text focus-visible:ring-gl-primary flex items-center justify-center rounded-lg p-2 transition-colors focus-visible:ring-2 focus-visible:outline-none md:hidden"
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          {mobileOpen ? <IconClose size={20} /> : <IconMenu size={20} />}
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-in-out md:hidden',
          mobileOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0',
        )}
        aria-hidden={!mobileOpen}
      >
        <div className="border-gl-border flex flex-col gap-1 border-t py-4">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="text-gl-text-muted hover:bg-gl-surface hover:text-gl-text rounded-lg px-3 py-2.5 text-[15px] font-medium transition-colors"
            >
              {link.label}
            </a>
          ))}
          <div className="border-gl-border mt-3 flex flex-col gap-2 border-t pt-3">
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="text-gl-text hover:bg-gl-surface rounded-lg px-3 py-2.5 text-[15px] font-semibold transition-colors"
            >
              Log in
            </Link>
            <Link href="/register" onClick={() => setMobileOpen(false)}>
              <GlButton
                variant="primary"
                size="lg"
                trailing={<IconArrow size={13} />}
                className="w-full justify-center"
              >
                Get started
              </GlButton>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
