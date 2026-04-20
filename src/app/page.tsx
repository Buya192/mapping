'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Zap, TrendingUp, Shield, MapPin, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { BebanChart } from '@/components/dashboard/BebanChart';
import { GangguanChart } from '@/components/dashboard/GangguanChart';
import { KeandalanChart } from '@/components/dashboard/KeandalanChart';
import { GangguanTable } from '@/components/dashboard/GangguanTable';
import { AssetSummaryTable } from '@/components/dashboard/AssetSummaryTable';
import { VerificationStats } from '@/components/dashboard/VerificationStats';

function LiveClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="font-mono tabular-nums">{time}</span>;
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <>
      {/* Hero Banner */}
      <div className="dashboard-hero">
        <div className="max-w-1400px mx-auto px-4">
          <div className="flex justify-between items-start">
            <div>
              <h1>PLN JARKOM Dashboard</h1>
              <p className="text-secondary mt-2">Sistem Manajemen Jaringan & Perencanaan Distribusi</p>
            </div>
            <div className="text-right">
              <div className="text-secondary text-sm">Last Update</div>
              <div className="font-mono text-accent-indigo">{mounted && <LiveClock />}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-8">
        <SummaryCards />
      </div>

      {/* Verification Status */}
      <div className="mb-8">
        <div className="glass-card-header mb-4">
          <CheckCircle2 size={16} />
          [ VERIFICATION_STATUS ] Field Validation Metrics
        </div>
        <VerificationStats />
      </div>
      
      {/* Quick Discovery Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <a href="/rekomendasi" className="discovery-card group" style={{ '--accent': '#818cf8' } as React.CSSProperties}>
          <div className="discovery-card-accent" style={{ background: '#818cf8' }} />
          <div className="flex items-start gap-4 relative z-10">
            <div className="text-[#818cf8] mt-1 group-hover:scale-110 transition-transform">
              <TrendingUp size={24} />
            </div>
            <div>
              <h3 className="font-bold tracking-tight text-[#e4e4e7] text-lg">AI Expansion Module</h3>
              <p className="text-[10px] font-mono text-[#52525b] mt-1 uppercase tracking-widest">Geo-Spatial analytics & blind-spot metrics</p>
            </div>
          </div>
        </a>
        <a href="/diagram" className="discovery-card group" style={{ '--accent': '#22d3ee' } as React.CSSProperties}>
          <div className="discovery-card-accent" style={{ background: '#22d3ee' }} />
          <div className="flex items-start gap-4 relative z-10">
            <div className="text-[#22d3ee] mt-1 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
            </div>
            <div>
              <h3 className="font-bold tracking-tight text-[#e4e4e7] text-lg">SLD Core Generator</h3>
              <p className="text-[10px] font-mono text-[#52525b] mt-1 uppercase tracking-widest">Single Line Diagram auto-plot system</p>
            </div>
          </div>
        </a>
        <Link href="/verifikasi" className="discovery-card group" style={{ '--accent': '#34d399' } as React.CSSProperties}>
          <div className="discovery-card-accent" style={{ background: '#34d399' }} />
          <div className="flex items-start gap-4 relative z-10">
            <div className="text-[#34d399] mt-1 group-hover:scale-110 transition-transform">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h3 className="font-bold tracking-tight text-[#e4e4e7] text-lg">Verifikasi Lapangan</h3>
              <p className="text-[10px] font-mono text-[#52525b] mt-1 uppercase tracking-widest">GPS-based asset verification & validation</p>
            </div>
          </div>
        </Link>
        <Link href="/peta" className="discovery-card group" style={{ '--accent': '#f59e0b' } as React.CSSProperties}>
          <div className="discovery-card-accent" style={{ background: '#f59e0b' }} />
          <div className="flex items-start gap-4 relative z-10">
            <div className="text-[#f59e0b] mt-1 group-hover:scale-110 transition-transform">
              <MapPin size={24} />
            </div>
            <div>
              <h3 className="font-bold tracking-tight text-[#e4e4e7] text-lg">Network Topology Map</h3>
              <p className="text-[10px] font-mono text-[#52525b] mt-1 uppercase tracking-widest">Interactive network visualization & analysis</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-3 glass-card">
          <div className="glass-card-header">
            <span>[ CHART_BLOCK 01 ] 24H FEEDER LOAD</span>
            <span className="text-[#34d399] text-[10px] animate-pulse">● LIVE</span>
          </div>
          <div className="p-4"><BebanChart /></div>
        </div>
        <div className="glass-card">
          <div className="glass-card-header">[ CHART_BLOCK 02 ] FAULT CAUSES</div>
          <div className="p-4"><GangguanChart /></div>
        </div>
        <div className="glass-card lg:col-span-2">
          <div className="glass-card-header">[ CHART_BLOCK 03 ] RELIABILITY TREND</div>
          <div className="p-4"><KeandalanChart /></div>
        </div>
      </div>

      {/* Asset Summary Table */}
      <div className="mb-8 glass-card overflow-hidden">
        <div className="glass-card-header flex items-center justify-between">
          <span>[ TERMINAL_MATRIX ] ASSET_REGISTRY</span>
          <span className="text-[#34d399] animate-pulse text-[10px]">● SYNC</span>
        </div>
        <AssetSummaryTable />
      </div>

      {/* Gangguan Table */}
      <div className="mb-8 glass-card relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#ef4444] to-[#f97316]"></div>
        <div className="glass-card-header text-[#ef4444] flex items-center justify-between">
          <span>[ ALERTS ] CRITICAL_FAULTS</span>
          <AlertTriangle size={14} className="text-[#ef4444]" />
        </div>
        <div className="pl-2">
          <GangguanTable />
        </div>
      </div>
    </>
  );
}
