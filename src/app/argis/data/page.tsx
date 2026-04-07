'use client';

import { useState, useEffect, useMemo } from 'react';
import type { LayerInfo, GeoJSONFeature } from '@/app/api/argis/route';
import {
  Search, Download, ChevronUp, ChevronDown,
  ChevronsUpDown, RefreshCw, AlertCircle, FileJson, Table2
} from 'lucide-react';

const PAGE_SIZE = 50;

export default function DataPage() {
  const [layers, setLayers] = useState<Omit<LayerInfo, 'data'>[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<string>('');
  const [layerData, setLayerData] = useState<LayerInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'table' | 'raw'>('table');

  // Load layer list
  useEffect(() => {
    setListLoading(true);
    fetch('/api/argis?action=list')
      .then(r => r.json())
      .then(d => {
        setLayers(d.geojsonLayers ?? []);
        if (d.geojsonLayers?.length > 0) {
          setSelectedLayer(d.geojsonLayers[0].name);
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setListLoading(false));
  }, []);

  // Load selected layer data
  useEffect(() => {
    if (!selectedLayer) return;
    setLoading(true);
    setError(null);
    setLayerData(null);
    setPage(1);
    setSearch('');
    setSortKey(null);
    fetch(`/api/argis?action=layer&layer=${encodeURIComponent(selectedLayer)}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setLayerData(d);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedLayer]);

  const features: GeoJSONFeature[] = layerData?.data?.features ?? [];
  const columns = layerData?.properties ?? [];

  const filtered = useMemo(() => {
    if (!search.trim()) return features;
    const q = search.toLowerCase();
    return features.filter(f =>
      Object.values(f.properties ?? {}).some(v =>
        String(v ?? '').toLowerCase().includes(q)
      )
    );
  }, [features, search]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a.properties?.[sortKey] ?? '';
      const bv = b.properties?.[sortKey] ?? '';
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sorted.slice(start, start + PAGE_SIZE);
  }, [sorted, page]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  }

  function downloadJSON() {
    if (!layerData) return;
    const blob = new Blob([JSON.stringify(layerData.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${layerData.name}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadCSV() {
    if (!layerData || columns.length === 0) return;
    const rows = [
      columns.join(','),
      ...features.map(f =>
        columns.map(col => {
          const val = f.properties?.[col] ?? '';
          return `"${String(val).replace(/"/g, '""')}"`;
        }).join(',')
      ),
    ];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${layerData.name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Data Tabel Argis</h1>
        <p className="page-subtitle">Baca dan inspeksi fitur GeoJSON dari file ZIP</p>
      </div>

      {/* Layer selector */}
      <div className="card" style={{ marginBottom: 16, padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <label style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap' }}>
            Pilih Layer:
          </label>
          {listLoading ? (
            <div style={{ color: '#64748b', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Memuat...
            </div>
          ) : (
            <select
              className="form-select"
              value={selectedLayer}
              onChange={e => setSelectedLayer(e.target.value)}
              style={{ maxWidth: 320, fontSize: 13, padding: '8px 12px' }}
            >
              {layers.map(l => (
                <option key={l.name} value={l.name}>
                  {l.name} ({l.featureCount} fitur)
                </option>
              ))}
            </select>
          )}

          {layerData && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button onClick={downloadCSV} className="btn btn-secondary" style={{ fontSize: 12, padding: '8px 14px', gap: 6 }}>
                <Download size={13} /> CSV
              </button>
              <button onClick={downloadJSON} className="btn btn-secondary" style={{ fontSize: 12, padding: '8px 14px', gap: 6 }}>
                <FileJson size={13} /> GeoJSON
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="card" style={{ borderColor: 'rgba(239,68,68,0.3)', marginBottom: 16, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10, color: '#ef4444' }}>
          <AlertCircle size={16} />
          <span style={{ fontSize: 13 }}>{error}</span>
        </div>
      )}

      {loading && (
        <div className="card" style={{ marginBottom: 16, padding: '24px', textAlign: 'center', color: '#64748b' }}>
          <RefreshCw size={24} style={{ margin: '0 auto 8px', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: 13 }}>Memuat data layer...</p>
        </div>
      )}

      {layerData && !loading && (
        <>
          {/* Layer info */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Layer', value: layerData.name },
              { label: 'Tipe Geometri', value: layerData.geometryType },
              { label: 'Total Fitur', value: layerData.featureCount.toLocaleString() },
              { label: 'Jumlah Kolom', value: columns.length.toString() },
            ].map(item => (
              <div key={item.label} className="card" style={{ padding: '12px 16px' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="tabs" style={{ marginBottom: 12 }}>
            <button className={`tab ${activeTab === 'table' ? 'active' : ''}`} onClick={() => setActiveTab('table')}>
              <Table2 size={13} style={{ display: 'inline', marginRight: 6 }} />Tabel
            </button>
            <button className={`tab ${activeTab === 'raw' ? 'active' : ''}`} onClick={() => setActiveTab('raw')}>
              <FileJson size={13} style={{ display: 'inline', marginRight: 6 }} />Raw JSON
            </button>
          </div>

          {activeTab === 'table' && (
            <>
              {/* Search & filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
                  <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input
                    className="form-input"
                    style={{ paddingLeft: 36, fontSize: 13 }}
                    placeholder="Cari di semua kolom..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                  />
                </div>
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  {sorted.length.toLocaleString()} dari {features.length.toLocaleString()} fitur
                </span>
              </div>

              {/* Table */}
              <div className="chart-card" style={{ padding: 0, overflowX: 'auto' }}>
                <table className="gangguan-table" style={{ minWidth: columns.length * 120 }}>
                  <thead>
                    <tr>
                      <th style={{ width: 48, textAlign: 'center' }}>#</th>
                      {columns.map(col => (
                        <th
                          key={col}
                          onClick={() => toggleSort(col)}
                          style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            {col}
                            {sortKey === col
                              ? sortDir === 'asc'
                                ? <ChevronUp size={12} />
                                : <ChevronDown size={12} />
                              : <ChevronsUpDown size={11} style={{ opacity: 0.4 }} />
                            }
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((feature, idx) => (
                      <tr key={idx}>
                        <td style={{ textAlign: 'center', color: '#64748b', fontSize: 12 }}>
                          {(page - 1) * PAGE_SIZE + idx + 1}
                        </td>
                        {columns.map(col => {
                          const val = feature.properties?.[col];
                          return (
                            <td key={col} style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>
                              {val === null || val === undefined ? (
                                <span style={{ color: '#64748b', fontStyle: 'italic' }}>null</span>
                              ) : String(val)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {paginated.length === 0 && (
                  <div style={{ padding: 32, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                    Tidak ada data yang cocok dengan pencarian.
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '6px 14px', fontSize: 13 }}
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    Sebelumnya
                  </button>
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>
                    Halaman {page} dari {totalPages}
                  </span>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '6px 14px', fontSize: 13 }}
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  >
                    Berikutnya
                  </button>
                </div>
              )}
            </>
          )}

          {activeTab === 'raw' && (
            <div className="chart-card" style={{ padding: 0 }}>
              <pre style={{
                fontSize: 11,
                color: '#94a3b8',
                padding: 20,
                overflowX: 'auto',
                overflowY: 'auto',
                maxHeight: 500,
                lineHeight: 1.6,
                fontFamily: 'monospace',
              }}>
                {JSON.stringify(layerData.data, null, 2)}
              </pre>
            </div>
          )}
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
