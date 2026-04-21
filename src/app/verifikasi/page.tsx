'use client';

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Navigation2, MapPin, ChevronLeft, ChevronRight, CheckCircle2, Edit3, 
  Plus, X, Crosshair, Filter, Layers, Save, AlertTriangle, Zap, Radio,
  Cable, Shield, SkipForward, SkipBack, Play, Pause, List, Map as MapIcon
} from 'lucide-react';
import dynamic from 'next/dynamic';

const VerifikasiMap = dynamic(() => import('@/components/verifikasi/VerifikasiMap'), { ssr: false });

// ─── Types ──────────────────────────────────
interface AssetItem {
  id: string;
  _table: string;
  _lat: number;
  _lng: number;
  _hasGPS: boolean;
  verified?: boolean;
  nama_tiang?: string;
  namaGardu?: string;
  name?: string;
  assetnum?: string;
  penyulang?: string;
  feeder?: string;
  [key: string]: unknown;
}

interface ProgressInfo {
  [table: string]: { total: number; verified: number };
}

const TABLE_COLORS: Record<string, string> = {
  tiang_jtm: '#3b82f6',
  gardus: '#f59e0b',
  jtm_segments: '#8b5cf6',
  jtr_segments: '#06b6d4',
  pelanggan: '#f97316',
};

const TABLE_ICONS: Record<string, React.ReactNode> = {
  tiang_jtm: <MapPin size={14} />,
  gardus: <Zap size={14} />,
  jtm_segments: <Cable size={14} />,
  jtr_segments: <Radio size={14} />,
  pelanggan: <Shield size={14} />,
};

const TABLE_LABELS: Record<string, string> = {
  tiang_jtm: 'Tiang',
  gardus: 'Gardu',
  jtm_segments: 'JTM',
  jtr_segments: 'JTR',
  pelanggan: 'Pelanggan',
};

// Get display name for an asset
function getAssetName(a: AssetItem): string {
  return String(a.nama_tiang || a.namaGardu || a.name || a.assetnum || a.id || '?');
}

// Calculate distance between two points (Haversine)
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ─── Styles ──────────────────────────────────
const S = {
  topBar: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
    background: '#0d1117', borderBottom: '1px solid #1e293b', flexWrap: 'wrap' as const,
  },
  label: { fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.06em' },
  select: {
    padding: '7px 10px', fontSize: 13, borderRadius: 8, border: '1px solid #2a3654',
    background: '#111827', color: '#f1f5f9', outline: 'none', minWidth: 160,
  },
  badge: (color: string) => ({
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
    background: `${color}20`, color, border: `1px solid ${color}40`,
  }),
  sidePanel: {
    position: 'absolute' as const, top: 0, right: 0, bottom: 0, width: 380,
    background: '#0d1117', borderLeft: '1px solid #1e293b', overflowY: 'auto' as const,
    zIndex: 20, boxShadow: '-4px 0 24px rgba(0,0,0,0.3)',
  },
  navBar: {
    position: 'absolute' as const, bottom: 0, left: 0, right: 0, zIndex: 15,
    background: 'rgba(13,17,23,0.95)', backdropFilter: 'blur(12px)',
    borderTop: '1px solid #1e293b', padding: '8px 16px',
  },
  navBtn: (active: boolean) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontSize: 12, fontWeight: 700,
    background: active ? '#3b82f6' : '#1e293b', color: active ? '#fff' : '#94a3b8',
    transition: 'all 0.2s',
  }),
  assetListItem: (active: boolean, color: string) => ({
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
    background: active ? `${color}15` : 'transparent',
    borderLeft: `3px solid ${active ? color : 'transparent'}`,
    borderBottom: '1px solid #1e293b', cursor: 'pointer',
    transition: 'all 0.15s',
  }),
  fieldRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 },
  fieldLabel: { fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' as const, marginBottom: 3 },
  fieldInput: {
    width: '100%', padding: '7px 10px', fontSize: 13, borderRadius: 6,
    border: '1px solid #2a3654', background: '#111827', color: '#f1f5f9', outline: 'none',
  },
};

