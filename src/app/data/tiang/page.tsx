'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { DataPageShell } from '@/components/common/DataPageShell';
import { MapPin, Cable, Edit3, Save, X, Plus } from 'lucide-react';
import Link from 'next/link';

// ─── Types ───
interface TiangRow {
  id: number;
  nama_tiang: string;
  penyulang: string;
  namaGardu: string;
  jenis_tiang: string;
  ukuranTiang: string;
  konstruksi_1: string;
  konstruksi_2: string;
  jenis_hantaran_1: string;
  ukuran_hantaran_1: string;
  jenis_hantaran_2: string;
  ukuran_hantaran_2: string;
  under_built: string;
  kondisiTiang: string;
  latitude: number;
  longitude: number;
  verified: boolean;
  kekuatan_tiang: number;
  pondasi_tiang: string;
  urutan_tiang: number;
  alamat: string;
  kelurahan: string;
  kecamatan: string;
  [key: string]: unknown;
}

const CABLE_TYPES = ['TIC', 'AAAC', 'ACSR', 'ACCC', 'MVTIC', 'XLPE', 'UNDERBUILT', 'ONLY'];
const CABLE_SIZES = ['3x35', '3x50', '3x70', '3x95', '3x120', '3x150', '3x240', '1x35', '1x50', '1x70'];
const KONSTRUKSI = ['SA', 'LA', 'FDE', 'TA', 'TM-1', 'TM-2', 'TM-3', 'TM-5', 'TM-7', 'TM-9', 'AA', 'AJ'];
const JENIS_TIANG = ['BESI', 'BETON', 'KAYU'];
const KONDISI = ['Baik', 'Rusak Ringan', 'Rusak Berat', 'Miring', 'Patah'];
const UKURAN_TIANG = ['7/100', '9/100', '9/156', '9/200', '11/156', '11/200', '11/350', '12/200', '12/350', '13/350', '14/350'];

