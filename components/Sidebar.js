"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/teams', label: 'Teams' },
  { href: '/evaluations', label: 'Evaluations' },
  { href: '/announcements', label: 'Announcements' },
  { href: '/checkin', label: 'Check-in' },
  { href: '/submissions', label: 'Submissions' },
  { href: '/settings', label: 'Settings' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <h1>AI WARS Admin</h1>
      <nav>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={pathname.startsWith(link.href) ? 'active' : ''}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
