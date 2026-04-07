import { DashboardClient } from '@/components/dashboard/DashboardClient';

export default function DashboardPage() {
  return (
    <>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title flex items-center gap-3">
            Analisa Asset &amp; Switchgear
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

      <DashboardClient />
    </>
  );
}
