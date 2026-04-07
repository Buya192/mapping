'use client';

import { useState, useEffect, useMemo } from 'react';
import type { LayerInfo, GeoJSONFeature } from '@/app/api/argis/route';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, Treemap
} from 'recharts';
import { RefreshCw, AlertCircle, BarChart3, PieChartIcon, Grid3x3 } from 'lucide-react';

const COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#eab308', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#14b8a6'];

type FieldStats = {
  key: string;
  type: 'categorical' | 'numeric';
  uniqueCount: number;
  topValues: { value: string; count: number }[];
  min?: number;
  max?: number;
  avg?: number;
};

function computeStats(features: GeoJSONFeature[], columns: string[]): FieldStats[] {
  return columns.map(key => {
    const values = features.map(f => f.properties?.[key]).filter(v => v !== null && v !== undefined && v !== '');
    const numericVals = values.map(v => Number(v)).filter(n => !isNaN(n));
    const isNumeric = numericVals.length > values.length * 0.7 && values.length > 0;

    const freq: Record<string, number> = {};
    values.forEach(v => {
      const k = String(v);
      freq[k] = (freq[k] ?? 0) + 1;
    });
    const topValues = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([value, count]) => ({ value, count }));

    const uniqueCount = Object.keys(freq).length;

    if (isNumeric) {
      const min = Math.min(...numericVals);
      const max = Math.max(...numericVals);
      const avg = numericVals.reduce((a, b) => a + b, 0) / numericVals.length;
      return { key, type: 'numeric', uniqueCount, topValues, min, max, avg };
    }

    return { key, type: 'categorical', uniqueCount, topValues };
  });
}

