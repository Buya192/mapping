'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, LayoutDashboard, Table2, BarChart3, Upload, Zap } from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/argis/peta', label: 'Peta', icon: Map },
  { href: '/argis/data', label: 'Data', icon: Table2 },
  { href: '/argis/statistik', label: 'Statistik', icon: BarChart3 },
  { href: '/argis/upload', label: 'Upload', icon: Upload },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="nav-container">
      <div className="nav-inner">
        <Link href="/" className="nav-logo">
          <div className="nav-logo-icon">
            <Zap size={20} color="white" />
          </div>
          <div>
            <div className="nav-logo-text">PLN Jarkom</div>
            <div className="nav-logo-sub">Sistem Informasi Geospasial</div>
          </div>
        </Link>

        <div className="nav-links">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`nav-link${isActive ? ' active' : ''}`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
