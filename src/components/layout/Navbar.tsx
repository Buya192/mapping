'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, Map, Zap, MapPin, Activity, Cable, Users, Radio, 
  ChevronDown, Shield, Cpu, GitBranch, BarChart3, Wrench, FolderKanban, CheckCircle2
} from 'lucide-react';

const dataMenus = [
  { href: '/data/trafo', label: 'Gardu / Trafo', icon: Zap },
  { href: '/data/tiang', label: 'Tiang', icon: MapPin },
  { href: '/data/jtm', label: 'JTM', icon: Activity },
  { href: '/data/jtr', label: 'JTR', icon: Cable },
  { href: '/data/sr', label: 'SR', icon: Cable },
  { href: '/data/pelanggan', label: 'Pelanggan', icon: Users },
  { href: '/data/pembangkit', label: 'Pembangkit', icon: Cpu },
  { href: '/data/proteksi', label: 'Proteksi', icon: Shield },
  { href: '/data/sistem', label: 'Data Sistem', icon: BarChart3 },
];

const analisisMenus = [
  { href: '/analisis/kabel', label: 'Analisis Kabel', icon: Cable },
  { href: '/analisis/tiang', label: 'Analisis Tiang', icon: MapPin },
  { href: '/analisis/coverage', label: 'Coverage Mapping', icon: Map },
  { href: '/analisis/survey', label: 'Survey Tools', icon: Shield },
];

const toolMenus = [
  { href: '/diagram', label: 'SLD Generator', icon: GitBranch },
  { href: '/keandalan', label: 'Keandalan', icon: BarChart3 },
  { href: '/rekomendasi', label: 'Rekomendasi AI', icon: Wrench },
  { href: '/proyek', label: 'Proyek', icon: FolderKanban },
];

export function Navbar() {
  const pathname = usePathname();
  const [dataOpen, setDataOpen] = useState(false);
  const [toolOpen, setToolOpen] = useState(false);
  const dataRef = useRef<HTMLDivElement>(null);
  const toolRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dataRef.current && !dataRef.current.contains(e.target as Node)) setDataOpen(false);
      if (toolRef.current && !toolRef.current.contains(e.target as Node)) setToolOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isDataPage = pathname.startsWith('/data');
  const isAnalisisPage = pathname.startsWith('/analisis');
  const isToolPage = ['/diagram', '/keandalan', '/rekomendasi', '/proyek'].includes(pathname);
  const isPeta = pathname === '/peta';
  const isVerifikasi = pathname === '/verifikasi';

  return (
    <nav className={`nav-container ${isPeta ? 'nav-hidden' : ''}`}>
      <div className="nav-inner">
        <Link href="/" className="nav-logo">
          <div className="nav-logo-icon">⚡</div>
          <div>
            <div className="nav-logo-text">PLN JARKOM</div>
            <div className="nav-logo-sub">Sistem Manajemen Jaringan</div>
          </div>
        </Link>
        <div className="nav-links">
          <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
            <LayoutDashboard size={18} /> Dashboard
          </Link>
          <Link href="/peta" className={`nav-link ${pathname === '/peta' ? 'active' : ''}`}>
            <Map size={18} /> Peta
          </Link>
          <Link href="/verifikasi" className={`nav-link ${pathname === '/verifikasi' ? 'active' : ''}`}>
            <CheckCircle2 size={18} /> Verifikasi
          </Link>

          {/* Data Aset Dropdown */}
          <div ref={dataRef} className="relative">
            <button
              onClick={() => { setDataOpen(!dataOpen); setToolOpen(false); }}
              className={`nav-link flex items-center gap-1 ${isDataPage ? 'active' : ''}`}
            >
              <Activity size={18} />
              Data Aset
              <ChevronDown size={14} className={`transition-transform ${dataOpen ? 'rotate-180' : ''}`} />
            </button>
            {dataOpen && (
              <div className="dropdown-panel" style={{ minWidth: 300 }}>
                <div className="p-1.5">
                  {dataMenus.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setDataOpen(false)}
                      className={`dropdown-item ${pathname === item.href ? 'active' : ''}`}
                    >
                      <item.icon size={16} className={pathname === item.href ? 'text-[#34d399]' : 'text-[#52525b] group-hover:text-[#71717a]'} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">{item.label}</div>
                        <div className="text-[10px] font-mono text-[#52525b] group-hover:text-[#71717a] tracking-wider">{item.sub}</div>
                      </div>
                      {pathname === item.href && (
                        <div className="w-1.5 h-1.5 rounded-full bg-[#34d399] shadow-[0_0_6px_#34d399]" />
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Analisis Dropdown */}
          <div ref={dataRef} className="relative">
            <button
              onClick={() => { setDataOpen(!dataOpen); setToolOpen(false); }}
              className={`nav-link flex items-center gap-1 ${isAnalisisPage ? 'active' : ''}`}
            >
              <BarChart3 size={18} />
              Analisis
              <ChevronDown size={14} className={`transition-transform ${dataOpen ? 'rotate-180' : ''}`} />
            </button>
            {dataOpen && (
              <div className="dropdown-panel" style={{ minWidth: 220 }}>
                <div className="p-1.5">
                  {analisisMenus.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setDataOpen(false)}
                      className={`dropdown-item ${pathname === item.href ? 'active' : ''}`}
                    >
                      <item.icon size={16} className={pathname === item.href ? 'text-[#34d399]' : 'text-[#52525b]'} />
                      <div className="text-sm font-semibold">{item.label}</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div ref={toolRef} className="relative">
            <button
              onClick={() => { setToolOpen(!toolOpen); setDataOpen(false); }}
              className={`nav-link flex items-center gap-1 ${isToolPage ? 'active' : ''}`}
            >
              <Wrench size={18} />
              Tools
              <ChevronDown size={14} className={`transition-transform ${toolOpen ? 'rotate-180' : ''}`} />
            </button>
            {toolOpen && (
              <div className="dropdown-panel" style={{ minWidth: 240 }}>
                <div className="p-1.5">
                  {toolMenus.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setToolOpen(false)}
                      className={`dropdown-item ${pathname === item.href ? 'active' : ''}`}
                    >
                      <item.icon size={16} className={pathname === item.href ? 'text-[#818cf8]' : 'text-[#52525b] group-hover:text-[#71717a]'} />
                      <div className="text-sm font-semibold">{item.label}</div>
                      {pathname === item.href && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#818cf8] shadow-[0_0_6px_#818cf8]" />
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
