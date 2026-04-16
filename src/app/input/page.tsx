'use client';

import { useState } from 'react';
import { Navigation, Camera, Send, CheckSquare, Square, Info } from 'lucide-react';
import { KONDUKTOR_INFO, UKURAN_PENAMPANG } from '@/lib/map-config';
import { CENTER_LAT, CENTER_LNG } from '@/lib/demo-data';
import dynamic from 'next/dynamic';

const InputPreviewMap = dynamic(() => import('@/components/map/InputPreviewMap'), { ssr: false });

const ODK_TYPES = [
  "1. Transformator",
  "2. Titik Cabang",
  "3. Gardu",
  "4. Tiang Akhir (TM)",
  "5. Peralatan Proteksi",
  "6. Fasilitas Pembangkitan",
  "7. Mulai, Jeda atau Melanjutkan Lacak",
  "8. Tiang",
  "9. LBS (Load Break Switch)",
  "10. Laporan Gangguan"
];

export default function InputPage() {
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Form State
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({
    tinggiTiang: '',
    materialTiang: '',
    jenisKonduktor: '',
    penampang: '',
  });

  const captureGPS = () => {
    setGpsLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGpsLoading(false);
        },
        () => {
          setGpsCoords({ lat: CENTER_LAT, lng: CENTER_LNG }); // fallback
          setGpsLoading(false);
        }
      );
    } else {
      setGpsCoords({ lat: CENTER_LAT, lng: CENTER_LNG });
      setGpsLoading(false);
    }
  };

  const toggleType = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTypes.length === 0) {
      alert("Pilih minimal satu tipe objek!");
      return;
    }
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setSelectedTypes([]);
      setGpsCoords(null);
      setPhotoPreview(null);
    }, 3000);
  };

  const updateForm = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const isSelected = (keyword: string) => {
    return selectedTypes.some(t => t.toLowerCase().includes(keyword.toLowerCase()));
  };

  return (
    <>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <h1 className="page-title">ODK Collect Input</h1>
        <p className="page-subtitle">grid_line_mappingV5</p>
      </div>

      <div className="form-container">
        {submitted && (
          <div className="toast success">
            <span style={{ fontSize: 20 }}>✅</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Data Terkirim ke Server!</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Sinkronisasi DB Supabase sukses</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* ODK Multi-Select Question */}
          <div className="card" style={{ padding: '20px 16px', background: '#111827' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: '#f1f5f9' }}>
              apa tipe dari objek ini?
            </h3>
            <p style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic', marginBottom: 16, lineHeight: 1.5 }}>
              Jelaskan tipe titik tersebut. Pilih diantara "SEMUA" pilihan yang memungkinkan. Hanya pilih "LAINNYA" jika objek tidak terdapat di pilihan tersebut.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {ODK_TYPES.map((type) => {
                const checked = selectedTypes.includes(type);
                return (
                  <div 
                    key={type}
                    onClick={() => toggleType(type)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, 
                      padding: '12px 8px',
                      background: checked ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                      borderBottom: '1px solid #1f2937',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {checked ? <CheckSquare size={22} color="#3b82f6" /> : <Square size={22} color="#4b5563" />}
                    <span style={{ fontSize: 15, color: checked ? '#fff' : '#cbd5e1', fontWeight: checked ? 600 : 400 }}>
                      {type}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CONDITIONAL SUB-FORMS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* TIANG DETAILS */}
            {(isSelected('Tiang') || isSelected('Titik Cabang')) && (
              <div className="card fade-in" style={{ borderColor: '#3b82f6' }}>
                <div className="card-title" style={{ color: '#3b82f6' }}>Detail Tiang</div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Tinggi Tiang</label>
                    <select className="form-select" value={formData.tinggiTiang} onChange={e => updateForm('tinggiTiang', e.target.value)} required>
                      <option value="">Pilih Tinggi</option>
                      <option value="9">9 Meter</option>
                      <option value="11">11 Meter</option>
                      <option value="12">12 Meter</option>
                      <option value="13">13 Meter</option>
                      <option value="14">14 Meter</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Material Tiang</label>
                    <select className="form-select" value={formData.materialTiang} onChange={e => updateForm('materialTiang', e.target.value)} required>
                      <option value="">Pilih Jenis</option>
                      <option value="Besi">Besi / Baja</option>
                      <option value="Beton">Beton</option>
                      <option value="Kayu">Kayu</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* JARINGAN / KONDUKTOR DETAILS */}
            {(isSelected('Lacak') || isSelected('Transformator') || isSelected('Tiang Akhir')) && (
              <div className="card fade-in" style={{ borderColor: '#8b5cf6' }}>
                <div className="card-title" style={{ color: '#8b5cf6' }}>Data Konduktor / Jaringan</div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Jenis Konduktor</label>
                    <select className="form-select" value={formData.jenisKonduktor} onChange={e => updateForm('jenisKonduktor', e.target.value)} required>
                      <option value="">Pilih Konduktor</option>
                      {Object.entries(KONDUKTOR_INFO).map(([key, label]) => (
                        <option key={key} value={key}>{key} - {label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ukuran Penampang</label>
                    <select className="form-select" value={formData.penampang} onChange={e => updateForm('penampang', e.target.value)} required>
                      <option value="">Pilih Ukuran</option>
                      {UKURAN_PENAMPANG.map(u => (
                        <option key={u} value={u}>{u} mm²</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* PROTEKSI & SWITCHING DETAILS */}
            {(isSelected('Peralatan Proteksi') || isSelected('LBS')) && (
              <div className="card fade-in" style={{ borderColor: '#f59e0b' }}>
                <div className="card-title" style={{ color: '#f59e0b' }}>Data Switching & Proteksi</div>
                <div className="form-group">
                  <label className="form-label">Jenis Peralatan</label>
                  <select 
                    className="form-select" 
                    value={formData.jenisProteksi || ''} 
                    onChange={e => updateForm('jenisProteksi', e.target.value)} 
                    required
                  >
                    <option value="">Pilih Alat Proteksi/Switch</option>
                    <option value="FCO">Fuse Cut Out (FCO) / CO</option>
                    <option value="LBS">Load Break Switch (LBS)</option>
                    <option value="Recloser">Recloser</option>
                    <option value="Sectionalizer">Sectionalizer</option>
                    <option value="LA">Lightning Arrester (LA)</option>
                    <option value="DS">Disconnecting Switch (DS)</option>
                  </select>
                </div>

                {formData.jenisProteksi === 'FCO' && (
                  <div className="form-row fade-in">
                    <div className="form-group">
                      <label className="form-label">Beban Trafo / Saluran (Ampere)</label>
                      <input type="number" step="0.1" className="form-input" placeholder="Contoh: 45" onChange={e => updateForm('bebanArus', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Fuse Link Terpasang (Ampere)</label>
                      <select className="form-select" onChange={e => updateForm('fuseLink', e.target.value)}>
                        <option value="">Pilih Fuse Link</option>
                        <option value="3">3A (Tipe K)</option>
                        <option value="5">5A (Tipe K)</option>
                        <option value="8">8A (Tipe K)</option>
                        <option value="10">10A (Tipe K)</option>
                        <option value="15">15A (Tipe K)</option>
                        <option value="20">20A (Tipe K)</option>
                        <option value="30">30A (Tipe K)</option>
                        <option value="40">40A (Tipe K)</option>
                        <option value="50">50A (Tipe K)</option>
                        <option value="65">65A (Tipe K)</option>
                      </select>
                    </div>
                  </div>
                )}

                {(formData.jenisProteksi === 'LBS' || formData.jenisProteksi === 'Recloser' || formData.jenisProteksi === 'DS') && (
                  <div className="form-row fade-in">
                    <div className="form-group">
                      <label className="form-label">Kapasitas (Ampere)</label>
                      <select className="form-select" onChange={e => updateForm('kapasitasSwitch', e.target.value)}>
                        <option value="">Pilih Kapasitas</option>
                        <option value="400">400 A</option>
                        <option value="630">630 A</option>
                        <option value="800">800 A</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Status Normal</label>
                      <select className="form-select" onChange={e => updateForm('statusNormal', e.target.value)}>
                        <option value="">Pilih Status</option>
                        <option value="NC">Normally Closed (Tertutup)</option>
                        <option value="NO">Normally Open (Terbuka/Tie)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* RELAY SETTINGS FOR RECLOSER */}
                {formData.jenisProteksi === 'Recloser' && (
                  <div className="card fade-in" style={{ borderColor: '#ef4444', marginTop: 12, padding: 12, borderStyle: 'dashed' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', marginBottom: 12 }}>Setting Relay Proteksi</div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Overcurrent (OC) - A</label>
                        <input type="number" className="form-input" placeholder="Cth: 20" onChange={e => updateForm('settingOC', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Delay OC (dtk)</label>
                        <input type="number" step="0.01" className="form-input" placeholder="Cth: 0.05" onChange={e => updateForm('delayOC', e.target.value)} />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Ground Fault (GF) - A</label>
                        <input type="number" className="form-input" placeholder="Cth: 6" onChange={e => updateForm('settingGF', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Delay GF (dtk)</label>
                        <input type="number" step="0.01" className="form-input" placeholder="Cth: 0.05" onChange={e => updateForm('delayGF', e.target.value)} />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Under Frequency (UF) - Hz</label>
                      <input type="number" step="0.1" className="form-input" placeholder="Cth: 49.20" onChange={e => updateForm('settingUF', e.target.value)} />
                    </div>
                  </div>
                )}

                {formData.jenisProteksi === 'LA' && (
                  <div className="form-row fade-in">
                    <div className="form-group">
                      <label className="form-label">Tegangan Sistem (kV)</label>
                      <select className="form-select" onChange={e => updateForm('teganganLA', e.target.value)}>
                        <option value="20">20 kV</option>
                        <option value="24">24 kV</option>
                        <option value="150">150 kV</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Nilai Arus Buang (kA)</label>
                      <select className="form-select" onChange={e => updateForm('arusLA', e.target.value)}>
                        <option value="5">5 kA</option>
                        <option value="10">10 kA</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* GPS CAPTURE */}
            <div className="form-group">
              <label className="form-label">📍 Titik Koordinat GPS</label>
              <div className="gps-capture" onClick={captureGPS}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {gpsLoading ? <div style={{ animation: 'pulse 1s infinite' }}>📍</div> : <Navigation size={20} color="#3b82f6" />}
                </div>
                <div>
                  {gpsCoords ? (
                    <><div className="coords">{gpsCoords.lat.toFixed(6)}, {gpsCoords.lng.toFixed(6)}</div><div style={{ fontSize: 11, color: '#64748b' }}>Akurasi: ±3m | Tap untuk perbarui</div></>
                  ) : (
                    <><div style={{ fontWeight: 600, fontSize: 14 }}>Ambil Koordinat</div><div style={{ fontSize: 11, color: '#64748b' }}>Wajib diukur di lokasi tiang</div></>
                  )}
                </div>
              </div>

              {/* LIVE MAP & ICON PREVIEW */}
              {gpsCoords && (
                <InputPreviewMap 
                  gpsCoords={gpsCoords} 
                  selectedTypes={selectedTypes} 
                  formData={formData} 
                />
              )}
            </div>

            {/* PHOTO UPLOAD */}
            <div className="form-group">
              <label className="form-label">📸 Bukti Foto (Geo-tagged)</label>
              <label htmlFor="photo-input" className="photo-upload">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }} />
                ) : (
                  <><Camera size={32} color="#64748b" /><span className="photo-upload-text">Buka Kamera / Galeri</span></>
                )}
              </label>
              <input id="photo-input" type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} style={{ display: 'none' }} />
            </div>

          </div>

          <button type="submit" className="btn btn-primary btn-full" style={{ padding: '16px', fontSize: '16px' }}>
            <Send size={20} />
            Simpan Form ODK
          </button>
        </form>
      </div>
    </>
  );
}
