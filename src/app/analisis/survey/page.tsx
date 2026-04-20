'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, MapPin, Camera, CheckCircle, AlertCircle, Save } from 'lucide-react';

export default function SurveyPage() {
  const [surveys, setSurveys] = useState([
    { id: 1, asset: 'Tiang MALI-001', location: '-8.24386, 124.53221', date: '2024-01-15', status: 'verified', notes: 'Kondisi baik' },
    { id: 2, asset: 'Gardu MALI-02', location: '-8.21874, 124.53728', date: '2024-01-14', status: 'needs_repair', notes: 'Perlu perbaikan isolator' },
  ]);

  const [formData, setFormData] = useState({
    assetId: '',
    assetType: 'tiang',
    location: '',
    condition: 'good',
    notes: '',
    photos: 0,
  });

  const [showForm, setShowForm] = useState(false);

  const handleAddSurvey = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.assetId && formData.location) {
      setSurveys([
        ...surveys,
        {
          id: surveys.length + 1,
          asset: formData.assetId,
          location: formData.location,
          date: new Date().toISOString().split('T')[0],
          status: formData.condition === 'good' ? 'verified' : 'needs_repair',
          notes: formData.notes,
        },
      ]);
      setFormData({ assetId: '', assetType: 'tiang', location: '', condition: 'good', notes: '', photos: 0 });
      setShowForm(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', padding: '24px 20px' }}>
        <div className="max-w-1400px mx-auto">
          <Link href="/analisis" className="inline-flex items-center gap-2 text-secondary mb-4 hover:text-primary transition">
            <ChevronLeft size={16} /> Analisis
          </Link>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>Survey & Inspeksi Lapangan</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Tools untuk verifikasi aset dengan geotagging dan dokumentasi foto</p>
        </div>
      </div>

      <div className="max-w-1400px mx-auto px-20 py-8">
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Survey', value: surveys.length, color: 'var(--accent-indigo)' },
            { label: 'Terverifikasi', value: surveys.filter(s => s.status === 'verified').length, color: 'var(--color-success)' },
            { label: 'Perlu Perbaikan', value: surveys.filter(s => s.status === 'needs_repair').length, color: 'var(--color-danger)' },
            { label: 'Completion Rate', value: Math.round((surveys.filter(s => s.status === 'verified').length / surveys.length) * 100) + '%', color: 'var(--accent-cyan)' },
          ].map((card, i) => (
            <div key={i} className="glass-card p-6 text-center">
              <div style={{ color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>
                {card.label}
              </div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: card.color }}>
                {card.value}
              </div>
            </div>
          ))}
        </div>

        {/* Add Survey Button */}
        <div style={{ marginBottom: '24px' }}>
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-primary"
              style={{ background: 'var(--accent-indigo)', color: 'white', border: 'none' }}
            >
              <Camera size={16} /> Tambah Survey Baru
            </button>
          ) : (
            <div className="glass-card p-6 mb-6">
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Form Survey Lapangan</h3>
              <form onSubmit={handleAddSurvey} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                    Tipe Aset
                  </label>
                  <select
                    value={formData.assetType}
                    onChange={(e) => setFormData({ ...formData, assetType: e.target.value })}
                  >
                    <option value="tiang">Tiang</option>
                    <option value="gardu">Gardu</option>
                    <option value="trafo">Trafo</option>
                    <option value="proteksi">Proteksi</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                    ID Aset
                  </label>
                  <input
                    type="text"
                    placeholder="Mis: MALI-001"
                    value={formData.assetId}
                    onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                    GPS Location
                  </label>
                  <input
                    type="text"
                    placeholder="-8.24386, 124.53221"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                    Kondisi
                  </label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                    Catatan & Observasi
                  </label>
                  <textarea
                    placeholder="Deskripsikan kondisi aset, masalah yang ditemukan, rekomendasi perbaikan..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    style={{ minHeight: '100px', resize: 'vertical' }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '8px' }}>
                  <button type="submit" className="btn btn-primary" style={{ background: 'var(--accent-indigo)', color: 'white', border: 'none' }}>
                    <Save size={16} /> Simpan Survey
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="btn btn-secondary"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Survey List */}
        <div className="glass-card overflow-hidden">
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', fontWeight: 'bold' }}>
            Riwayat Survey ({surveys.length})
          </div>
          <table style={{ width: '100%' }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Aset</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Lokasi GPS</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Tanggal</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Catatan</th>
              </tr>
            </thead>
            <tbody>
              {surveys.map((survey, idx) => (
                <tr key={survey.id} style={{ borderBottom: '1px solid var(--border-subtle)', background: idx % 2 === 0 ? 'transparent' : 'rgba(88, 166, 255, 0.02)' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{survey.asset}</td>
                  <td style={{ padding: '12px', fontSize: '12px', fontFamily: 'monospace' }}>{survey.location}</td>
                  <td style={{ padding: '12px', fontSize: '12px' }}>{survey.date}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {survey.status === 'verified' ? (
                        <>
                          <CheckCircle size={14} style={{ color: 'var(--color-success)' }} />
                          <span style={{ color: 'var(--color-success)', fontSize: '12px' }}>Verified</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={14} style={{ color: 'var(--color-danger)' }} />
                          <span style={{ color: 'var(--color-danger)', fontSize: '12px' }}>Needs Repair</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>{survey.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Instructions */}
        <div className="glass-card p-6 mt-8" style={{ background: 'rgba(88, 166, 255, 0.05)', border: '1px solid rgba(88, 166, 255, 0.2)' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '12px' }}>Petunjuk Penggunaan</h3>
          <ul style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.8' }}>
            <li>• Klik "Tambah Survey Baru" untuk memulai verifikasi aset di lapangan</li>
            <li>• Isi tipe aset, ID, dan lokasi GPS dengan presisi (gunakan GPS device untuk akurasi)</li>
            <li>• Dokumentasikan kondisi aset dan temuan masalah di kolom catatan</li>
            <li>• Foto-foto dapat di-attach sebagai backup dokumentasi</li>
            <li>• Data tersimpan dengan timestamp otomatis untuk audit trail</li>
            <li>• Export survey data ke CSV/PDF untuk laporan manajemen</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
