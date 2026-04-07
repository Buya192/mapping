'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, Treemap
} from 'recharts';
import { RefreshCw, AlertCircle, BarChart3, PieChart as PieChartIcon, Grid3x3, Database } from 'lucide-react';

const COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#eab308', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#14b8a6'];

type LayerRow = {
  layer_id: number;
  layer_name: string;
  geometry_type: string;
  feature_count: number;
  property_keys: string[];
  bbox_minx: number | null;
  bbox_miny: number | null;
  bbox_maxx: number | null;
  bbox_maxy: number | null;
  zip_filename: string;
  import_status: string;
};

type FieldStat = {
  value: string;
  count: number;
};

type StatsResult = {
  layerName: string;
  featureCount: number;
  propertyKeys: string[];
  stats: Record<string, FieldStat[]>;
};

export default function StatistikPage() {
  const [layers, setLayers] = useState<LayerRow[]>([]);
  const [selectedLayer, setSelectedLayer] = useState('');
  const [stats, setStats] = useState<StatsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'tree'>('bar');

  useEffect(() => {
    setListLoading(true);
    fetch('/api/argis?action=layers&source=db')
      .then(r => r.json())
      .then(d => {
        const rows: LayerRow[] = d.layers ?? [];
        setLayers(rows);
        if (rows.length > 0) setSelectedLayer(rows[0].layer_name);
      })
      .catch(e => setError(e.message))
      .finally(() => setListLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedLayer) return;
    setLoading(true);
    setStats(null);
    setError(null);
    fetch(`/api/argis?action=stats&source=db&layer=${encodeURIComponent(selectedLayer)}`)
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setStats(d); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedLayer]);

  const currentLayer = layers.find(l => l.layer_name === selectedLayer);

  // Layer overview chart data
  const layerOverview = layers.map(l => ({
    name: l.layer_name.length > 14 ? l.layer_name.slice(0, 14) + '...' : l.layer_name,
    fitur: l.feature_count,
    kolom: l.property_keys?.length ?? 0,
  }));

  // Geometry type distribution for current layer
  const geomBreakdown = useMemo(() => {
    if (!currentLayer) return [];
    return [{ name: currentLayer.geometry_type, value: currentLayer.feature_count }];
  }, [currentLayer]);

  const statEntries = stats ? Object.entries(stats.stats).filter(([, vals]) => vals.length > 0) : [];

  return (
    <div style={{ paddingBottom: 40 }}>
      <div className="page-header">
        <h1 className="page-title">Statistik Data GeoJSON</h1>
        <p className="page-subtitle">Ringkasan dan visualisasi atribut dari database Neon</p>
      </div>

      {/* Layer overview chart */}
      {layerOverview.length > 0 && (
        <div className="chart-card" style={{ marginBottom: 20 }}>
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Database size={14} style={{ color: '#3b82f6' }} /> Ringkasan Semua Layer di Database
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={layerOverview} margin={{ top: 5, right: 10, left: -10, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,54,84,0.6)" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1a2236', border: '1px solid #2a3654', borderRadius: 8, color: '#f1f5f9' }} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              <Bar dataKey="fitur" name="Jumlah Fitur" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="kolom" name="Jumlah Kolom" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Layer selector */}
      <div className="card" style={{ marginBottom: 16, padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <label style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>Analisis Layer:</label>
          {listLoading ? (
            <div style={{ color: '#64748b', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Memuat...
            </div>
          ) : layers.length === 0 ? (
            <span style={{ fontSize: 13, color: '#ef4444' }}>Belum ada data. Silakan upload ZIP terlebih dahulu.</span>
          ) : (
            <select
              className="form-select"
              value={selectedLayer}
              onChange={e => setSelectedLayer(e.target.value)}
              style={{ maxWidth: 340, fontSize: 13, padding: '8px 12px' }}
            >
              {layers.map(l => (
                <option key={l.layer_name} value={l.layer_name}>
                  {l.layer_name} ({l.feature_count.toLocaleString()} fitur)
                </option>
              ))}
            </select>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            {([
              { key: 'bar' as const, icon: BarChart3, label: 'Bar' },
              { key: 'pie' as const, icon: PieChartIcon, label: 'Pie' },
              { key: 'tree' as const, icon: Grid3x3, label: 'Tree' },
            ]).map(({ key, icon: Icon, label }) => (
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
          <p style={{ fontSize: 13 }}>Menghitung statistik dari database...</p>
        </div>
      )}

      {stats && currentLayer && !loading && (
        <>
          {/* Info cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Total Fitur', value: currentLayer.feature_count.toLocaleString(), color: '#3b82f6' },
              { label: 'Tipe Geometri', value: currentLayer.geometry_type, color: '#22c55e' },
              { label: 'Total Kolom', value: stats.propertyKeys.length.toString(), color: '#f1f5f9' },
              { label: 'Kolom Dianalisis', value: statEntries.length.toString(), color: '#eab308' },
              { label: 'Sumber ZIP', value: currentLayer.zip_filename, color: '#94a3b8' },
            ].map(item => (
              <div key={item.label} className="card" style={{ padding: '12px 16px' }}>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4, fontWeight: 600 }}>{item.label}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: item.color, wordBreak: 'break-all' }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Geometry + Bbox */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div className="chart-card">
              <div className="card-title">Distribusi Tipe Geometri</div>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={geomBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={58}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                    {geomBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1a2236', border: '1px solid #2a3654', borderRadius: 8, color: '#f1f5f9' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-card">
              <div className="card-title">Bounding Box</div>
              {currentLayer.bbox_minx !== null ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
                  {[
                    { label: 'Min Lon', value: currentLayer.bbox_minx?.toFixed(6) },
                    { label: 'Min Lat', value: currentLayer.bbox_miny?.toFixed(6) },
                    { label: 'Max Lon', value: currentLayer.bbox_maxx?.toFixed(6) },
                    { label: 'Max Lat', value: currentLayer.bbox_maxy?.toFixed(6) },
                  ].map(item => (
                    <div key={item.label} style={{ padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>{item.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6', fontFamily: 'monospace' }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: '#64748b', marginTop: 8 }}>Koordinat tidak tersedia</p>
              )}
            </div>
          </div>

          {/* Per-field stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
            {statEntries.map(([key, values], si) => (
              <div key={key} className="chart-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9' }}>{key}</div>
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{values.length} nilai unik (top {values.length})</div>
                  </div>
                </div>

                {chartType === 'bar' && (
                  <ResponsiveContainer width="100%" height={130}>
                    <BarChart data={values} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <XAxis dataKey="value" tick={{ fill: '#64748b', fontSize: 10 }} hide={values.length > 5} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: '#1a2236', border: '1px solid #2a3654', borderRadius: 8, color: '#f1f5f9', fontSize: 12 }}
                        formatter={(v, _, p) => [v, p.payload.value]} />
                      <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                        {values.map((_, i) => <Cell key={i} fill={COLORS[(si + i) % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
                {chartType === 'pie' && (
                  <ResponsiveContainer width="100%" height={130}>
                    <PieChart>
                      <Pie data={values} dataKey="count" nameKey="value" cx="50%" cy="50%" outerRadius={48} innerRadius={22}>
                        {values.map((_, i) => <Cell key={i} fill={COLORS[(si + i) % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#1a2236', border: '1px solid #2a3654', borderRadius: 8, color: '#f1f5f9', fontSize: 11 }} />
                      <Legend wrapperStyle={{ fontSize: 10, color: '#94a3b8' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                {chartType === 'tree' && (
                  <ResponsiveContainer width="100%" height={130}>
                    <Treemap
                      data={values.map((v, i) => ({ name: v.value, size: v.count, fill: COLORS[(si + i) % COLORS.length] }))}
                      dataKey="size" aspectRatio={4 / 3}
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
