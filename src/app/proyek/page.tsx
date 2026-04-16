'use client';

import React, { useState } from 'react';
import { useAssetStore, ProyekPekerjaan, StatusUsulan } from '@/store/assetStore';
import toast from 'react-hot-toast';

const STATUS_CONFIG: Record<StatusUsulan, { label: string; color: string; bg: string; icon: string }> = {
  usulan:    { label: 'Usulan',     color: '#eab308', bg: 'rgba(234,179,8,0.15)',  icon: '📝' },
  disetujui: { label: 'Disetujui',  color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', icon: '✅' },
  progres:   { label: 'Dalam Progres', color: '#f97316', bg: 'rgba(249,115,22,0.15)', icon: '🔧' },
  selesai:   { label: 'Selesai',    color: '#22c55e', bg: 'rgba(34,197,94,0.15)',  icon: '🎉' },
};

const JENIS_OPTIONS = [
  { value: 'perluasan', label: '📡 Perluasan Jaringan' },
  { value: 'pemeliharaan', label: '🔧 Pemeliharaan' },
  { value: 'peningkatan', label: '⬆️ Peningkatan Kapasitas' },
  { value: 'rehabilitasi', label: '🏗️ Rehabilitasi' },
];

function StatusBadge({ status }: { status: StatusUsulan }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30`,
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  const color = value >= 100 ? '#22c55e' : value >= 50 ? '#f97316' : '#3b82f6';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 8, background: 'rgba(100,116,139,0.2)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(value, 100)}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 36, textAlign: 'right' }}>{value}%</span>
    </div>
  );
}

export default function ProyekPage() {
  const { proyekPekerjaan, addProyek, updateProyek, deleteProyek, usulanTiang, usulanJalur, usulanGardu } = useAssetStore();
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editId, setEditId] = useState<string | null>(null);

  const [form, setForm] = useState({
    judul: '', deskripsi: '', penyulang: '', jenis: 'perluasan' as ProyekPekerjaan['jenis'],
    tanggal_target: '', volume_tiang: '', volume_jalur_km: '', volume_gardu: '',
    biaya_estimasi: '', pelaksana: '', catatan: '',
  });

  const resetForm = () => {
    setForm({ judul: '', deskripsi: '', penyulang: '', jenis: 'perluasan', tanggal_target: '', volume_tiang: '', volume_jalur_km: '', volume_gardu: '', biaya_estimasi: '', pelaksana: '', catatan: '' });
    setShowForm(false);
    setEditId(null);
  };

  const handleSubmit = () => {
    if (!form.judul.trim()) { toast.error('Judul proyek harus diisi!'); return; }
    const now = new Date().toISOString();
    if (editId) {
      updateProyek(editId, {
        judul: form.judul, deskripsi: form.deskripsi, penyulang: form.penyulang,
        jenis: form.jenis, tanggal_target: form.tanggal_target,
        volume_tiang: form.volume_tiang ? parseInt(form.volume_tiang) : undefined,
        volume_jalur_km: form.volume_jalur_km ? parseFloat(form.volume_jalur_km) : undefined,
        volume_gardu: form.volume_gardu ? parseInt(form.volume_gardu) : undefined,
        biaya_estimasi: form.biaya_estimasi ? parseFloat(form.biaya_estimasi) : undefined,
        pelaksana: form.pelaksana, catatan: form.catatan,
      });
      toast.success('Proyek diperbarui!');
    } else {
      addProyek({
        id: 'PRJ_' + Date.now(),
        judul: form.judul, deskripsi: form.deskripsi, penyulang: form.penyulang,
        jenis: form.jenis, status: 'usulan', tanggal_usulan: now,
        tanggal_target: form.tanggal_target, progress_pct: 0,
        volume_tiang: form.volume_tiang ? parseInt(form.volume_tiang) : undefined,
        volume_jalur_km: form.volume_jalur_km ? parseFloat(form.volume_jalur_km) : undefined,
        volume_gardu: form.volume_gardu ? parseInt(form.volume_gardu) : undefined,
        biaya_estimasi: form.biaya_estimasi ? parseFloat(form.biaya_estimasi) : undefined,
        pelaksana: form.pelaksana, catatan: form.catatan,
      });
      toast.success('Proyek berhasil ditambahkan!');
    }
    resetForm();
  };

  const handleEdit = (p: ProyekPekerjaan) => {
    setForm({
      judul: p.judul, deskripsi: p.deskripsi || '', penyulang: p.penyulang || '',
      jenis: p.jenis, tanggal_target: p.tanggal_target || '',
      volume_tiang: p.volume_tiang?.toString() || '', volume_jalur_km: p.volume_jalur_km?.toString() || '',
      volume_gardu: p.volume_gardu?.toString() || '', biaya_estimasi: p.biaya_estimasi?.toString() || '',
      pelaksana: p.pelaksana || '', catatan: p.catatan || '',
    });
    setEditId(p.id);
    setShowForm(true);
  };

  const advanceStatus = (p: ProyekPekerjaan) => {
    const order: StatusUsulan[] = ['usulan', 'disetujui', 'progres', 'selesai'];
    const idx = order.indexOf(p.status);
    if (idx < order.length - 1) {
      const next = order[idx + 1];
      const updates: Partial<ProyekPekerjaan> = { status: next };
      if (next === 'selesai') { updates.progress_pct = 100; updates.tanggal_selesai = new Date().toISOString(); }
      else if (next === 'progres') updates.progress_pct = Math.max(p.progress_pct, 10);
      updateProyek(p.id, updates);
      toast.success(`Status → ${STATUS_CONFIG[next].label}`);
    }
  };

  const filtered = filterStatus === 'all' ? proyekPekerjaan : proyekPekerjaan.filter(p => p.status === filterStatus);

  // Summary stats
  const totalUsulan = proyekPekerjaan.filter(p => p.status === 'usulan').length;
  const totalProgres = proyekPekerjaan.filter(p => p.status === 'progres').length;
  const totalSelesai = proyekPekerjaan.filter(p => p.status === 'selesai').length;

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155',
    borderRadius: 8, color: '#f1f5f9', fontSize: 13, outline: 'none',
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9', marginBottom: 4 }}>📋 Proyek & Progres Pekerjaan</h1>
          <p style={{ color: '#94a3b8', fontSize: 14 }}>Manajemen usulan perluasan, pemeliharaan, dan progres pekerjaan jaringan</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} style={{
          padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8,
          fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
        }}>+ Tambah Proyek</button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Proyek', value: proyekPekerjaan.length, color: '#8b5cf6', icon: '📊' },
          { label: 'Usulan', value: totalUsulan, color: '#eab308', icon: '📝' },
          { label: 'Dalam Progres', value: totalProgres, color: '#f97316', icon: '🔧' },
          { label: 'Selesai', value: totalSelesai, color: '#22c55e', icon: '🎉' },
          { label: 'Aset Usulan', value: usulanTiang.length + usulanJalur.length + usulanGardu.length, color: '#06b6d4', icon: '📍' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.9))',
            border: '1px solid rgba(100,116,139,0.2)', borderLeft: `4px solid ${s.color}`,
            borderRadius: 12, padding: '16px 20px',
          }}>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>{s.icon} {s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#f1f5f9' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['all', 'usulan', 'disetujui', 'progres', 'selesai'].map(st => (
          <button key={st} onClick={() => setFilterStatus(st)} style={{
            padding: '6px 16px', borderRadius: 20, border: '1px solid',
            borderColor: filterStatus === st ? '#3b82f6' : '#334155',
            background: filterStatus === st ? '#3b82f6' : 'transparent',
            color: filterStatus === st ? '#fff' : '#94a3b8', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>
            {st === 'all' ? 'Semua' : STATUS_CONFIG[st as StatusUsulan].icon + ' ' + STATUS_CONFIG[st as StatusUsulan].label}
          </button>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#1e293b', borderRadius: 16, padding: 28, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', border: '1px solid #334155' }}>
            <h2 style={{ color: '#f1f5f9', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
              {editId ? '✏️ Edit Proyek' : '➕ Tambah Proyek Baru'}
            </h2>
            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <label style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Judul Proyek *</label>
                <input style={inputStyle} value={form.judul} onChange={e => setForm(f => ({ ...f, judul: e.target.value }))} placeholder="Perluasan JTM Penyulang MALI Km 5-8" />
              </div>
              <div>
                <label style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Deskripsi</label>
                <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={form.deskripsi} onChange={e => setForm(f => ({ ...f, deskripsi: e.target.value }))} placeholder="Detail pekerjaan..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Jenis</label>
                  <select style={inputStyle} value={form.jenis} onChange={e => setForm(f => ({ ...f, jenis: e.target.value as any }))}>
                    {JENIS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Penyulang</label>
                  <input style={inputStyle} value={form.penyulang} onChange={e => setForm(f => ({ ...f, penyulang: e.target.value }))} placeholder="MALI" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Vol. Tiang</label>
                  <input style={inputStyle} type="number" value={form.volume_tiang} onChange={e => setForm(f => ({ ...f, volume_tiang: e.target.value }))} placeholder="0" />
                </div>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Vol. Jalur (km)</label>
                  <input style={inputStyle} type="number" step="0.1" value={form.volume_jalur_km} onChange={e => setForm(f => ({ ...f, volume_jalur_km: e.target.value }))} placeholder="0" />
                </div>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Vol. Gardu</label>
                  <input style={inputStyle} type="number" value={form.volume_gardu} onChange={e => setForm(f => ({ ...f, volume_gardu: e.target.value }))} placeholder="0" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Target Selesai</label>
                  <input style={inputStyle} type="date" value={form.tanggal_target} onChange={e => setForm(f => ({ ...f, tanggal_target: e.target.value }))} />
                </div>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Estimasi Biaya (Rp)</label>
                  <input style={inputStyle} type="number" value={form.biaya_estimasi} onChange={e => setForm(f => ({ ...f, biaya_estimasi: e.target.value }))} placeholder="0" />
                </div>
              </div>
              <div>
                <label style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Pelaksana</label>
                <input style={inputStyle} value={form.pelaksana} onChange={e => setForm(f => ({ ...f, pelaksana: e.target.value }))} placeholder="Nama kontraktor / tim" />
              </div>
              <div>
                <label style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Catatan</label>
                <textarea style={{ ...inputStyle, minHeight: 50, resize: 'vertical' }} value={form.catatan} onChange={e => setForm(f => ({ ...f, catatan: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button onClick={resetForm} style={{ padding: '10px 20px', background: '#334155', color: '#94a3b8', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Batal</button>
              <button onClick={handleSubmit} style={{ padding: '10px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                {editId ? 'Simpan Perubahan' : 'Tambah Proyek'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Belum ada proyek</div>
          <div style={{ fontSize: 13 }}>Klik "Tambah Proyek" untuk membuat usulan baru</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {filtered.map(p => {
            const jenisLabel = JENIS_OPTIONS.find(j => j.value === p.jenis)?.label || p.jenis;
            return (
              <div key={p.id} style={{
                background: 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.9))',
                border: '1px solid rgba(100,116,139,0.2)', borderRadius: 16, padding: 24,
                borderLeft: `4px solid ${STATUS_CONFIG[p.status].color}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ color: '#f1f5f9', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{p.judul}</h3>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <StatusBadge status={p.status} />
                      <span style={{ fontSize: 12, color: '#64748b', padding: '4px 10px', background: 'rgba(100,116,139,0.1)', borderRadius: 12 }}>{jenisLabel}</span>
                      {p.penyulang && <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>⚡ {p.penyulang}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {p.status !== 'selesai' && (
                      <button onClick={() => advanceStatus(p)} style={{ padding: '6px 14px', background: STATUS_CONFIG[p.status].bg, color: STATUS_CONFIG[p.status].color, border: `1px solid ${STATUS_CONFIG[p.status].color}40`, borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                        Naikkan Status ▶
                      </button>
                    )}
                    <button onClick={() => handleEdit(p)} style={{ padding: '6px 12px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>✏️</button>
                    <button onClick={() => { deleteProyek(p.id); toast.success('Proyek dihapus'); }} style={{ padding: '6px 12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>🗑️</button>
                  </div>
                </div>

                {p.deskripsi && <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 12 }}>{p.deskripsi}</p>}

                <ProgressBar value={p.progress_pct} />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginTop: 14 }}>
                  {p.volume_tiang && <div style={{ fontSize: 12, color: '#94a3b8' }}>📍 Tiang: <strong style={{ color: '#f1f5f9' }}>{p.volume_tiang} unit</strong></div>}
                  {p.volume_jalur_km && <div style={{ fontSize: 12, color: '#94a3b8' }}>〰️ Jalur: <strong style={{ color: '#f1f5f9' }}>{p.volume_jalur_km} km</strong></div>}
                  {p.volume_gardu && <div style={{ fontSize: 12, color: '#94a3b8' }}>⚡ Gardu: <strong style={{ color: '#f1f5f9' }}>{p.volume_gardu} unit</strong></div>}
                  {p.biaya_estimasi && <div style={{ fontSize: 12, color: '#94a3b8' }}>💰 Biaya: <strong style={{ color: '#f1f5f9' }}>Rp {p.biaya_estimasi.toLocaleString()}</strong></div>}
                  {p.pelaksana && <div style={{ fontSize: 12, color: '#94a3b8' }}>👷 Pelaksana: <strong style={{ color: '#f1f5f9' }}>{p.pelaksana}</strong></div>}
                  {p.tanggal_target && <div style={{ fontSize: 12, color: '#94a3b8' }}>📅 Target: <strong style={{ color: '#f1f5f9' }}>{new Date(p.tanggal_target).toLocaleDateString('id-ID')}</strong></div>}
                </div>

                {/* Print Ready SLD Image Option */}
                {p.gambar_print_url && (
                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(100,116,139,0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <h4 style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>🖨️</span> Sketsa SLD Otomatis (Siap Cetak)
                      </h4>
                      <button onClick={() => {
                        const a = document.createElement('a'); 
                        a.href = p.gambar_print_url!; 
                        a.download = `SLD_${p.id}.svg`; 
                        a.click(); 
                        toast.success('Peta SLD berhasil diunduh!'); 
                      }} style={{ padding: '6px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', gap: 6 }}>
                        ⬇ Unduh
                      </button>
                    </div>
                    <div style={{ width: '100%', borderRadius: 8, overflow: 'hidden', border: '1px solid #334155', background: '#020617', height: 260 }}>
                      <img src={p.gambar_print_url} alt="SLD Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  </div>
                )}

                {/* Inline progress updater */}
                {p.status === 'progres' && (
                  <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(249,115,22,0.08)', borderRadius: 8, border: '1px solid rgba(249,115,22,0.15)' }}>
                    <label style={{ fontSize: 12, color: '#f97316', fontWeight: 600, whiteSpace: 'nowrap' }}>Update Progres:</label>
                    <input type="range" min={0} max={100} value={p.progress_pct} onChange={e => updateProyek(p.id, { progress_pct: parseInt(e.target.value) })} style={{ flex: 1, accentColor: '#f97316' }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#f97316', minWidth: 36 }}>{p.progress_pct}%</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
