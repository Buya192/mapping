'use client';

import { Zap, AlertTriangle, Activity, Users } from 'lucide-react';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { BebanChart } from '@/components/dashboard/BebanChart';
import { GangguanChart } from '@/components/dashboard/GangguanChart';
import { KeandalanChart } from '@/components/dashboard/KeandalanChart';
import { GangguanTable } from '@/components/dashboard/GangguanTable';
import { AssetSummaryTable } from '@/components/dashboard/AssetSummaryTable';

export default function DashboardPage() {
  return (
    <>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title flex items-center gap-3">
            Analisa Asset & Switchgear
            <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full font-mono uppercase tracking-wider relative top-[-2px]">
              Argis Data Terintegrasi
            </span>
          </h1>
          <p className="page-subtitle">Sistem Informasi Geospasial PLN ULP Kalabahi</p>
        </div>
        <div className="live-indicator">
          <span className="live-dot"></span>
          LIVE
        </div>
      </div>

      <SummaryCards />
      
      {/* Quick Discovery Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <a href="/rekomendasi" className="block bg-gradient-to-r from-indigo-900/40 to-slate-800/80 border border-indigo-500/30 rounded-xl p-5 hover:border-indigo-500/60 transition-colors shadow-lg shadow-indigo-500/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-lg">Modul Rekomendasi Cerdas</h3>
              <p className="text-sm text-slate-400">Analisis geospasial AI untuk ekspansi & _blank spot_</p>
            </div>
          </div>
        </a>
        <a href="/diagram" className="block bg-gradient-to-r from-cyan-900/40 to-slate-800/80 border border-cyan-500/30 rounded-xl p-5 hover:border-cyan-500/60 transition-colors shadow-lg shadow-cyan-500/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-lg">Generator Gambar Otomatis</h3>
              <p className="text-sm text-slate-400">Cetak Single Line Diagram (SLD) instan otomatis</p>
            </div>
          </div>
        </a>
      </div>

      <div className="charts-grid">
        <div className="chart-card full-width">
          <div className="card-title">📊 Beban Penyulang (24 Jam)</div>
          <BebanChart />
        </div>
        <div className="chart-card">
          <div className="card-title">⚡ Gangguan per Penyebab</div>
          <GangguanChart />
        </div>
        <div className="chart-card">
          <div className="card-title">📈 Trend Gangguan Bulanan</div>
          <KeandalanChart />
        </div>
      </div>

      <div className="chart-card" style={{ marginBottom: 24 }}>
        <div className="card-title">📦 Ringkasan Asset Terkini</div>
        <div className="overflow-x-auto">
          <AssetSummaryTable />
        </div>
      </div>

      <div className="chart-card" style={{ marginBottom: 24 }}>
        <div className="card-title">🚨 Gangguan Terkini</div>
        <GangguanTable />
      </div>
    </>
  );
}
