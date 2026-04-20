'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, Search, Download, Filter, MapPin, ArrowRight } from 'lucide-react';

const CABLE_TYPES = [
  { name: 'AAAC', description: 'All Aluminum Alloy Conductor', status: 'existing', color: '#3fb950' },
  { name: 'AAAC-S', description: 'AAAC dengan tensile strength lebih tinggi', status: 'recommended', color: '#58a6ff' },
  { name: 'ACSR', description: 'Aluminum Conductor Steel Reinforced', status: 'backup', color: '#d29922' },
];

// Demo JTM data dengan cable types
const DEMO_JTM_DATA = [
  { id: 1, penyulang: 'MALI', segment: 'Kampung Alor', cableType: 'AAAC', length: 5.2, voltage: '20 kV', condition: 'good', year: 2015 },
  { id: 2, penyulang: 'MALI', segment: 'Kolbano', cableType: 'AAAC', length: 3.8, voltage: '20 kV', condition: 'fair', year: 2012 },
  { id: 3, penyulang: 'MORU', segment: 'Takahata', cableType: 'AAAC-S', length: 4.5, voltage: '20 kV', condition: 'excellent', year: 2018 },
  { id: 4, penyulang: 'BATUNIRWALA', segment: 'Pulau Pura', cableType: 'AAAC', length: 6.1, voltage: '20 kV', condition: 'poor', year: 2010 },
  { id: 5, penyulang: 'BARANUSA', segment: 'Kampung Baranusa', cableType: 'ACSR', length: 2.3, voltage: '20 kV', condition: 'good', year: 2014 },
];

export default function AnalisisiKabelPage() {
  const [search, setSearch] = useState('');
  const [selectedCableType, setSelectedCableType] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('penyulang');

  const filtered = useMemo(() => {
    let result = DEMO_JTM_DATA;
    
    if (search) {
      result = result.filter(item => 
        item.penyulang.toLowerCase().includes(search.toLowerCase()) ||
        item.segment.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (selectedCableType) {
      result = result.filter(item => item.cableType === selectedCableType);
    }
    
    return result.sort((a, b) => {
      if (sortBy === 'penyulang') return a.penyulang.localeCompare(b.penyulang);
      if (sortBy === 'length') return b.length - a.length;
      return 0;
    });
  }, [search, selectedCableType, sortBy]);

  const stats = useMemo(() => ({
    totalSegments: DEMO_JTM_DATA.length,
    aaacCount: DEMO_JTM_DATA.filter(d => d.cableType === 'AAAC').length,
    upgradeNeeded: DEMO_JTM_DATA.filter(d => d.cableType === 'AAAC' && (d.condition === 'fair' || d.condition === 'poor')).length,
  }), []);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-1400px mx-auto px-20 py-12">
          <Link href="/" className="inline-flex items-center gap-2 text-secondary mb-4 hover:text-primary transition">
            <ChevronLeft size={16} /> Dashboard
          </Link>
          <h1 className="text-3xl font-bold mb-2">Analisis Tipe Kabel JTM</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Identifikasi lokasi kabel AAAC untuk upgrade ke AAAC-S</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-1400px mx-auto px-20 py-8">
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Segmen JTM', value: stats.totalSegments, color: 'var(--accent-indigo)' },
            { label: 'Kabel AAAC', value: stats.aaacCount, color: 'var(--color-warning)' },
            { label: 'Perlu Upgrade', value: stats.upgradeNeeded, color: 'var(--color-danger)' },
          ].map((card, i) => (
            <div key={i} className="glass-card text-center p-6">
              <div style={{ color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>
                {card.label}
              </div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: card.color }}>
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
              <label className="text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Tipe Kabel</label>
              <select value={selectedCableType || ''} onChange={(e) => setSelectedCableType(e.target.value || null)} className="mt-2">
                <option value="">Semua</option>
                {CABLE_TYPES.map(c => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Sort</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="mt-2">
                <option value="penyulang">Penyulang</option>
                <option value="length">Panjang (Terbesar)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Cable Type Reference */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {CABLE_TYPES.map(cable => (
            <div key={cable.name} className="glass-card p-4" style={{ borderLeft: `3px solid ${cable.color}` }}>
              <div className="font-bold mb-1">{cable.name}</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{cable.description}</div>
              <div className="text-xs mt-2 badge" style={{ background: `${cable.color}20`, color: cable.color }}>
                {cable.status.toUpperCase()}
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
                <th>Tipe Kabel</th>
                <th>Panjang (KM)</th>
                <th>Tegangan</th>
                <th>Kondisi</th>
                <th>Tahun</th>
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
                      background: CABLE_TYPES.find(c => c.name === item.cableType)?.color + '20',
                      color: CABLE_TYPES.find(c => c.name === item.cableType)?.color,
                    }}>
                      {item.cableType}
                    </span>
                  </td>
                  <td>{item.length.toFixed(1)}</td>
                  <td>{item.voltage}</td>
                  <td>
                    <span className="badge" style={{
                      background: item.condition === 'excellent' ? '#3fb95020' : item.condition === 'good' ? '#58a6ff20' : item.condition === 'fair' ? '#d2992220' : '#f8514920',
                      color: item.condition === 'excellent' ? '#3fb950' : item.condition === 'good' ? '#58a6ff' : item.condition === 'fair' ? '#d29922' : '#f85149',
                    }}>
                      {item.condition}
                    </span>
                  </td>
                  <td>{item.year}</td>
                  <td>
                    {item.cableType === 'AAAC' && (
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
          <h3 className="font-bold mb-4">Rekomendasi Upgrade</h3>
          <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <li>• Prioritas: Upgrade {stats.upgradeNeeded} segmen AAAC dengan kondisi fair/poor ke AAAC-S</li>
            <li>• Total panjang: {DEMO_JTM_DATA.filter(d => d.cableType === 'AAAC').reduce((a, b) => a + b.length, 0).toFixed(1)} KM</li>
            <li>• Estimasi biaya: Diperlukan survey lebih lanjut</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