export default function StatistikPage() {
  const [layers, setLayers] = useState<Omit<LayerInfo, 'data'>[]>([]);
  const [selectedLayer, setSelectedLayer] = useState('');
  const [layerData, setLayerData] = useState<LayerInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'tree'>('bar');

  useEffect(() => {
    setListLoading(true);
    fetch('/api/argis?action=list')
      .then(r => r.json())
      .then(d => {
        setLayers(d.geojsonLayers ?? []);
        if (d.geojsonLayers?.length > 0) setSelectedLayer(d.geojsonLayers[0].name);
      })
      .catch(e => setError(e.message))
      .finally(() => setListLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedLayer) return;
    setLoading(true);
    setLayerData(null);
    setError(null);
    fetch(`/api/argis?action=layer&layer=${encodeURIComponent(selectedLayer)}`)
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setLayerData(d); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedLayer]);

  const features = layerData?.data?.features ?? [];
  const columns = layerData?.properties ?? [];

  const stats = useMemo(() => {
    if (!features.length || !columns.length) return [];
    return computeStats(features, columns);
  }, [features, columns]);

  // Geometry type breakdown
  const geomBreakdown = useMemo(() => {
    const freq: Record<string, number> = {};
    features.forEach(f => {
      const t = f.geometry?.type ?? 'Unknown';
      freq[t] = (freq[t] ?? 0) + 1;
    });
    return Object.entries(freq).map(([name, value]) => ({ name, value }));
  }, [features]);

  // Layer overview
  const layerOverview = layers.map(l => ({
    name: l.name.length > 16 ? l.name.slice(0, 16) + '...' : l.name,
    fitur: l.featureCount,
    kolom: l.properties.length,
  }));

  return (
    <div style={{ paddingBottom: 40 }}>
      <div className="page-header">
        <h1 className="page-title">Statistik Data Argis</h1>
        <p className="page-subtitle">Ringkasan dan visualisasi atribut GeoJSON dari ZIP</p>
      </div>

      {/* Layer overview */}
      <div className="chart-card" style={{ marginBottom: 20 }}>
        <div className="card-title">Ringkasan Semua Layer</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={layerOverview} margin={{ top: 5, right: 10, left: -10, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,54,84,0.6)" />
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#1a2236', border: '1px solid #2a3654', borderRadius: 8, color: '#f1f5f9' }} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
            <Bar dataKey="fitur" name="Jumlah Fitur" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="kolom" name="Jumlah Kolom" fill="#06b6d4" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Layer selector */}
      <div className="card" style={{ marginBottom: 16, padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <label style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>Analisis Layer:</label>
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
                <option key={l.name} value={l.name}>{l.name} ({l.featureCount} fitur)</option>
              ))}
            </select>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            {([
              { key: 'bar', icon: BarChart3, label: 'Bar' },
              { key: 'pie', icon: PieChartIcon, label: 'Pie' },
              { key: 'tree', icon: Grid3x3, label: 'Tree' },
            ] as const).map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setChartType(key)}
                className={`btn ${chartType === key ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: 12, padding: '6px 12px', gap: 6 }}
              >
                <Icon size={12} /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="card" style={{ borderColor: 'rgba(239,68,68,0.3)', marginBottom: 16, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10, color: '#ef4444' }}>
          <AlertCircle size={16} /><span style={{ fontSize: 13 }}>{error}</span>
        </div>
      )}

      {loading && (
        <div className="card" style={{ marginBottom: 16, padding: 24, textAlign: 'center', color: '#64748b' }}>
          <RefreshCw size={24} style={{ margin: '0 auto 8px', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: 13 }}>Menghitung statistik...</p>
        </div>
      )}

      {layerData && !loading && (
        <>
          {/* Info cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Total Fitur', value: features.length.toLocaleString() },
              { label: 'Tipe Geometri', value: layerData.geometryType },
              { label: 'Total Kolom', value: columns.length.toString() },
              { label: 'Kolom Kategori', value: stats.filter(s => s.type === 'categorical').length.toString() },
              { label: 'Kolom Numerik', value: stats.filter(s => s.type === 'numeric').length.toString() },
            ].map(item => (
              <div key={item.label} className="card" style={{ padding: '12px 16px' }}>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4, fontWeight: 600 }}>{item.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Geometry type chart */}
          {geomBreakdown.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div className="chart-card">
                <div className="card-title">Distribusi Tipe Geometri</div>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={geomBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                      {geomBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1a2236', border: '1px solid #2a3654', borderRadius: 8, color: '#f1f5f9' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Bbox info */}
              <div className="chart-card">
                <div className="card-title">Bounding Box</div>
                {layerData.bbox ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
                    {[
                      { label: 'Min Longitude', value: layerData.bbox[0].toFixed(6) },
                      { label: 'Min Latitude', value: layerData.bbox[1].toFixed(6) },
                      { label: 'Max Longitude', value: layerData.bbox[2].toFixed(6) },
                      { label: 'Max Latitude', value: layerData.bbox[3].toFixed(6) },
                    ].map(item => (
                      <div key={item.label} style={{ padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>{item.label}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#3b82f6', fontFamily: 'monospace' }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: '#64748b', marginTop: 8 }}>Koordinat tidak tersedia</p>
                )}
              </div>
            </div>
          )}

          {/* Per-column stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
            {stats.filter(s => s.topValues.length > 0).map((stat, si) => (
              <div key={stat.key} className="chart-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9' }}>{stat.key}</div>
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                      {stat.type === 'numeric' ? 'Numerik' : 'Kategori'} &bull; {stat.uniqueCount} unik
                    </div>
                  </div>
                  {stat.type === 'numeric' && (
                    <div style={{ textAlign: 'right', fontSize: 11, color: '#94a3b8' }}>
                      <div>Min: <strong style={{ color: '#22c55e' }}>{stat.min?.toFixed(2)}</strong></div>
                      <div>Max: <strong style={{ color: '#ef4444' }}>{stat.max?.toFixed(2)}</strong></div>
                      <div>Avg: <strong style={{ color: '#3b82f6' }}>{stat.avg?.toFixed(2)}</strong></div>
                    </div>
                  )}
                </div>

                {chartType === 'bar' && (
                  <ResponsiveContainer width="100%" height={130}>
                    <BarChart data={stat.topValues} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <XAxis dataKey="value" tick={{ fill: '#64748b', fontSize: 10 }} interval={0} hide={stat.topValues.length > 5} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ background: '#1a2236', border: '1px solid #2a3654', borderRadius: 8, color: '#f1f5f9', fontSize: 12 }}
                        formatter={(v: unknown, _: unknown, p) => [v, p.payload.value]}
                      />
                      <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                        {stat.topValues.map((_, i) => (
                          <Cell key={i} fill={COLORS[(si + i) % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {chartType === 'pie' && (
                  <ResponsiveContainer width="100%" height={130}>
                    <PieChart>
                      <Pie data={stat.topValues} dataKey="count" nameKey="value" cx="50%" cy="50%" outerRadius={50} innerRadius={25}>
                        {stat.topValues.map((_, i) => <Cell key={i} fill={COLORS[(si + i) % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#1a2236', border: '1px solid #2a3654', borderRadius: 8, color: '#f1f5f9', fontSize: 11 }} />
                      <Legend wrapperStyle={{ fontSize: 10, color: '#94a3b8' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}

                {chartType === 'tree' && (
                  <ResponsiveContainer width="100%" height={130}>
                    <Treemap
                      data={stat.topValues.map((v, i) => ({ name: v.value, size: v.count, fill: COLORS[(si + i) % COLORS.length] }))}
                      dataKey="size"
                      aspectRatio={4 / 3}
                    >
                      <Tooltip contentStyle={{ background: '#1a2236', border: '1px solid #2a3654', borderRadius: 8, color: '#f1f5f9', fontSize: 11 }} />
                    </Treemap>
                  </ResponsiveContainer>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
