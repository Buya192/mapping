'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { DataPageShell } from '@/components/common/DataPageShell';
import { Cable, Edit3, Save, X, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

// ─── Types ───
interface JTRRow {
  id: string;
  name?: string;
  description?: string;
  namaGardu?: string;
  penyulang?: string;
  fasaJaringan?: string;
  jenisKabel?: string;
  ukuranKawat?: string;
  jurusan?: string;
  feature?: string;
  panjangHantaran?: number;
  kodeHantaran?: string;
  hantaranNetral?: string;
  posisiFasa?: string;
  classification?: string;
  cxunit?: string;
  orgid?: string;
  siteid?: string;
  parent?: string;
  verified?: boolean;
  [key: string]: unknown;
}

// ─── Constants ───
const JENIS_KABEL = ['TIC', 'LVTC', 'NFA2X', 'NYFGBY', 'AAACS', 'NYA', 'NYM', 'NYMHY', 'TWISTED', 'MVTIC', 'SUTM', 'SUTR', 'LVTIC'];
const UKURAN_KAWAT = ['2x10', '2x16', '2x25', '3x25', '3x35', '3x50', '3x70', '3x95', '3x120', '3x150', '4x16', '4x25', '4x50', '4x70', '4x95', '4x120', '4x150', '1x16', '1x25', '1x35', '1x50', '1x70'];
const FASA = ['1', '2', '3', 'R', 'S', 'T', 'RS', 'RT', 'ST', 'RST'];
const JURUSAN = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'UTAMA'];
const CIRCUIT_TYPES = ['Single circuit', 'Double circuit', 'Underbuilt', 'Triple circuit', 'Multi circuit'];
const KONSTRUKSI = ['TM1', 'TM2', 'TM3', 'TM5', 'TM7', 'TR1', 'TR3', 'TR5', 'SA', 'SA1', 'SC', 'FDE', 'RCD'];

