'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Zap, TrendingUp, Shield, MapPin, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
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
    <div className="main-content max-w-7xl mx-auto">
      {/* Dashboard Hero */}
      <div className="dashboard-hero mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="mb-2">PLN JARKOM Dashboard</h1>
            <p>Sistem Manajemen Jaringan & Perencanaan Distribusi Tenaga Listrik</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-text-tertiary">Live Update</div>
            <div className="font-mono text-base text-color-info mt-1">{mounted && <LiveClock />}</div>
          </div>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="stat-card healthy">
          <div className="stat-label flex items-center gap-2">
            <CheckCircle2 size={14} />
            Operational
          </div>
          <div className="stat-value">847</div>
          <div className="stat-change">+12 this week</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label flex items-center gap-2">
            <AlertTriangle size={14} />
            Maintenance Due
          </div>
          <div className="stat-value">23</div>
          <div className="stat-change">5 urgent</div>
        </div>
        <div className="stat-card critical">
          <div className="stat-label flex items-center gap-2">
            <Shield size={14} />
            Critical Issues
          </div>
          <div className="stat-value">3</div>
          <div className="stat-change">All assigned</div>
        </div>
        <div className="stat-card info">
          <div className="stat-label flex items-center gap-2">
            <MapPin size={14} />
            Network Coverage
          </div>
          <div className="stat-value">94%</div>
          <div className="stat-change">6 villages pending</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 glass-card">
          <div className="glass-card-header">
            <Zap size={14} />
            Beban Sistem 24 Jam
          </div>
          <div className="h-80"><BebanChart /></div>
        </div>
        <div className="glass-card">
          <div className="glass-card-header">
            <AlertTriangle size={14} />
            Penyebab Gangguan
          </div>
          <div className="h-80"><GangguanChart /></div>
        </div>
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="glass-card">
          <div className="glass-card-header">
            <TrendingUp size={14} />
            Keandalan Sistem
          </div>
          <div className="h-72"><KeandalanChart /></div>
        </div>
        <div className="glass-card">
          <div className="glass-card-header">
            <CheckCircle2 size={14} />
            Verifikasi Lapangan
          </div>
          <div className="p-6">
            <VerificationStats />
          </div>
        </div>
      </div>

      {/* Asset Summary Table */}
      <div className="glass-card overflow-hidden mb-8">
        <div className="glass-card-header">
          <Shield size={14} />
          Asset Summary
        </div>
        <div className="overflow-x-auto">
          <AssetSummaryTable />
        </div>
      </div>

      {/* Critical Alerts */}
      <div className="glass-card overflow-hidden border-l-4 border-l-[var(--status-critical)]">
        <div className="glass-card-header text-color-critical">
          <AlertTriangle size={14} />
          Gangguan Kritis
        </div>
        <div className="overflow-x-auto">
          <GangguanTable />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-8 border-t border-glass-border">
        <Link href="/analisis" className="glass-card hover:glass-card-elevated group">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp size={18} className="text-color-info group-hover:translate-y-[-2px] transition-transform" />
            <h3 className="font-semibold">Analisis</h3>
          </div>
          <p className="text-xs text-text-secondary">Cable & pole analysis</p>
        </Link>
        <Link href="/diagram" className="glass-card hover:glass-card-elevated group">
          <div className="flex items-center gap-3 mb-2">
            <Shield size={18} className="text-color-warning group-hover:translate-y-[-2px] transition-transform" />
            <h3 className="font-semibold">SLD Generator</h3>
          </div>
          <p className="text-xs text-text-secondary">Single line diagrams</p>
        </Link>
        <Link href="/verifikasi" className="glass-card hover:glass-card-elevated group">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 size={18} className="text-color-success group-hover:translate-y-[-2px] transition-transform" />
            <h3 className="font-semibold">Verifikasi</h3>
          </div>
          <p className="text-xs text-text-secondary">Field verification</p>
        </Link>
        <Link href="/peta" className="glass-card hover:glass-card-elevated group">
          <div className="flex items-center gap-3 mb-2">
            <MapPin size={18} className="text-color-info group-hover:translate-y-[-2px] transition-transform" />
            <h3 className="font-semibold">Network Map</h3>
          </div>
          <p className="text-xs text-text-secondary">Interactive topology</p>
        </Link>
      </div>
    </div>
  );
}
