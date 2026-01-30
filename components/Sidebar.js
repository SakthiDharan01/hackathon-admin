"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/teams', label: 'Teams' },
  { href: '/evaluations', label: 'Evaluations' },
  { href: '/announcements', label: 'Announcements' },
  { href: '/agenda', label: 'Agenda' },
  { href: '/support', label: 'Support' },
  { href: '/emails', label: 'Emails' },
  { href: '/checkin', label: 'Check-in' },
  { href: '/submissions', label: 'Submissions' },
  { href: '/settings', label: 'Settings' },
];

export default function Sidebar({ mobileOpen = false, onClose }) {
  const pathname = usePathname();

  return (
    <>
      <div
        className={`sidebar-backdrop ${mobileOpen ? 'open' : ''}`}
        onClick={() => (typeof onClose === 'function' ? onClose() : null)}
      />
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1>AI WARS Admin</h1>
          <button
            className="icon-button mobile-only"
            type="button"
            onClick={() => (typeof onClose === 'function' ? onClose() : null)}
            aria-label="Close menu"
            title="Close"
          >
            ✕
          </button>
        </div>
        <nav>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={pathname.startsWith(link.href) ? 'active' : ''}
              onClick={() => (typeof onClose === 'function' ? onClose() : null)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
