'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, Search, MapPin, AlertCircle } from 'lucide-react';

// Demo village data
const DEMO_VILLAGES = [
  { id: 1, name: 'Kampung Alor', district: 'Alor Tengah', population: 3500, coverage: 'full', penyulang: 'MALI', lastUpdate: '2024-01-15' },
  { id: 2, name: 'Kolbano', district: 'Alor Tengah', population: 2100, coverage: 'partial', penyulang: 'MALI', lastUpdate: '2024-01-10' },
  { id: 3, name: 'Takahata', district: 'Alor Timur', population: 1800, coverage: 'none', penyulang: 'None', lastUpdate: '2024-01-05' },
  { id: 4, name: 'Pulau Pura', district: 'Alor Barat', population: 980, coverage: 'full', penyulang: 'BATUNIRWALA', lastUpdate: '2024-01-12' },
  { id: 5, name: 'Kampung Baranusa', district: 'Alor Selatan', population: 2300, coverage: 'partial', penyulang: 'BARANUSA', lastUpdate: '2024-01-08' },
  { id: 6, name: 'Pantar Timur', district: 'Pantar', population: 1500, coverage: 'none', penyulang: 'None', lastUpdate: '2023-12-20' },
  { id: 7, name: 'Bukit Baranusa', district: 'Alor Selatan', population: 750, coverage: 'partial', penyulang: 'BARANUSA', lastUpdate: '2024-01-01' },
  { id: 8, name: 'Tanjung Panduan', district: 'Pantar', population: 1200, coverage: 'none', penyulang: 'None', lastUpdate: '2023-12-15' },
];

export default function CoverageMappingPage() {
  const [search, setSearch] = useState('');
  const [selectedCoverage, setSelectedCoverage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = DEMO_VILLAGES;
    
    if (search) {
      result = result.filter(item => 
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.district.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (selectedCoverage) {
      result = result.filter(item => item.coverage === selectedCoverage);
    }
    
    return result;
  }, [search, selectedCoverage]);

  const stats = useMemo(() => ({
    totalVillages: DEMO_VILLAGES.length,
    fullCoverage: DEMO_VILLAGES.filter(d => d.coverage === 'full').length,
    partialCoverage: DEMO_VILLAGES.filter(d => d.coverage === 'partial').length,
    noCoverage: DEMO_VILLAGES.filter(d => d.coverage === 'none').length,
    population: DEMO_VILLAGES.reduce((a, b) => a + b.population, 0),
  }), []);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-1400px mx-auto px-20 py-12">
          <Link href="/" className="inline-flex items-center gap-2 text-secondary mb-4 hover:text-primary transition">
            <ChevronLeft size={16} /> Dashboard
          </Link>
          <h1 className="text-3xl font-bold mb-2">Coverage Mapping & Gap Analysis</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Identifikasi desa tanpa jaringan listrik untuk perencanaan ekspansi</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-1400px mx-auto px-20 py-8">
        <div className="grid grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total Desa', value: stats.totalVillages, color: 'var(--accent-indigo)', icon: '🏘️' },
            { label: 'Cakupan Penuh', value: stats.fullCoverage, color: 'var(--color-success)', icon: '✓' },
            { label: 'Cakupan Partial', value: stats.partialCoverage, color: 'var(--color-warning)', icon: '⚠' },
            { label: 'Belum Terkoneksi', value: stats.noCoverage, color: 'var(--color-danger)', icon: '✕' },
            { label: 'Total Populasi', value: stats.population.toLocaleString(), color: 'var(--accent-cyan)', icon: '👥' },
          ].map((card, i) => (
            <div key={i} className="glass-card text-center p-6">
              <div style={{ fontSize: '20px', marginBottom: '8px' }}>{card.icon}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>
                {card.label}
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: card.color }}>
                {card.value}
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="glass-card p-6 mb-6">
          <div className="flex gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-64">
              <label className="text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Cari Desa / Distrik</label>
              <div className="relative mt-2">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
                <input
                  type="text"
                  placeholder="Cari..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Status Cakupan</label>
              <select value={selectedCoverage || ''} onChange={(e) => setSelectedCoverage(e.target.value || null)} className="mt-2">
                <option value="">Semua</option>
                <option value="full">Penuh</option>
                <option value="partial">Partial</option>
                <option value="none">Tidak Ada</option>
              </select>
            </div>
          </div>
        </div>

        {/* Priority Action */}
        {stats.noCoverage > 0 && (
          <div className="glass-card p-6 mb-6 border-l-4" style={{ borderLeftColor: 'var(--color-danger)' }}>
            <div className="flex items-start gap-4">
              <AlertCircle size={24} style={{ color: 'var(--color-danger)' }} />
              <div>
                <h3 className="font-bold mb-2">Prioritas Ekspansi</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  {stats.noCoverage} desa belum memiliki akses listrik dengan total populasi {DEMO_VILLAGES.filter(d => d.coverage === 'none').reduce((a, b) => a + b.population, 0).toLocaleString()} orang.
                </p>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Rekomendasi: Prioritaskan perencanaan ekspansi ke desa-desa berikut berdasarkan populasi dan jarak terdekat ke jaringan eksisting.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Results Table */}
        <div className="glass-card overflow-hidden">
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Desa</th>
                <th>Distrik</th>
                <th>Populasi</th>
                <th>Status Cakupan</th>
                <th>Penyulang Terdekat</th>
                <th>Update Terakhir</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map((item, i) => (
                <tr key={item.id} style={{
                  background: item.coverage === 'none' ? 'rgba(248, 81, 73, 0.05)' : item.coverage === 'partial' ? 'rgba(210, 153, 34, 0.05)' : undefined
                }}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 'bold' }}>{item.name}</td>
                  <td>{item.district}</td>
                  <td>{item.population.toLocaleString()}</td>
                  <td>
                    <span className={`badge badge-${item.coverage === 'full' ? 'success' : item.coverage === 'partial' ? 'warning' : 'danger'}`}>
                      {item.coverage === 'full' ? 'Penuh' : item.coverage === 'partial' ? 'Partial' : 'Tidak Ada'}
                    </span>
                  </td>
                  <td>{item.penyulang}</td>
                  <td style={{ fontSize: '12px' }}>{item.lastUpdate}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                    Tidak ada data yang cocok
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Gap Analysis Summary */}
        <div className="mt-8 grid grid-cols-2 gap-8">
          <div className="glass-card p-6">
            <h3 className="font-bold mb-4">Analisis Gap Cakupan</h3>
            <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <li>• Desa tanpa akses: {stats.noCoverage}</li>
              <li>• Populasi belum terlayani: {DEMO_VILLAGES.filter(d => d.coverage === 'none').reduce((a, b) => a + b.population, 0).toLocaleString()} orang</li>
              <li>• Cakupan geografis: {Math.round((stats.fullCoverage / stats.totalVillages) * 100)}%</li>
            </ul>
          </div>

          <div className="glass-card p-6">
            <h3 className="font-bold mb-4">Rekomendasi Aksi</h3>
            <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <li>• Lakukan survey ke {stats.noCoverage} desa prioritas</li>
              <li>• Hitung jarak terdekat ke jaringan eksisting</li>
              <li>• Buat business case untuk ekspansi</li>
              <li>• Koordinasi dengan stakeholder lokal</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
