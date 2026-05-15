import Link from 'next/link';
import { Logo } from '@/components/common/logo';

const FOOTER_COLS = [
  {
    heading: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Changelog', href: '#changelog' },
      { label: 'Roadmap', href: '#roadmap' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '#about' },
      { label: 'Blog', href: '#blog' },
      { label: 'Contact', href: '#contact' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy', href: '#privacy' },
      { label: 'Terms', href: '#terms' },
      { label: 'Security', href: '#security' },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="border-gl-border border-t py-12 pb-10" aria-label="Site footer">
      <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:gap-8">
        {/* Brand column */}
        <div className="col-span-2 sm:col-span-1">
          <Link
            href="/"
            className="focus-visible:ring-gl-primary mb-3.5 inline-flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2"
            aria-label="Grow Logs home"
          >
            <Logo size={20} />
            <span className="text-gl-text text-[16px] font-bold tracking-[-0.015em]">
              Grow Logs
            </span>
          </Link>

          <p className="text-gl-text-muted max-w-[280px] text-[13px] leading-[1.55]">
            A daily log book for the work you do and the things you learn.
          </p>

          <p className="text-gl-text-faint mt-6 font-mono text-[12px]">
            © 2026 Grow Logs · Made for people who keep notes.
          </p>
        </div>

        {/* Link columns */}
        {FOOTER_COLS.map(({ heading, links }) => (
          <div key={heading}>
            <h3 className="text-gl-text-faint mb-4 text-[11px] font-bold tracking-[0.12em] uppercase">
              {heading}
            </h3>
            <ul className="flex flex-col gap-2.5" role="list">
              {links.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    className="text-gl-text-muted hover:text-gl-text focus-visible:text-gl-text text-[13.5px] font-medium transition-colors duration-150 focus-visible:outline-none"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}
