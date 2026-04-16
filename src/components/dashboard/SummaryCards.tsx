'use client';

import { useState, useEffect } from 'react';
import { Zap, MapPin, Activity, Cable, Users, Radio, Database, Cpu, Shield } from 'lucide-react';
import Link from 'next/link';

interface StatCard {
  label: string;
  source: string;
  value: number;
  color: string;
  icon: React.ReactNode;
  href: string;
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) return;
    const duration = 800;
    const start = Date.now();
    const from = 0;
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(from + (value - from) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <>{display.toLocaleString('id-ID')}</>;
}

function SkeletonCard() {
  return (
    <div className="bg-[#09090b] border border-[#1c1c1e] rounded-xl p-4">
      <div className="skeleton w-8 h-8 mb-3" />
      <div className="skeleton w-16 h-6 mb-2" />
      <div className="skeleton w-20 h-3" />
    </div>
  );
}

export function SummaryCards() {
  const [stats, setStats] = useState<StatCard[]>([]);
  const [total, setTotal] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    fetch('/api/counts')
      .then(r => r.ok ? r.json() : null)
      .catch(() => null)
      .then(c => {
        if (!c) { setLoading(false); return; }
        setTotal(c.total || 0);
        setStats([
          { label: 'Gardu / Trafo', source: 'gardu-arcgis', value: c.gardu, color: '#34d399', icon: <Zap size={20} />, href: '/data/trafo' },
          { label: 'Tiang', source: 'tiang-arcgis', value: c.tiang, color: '#3b82f6', icon: <MapPin size={20} />, href: '/data/tiang' },
          { label: 'Tiang JTM', source: 'jtm-lines', value: c.jtm, color: '#8b5cf6', icon: <Activity size={20} />, href: '/data/jtm' },
          { label: 'JTR', source: 'jtr-lines', value: c.jtr, color: '#f59e0b', icon: <Cable size={20} />, href: '/data/jtr' },
          { label: 'SR', source: 'sr-lines', value: c.sr, color: '#06b6d4', icon: <Cable size={20} />, href: '/data/sr' },
          { label: 'Pelanggan', source: 'pelanggan', value: c.pelanggan, color: '#ec4899', icon: <Users size={20} />, href: '/data/pelanggan' },
          { label: 'Pembangkit', source: 'PLTS/PLTD', value: c.pembangkit || 0, color: '#f97316', icon: <Cpu size={20} />, href: '/data/pembangkit' },
          { label: 'Proteksi', source: 'FCO+Recloser', value: (c.fco || 0) + (c.recloser || 0), color: '#a78bfa', icon: <Shield size={20} />, href: '/data/proteksi' },
        ]);
        setLoading(false);
      });
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-4">
      {/* Grand Total */}
      <div className="bg-[#09090b] border border-[#1c1c1e] rounded-2xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#18181b] border border-[#27272a] flex items-center justify-center text-[#71717a]">
            <Database size={20} />
          </div>
          <div>
            <div className="text-xs font-mono text-[#52525b] uppercase tracking-widest mb-0.5">Total Record Database</div>
            <div className="text-2xl font-bold font-mono text-white count-pop">
              {loading ? <span className="skeleton inline-block w-24 h-7" /> : <AnimatedNumber value={total} />}
            </div>
          </div>
        </div>
        <div className="text-[10px] font-mono text-[#3f3f46] text-right">
          8 TABEL SUMBER<br/>ArcGIS + Hardware
        </div>
      </div>

      {/* Individual Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          stats.map((s, i) => (
            <Link key={s.source} href={s.href}
              className="bg-[#09090b] border border-[#1c1c1e] rounded-xl p-4 hover:bg-[#0f0f11] hover:border-[#27272a] transition-all group cursor-pointer"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div style={{ color: s.color }} className="opacity-70 group-hover:opacity-100 transition-all group-hover:scale-110 duration-200">
                  {s.icon}
                </div>
              </div>
              <div className="text-xl font-bold font-mono text-white mb-0.5 count-pop">
                <AnimatedNumber value={s.value} />
              </div>
              <div className="text-[10px] font-medium text-[#52525b] uppercase tracking-wider truncate">{s.label}</div>
              <div className="text-[9px] font-mono text-[#27272a] mt-1 truncate">{s.source}</div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
