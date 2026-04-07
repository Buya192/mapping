'use client';

import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { BebanChart } from '@/components/dashboard/BebanChart';
import { GangguanChart } from '@/components/dashboard/GangguanChart';
import { KeandalanChart } from '@/components/dashboard/KeandalanChart';
import { GangguanTable } from '@/components/dashboard/GangguanTable';
import { AssetSummaryTable } from '@/components/dashboard/AssetSummaryTable';

export function DashboardClient() {
  return (
    <>
      <SummaryCards />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <a
          href="/argis/peta"
          className="block bg-gradient-to-r from-indigo-900/40 to-slate-800/80 border border-indigo-500/30 rounded-xl p-5 hover:border-indigo-500/60 transition-colors shadow-lg shadow-indigo-500/10"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-lg">Peta Interaktif Argis</h3>
              <p className="text-sm text-slate-400">Visualisasi GeoJSON dari file ZIP pada peta Leaflet</p>
            </div>
          </div>
        </a>

        <a
          href="/argis/data"
          className="block bg-gradient-to-r from-emerald-900/40 to-slate-800/80 border border-emerald-500/30 rounded-xl p-5 hover:border-emerald-500/60 transition-colors shadow-lg shadow-emerald-500/10"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18M3 6h18M3 18h18" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-lg">Tabel Data GeoJSON</h3>
              <p className="text-sm text-slate-400">Baca, filter, dan ekspor atribut fitur spasial</p>
            </div>
          </div>
        </a>

        <a
          href="/argis/statistik"
          className="block bg-gradient-to-r from-cyan-900/40 to-slate-800/80 border border-cyan-500/30 rounded-xl p-5 hover:border-cyan-500/60 transition-colors shadow-lg shadow-cyan-500/10"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-lg">Statistik & Grafik Data</h3>
              <p className="text-sm text-slate-400">Analisis distribusi dan ringkasan atribut GeoJSON</p>
            </div>
          </div>
        </a>

        <a
          href="/argis/upload"
          className="block bg-gradient-to-r from-amber-900/40 to-slate-800/80 border border-amber-500/30 rounded-xl p-5 hover:border-amber-500/60 transition-colors shadow-lg shadow-amber-500/10"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-lg">Upload File ZIP</h3>
              <p className="text-sm text-slate-400">Upload file GeoJSON/GeoPackage ZIP baru</p>
            </div>
          </div>
        </a>
      </div>

      <div className="charts-grid">
        <div className="chart-card full-width">
          <div className="card-title">Beban Penyulang (24 Jam)</div>
          <BebanChart />
        </div>
        <div className="chart-card">
          <div className="card-title">Gangguan per Penyebab</div>
          <GangguanChart />
        </div>
        <div className="chart-card">
          <div className="card-title">Trend Gangguan Bulanan</div>
          <KeandalanChart />
        </div>
      </div>

      <div className="chart-card" style={{ marginBottom: 24 }}>
        <div className="card-title">Ringkasan Asset Terkini</div>
        <div className="overflow-x-auto">
          <AssetSummaryTable />
        </div>
      </div>

      <div className="chart-card" style={{ marginBottom: 24 }}>
        <div className="card-title">Gangguan Terkini</div>
        <GangguanTable />
      </div>
    </>
  );
}