// ─── Editable field configs per table ──────────
const EDITABLE_FIELDS: Record<string, { key: string; label: string; type: 'text' | 'number' | 'select'; options?: string[] }[]> = {
  tiang_jtm: [
    { key: 'nama_tiang', label: 'Nama Tiang', type: 'text' },
    { key: 'penyulang', label: 'Penyulang', type: 'text' },
    { key: 'tinggiTiang', label: 'Tinggi (m)', type: 'select', options: ['9', '11', '12', '13', '14'] },
    { key: 'materialTiang', label: 'Material', type: 'select', options: ['Besi', 'Beton', 'Kayu'] },
    { key: 'kondisi', label: 'Kondisi', type: 'select', options: ['Baik', 'Rusak Ringan', 'Rusak Berat', 'Miring'] },
    { key: 'desa', label: 'Desa', type: 'text' },
    { key: 'latitude', label: 'Latitude', type: 'number' },
    { key: 'longitude', label: 'Longitude', type: 'number' },
  ],
  gardus: [
    { key: 'namaGardu', label: 'Nama Gardu', type: 'text' },
    { key: 'feeder', label: 'Penyulang', type: 'text' },
    { key: 'tipe_gardu', label: 'Tipe', type: 'select', options: ['Portal', 'Kios', 'Ground Pad', 'Cantol', 'GH'] },
    { key: 'kapasitas_kva', label: 'Kapasitas kVA', type: 'number' },
    { key: 'merk_trafo', label: 'Merk Trafo', type: 'text' },
    { key: 'kondisi', label: 'Kondisi', type: 'select', options: ['Baik', 'Rusak Ringan', 'Rusak Berat'] },
    { key: 'latitude', label: 'Latitude', type: 'number' },
    { key: 'longitude', label: 'Longitude', type: 'number' },
  ],
  jtm_segments: [
    { key: 'name', label: 'Nama Segmen', type: 'text' },
    { key: 'feeder', label: 'Penyulang', type: 'text' },
    { key: 'jenisKonduktor', label: 'Konduktor', type: 'text' },
    { key: 'penampang', label: 'Penampang (mm²)', type: 'text' },
    { key: 'panjang_km', label: 'Panjang (km)', type: 'number' },
  ],
  jtr_segments: [
    { key: 'name', label: 'Nama Segmen', type: 'text' },
    { key: 'feeder', label: 'Penyulang', type: 'text' },
    { key: 'jenisKonduktor', label: 'Konduktor', type: 'text' },
    { key: 'penampang', label: 'Penampang (mm²)', type: 'text' },
    { key: 'panjang_km', label: 'Panjang (km)', type: 'number' },
  ],
};

export default function VerifikasiPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#64748b' }}>Memuat...</div>}>
      <VerifikasiContent />
    </Suspense>
  );
}

