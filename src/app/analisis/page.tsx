'use client';
import Link from 'next/link';
import { ChevronLeft, Cable, MapPin, Map, Camera, TrendingUp } from 'lucide-react';

const ANALYSIS_TOOLS = [
  {
    title: 'Analisis Tipe Kabel',
    description: 'Identifikasi lokasi kabel AAAC dan rencanakan upgrade ke AAAC-S',
    href: '/analisis/kabel',
    icon: Cable,
    color: 'var(--color-warning)',
    stat: '234 segmen',
  },
  {
    title: 'Analisis Ketinggian Tiang',
    description: 'Temukan tiang 9m/11m untuk perencanaan upgrade infrastruktur',
    href: '/analisis/tiang',
    icon: MapPin,
    color: 'var(--color-danger)',
    stat: '156 tiang',
  },
  {
    title: 'Coverage Mapping',
    description: 'Identifikasi desa tanpa jaringan listrik dan perencanaan ekspansi',
    href: '/analisis/coverage',
    icon: Map,
    color: 'var(--accent-indigo)',
    stat: '8 desa',
  },
  {
    title: 'Survey & Inspeksi',
    description: 'Tools untuk survey lapangan dengan geotagging dan dokumentasi foto',
    href: '/analisis/survey',
    icon: Camera,
    color: 'var(--color-success)',
    stat: 'Ready',
  },
  {
    title: 'Planning Reports',
    description: 'Generate laporan perencanaan dengan rekomendasi dan estimasi biaya',
    href: '/analisis/reports',
    icon: TrendingUp,
    color: 'var(--accent-cyan)',
    stat: 'Ready',
  },
];

export default function AnalisisPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-1400px mx-auto px-20 py-12">
          <Link href="/" className="inline-flex items-center gap-2 text-secondary mb-4 hover:text-primary transition">
            <ChevronLeft size={16} /> Dashboard
          </Link>
          <h1 className="text-3xl font-bold mb-2">Modul Analisis & Perencanaan</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Tools komprehensif untuk perencanaan jaringan distribusi dan perencanaan investasi infrastruktur</p>
        </div>
      </div>

      {/* Analysis Tools Grid */}
      <div className="max-w-1400px mx-auto px-20 py-12">
        <div className="grid grid-cols-3 gap-6">
          {ANALYSIS_TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className="glass-card p-6 hover:bg-hover transition group cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div style={{
                    background: `${tool.color}20`,
                    color: tool.color,
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                  }}>
                    <Icon size={24} />
                  </div>
                  <div className="badge" style={{ background: `${tool.color}20`, color: tool.color }}>
                    {tool.stat}
                  </div>
                </div>
                <h3 className="font-bold text-lg mb-2 group-hover:text-accent-indigo transition">{tool.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  {tool.description}
                </p>
              </Link>
            );
          })}
        </div>

        {/* Features Overview */}
        <div className="mt-12 grid grid-cols-2 gap-6">
          <div className="glass-card p-8">
            <h3 className="font-bold text-lg mb-4">Fitur Utama</h3>
            <ul className="space-y-3" style={{ color: 'var(--text-secondary)' }}>
              <li className="flex gap-3 items-start">
                <span style={{ color: 'var(--color-success)', marginTop: '2px' }}>✓</span>
                <span>Filter multi-kriteria berdasarkan tipe kabel, tinggi tiang, penyulang</span>
              </li>
              <li className="flex gap-3 items-start">
                <span style={{ color: 'var(--color-success)', marginTop: '2px' }}>✓</span>
                <span>Visualisasi peta dengan geotagging dan koordinat GPS presisi</span>
              </li>
              <li className="flex gap-3 items-start">
                <span style={{ color: 'var(--color-success)', marginTop: '2px' }}>✓</span>
                <span>Generate laporan dengan rekomendasi upgrade dan estimasi biaya</span>
              </li>
              <li className="flex gap-3 items-start">
                <span style={{ color: 'var(--color-success)', marginTop: '2px' }}>✓</span>
                <span>Export data untuk presentasi ke stakeholder dan manajemen</span>
              </li>
            </ul>
          </div>

          <div className="glass-card p-8">
            <h3 className="font-bold text-lg mb-4">Use Cases</h3>
            <ul className="space-y-3" style={{ color: 'var(--text-secondary)' }}>
              <li className="flex gap-3 items-start">
                <span style={{ color: 'var(--accent-indigo)', marginTop: '2px' }}>→</span>
                <span>Perencanaan upgrade kabel AAAC ke AAAC-S di penyulang prioritas</span>
              </li>
              <li className="flex gap-3 items-start">
                <span style={{ color: 'var(--accent-indigo)', marginTop: '2px' }}>→</span>
                <span>Identifikasi tiang 9m/11m untuk penggantian sesuai standar PLN</span>
              </li>
              <li className="flex gap-3 items-start">
                <span style={{ color: 'var(--accent-indigo)', marginTop: '2px' }}>→</span>
                <span>Mapping desa tanpa listrik untuk ekspansi jaringan</span>
              </li>
              <li className="flex gap-3 items-start">
                <span style={{ color: 'var(--accent-indigo)', marginTop: '2px' }}>→</span>
                <span>Survey lapangan dengan dokumentasi dan geotagging foto</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Getting Started */}
        <div className="mt-12 glass-card p-8 bg-opacity-50" style={{ background: 'rgba(88, 166, 255, 0.05)', border: '1px solid rgba(88, 166, 255, 0.2)' }}>
          <h3 className="font-bold text-lg mb-4">Cara Menggunakan</h3>
          <div className="grid grid-cols-4 gap-6 text-center">
            {[
              { step: '1', title: 'Pilih Analisis', desc: 'Pilih jenis analisis sesuai kebutuhan perencanaan' },
              { step: '2', title: 'Set Filter', desc: 'Filter data berdasarkan penyulang, tipe aset, lokasi' },
              { step: '3', title: 'Review Data', desc: 'Lihat hasil dengan visualisasi dan statistik' },
              { step: '4', title: 'Export Report', desc: 'Download laporan untuk presentasi stakeholder' },
            ].map((item, i) => (
              <div key={i}>
                <div style={{
                  background: 'var(--accent-indigo)',
                  color: 'white',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '18px',
                  margin: '0 auto 12px',
                }}>
                  {item.step}
                </div>
                <div className="font-bold mb-2">{item.title}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