export default function TiangDataPage() {
  const [data, setData] = useState<TiangRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [addingNew, setAddingNew] = useState(false);
  const [newData, setNewData] = useState<Record<string, string>>({});

  // ─── Load from Supabase ───
  useEffect(() => {
    setLoading(true);
    fetch('/api/dream/asset?table=tiang_jtm&limit=20000&all=true')
      .then(r => r.ok ? r.json() : { data: [] })
      .then(res => {
        const items = (res.data || []).map((t: TiangRow) => ({
          ...t,
          nama_tiang: t.nama_tiang || '-',
          penyulang: t.penyulang || '-',
          namaGardu: t.namaGardu || '-',
          jenis_tiang: t.jenis_tiang || '-',
          ukuranTiang: t.ukuranTiang || '-',
          konstruksi_1: t.konstruksi_1 || '-',
          jenis_hantaran_1: t.jenis_hantaran_1 || '-',
          ukuran_hantaran_1: t.ukuran_hantaran_1 || '-',
          kondisiTiang: t.kondisiTiang || '-',
          verified: !!t.verified,
        }));
        setData(items);
        setLoading(false);
      })
      .catch(() => { setData([]); setLoading(false); });
  }, []);

  // ─── Start editing ───
  const startEdit = useCallback((tiang: TiangRow) => {
    setEditingId(tiang.id);
    setEditData({
      nama_tiang: tiang.nama_tiang || '',
      penyulang: tiang.penyulang || '',
      namaGardu: tiang.namaGardu || '',
      jenis_tiang: tiang.jenis_tiang || '',
      ukuranTiang: tiang.ukuranTiang || '',
      konstruksi_1: tiang.konstruksi_1 || '',
      konstruksi_2: tiang.konstruksi_2 || '',
      jenis_hantaran_1: tiang.jenis_hantaran_1 || '',
      ukuran_hantaran_1: tiang.ukuran_hantaran_1 || '',
      jenis_hantaran_2: tiang.jenis_hantaran_2 || '',
      ukuran_hantaran_2: tiang.ukuran_hantaran_2 || '',
      under_built: tiang.under_built || '',
      kondisiTiang: tiang.kondisiTiang || '',
      pondasi_tiang: tiang.pondasi_tiang || '',
      kekuatan_tiang: String(tiang.kekuatan_tiang || ''),
      alamat: tiang.alamat || '',
    });
  }, []);

  // ─── Save edit ───
  const saveEdit = useCallback(async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      await fetch('/api/dream/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit',
          asset_table: 'tiang_jtm',
          asset_id: editingId,
          data: editData,
          verified_by: 'Admin',
        }),
      });
      // Update local
      setData(prev => prev.map(t =>
        t.id === editingId ? { ...t, ...editData, verified: true } as TiangRow : t
      ));
      setEditingId(null);
    } catch { /* ignore */ }
    setSaving(false);
  }, [editingId, editData]);

  // ─── Add new tiang ───
  const saveNew = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/dream/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          asset_table: 'tiang_jtm',
          data: newData,
          verified_by: 'Admin',
        }),
      });
      const result = await res.json();
      if (result.success) {
        // Reload
        const reload = await fetch('/api/dream/asset?table=tiang_jtm&limit=20000');
        const reloadData = await reload.json();
        setData(reloadData.data || []);
        setAddingNew(false);
        setNewData({});
      }
    } catch { /* ignore */ }
    setSaving(false);
  }, [newData]);

  // ─── Render select field ───
  const renderSelect = (value: string, key: string, options: string[], isNew = false) => (
    <select
      value={value}
      onChange={e => isNew 
        ? setNewData(p => ({ ...p, [key]: e.target.value }))
        : setEditData(p => ({ ...p, [key]: e.target.value }))
      }
      style={fieldInputStyle}
    >
      <option value="">— Pilih —</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  const renderInput = (value: string, key: string, isNew = false, placeholder = '') => (
    <input
      type="text" value={value} placeholder={placeholder}
      onChange={e => isNew
        ? setNewData(p => ({ ...p, [key]: e.target.value }))
        : setEditData(p => ({ ...p, [key]: e.target.value }))
      }
      style={fieldInputStyle}
    />
  );

  return (
    <DataPageShell
      title="Data Tiang & Kabel Melekat"
      source="Supabase — tiang_jtm"
      icon={<MapPin size={24} />}
      accentColor="3b82f6"
      data={data}
      filterKey="penyulang"
      filterLabel="Penyulang"
      searchKeys={['nama_tiang', 'penyulang', 'namaGardu', 'jenis_hantaran_1', 'kondisiTiang']}
      headerActions={
        <button
          onClick={() => { setAddingNew(!addingNew); setNewData({ jenis_tiang: 'BESI', ukuranTiang: '11/200', konstruksi_1: 'SA', jenis_hantaran_1: 'TIC', ukuran_hantaran_1: '3x70' }); }}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: '1px solid #22c55e40', background: '#22c55e15', color: '#22c55e', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
        >
          <Plus size={14} /> Tambah Tiang
        </button>
      }
      columns={[
        { key: 'nama_tiang', label: 'No Tiang', format: (v: string) => <span style={{ fontWeight: 700, color: '#f1f5f9' }}>{v}</span> },
        { key: 'penyulang', label: 'Penyulang', format: (v: string) => v && v !== '-' ? (
          <Link href={`/verifikasi?feeder=${encodeURIComponent(v)}`}
            style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', background: '#f59e0b15', padding: '2px 8px', borderRadius: 4, textDecoration: 'none' }}
          >{v}</Link>
        ) : <span style={{ color: '#3f3f46' }}>—</span> },
        { key: 'namaGardu', label: 'Gardu', format: (v: string) => <span style={{ fontSize: 11, color: '#06b6d4', fontWeight: 500 }}>{v}</span> },
        { key: 'jenis_tiang', label: 'Bahan', format: (v: string) => <span style={{ fontSize: 11, color: '#a1a1aa' }}>{v}</span> },
        { key: 'ukuranTiang', label: 'Ukuran', align: 'center' as const, format: (v: string) => <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#d4d4d8' }}>{v}</span> },
        { key: 'konstruksi_1', label: 'Konstruksi', align: 'center' as const, format: (v: string, row: TiangRow) => (
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#8b5cf620', color: '#a78bfa' }}>
            {v}{row.konstruksi_2 && row.konstruksi_2 !== '-' ? ` + ${row.konstruksi_2}` : ''}
          </span>
        )},
        { key: 'jenis_hantaran_1', label: '🔌 Kabel JTM', format: (v: string, row: TiangRow) => {
          if (!v || v === '-') return <span style={{ color: '#3f3f46' }}>—</span>;
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Cable size={12} style={{ color: '#f97316' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#fb923c' }}>{v}</span>
              {row.ukuran_hantaran_1 && row.ukuran_hantaran_1 !== '-' && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: '#f9731620', color: '#fdba74' }}>
                  {row.ukuran_hantaran_1}
                </span>
              )}
            </div>
          );
        }},
        { key: 'under_built', label: 'UB/JTR', align: 'center' as const, format: (v: string) => {
          if (!v || v === '-' || v === '0') return <span style={{ color: '#3f3f46' }}>—</span>;
          return <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#06b6d420', color: '#22d3ee' }}>UB</span>;
        }},
        { key: 'kondisiTiang', label: 'Kondisi', align: 'center' as const, format: (v: string) => {
          if (!v || v === '-') return <span style={{ color: '#3f3f46' }}>—</span>;
          const isGood = v === 'Baik' || v === 'BAIK';
          return <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: isGood ? '#22c55e15' : '#ef444415', color: isGood ? '#4ade80' : '#f87171', textTransform: 'uppercase' }}>{v}</span>;
        }},
        { key: 'verified', label: 'Status', align: 'center' as const, format: (v: boolean) => (
          v ? <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#22c55e15', color: '#4ade80', border: '1px solid #22c55e30' }}>✓ Verified</span>
            : <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#f59e0b15', color: '#fbbf24', border: '1px solid #f59e0b30' }}>Pending</span>
        )},
        { key: 'id', label: 'Aksi', align: 'center' as const, format: (_v: unknown, row: TiangRow) => (
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
            <button onClick={(e) => { e.stopPropagation(); startEdit(row); }}
              style={{ ...actionBtnStyle, color: '#60a5fa', borderColor: '#3b82f640' }}>
              <Edit3 size={12} /> Edit
            </button>
          </div>
        )},
      ]}
      renderExpanded={(row: TiangRow) => {
        const isEditing = editingId === row.id;

        return (
          <tr>
            <td colSpan={100} style={{ padding: 0, background: '#0c1222', borderBottom: '2px solid #1e293b' }}>
              <div style={{ padding: '16px 20px' }}>
                {/* ─── Header ─── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>
                    📍 Detail Tiang <span style={{ color: '#3b82f6' }}>{row.nama_tiang}</span>
                    <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8, fontFamily: 'monospace' }}>
                      ({row.latitude?.toFixed(6)}, {row.longitude?.toFixed(6)})
                    </span>
                  </div>
                  {isEditing && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setEditingId(null)} style={{ ...actionBtnStyle, padding: '6px 12px' }}>
                        <X size={12} /> Batal
                      </button>
                      <button onClick={saveEdit} disabled={saving}
                        style={{ ...actionBtnStyle, padding: '6px 12px', color: '#4ade80', borderColor: '#22c55e60', background: '#22c55e10' }}>
                        <Save size={12} /> {saving ? 'Menyimpan...' : 'Simpan'}
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  {/* ─── Kolom 1: Info Tiang ─── */}
                  <div style={sectionStyle}>
                    <div style={sectionTitleStyle}>🏗️ Data Tiang</div>
                    <div style={fieldGridStyle}>
                      <FieldDisplay label="No Tiang" value={isEditing ? renderInput(editData.nama_tiang, 'nama_tiang') : row.nama_tiang} />
                      <FieldDisplay label="Penyulang" value={isEditing ? renderInput(editData.penyulang, 'penyulang') : row.penyulang} />
                      <FieldDisplay label="Gardu" value={isEditing ? renderInput(editData.namaGardu, 'namaGardu') : row.namaGardu} />
                      <FieldDisplay label="Bahan" value={isEditing ? renderSelect(editData.jenis_tiang, 'jenis_tiang', JENIS_TIANG) : row.jenis_tiang} />
                      <FieldDisplay label="Ukuran" value={isEditing ? renderSelect(editData.ukuranTiang, 'ukuranTiang', UKURAN_TIANG) : row.ukuranTiang} />
                      <FieldDisplay label="Pondasi" value={isEditing ? renderInput(editData.pondasi_tiang, 'pondasi_tiang') : (row.pondasi_tiang || '-')} />
                      <FieldDisplay label="Kekuatan (daN)" value={isEditing ? renderInput(editData.kekuatan_tiang, 'kekuatan_tiang') : String(row.kekuatan_tiang || '-')} />
                      <FieldDisplay label="Kondisi" value={isEditing ? renderSelect(editData.kondisiTiang, 'kondisiTiang', KONDISI) : row.kondisiTiang} />
                      <FieldDisplay label="Alamat" value={isEditing ? renderInput(editData.alamat, 'alamat') : (row.alamat || '-')} />
                    </div>
                  </div>

                  {/* ─── Kolom 2: Kabel JTM Melekat ─── */}
                  <div style={sectionStyle}>
                    <div style={{ ...sectionTitleStyle, color: '#f97316' }}>🔌 Kabel JTM Melekat</div>
                    <div style={fieldGridStyle}>
                      <FieldDisplay label="Konstruksi 1" value={isEditing ? renderSelect(editData.konstruksi_1, 'konstruksi_1', KONSTRUKSI) : row.konstruksi_1} />
                      <FieldDisplay label="Jenis Penghantar 1" value={isEditing ? renderSelect(editData.jenis_hantaran_1, 'jenis_hantaran_1', CABLE_TYPES) : row.jenis_hantaran_1} />
                      <FieldDisplay label="Ukuran (mm²)" value={isEditing ? renderSelect(editData.ukuran_hantaran_1, 'ukuran_hantaran_1', CABLE_SIZES) : row.ukuran_hantaran_1} />
                    </div>
                    <div style={{ borderTop: '1px solid #1e293b', margin: '10px 0', paddingTop: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>SALURAN KEDUA (jika ada)</div>
                      <div style={fieldGridStyle}>
                        <FieldDisplay label="Konstruksi 2" value={isEditing ? renderSelect(editData.konstruksi_2, 'konstruksi_2', KONSTRUKSI) : (row.konstruksi_2 || '-')} />
                        <FieldDisplay label="Jenis Penghantar 2" value={isEditing ? renderSelect(editData.jenis_hantaran_2, 'jenis_hantaran_2', CABLE_TYPES) : (row.jenis_hantaran_2 || '-')} />
                        <FieldDisplay label="Ukuran 2 (mm²)" value={isEditing ? renderSelect(editData.ukuran_hantaran_2, 'ukuran_hantaran_2', CABLE_SIZES) : (row.ukuran_hantaran_2 || '-')} />
                      </div>
                    </div>
                  </div>

                  {/* ─── Kolom 3: Under Built / JTR ─── */}
                  <div style={sectionStyle}>
                    <div style={{ ...sectionTitleStyle, color: '#22d3ee' }}>⚡ Under Built / JTR</div>
                    <div style={fieldGridStyle}>
                      <FieldDisplay label="Under Built" value={isEditing ? renderInput(editData.under_built, 'under_built') : (row.under_built || '-')} />
                    </div>
                    <div style={{ borderTop: '1px solid #1e293b', margin: '12px 0', paddingTop: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>INFO TAMBAHAN</div>
                      <div style={fieldGridStyle}>
                        <FieldDisplay label="Kelurahan" value={row.kelurahan || '-'} />
                        <FieldDisplay label="Kecamatan" value={row.kecamatan || '-'} />
                        <FieldDisplay label="Urutan" value={String(row.urutan_tiang || '-')} />
                      </div>
                    </div>

                    {!isEditing && (
                      <div style={{ marginTop: 12 }}>
                        <Link
                          href={`/verifikasi?feeder=${encodeURIComponent(row.penyulang)}`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#22c55e', background: '#22c55e15', padding: '6px 12px', borderRadius: 6, textDecoration: 'none', border: '1px solid #22c55e30' }}
                        >
                          🧭 Walk the Line — {row.penyulang}
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </td>
          </tr>
        );
      }}
      renderBeforeTable={addingNew ? (
        <div style={{ margin: '0 0 16px', padding: 20, background: '#0c1222', borderRadius: 12, border: '1px solid #22c55e30' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#22c55e' }}>➕ Tambah Tiang Baru + Data Kabel</div>
            <button onClick={() => setAddingNew(false)} style={actionBtnStyle}><X size={12} /> Batal</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <div style={sectionTitleStyle}>Data Tiang</div>
              <div style={fieldGridStyle}>
                <FieldDisplay label="No Tiang *" value={renderInput(newData.nama_tiang || '', 'nama_tiang', true, 'Cth: A1')} />
                <FieldDisplay label="Penyulang *" value={renderInput(newData.penyulang || '', 'penyulang', true, 'Cth: MALI')} />
                <FieldDisplay label="Gardu" value={renderInput(newData.namaGardu || '', 'namaGardu', true, 'Cth: AT029')} />
                <FieldDisplay label="Bahan" value={renderSelect(newData.jenis_tiang || 'BESI', 'jenis_tiang', JENIS_TIANG, true)} />
                <FieldDisplay label="Ukuran" value={renderSelect(newData.ukuranTiang || '11/200', 'ukuranTiang', UKURAN_TIANG, true)} />
                <FieldDisplay label="Kondisi" value={renderSelect(newData.kondisiTiang || '', 'kondisiTiang', KONDISI, true)} />
                <FieldDisplay label="Latitude *" value={renderInput(newData.latitude || '', 'latitude', true, '-8.xxx')} />
                <FieldDisplay label="Longitude *" value={renderInput(newData.longitude || '', 'longitude', true, '124.xxx')} />
              </div>
            </div>
            <div>
              <div style={{ ...sectionTitleStyle, color: '#f97316' }}>Kabel JTM Melekat</div>
              <div style={fieldGridStyle}>
                <FieldDisplay label="Konstruksi" value={renderSelect(newData.konstruksi_1 || 'SA', 'konstruksi_1', KONSTRUKSI, true)} />
                <FieldDisplay label="Jenis Penghantar" value={renderSelect(newData.jenis_hantaran_1 || 'TIC', 'jenis_hantaran_1', CABLE_TYPES, true)} />
                <FieldDisplay label="Ukuran (mm²)" value={renderSelect(newData.ukuran_hantaran_1 || '3x70', 'ukuran_hantaran_1', CABLE_SIZES, true)} />
              </div>
              <div style={{ borderTop: '1px solid #1e293b', margin: '10px 0', paddingTop: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>SALURAN KEDUA (opsional)</div>
                <div style={fieldGridStyle}>
                  <FieldDisplay label="Konstruksi 2" value={renderSelect(newData.konstruksi_2 || '', 'konstruksi_2', KONSTRUKSI, true)} />
                  <FieldDisplay label="Jenis Penghantar 2" value={renderSelect(newData.jenis_hantaran_2 || '', 'jenis_hantaran_2', CABLE_TYPES, true)} />
                  <FieldDisplay label="Ukuran 2 (mm²)" value={renderSelect(newData.ukuran_hantaran_2 || '', 'ukuran_hantaran_2', CABLE_SIZES, true)} />
                </div>
              </div>
            </div>
            <div>
              <div style={{ ...sectionTitleStyle, color: '#22d3ee' }}>Under Built / JTR</div>
              <div style={fieldGridStyle}>
                <FieldDisplay label="Under Built" value={renderInput(newData.under_built || '', 'under_built', true)} />
                <FieldDisplay label="Alamat" value={renderInput(newData.alamat || '', 'alamat', true)} />
              </div>
              <button onClick={saveNew} disabled={saving || !newData.nama_tiang || !newData.penyulang}
                style={{ marginTop: 16, width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: (newData.nama_tiang && newData.penyulang) ? '#22c55e' : '#1e293b', color: '#fff', fontSize: 13, fontWeight: 700, cursor: (newData.nama_tiang && newData.penyulang) ? 'pointer' : 'not-allowed' }}
              >
                {saving ? 'Menyimpan...' : '💾 Simpan Tiang + Kabel'}
              </button>
            </div>
          </div>
        </div>
      ) : undefined}
    />
  );
}

// ─── Helper Components ───
function FieldDisplay({ label, value }: { label: string; value: string | React.ReactNode }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>{label}</div>
      {typeof value === 'string' ? (
        <div style={{ fontSize: 13, fontWeight: 500, color: value === '-' ? '#3f3f46' : '#e2e8f0' }}>{value}</div>
      ) : value}
    </div>
  );
}

// ─── Styles ───
const fieldInputStyle: React.CSSProperties = {
  width: '100%', padding: '6px 8px', fontSize: 12, borderRadius: 6,
  border: '1px solid #2a3654', background: '#111827', color: '#f1f5f9', outline: 'none',
};

const sectionStyle: React.CSSProperties = {
  background: '#111827', borderRadius: 10, padding: 14, border: '1px solid #1e293b',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: '#3b82f6', marginBottom: 10, 
  display: 'flex', alignItems: 'center', gap: 6,
};

const fieldGridStyle: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px',
};

const actionBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 3, padding: '4px 8px', borderRadius: 5,
  border: '1px solid #334155', background: 'transparent', color: '#94a3b8',
  fontSize: 10, fontWeight: 600, cursor: 'pointer',
};