function VerifikasiContent() {
  const searchParams = useSearchParams();
  const initialFeeder = searchParams.get('feeder') || '';
  
  // ─── State ───
  const [surveyorName, setSurveyorName] = useState('');
  const [started, setStarted] = useState(false);
  const [feeders, setFeeders] = useState<string[]>([]);
  const [selectedFeeder, setSelectedFeeder] = useState(initialFeeder);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<ProgressInfo>({});

  // Navigation state
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [showPanel, setShowPanel] = useState(false);
  const [panelMode, setPanelMode] = useState<'view' | 'edit' | 'create'>('view');
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // GPS
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [followGps, setFollowGps] = useState(false);
  const watchRef = useRef<number | null>(null);

  // Filters
  const [tableFilter, setTableFilter] = useState<string[]>(['tiang_jtm', 'gardus', 'jtm_segments', 'jtr_segments']);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);

  // Current asset
  const currentAsset = currentIdx >= 0 ? assets[currentIdx] : null;

  // Sorted & filtered assets (sorted by proximity to start or next nearest)
  const filteredAssets = useMemo(() => {
    let list = assets.filter(a => tableFilter.includes(a._table));
    if (showVerifiedOnly) list = list.filter(a => !a.verified);
    return list;
  }, [assets, tableFilter, showVerifiedOnly]);

  // Progress stats
  const totalAssets = assets.length;
  const verifiedCount = assets.filter(a => a.verified).length;
  const progressPct = totalAssets > 0 ? Math.round(verifiedCount / totalAssets * 100) : 0;

  // ─── Load feeders ───
  useEffect(() => {
    fetch('/api/dream/asset', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_feeders' }),
    })
      .then(r => r.json())
      .then(d => { if (d.feeders) setFeeders(d.feeders); })
      .catch(() => {});
  }, []);

  // ─── Load assets for feeder ───
  const loadAssets = useCallback(async (feeder: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/dream/asset', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_all_assets', penyulang: feeder }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        // Sort by nearest-neighbor from first point
        const sorted = sortByProximity(data.data);
        setAssets(sorted);
        setCurrentIdx(sorted.length > 0 ? 0 : -1);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  // Sort assets by nearest-neighbor chain (walk the line)
  function sortByProximity(items: AssetItem[]): AssetItem[] {
    if (items.length <= 1) return items;
    
    // Start from gardu if available, otherwise first item
    const garduIdx = items.findIndex(a => a._table === 'gardus');
    const startIdx = garduIdx >= 0 ? garduIdx : 0;
    
    const sorted: AssetItem[] = [items[startIdx]];
    const remaining = new Set(items.map((_, i) => i));
    remaining.delete(startIdx);

    while (remaining.size > 0) {
      const last = sorted[sorted.length - 1];
      let nearest = -1;
      let nearestDist = Infinity;

      for (const idx of remaining) {
        const d = distanceKm(last._lat, last._lng, items[idx]._lat, items[idx]._lng);
        if (d < nearestDist) { nearestDist = d; nearest = idx; }
      }

      if (nearest >= 0) {
        sorted.push(items[nearest]);
        remaining.delete(nearest);
      } else break;
    }

    return sorted;
  }

  useEffect(() => {
    if (selectedFeeder) loadAssets(selectedFeeder);
  }, [selectedFeeder, loadAssets]);

  // ─── GPS tracking ───
  const toggleGPS = () => {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
      setFollowGps(false);
    } else {
      watchRef.current = navigator.geolocation.watchPosition(
        (pos) => setUserPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}, { enableHighAccuracy: true, maximumAge: 3000 }
      );
      setFollowGps(true);
    }
  };

  useEffect(() => {
    return () => {
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, []);

  // ─── Navigation ───
  const goTo = (idx: number) => {
    if (idx >= 0 && idx < filteredAssets.length) {
      const actualIdx = assets.indexOf(filteredAssets[idx]);
      setCurrentIdx(actualIdx);
      setShowPanel(true);
      setPanelMode('view');
    }
  };

  const goNext = () => {
    const curFilterIdx = currentAsset ? filteredAssets.indexOf(currentAsset) : -1;
    if (curFilterIdx < filteredAssets.length - 1) goTo(curFilterIdx + 1);
  };

  const goPrev = () => {
    const curFilterIdx = currentAsset ? filteredAssets.indexOf(currentAsset) : -1;
    if (curFilterIdx > 0) goTo(curFilterIdx - 1);
  };

  // ─── Asset click handler ───
  const handleAssetClick = useCallback((asset: AssetItem) => {
    const idx = assets.indexOf(asset);
    setCurrentIdx(idx);
    setShowPanel(true);
    setPanelMode('view');
  }, [assets]);

  const handleMapClick = useCallback((latlng: { lat: number; lng: number }) => {
    setPanelMode('create');
    setShowPanel(true);
    setEditData({
      latitude: String(latlng.lat),
      longitude: String(latlng.lng),
      penyulang: selectedFeeder,
      feeder: selectedFeeder,
    });
  }, [selectedFeeder]);

  // ─── Edit / Verify / Create ───
  const startEdit = () => {
    if (!currentAsset) return;
    const data: Record<string, string> = {};
    const fields = EDITABLE_FIELDS[currentAsset._table] || [];
    fields.forEach(f => { data[f.key] = String((currentAsset as Record<string, unknown>)[f.key] || ''); });
    setEditData(data);
    setPanelMode('edit');
  };

  const handleVerify = async () => {
    if (!currentAsset) return;
    setSaving(true);
    try {
      await fetch('/api/dream/verification', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify', asset_table: currentAsset._table, asset_id: currentAsset.id,
          verified_by: surveyorName, latitude: userPosition?.lat, longitude: userPosition?.lng,
        }),
      });
      // Update local
      setAssets(prev => prev.map(a => a.id === currentAsset.id ? { ...a, verified: true } : a));
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleSaveEdit = async () => {
    if (!currentAsset) return;
    setSaving(true);
    try {
      await fetch('/api/dream/verification', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit', asset_table: currentAsset._table, asset_id: currentAsset.id,
          data: editData, verified_by: surveyorName,
          latitude: userPosition?.lat, longitude: userPosition?.lng,
        }),
      });
      setAssets(prev => prev.map(a => a.id === currentAsset.id ? { ...a, ...editData, verified: true } : a));
      setPanelMode('view');
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleCreate = async () => {
    setSaving(true);
    const table = editData._table || 'tiang_jtm';
    try {
      const res = await fetch('/api/dream/verification', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create', asset_table: table, data: editData,
          verified_by: surveyorName, latitude: editData.latitude, longitude: editData.longitude,
        }),
      });
      const result = await res.json();
      if (result.success && result.asset) {
        const newAsset: AssetItem = {
          ...result.asset, _table: table,
          _lat: Number(editData.latitude), _lng: Number(editData.longitude), _hasGPS: true, verified: true,
        };
        setAssets(prev => [...prev, newAsset]);
        setShowPanel(false);
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  // ─── Entry Screen ───
  if (!started) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)' }}>
        <div style={{ background: '#111827', borderRadius: 16, padding: 40, maxWidth: 440, width: '100%', textAlign: 'center', border: '1px solid #1e293b' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg, #22c55e, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Navigation2 size={26} color="#fff" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>Mode Verifikasi Aset</h2>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>
            Navigasi aset berurutan — ikuti jalur penyulang dari pembangkit ke pelanggan. Edit dan verifikasi data langsung di lapangan.
          </p>
          <div style={{ marginTop: 24, textAlign: 'left' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>🧑 Nama Surveyor / Petugas</label>
            <input
              type="text" value={surveyorName}
              onChange={e => setSurveyorName(e.target.value)}
              placeholder="Masukkan nama Anda"
              style={{ ...S.select, width: '100%', marginTop: 6, padding: '12px' }}
            />
          </div>
          <button
            disabled={!surveyorName.trim()}
            onClick={() => setStarted(true)}
            style={{
              width: '100%', marginTop: 20, padding: '14px', borderRadius: 10, border: 'none',
              background: surveyorName.trim() ? 'linear-gradient(135deg, #22c55e, #06b6d4)' : '#1e293b',
              color: surveyorName.trim() ? '#fff' : '#64748b', fontSize: 15, fontWeight: 700, cursor: surveyorName.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            <Navigation2 size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
            Mulai Verifikasi
          </button>
        </div>
      </div>
    );
  }

  const curFilterIdx = currentAsset ? filteredAssets.indexOf(currentAsset) : -1;

  // ─── Main Verification UI ───
  return (
    <div style={{ position: 'relative', height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* TOP BAR */}
      <div style={S.topBar}>
        <div>
          <div style={S.label}>Penyulang</div>
          <select style={S.select} value={selectedFeeder} onChange={e => setSelectedFeeder(e.target.value)}>
            <option value="">— Pilih Penyulang —</option>
            {feeders.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>

        {/* Progress */}
        {totalAssets > 0 && (
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ ...S.label, fontSize: 10 }}>Progress Verifikasi</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: progressPct === 100 ? '#22c55e' : '#f1f5f9' }}>
                {verifiedCount}/{totalAssets} ({progressPct}%)
              </span>
            </div>
            <div style={{ width: '100%', height: 6, borderRadius: 3, background: '#1e293b' }}>
              <div style={{ width: `${progressPct}%`, height: '100%', borderRadius: 3, background: progressPct === 100 ? '#22c55e' : 'linear-gradient(90deg, #3b82f6, #8b5cf6)', transition: 'width 0.5s' }} />
            </div>
          </div>
        )}

        {/* Filter toggles */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {Object.entries(TABLE_LABELS).map(([key, label]) => {
            const active = tableFilter.includes(key);
            return (
              <button key={key} onClick={() => setTableFilter(prev => active ? prev.filter(t => t !== key) : [...prev, key])}
                style={{ ...S.badge(active ? TABLE_COLORS[key] : '#475569'), cursor: 'pointer', border: `1px solid ${active ? TABLE_COLORS[key] + '60' : '#2a3654'}`, opacity: active ? 1 : 0.4 }}>
                {TABLE_ICONS[key]} {label}
              </button>
            );
          })}
          <button onClick={() => setShowVerifiedOnly(!showVerifiedOnly)}
            style={{ ...S.badge(showVerifiedOnly ? '#ef4444' : '#475569'), cursor: 'pointer', opacity: showVerifiedOnly ? 1 : 0.5 }}>
            <AlertTriangle size={10} /> {showVerifiedOnly ? 'Unverified' : 'Semua'}
          </button>
        </div>

        {/* View mode + GPS */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')} style={S.navBtn(false)}>
            {viewMode === 'map' ? <><List size={14} /> List</> : <><MapIcon size={14} /> Peta</>}
          </button>
          <button onClick={toggleGPS} style={S.navBtn(followGps)}>
            <Crosshair size={14} /> GPS {followGps ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, position: 'relative', display: 'flex' }}>
        
        {/* MAP or LIST VIEW */}
        <div style={{ flex: 1, position: 'relative' }}>
          {viewMode === 'map' ? (
            selectedFeeder && filteredAssets.length > 0 ? (
              <VerifikasiMap
                assets={filteredAssets}
                userPosition={userPosition}
                followGps={followGps}
                onAssetClick={handleAssetClick}
                onMapClick={handleMapClick}
                tableColors={TABLE_COLORS}
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
                <div style={{ textAlign: 'center' }}>
                  <MapPin size={40} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    {loading ? 'Memuat aset...' : selectedFeeder ? 'Tidak ada aset dengan GPS' : 'Pilih penyulang untuk memulai'}
                  </div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Data akan ditampilkan berurutan dari gardu ke pelanggan</div>
                </div>
              </div>
            )
          ) : (
            /* LIST VIEW */
            <div style={{ height: '100%', overflowY: 'auto', background: '#0d1117' }}>
              {filteredAssets.map((asset, idx) => {
                const isActive = currentAsset?.id === asset.id;
                const color = TABLE_COLORS[asset._table] || '#64748b';
                const name = getAssetName(asset);
                return (
                  <div key={asset.id} onClick={() => handleAssetClick(asset)} style={S.assetListItem(isActive, color)}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${color}20`, color, fontSize: 11, fontWeight: 700 }}>
                      {idx + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>{TABLE_LABELS[asset._table] || asset._table}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {asset.verified ? (
                        <CheckCircle2 size={16} color="#22c55e" />
                      ) : (
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', animation: 'pulse 2s infinite' }} />
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredAssets.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: '#64748b', fontSize: 13 }}>
                  {selectedFeeder ? 'Tidak ada aset dengan filter ini' : 'Pilih penyulang'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* SIDE PANEL */}
        {showPanel && currentAsset && panelMode !== 'create' && (
          <div style={S.sidePanel}>
            {/* Panel Header */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={S.badge(TABLE_COLORS[currentAsset._table] || '#64748b')}>
                    {TABLE_ICONS[currentAsset._table]} {TABLE_LABELS[currentAsset._table]}
                  </div>
                  {currentAsset.verified && <CheckCircle2 size={14} color="#22c55e" />}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, marginTop: 6 }}>{getAssetName(currentAsset)}</div>
                <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>
                  {currentAsset._lat.toFixed(6)}, {currentAsset._lng.toFixed(6)}
                </div>
              </div>
              <button onClick={() => setShowPanel(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            {/* Panel Body */}
            <div style={{ padding: 16 }}>
              {panelMode === 'view' ? (
                <>
                  {/* Asset Details */}
                  <div style={{ marginBottom: 16 }}>
                    {(EDITABLE_FIELDS[currentAsset._table] || []).map(f => {
                      const val = String((currentAsset as Record<string, unknown>)[f.key] || '');
                      return (
                        <div key={f.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1e293b', fontSize: 12 }}>
                          <span style={{ color: '#64748b' }}>{f.label}</span>
                          <span style={{ fontWeight: 600, color: val && val !== 'undefined' ? '#f1f5f9' : '#3f3f46' }}>{val && val !== 'undefined' ? val : '—'}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {!currentAsset.verified && (
                      <button onClick={handleVerify} disabled={saving}
                        style={{ ...S.navBtn(true), width: '100%', background: '#22c55e', padding: 12 }}>
                        {saving ? 'Menyimpan...' : <><CheckCircle2 size={16} /> Verifikasi — Data Benar</>}
                      </button>
                    )}
                    <button onClick={startEdit}
                      style={{ ...S.navBtn(false), width: '100%', background: '#1e293b', padding: 12 }}>
                      <Edit3 size={16} /> {currentAsset.verified ? 'Edit Data' : 'Edit & Verifikasi'}
                    </button>
                  </div>
                </>
              ) : (
                /* EDIT MODE */
                <>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', marginBottom: 12 }}>✏️ Edit Data Aset</div>
                  <div style={S.fieldRow}>
                    {(EDITABLE_FIELDS[currentAsset._table] || []).map(f => (
                      <div key={f.key}>
                        <div style={S.fieldLabel}>{f.label}</div>
                        {f.type === 'select' ? (
                          <select style={S.fieldInput} value={editData[f.key] || ''} onChange={e => setEditData(prev => ({ ...prev, [f.key]: e.target.value }))}>
                            <option value="">—</option>
                            {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : (
                          <input type={f.type} style={S.fieldInput} value={editData[f.key] || ''} onChange={e => setEditData(prev => ({ ...prev, [f.key]: e.target.value }))} />
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button onClick={() => setPanelMode('view')} style={{ ...S.navBtn(false), flex: 1, padding: 10 }}>Batal</button>
                    <button onClick={handleSaveEdit} disabled={saving} style={{ ...S.navBtn(true), flex: 1, padding: 10, background: '#22c55e' }}>
                      {saving ? '...' : <><Save size={14} /> Simpan</>}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* CREATE PANEL */}
        {showPanel && panelMode === 'create' && (
          <div style={S.sidePanel}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#22c55e' }}>
                <Plus size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                Tambah Aset Baru
              </div>
              <button onClick={() => setShowPanel(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
            </div>
            <div style={{ padding: 16 }}>
              <div style={S.fieldLabel}>Tipe Aset</div>
              <select style={{ ...S.fieldInput, marginBottom: 12 }} value={editData._table || 'tiang_jtm'} onChange={e => setEditData(prev => ({ ...prev, _table: e.target.value }))}>
                {Object.entries(TABLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>

              <div style={S.fieldRow}>
                {(EDITABLE_FIELDS[editData._table || 'tiang_jtm'] || []).map(f => (
                  <div key={f.key}>
                    <div style={S.fieldLabel}>{f.label}</div>
                    {f.type === 'select' ? (
                      <select style={S.fieldInput} value={editData[f.key] || ''} onChange={e => setEditData(prev => ({ ...prev, [f.key]: e.target.value }))}>
                        <option value="">—</option>
                        {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input type={f.type} style={S.fieldInput} value={editData[f.key] || ''} onChange={e => setEditData(prev => ({ ...prev, [f.key]: e.target.value }))} />
                    )}
                  </div>
                ))}
              </div>
              
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 8, fontFamily: 'monospace' }}>
                📍 {editData.latitude}, {editData.longitude}
              </div>
              
              <button onClick={handleCreate} disabled={saving} style={{ ...S.navBtn(true), width: '100%', background: '#22c55e', padding: 12, marginTop: 12 }}>
                {saving ? 'Menyimpan...' : <><Plus size={16} /> Simpan Aset Baru</>}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM NAVIGATION BAR */}
      {selectedFeeder && filteredAssets.length > 0 && (
        <div style={S.navBar}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Asset counter */}
            <div style={{ fontSize: 12, color: '#94a3b8' }}>
              <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 16 }}>
                {curFilterIdx >= 0 ? curFilterIdx + 1 : '—'}
              </span>
              <span> / {filteredAssets.length}</span>
              {currentAsset && (
                <span style={{ marginLeft: 8, fontSize: 11, color: TABLE_COLORS[currentAsset._table] }}>
                  {getAssetName(currentAsset)}
                </span>
              )}
            </div>

            {/* Navigation buttons */}
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => goTo(0)} disabled={curFilterIdx <= 0} style={S.navBtn(false)}>
                <SkipBack size={14} />
              </button>
              <button onClick={goPrev} disabled={curFilterIdx <= 0} style={S.navBtn(false)}>
                <ChevronLeft size={16} /> Prev
              </button>
              <button onClick={goNext} disabled={curFilterIdx >= filteredAssets.length - 1}
                style={{ ...S.navBtn(true), background: curFilterIdx < filteredAssets.length - 1 ? '#3b82f6' : '#1e293b' }}>
                Next <ChevronRight size={16} />
              </button>
              <button onClick={() => goTo(filteredAssets.length - 1)} disabled={curFilterIdx >= filteredAssets.length - 1} style={S.navBtn(false)}>
                <SkipForward size={14} />
              </button>
            </div>

            {/* Add new */}
            <button onClick={() => { setPanelMode('create'); setShowPanel(true); setEditData({ penyulang: selectedFeeder, feeder: selectedFeeder, _table: 'tiang_jtm', latitude: String(userPosition?.lat || ''), longitude: String(userPosition?.lng || '') }); }}
              style={{ ...S.navBtn(false), background: '#064e3b', color: '#22c55e' }}>
              <Plus size={16} /> Tambah
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
