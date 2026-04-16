'use client';

import React, { useState, useMemo } from 'react';
import { useAssetStore, ProteksiItem } from '@/store/assetStore';
import { ChevronLeft, Search, Filter, Download, Shield, MapPin, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const jenisColors: Record<string, { bg: string; text: string; border: string }> = {
  CO: { bg: 'rgba(239,68,68,0.1)', text: '#ef4444', border: 'rgba(239,68,68,0.25)' },
  LBS: { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b', border: 'rgba(245,158,11,0.25)' },
  RECLOSER: { bg: 'rgba(168,85,247,0.1)', text: '#a855f7', border: 'rgba(168,85,247,0.25)' },
  FCO: { bg: 'rgba(6,182,212,0.1)', text: '#06b6d4', border: 'rgba(6,182,212,0.25)' },
  INTERKONEKSI: { bg: 'rgba(34,197,94,0.1)', text: '#22c55e', border: 'rgba(34,197,94,0.25)' },
  UJUNG_TM: { bg: 'rgba(99,102,241,0.1)', text: '#6366f1', border: 'rgba(99,102,241,0.25)' },
  LAINNYA: { bg: 'rgba(148,163,184,0.1)', text: '#94a3b8', border: 'rgba(148,163,184,0.25)' },
};

function JenisBadge({ jenis }: { jenis: string }) {
  const colors = jenisColors[jenis] || jenisColors.LAINNYA;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '3px 10px',
      borderRadius: '6px',
      fontSize: '11px',
      fontWeight: 700,
      letterSpacing: '0.5px',
      backgroundColor: colors.bg,
      color: colors.text,
      border: `1px solid ${colors.border}`,
    }}>
      <Shield size={10} />
      {jenis}
    </span>
  );
}

export default function ProteksiDataPage() {
  const { proteksi } = useAssetStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJenis, setFilterJenis] = useState('all');

  const jenisOptions = useMemo(() => {
    const set = new Set<string>();
    proteksi.forEach(p => { if (p.jenis) set.add(p.jenis); });
    return Array.from(set).sort();
  }, [proteksi]);

  const filteredData = useMemo(() => {
    return proteksi.filter(p => {
      const matchesSearch = (p.nama || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesJenis = filterJenis === 'all' || p.jenis === filterJenis;
      return matchesSearch && matchesJenis;
    });
  }, [proteksi, searchTerm, filterJenis]);

  // Summary stats
  const stats = useMemo(() => {
    const byJenis: Record<string, number> = {};
    proteksi.forEach(p => {
      byJenis[p.jenis] = (byJenis[p.jenis] || 0) + 1;
    });
    return byJenis;
  }, [proteksi]);

  const handleExport = () => {
    const headers = ['No', 'Nama', 'Jenis', 'Penyulang', 'Pangkal (Lat)', 'Pangkal (Lng)', 'Ujung (Lat)', 'Ujung (Lng)', 'Status'];
    const rows = filteredData.map((p, i) => [
      i + 1,
      p.nama,
      p.jenis,
      p.penyulang || '-',
      p.pangkal_lat,
      p.pangkal_lng,
      p.ujung_lat,
      p.ujung_lng,
      p.status || 'aktif',
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'data_proteksi.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#020617', color: '#cbd5e1', padding: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', gap: '16px' }}>
        <div>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa', textDecoration: 'none', marginBottom: '8px', fontSize: '14px', transition: 'color 0.2s' }}>
            <ChevronLeft size={16} /> Kembali ke Dashboard
          </Link>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Shield size={28} style={{ color: '#ef4444' }} />
            Database Proteksi & Switchgear
          </h1>
          <p style={{ color: '#64748b', marginTop: '6px', fontSize: '14px' }}>
            Total Perangkat: <span style={{ color: '#f87171', fontWeight: 700 }}>{proteksi.length} Unit</span>
            <span style={{ margin: '0 8px' }}>|</span>
            Sumber: <span style={{ color: '#a78bfa', fontWeight: 600 }}>GDB ArcGIS - Cek JTM Kalabahi</span>
          </p>
        </div>

        <button onClick={handleExport} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px',
          padding: '10px 18px', color: '#cbd5e1', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
          transition: 'all 0.2s'
        }}>
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {Object.entries(stats).map(([jenis, count]) => {
          const colors = jenisColors[jenis] || jenisColors.LAINNYA;
          return (
            <div key={jenis} style={{
              background: `linear-gradient(135deg, ${colors.bg}, transparent)`,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: colors.text }}>{count}</div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>{jenis.replace('_', ' ')}</div>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} size={18} />
          <input
            type="text"
            placeholder="Cari nama CO, LBS, atau Interkoneksi..."
            style={{
              width: '100%', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px',
              padding: '12px 16px 12px 42px', outline: 'none', color: '#e2e8f0', fontSize: '14px',
              transition: 'border-color 0.2s',
            }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ position: 'relative' }}>
          <Filter style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} size={18} />
          <select
            style={{
              width: '100%', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px',
              padding: '12px 16px 12px 42px', outline: 'none', color: '#e2e8f0', fontSize: '14px',
              appearance: 'none', cursor: 'pointer',
            }}
            value={filterJenis}
            onChange={(e) => setFilterJenis(e.target.value)}
          >
            <option value="all">Semua Jenis</option>
            {jenisOptions.map(j => <option key={j} value={j}>{j}</option>)}
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div style={{
        backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px',
        overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
      }}>
        <div style={{ overflowX: 'auto', maxHeight: '70vh' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1e293b', position: 'sticky', top: 0, backgroundColor: '#0f172a', zIndex: 10 }}>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '1px' }}>No</th>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '1px' }}>Nama Perangkat</th>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>Jenis</th>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>Penyulang</th>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                    <MapPin size={10} /> Pangkal
                  </div>
                </th>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                    <MapPin size={10} /> Ujung
                  </div>
                </th>
                <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? filteredData.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: '1px solid rgba(30,41,59,0.5)', transition: 'background 0.15s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.03)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '11px', color: '#475569' }}>{i + 1}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: (jenisColors[p.jenis] || jenisColors.LAINNYA).bg,
                        color: (jenisColors[p.jenis] || jenisColors.LAINNYA).text,
                      }}>
                        <Shield size={14} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#fff', fontSize: '13px', letterSpacing: '-0.2px' }}>{p.nama}</div>
                        {p.deskripsi && <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>{p.deskripsi}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <JenisBadge jenis={p.jenis} />
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 700, color: '#f59e0b',
                      backgroundColor: 'rgba(245,158,11,0.1)', padding: '3px 10px',
                      borderRadius: '6px', border: '1px solid rgba(245,158,11,0.2)'
                    }}>{p.penyulang || '-'}</span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#94a3b8' }}>
                      {p.pangkal_lat?.toFixed(6)}, {p.pangkal_lng?.toFixed(6)}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                      <ArrowRight size={10} style={{ color: '#ef4444' }} />
                      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#94a3b8' }}>
                        {p.ujung_lat?.toFixed(6)}, {p.ujung_lng?.toFixed(6)}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span style={{
                      fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                      padding: '3px 10px', borderRadius: '20px',
                      backgroundColor: p.status === 'aktif' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                      color: p.status === 'aktif' ? '#22c55e' : '#ef4444',
                      border: `1px solid ${p.status === 'aktif' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                    }}>{p.status || 'aktif'}</span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} style={{ padding: '80px 24px', textAlign: 'center', color: '#475569', fontStyle: 'italic' }}>
                    {proteksi.length === 0
                      ? 'Memuat data proteksi dari database...'
                      : 'Tidak ada data yang sesuai filter.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