export default function JTRDataPage() {
  const [data, setData] = useState<JTRRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [addingNew, setAddingNew] = useState(false);
  const [newData, setNewData] = useState<Record<string, string>>({});

  // ─── Load from Supabase ───
  useEffect(() => {
    setLoading(true);
    fetch('/api/dream/asset?table=jtr_segments&limit=5000&all=true')
      .then(r => r.ok ? r.json() : { data: [] })
      .then(res => {
        const items = (res.data || []).map((t: JTRRow) => ({
          ...t,
          namaGardu: t.namaGardu || '-',
          penyulang: t.penyulang || '-',
          jenisKabel: t.jenisKabel || '-',
          ukuranKawat: t.ukuranKawat || '-',
          fasaJaringan: t.fasaJaringan || '-',
          jurusan: t.jurusan || '-',
          verified: !!t.verified,
        }));
        setData(items);
        setLoading(false);
      })
      .catch(() => { setData([]); setLoading(false); });
  }, []);

  // ─── Start editing ───
  const startEdit = useCallback((row: JTRRow) => {
    setEditingId(row.id);
    setEditData({
      namaGardu: row.namaGardu || '',
      penyulang: row.penyulang || '',
      fasaJaringan: row.fasaJaringan || '',
      jenisKabel: row.jenisKabel || '',
      ukuranKawat: row.ukuranKawat || '',
      jurusan: row.jurusan || '',
      panjangHantaran: String(row.panjangHantaran || ''),
      kodeHantaran: row.kodeHantaran || '',
      hantaranNetral: row.hantaranNetral || '',
      posisiFasa: row.posisiFasa || '',
      description: row.description || '',
      classification: row.classification || '',
      feature: row.feature || '',
    });
  }, []);

  // ─── Save edit ───
  const saveEdit = useCallback(async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const res = await fetch('/api/dream/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'edit', table: 'jtr_segments', id: editingId, data: editData }),
      });
      if (res.ok) {
        setData(prev => prev.map(r => r.id === editingId ? { ...r, ...editData } : r));
        setEditingId(null);
      }
    } catch (e) { console.error(e); }
    setSaving(false);
  }, [editingId, editData]);

  // ─── Save new ───
  const saveNew = useCallback(async () => {
    if (!newData.namaGardu || !newData.penyulang) return;
    setSaving(true);
    try {
      const res = await fetch('/api/dream/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', table: 'jtr_segments', data: newData }),
      });
      if (res.ok) {
        const result = await res.json();
        setData(prev => [{ ...newData, id: result.id || Date.now().toString(), verified: false } as JTRRow, ...prev]);
        setAddingNew(false);
        setNewData({});
      }
    } catch (e) { console.error(e); }
    setSaving(false);
  }, [newData]);

  // ─── Delete ───
  const deleteRow = useCallback(async (id: string) => {
    if (!confirm('Yakin hapus segmen JTR ini?')) return;
    try {
      const res = await fetch('/api/dream/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', table: 'jtr_segments', id }),
      });
      if (res.ok) setData(prev => prev.filter(r => r.id !== id));
    } catch (e) { console.error(e); }
  }, []);

  // ─── Helpers ───
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
      title="Data JTR — Jaringan Tegangan Rendah"
      source="Supabase — jtr_segments"
      icon={<Cable size={24} />}
      accentColor="f59e0b"
      data={data}
      filterKey="penyulang"
      filterLabel="Penyulang"
      searchKeys={['namaGardu', 'penyulang', 'description', 'jurusan', 'jenisKabel', 'ukuranKawat', 'kodeHantaran']}
      headerActions={
        <button
          onClick={() => { setAddingNew(!addingNew); setNewData({ jenisKabel: 'TIC', ukuranKawat: '3x70', fasaJaringan: '3', jurusan: 'A', feature: 'SUTR' }); }}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: '1px solid #22c55e40', background: '#22c55e15', color: '#22c55e', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
        >
          <Plus size={14} /> Tambah JTR
        </button>
      }
      columns={[
        { key: 'cxunit', label: 'Unit', format: (v: string) => <span style={{ fontSize: 11, color: '#a1a1aa' }}>{v || '-'}</span> },
        { key: 'namaGardu', label: 'Gardu', format: (v: string) => <span style={{ fontSize: 11, fontWeight: 700, color: '#06b6d4' }}>{v}</span> },
        { key: 'penyulang', label: 'Penyulang', format: (v: string) => v && v !== '-' ? (
          <Link href={`/verifikasi?feeder=${encodeURIComponent(v)}`}
            style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', background: '#f59e0b15', padding: '2px 8px', borderRadius: 4, textDecoration: 'none' }}
          >{v}</Link>
        ) : <span style={{ color: '#3f3f46' }}>—</span> },
        { key: 'jurusan', label: 'Jurusan', align: 'center' as const, format: (v: string) => v && v !== '-' ? (
          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#8b5cf620', color: '#a78bfa' }}>{v}</span>
        ) : <span style={{ color: '#3f3f46' }}>—</span> },
        { key: 'jenisKabel', label: '🔌 Jenis Kabel', format: (v: string) => {
          if (!v || v === '-') return <span style={{ color: '#3f3f46' }}>—</span>;
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Cable size={12} style={{ color: '#f97316' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#fb923c' }}>{v}</span>
            </div>
          );
        }},
        { key: 'ukuranKawat', label: 'Ukuran', align: 'center' as const, format: (v: string) => v && v !== '-' ? (
          <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#f9731620', color: '#fdba74' }}>{v}</span>
        ) : <span style={{ color: '#3f3f46' }}>—</span> },
        { key: 'fasaJaringan', label: 'Fasa', align: 'center' as const, format: (v: string) => v && v !== '-' ? (
          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#3b82f620', color: '#60a5fa' }}>{v}φ</span>
        ) : <span style={{ color: '#3f3f46' }}>—</span> },
        { key: 'panjangHantaran', label: 'Panjang (km)', align: 'right' as const, format: (v: number) => (
          <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 600, color: '#4ade80' }}>{v ? Number(v).toFixed(3) : '-'}</span>
        )},
        { key: 'verified', label: 'Status', align: 'center' as const, format: (v: boolean) => (
          v ? <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#22c55e15', color: '#4ade80', border: '1px solid #22c55e30' }}>✓ Verified</span>
            : <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#f59e0b15', color: '#fbbf24', border: '1px solid #f59e0b30' }}>Pending</span>
        )},
        { key: 'id', label: 'Aksi', align: 'center' as const, format: (_v: unknown, row: JTRRow) => (
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
            <button onClick={(e) => { e.stopPropagation(); startEdit(row); }}
              style={{ ...actionBtnStyle, color: '#60a5fa', borderColor: '#3b82f640' }}>
              <Edit3 size={12} /> Edit
            </button>
            <button onClick={(e) => { e.stopPropagation(); deleteRow(row.id); }}
              style={{ ...actionBtnStyle, color: '#f87171', borderColor: '#ef444440' }}>
              <Trash2 size={12} />
            </button>
          </div>
        )},
      ]}
      renderExpanded={(row: JTRRow) => {
        const isEditing = editingId === row.id;

        return (
          <tr>
            <td colSpan={100} style={{ padding: 0, background: '#0c1222', borderBottom: '2px solid #1e293b' }}>
              <div style={{ padding: '16px 20px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>
                    🔌 Detail JTR — <span style={{ color: '#f59e0b' }}>Gardu {row.namaGardu}</span>
                    <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>Jurusan {row.jurusan}</span>
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
                  {/* Col 1: Info Segmen */}
                  <div style={sectionStyle}>
                    <div style={sectionTitleStyle}>📋 Data Segmen JTR</div>
                    <div style={fieldGridStyle}>
                      <FieldDisplay label="Gardu" value={isEditing ? renderInput(editData.namaGardu, 'namaGardu') : row.namaGardu} />
                      <FieldDisplay label="Penyulang" value={isEditing ? renderInput(editData.penyulang, 'penyulang') : row.penyulang} />
                      <FieldDisplay label="Jurusan" value={isEditing ? renderSelect(editData.jurusan, 'jurusan', JURUSAN) : row.jurusan} />
                      <FieldDisplay label="Fasa" value={isEditing ? renderSelect(editData.fasaJaringan, 'fasaJaringan', FASA) : `${row.fasaJaringan}φ`} />
                      <FieldDisplay label="Feature" value={isEditing ? renderInput(editData.feature, 'feature') : (row.feature || '-')} />
                      <FieldDisplay label="Deskripsi" value={isEditing ? renderInput(editData.description, 'description') : (row.description || '-')} />
                    </div>
                  </div>

                  {/* Col 2: Data Kabel */}
                  <div style={sectionStyle}>
                    <div style={{ ...sectionTitleStyle, color: '#f97316' }}>🔌 Data Kabel & Penghantar</div>
                    <div style={fieldGridStyle}>
                      <FieldDisplay label="Jenis Kabel" value={isEditing ? renderSelect(editData.jenisKabel, 'jenisKabel', JENIS_KABEL) : row.jenisKabel} />
                      <FieldDisplay label="Ukuran Kawat" value={isEditing ? renderSelect(editData.ukuranKawat, 'ukuranKawat', UKURAN_KAWAT) : row.ukuranKawat} />
                      <FieldDisplay label="Panjang (km)" value={isEditing ? renderInput(editData.panjangHantaran, 'panjangHantaran') : String(row.panjangHantaran?.toFixed(3) || '-')} />
                      <FieldDisplay label="Kode Hantaran" value={isEditing ? renderInput(editData.kodeHantaran, 'kodeHantaran') : (row.kodeHantaran || '-')} />
                      <FieldDisplay label="Hantaran Netral" value={isEditing ? renderInput(editData.hantaranNetral, 'hantaranNetral') : (row.hantaranNetral || '-')} />
                      <FieldDisplay label="Posisi Fasa" value={isEditing ? renderInput(editData.posisiFasa, 'posisiFasa') : (row.posisiFasa || '-')} />
                    </div>
                  </div>

                  {/* Col 3: Klasifikasi & Info */}
                  <div style={sectionStyle}>
                    <div style={{ ...sectionTitleStyle, color: '#22d3ee' }}>⚡ Klasifikasi & Circuit</div>
                    <div style={fieldGridStyle}>
                      <FieldDisplay label="Klasifikasi" value={isEditing ? renderInput(editData.classification, 'classification') : (row.classification || '-')} />
                      <FieldDisplay label="Unit" value={row.cxunit || row.siteid || '-'} />
                      <FieldDisplay label="Parent" value={row.parent || '-'} />
                    </div>
                    {!isEditing && (
                      <div style={{ marginTop: 12 }}>
                        <Link
                          href={`/verifikasi?feeder=${encodeURIComponent(row.penyulang || '')}`}
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
            <div style={{ fontSize: 14, fontWeight: 700, color: '#22c55e' }}>➕ Tambah Segmen JTR Baru</div>
            <button onClick={() => setAddingNew(false)} style={actionBtnStyle}><X size={12} /> Batal</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <div style={sectionTitleStyle}>Data Segmen</div>
              <div style={fieldGridStyle}>
                <FieldDisplay label="Gardu *" value={renderInput(newData.namaGardu || '', 'namaGardu', true, 'Cth: AT001')} />
                <FieldDisplay label="Penyulang *" value={renderInput(newData.penyulang || '', 'penyulang', true, 'Cth: BINONGKO')} />
                <FieldDisplay label="Jurusan" value={renderSelect(newData.jurusan || 'A', 'jurusan', JURUSAN, true)} />
                <FieldDisplay label="Fasa" value={renderSelect(newData.fasaJaringan || '3', 'fasaJaringan', FASA, true)} />
                <FieldDisplay label="Feature" value={renderInput(newData.feature || 'SUTR', 'feature', true)} />
                <FieldDisplay label="Deskripsi" value={renderInput(newData.description || '', 'description', true, 'Cth: SUTR GARDU AT01...')} />
              </div>
            </div>
            <div>
              <div style={{ ...sectionTitleStyle, color: '#f97316' }}>Data Kabel</div>
              <div style={fieldGridStyle}>
                <FieldDisplay label="Jenis Kabel" value={renderSelect(newData.jenisKabel || 'TIC', 'jenisKabel', JENIS_KABEL, true)} />
                <FieldDisplay label="Ukuran Kawat" value={renderSelect(newData.ukuranKawat || '3x70', 'ukuranKawat', UKURAN_KAWAT, true)} />
                <FieldDisplay label="Konstruksi" value={renderSelect(newData.konstruksi || '', 'konstruksi', KONSTRUKSI, true)} />
                <FieldDisplay label="Circuit" value={renderSelect(newData.circuit || '', 'circuit', CIRCUIT_TYPES, true)} />
                <FieldDisplay label="Panjang (km)" value={renderInput(newData.panjangHantaran || '', 'panjangHantaran', true, '0.000')} />
                <FieldDisplay label="Kode Hantaran" value={renderInput(newData.kodeHantaran || '', 'kodeHantaran', true)} />
              </div>
            </div>
            <div>
              <div style={{ ...sectionTitleStyle, color: '#22d3ee' }}>Info Lokasi</div>
              <div style={fieldGridStyle}>
                <FieldDisplay label="Klasifikasi" value={renderInput(newData.classification || '', 'classification', true)} />
                <FieldDisplay label="Unit" value={renderInput(newData.cxunit || '', 'cxunit', true)} />
              </div>
              <button onClick={saveNew} disabled={saving || !newData.namaGardu || !newData.penyulang}
                style={{ marginTop: 16, width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: (newData.namaGardu && newData.penyulang) ? '#22c55e' : '#1e293b', color: '#fff', fontSize: 13, fontWeight: 700, cursor: (newData.namaGardu && newData.penyulang) ? 'pointer' : 'not-allowed' }}
              >
                {saving ? 'Menyimpan...' : '💾 Simpan Segmen JTR'}
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
