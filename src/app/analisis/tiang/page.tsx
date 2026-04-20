'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, Search, Download, MapPin, ArrowRight } from 'lucide-react';

const POLE_TYPES = [
  { height: '9', status: 'upgrade_needed', description: 'Perlu upgrade ketinggan', count: 234 },
  { height: '11', status: 'upgrade_needed', description: 'Perlu upgrade ketinggan', count: 156 },
  { height: '12', status: 'standard', description: 'Standar PLN', count: 891 },
  { height: '14', status: 'standard', description: 'Standar PLN', count: 623 },
];

// Demo pole data
const DEMO_POLE_DATA = [
  { id: 1, penyulang: 'MALI', segment: 'Kampung Alor', height: 9, material: 'Concrete', year: 2008, condition: 'good', gps: '-8.24386, 124.53221' },
  { id: 2, penyulang: 'MALI', segment: 'Kolbano', height: 9, material: 'Concrete', year: 2010, condition: 'fair', gps: '-8.21874, 124.53728' },
  { id: 3, penyulang: 'MORU', segment: 'Takahata', height: 11, material: 'Concrete', year: 2012, condition: 'good', gps: '-8.29106, 125.12378' },
  { id: 4, penyulang: 'BATUNIRWALA', segment: 'Pulau Pura', height: 12, material: 'Concrete', year: 2015, condition: 'excellent', gps: '-8.37279, 124.24088' },
  { id: 5, penyulang: 'BARANUSA', segment: 'Kampung Baranusa', height: 11, material: 'Concrete', year: 2013, condition: 'good', gps: '-8.27739, 124.35243' },
  { id: 6, penyulang: 'KABIR', segment: 'Pantar Timur', height: 9, material: 'Concrete', year: 2009, condition: 'poor', gps: '-8.34124, 124.66587' },
];

export default function AnalisisiTiangPage() {
  const [search, setSearch] = useState('');
  const [selectedHeight, setSelectedHeight] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState('penyulang');

  const filtered = useMemo(() => {
    let result = DEMO_POLE_DATA;
    
    if (search) {
      result = result.filter(item => 
        item.penyulang.toLowerCase().includes(search.toLowerCase()) ||
        item.segment.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (selectedHeight) {
      result = result.filter(item => item.height === selectedHeight);
    }
    
    return result.sort((a, b) => {
      if (sortBy === 'penyulang') return a.penyulang.localeCompare(b.penyulang);
      if (sortBy === 'height') return a.height - b.height;
      return 0;
    });
  }, [search, selectedHeight, sortBy]);

  const stats = useMemo(() => ({
    totalPoles: DEMO_POLE_DATA.length,
    poles9m: DEMO_POLE_DATA.filter(d => d.height === 9).length,
    poles11m: DEMO_POLE_DATA.filter(d => d.height === 11).length,
    needsUpgrade: DEMO_POLE_DATA.filter(d => (d.height === 9 || d.height === 11) && (d.condition === 'fair' || d.condition === 'poor')).length,
  }), []);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-1400px mx-auto px-20 py-12">
          <Link href="/" className="inline-flex items-center gap-2 text-secondary mb-4 hover:text-primary transition">
            <ChevronLeft size={16} /> Dashboard
          </Link>
          <h1 className="text-3xl font-bold mb-2">Analisis Tiang Berdasarkan Ketinggian</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Identifikasi tiang 9m/11m untuk perencanaan upgrade infrastruktur</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-1400px mx-auto px-20 py-8">
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Tiang', value: stats.totalPoles, color: 'var(--accent-indigo)' },
            { label: 'Tiang 9 Meter', value: stats.poles9m, color: 'var(--color-danger)' },
            { label: 'Tiang 11 Meter', value: stats.poles11m, color: 'var(--color-warning)' },
            { label: 'Perlu Upgrade', value: stats.needsUpgrade, color: 'var(--color-danger)' },
          ].map((card, i) => (
            <div key={i} className="glass-card text-center p-6">
              <div style={{ color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>
                {card.label}
              </div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: card.color }}>
                {card.value}
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="glass-card p-6 mb-6">
          <div className="flex gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-64">
              <label className="text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Cari Penyulang / Segment</label>
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
              <label className="text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Ketinggian (Meter)</label>
              <select value={selectedHeight || ''} onChange={(e) => setSelectedHeight(e.target.value ? parseInt(e.target.value) : null)} className="mt-2">
                <option value="">Semua</option>
                {[9, 11, 12, 14].map(h => (
                  <option key={h} value={h}>{h}m</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Sort</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="mt-2">
                <option value="penyulang">Penyulang</option>
                <option value="height">Ketinggian</option>
              </select>
            </div>
          </div>
        </div>

        {/* Pole Type Reference */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {POLE_TYPES.map(pole => (
            <div key={pole.height} className="glass-card p-4">
              <div className="font-bold text-lg mb-1">{pole.height}m</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{pole.description}</div>
              <div className="text-xs mt-2">
                <span className={`badge ${pole.status === 'upgrade_needed' ? 'badge-danger' : 'badge-success'}`}>
                  {pole.count} unit
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Results Table */}
        <div className="glass-card overflow-hidden">
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>No</th>
                <th>Penyulang</th>
                <th>Segment</th>
                <th>Ketinggian (m)</th>
                <th>Material</th>
                <th>Kondisi</th>
                <th>Tahun</th>
                <th>Koordinat GPS</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => (
                <tr key={item.id}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 'bold' }}>{item.penyulang}</td>
                  <td>{item.segment}</td>
                  <td>
                    <span className="badge" style={{
                      background: (item.height === 9 || item.height === 11) ? 'var(--color-danger)20' : 'var(--color-success)20',
                      color: (item.height === 9 || item.height === 11) ? 'var(--color-danger)' : 'var(--color-success)',
                    }}>
                      {item.height}m
                    </span>
                  </td>
                  <td>{item.material}</td>
                  <td>
                    <span className="badge" style={{
                      background: item.condition === 'excellent' ? '#3fb95020' : item.condition === 'good' ? '#58a6ff20' : item.condition === 'fair' ? '#d2992220' : '#f8514920',
                      color: item.condition === 'excellent' ? '#3fb950' : item.condition === 'good' ? '#58a6ff' : item.condition === 'fair' ? '#d29922' : '#f85149',
                    }}>
                      {item.condition}
                    </span>
                  </td>
                  <td>{item.year}</td>
                  <td style={{ fontSize: '12px', fontFamily: 'monospace' }}>{item.gps}</td>
                  <td>
                    {(item.height === 9 || item.height === 11) && (
                      <button className="btn btn-sm btn-primary" style={{ background: 'var(--accent-indigo)', color: 'white', border: 'none' }}>
                        Upgrade <ArrowRight size={12} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="mt-8 glass-card p-6">
          <h3 className="font-bold mb-4">Rekomendasi Perencanaan</h3>
          <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <li>• Tiang 9m: Recommended upgrade ke 12m atau 14m untuk meningkatkan clearance</li>
            <li>• Tiang 11m: Pertimbangkan upgrade jika kondisi poor atau untuk high-load areas</li>
            <li>• Total tiang perlu upgrade: {stats.needsUpgrade} unit</li>
            <li>• Prioritas: Area dengan kondisi poor dan traffic tinggi (penyulang utama)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
