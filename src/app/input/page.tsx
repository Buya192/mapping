'use client';

import { useState, useCallback } from 'react';
import { 
  Navigation, Camera, Send, ChevronDown, ChevronUp, MapPin,
  Zap, Radio, Cable, Shield, Box, Users, CircuitBoard, CheckCircle2
} from 'lucide-react';
import { KONDUKTOR_INFO, UKURAN_PENAMPANG } from '@/lib/map-config';
import { CENTER_LAT, CENTER_LNG } from '@/lib/demo-data';
import dynamic from 'next/dynamic';

const InputPreviewMap = dynamic(() => import('@/components/map/InputPreviewMap'), { ssr: false });

// ─── DREAM Asset Type Definitions ────────────────────────────
interface AssetTypeConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  table: string;
  fields: FieldDef[];
}

interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea';
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  unit?: string;
  group?: string;  // group label for visual grouping
}

const DREAM_ASSET_TYPES: AssetTypeConfig[] = [
  {
    id: 'tiang',
    label: 'Tiang',
    icon: <MapPin size={18} />,
    color: '#3b82f6',
    table: 'tiang_jtm',
    fields: [
      { key: 'nama_tiang', label: 'Nama / ID Tiang', type: 'text', placeholder: 'TNJ-001', required: true },
      { key: 'penyulang', label: 'Penyulang', type: 'text', placeholder: 'ANGGREK', required: true },
      { key: 'tipe_tiang', label: 'Tipe Tiang', type: 'select', required: true, options: [
        { value: 'TM', label: 'TM (Tiang Medium)' },
        { value: 'TR', label: 'TR (Tiang Rendah)' },
        { value: 'TM/TR', label: 'TM/TR (Kombinasi)' },
        { value: 'Tiang Akhir', label: 'Tiang Akhir' },
        { value: 'Titik Cabang', label: 'Titik Cabang / Junction' },
      ]},
      { key: 'tinggiTiang', label: 'Tinggi Tiang', type: 'select', required: true, options: [
        { value: '9', label: '9 Meter' }, { value: '11', label: '11 Meter' },
        { value: '12', label: '12 Meter' }, { value: '13', label: '13 Meter' },
        { value: '14', label: '14 Meter' },
      ]},
      { key: 'materialTiang', label: 'Material Tiang', type: 'select', required: true, options: [
        { value: 'Besi', label: 'Besi / Baja' }, { value: 'Beton', label: 'Beton' }, { value: 'Kayu', label: 'Kayu' },
      ]},
      { key: 'desa', label: 'Desa / Kelurahan', type: 'text', placeholder: 'Kalabahi Tengah' },
      { key: 'kecamatan', label: 'Kecamatan', type: 'text', placeholder: 'Teluk Mutiara' },
      { key: 'kondisi', label: 'Kondisi', type: 'select', options: [
        { value: 'Baik', label: 'Baik' }, { value: 'Rusak Ringan', label: 'Rusak Ringan' },
        { value: 'Rusak Berat', label: 'Rusak Berat' }, { value: 'Miring', label: 'Miring' },
      ]},
    ]
  },
  {
    id: 'gardu',
    label: 'Gardu / Trafo',
    icon: <Zap size={18} />,
    color: '#f59e0b',
    table: 'gardus',
    fields: [
      { key: 'namaGardu', label: 'Nama Gardu', type: 'text', placeholder: 'KBH-001', required: true },
      { key: 'feeder', label: 'Penyulang (Feeder)', type: 'text', placeholder: 'ANGGREK', required: true },
      { key: 'tipe_gardu', label: 'Tipe Gardu', type: 'select', required: true, options: [
        { value: 'Portal', label: 'Portal (Tiang)' }, { value: 'Kios', label: 'Kios' },
        { value: 'Ground Pad', label: 'Ground Pad Mounted' }, { value: 'Cantol', label: 'Cantol (1 Tiang)' },
        { value: 'GH', label: 'Gardu Hubung (GH)' },
      ]},
      { key: 'kapasitas_kva', label: 'Kapasitas', type: 'select', unit: 'kVA', required: true, options: [
        { value: '25', label: '25 kVA' }, { value: '50', label: '50 kVA' },
        { value: '100', label: '100 kVA' }, { value: '160', label: '160 kVA' },
        { value: '200', label: '200 kVA' }, { value: '250', label: '250 kVA' },
        { value: '315', label: '315 kVA' }, { value: '400', label: '400 kVA' },
        { value: '630', label: '630 kVA' },
      ]},
      { key: 'merk_trafo', label: 'Merk Trafo', type: 'text', placeholder: 'TRAFINDO / UNINDO / BAMBANG DJAJA' },
      { key: 'no_seri_trafo', label: 'No. Seri Trafo', type: 'text', placeholder: 'T-2024-XXXXX' },
      { key: 'tahun_pasang', label: 'Tahun Pemasangan', type: 'number', placeholder: '2020' },
      { key: 'impedansi', label: 'Impedansi (%)', type: 'number', placeholder: '4', unit: '%' },
      { key: 'vektor_group', label: 'Vektor Group', type: 'select', options: [
        { value: 'Dyn5', label: 'Dyn5' }, { value: 'Yyn0', label: 'Yyn0' },
        { value: 'Dyn11', label: 'Dyn11' }, { value: 'Yzn5', label: 'Yzn5' },
      ]},
      { key: 'jumlahPelanggan', label: 'Jumlah Pelanggan', type: 'number', placeholder: '0' },
      { key: 'desa', label: 'Desa / Kelurahan', type: 'text', placeholder: 'Kalabahi Tengah' },
      { key: 'kondisi', label: 'Kondisi', type: 'select', options: [
        { value: 'Baik', label: 'Baik' }, { value: 'Rusak Ringan', label: 'Rusak Ringan' },
        { value: 'Rusak Berat', label: 'Rusak Berat' },
      ]},
    ]
  },
  {
    id: 'sutm',
    label: 'SUTM (JTM)',
    icon: <Cable size={18} />,
    color: '#8b5cf6',
    table: 'jtm_segments',
    fields: [
      { key: 'name', label: 'Nama Segmen', type: 'text', placeholder: 'JTM-ANG-001', required: true },
      { key: 'feeder', label: 'Penyulang (Feeder)', type: 'text', placeholder: 'ANGGREK', required: true },
      { key: 'jenisKonduktor', label: 'Jenis Konduktor', type: 'select', required: true, options: 
        Object.entries(KONDUKTOR_INFO).map(([key, label]) => ({ value: key, label: `${key} — ${label}` }))
      },
      { key: 'penampang', label: 'Ukuran Penampang', type: 'select', unit: 'mm²', required: true, options:
        UKURAN_PENAMPANG.map(u => ({ value: String(u), label: `${u} mm²` }))
      },
      { key: 'panjang_km', label: 'Panjang', type: 'number', placeholder: '0.5', unit: 'kms' },
      { key: 'jumlah_fasa', label: 'Jumlah Fasa', type: 'select', options: [
        { value: '3', label: '3 Fasa' }, { value: '1', label: '1 Fasa' },
      ]},
      { key: 'tegangan', label: 'Tegangan Sistem', type: 'select', options: [
        { value: '20', label: '20 kV' }, { value: '150', label: '150 kV' },
      ]},
    ]
  },
  {
    id: 'jtr',
    label: 'JTR',
    icon: <Radio size={18} />,
    color: '#06b6d4',
    table: 'jtr_segments',
    fields: [
      { key: 'name', label: 'Nama Segmen JTR', type: 'text', placeholder: 'JTR-ANG-001', required: true },
      { key: 'feeder', label: 'Penyulang / Gardu Induk', type: 'text', placeholder: 'ANGGREK', required: true },
      { key: 'gardu_asal', label: 'Gardu Asal', type: 'text', placeholder: 'KBH-001' },
      { key: 'jenisKonduktor', label: 'Jenis Konduktor', type: 'select', required: true, options: [
        { value: 'NFA2X', label: 'NFA2X (Twisted Cable)' }, { value: 'LVTC', label: 'LVTC' },
        { value: 'AAAC', label: 'AAAC' }, { value: 'AAC', label: 'AAC' },
      ]},
      { key: 'penampang', label: 'Ukuran Penampang', type: 'select', unit: 'mm²', options: [
        { value: '35', label: '35 mm²' }, { value: '50', label: '50 mm²' },
        { value: '70', label: '70 mm²' }, { value: '95', label: '95 mm²' }, { value: '120', label: '120 mm²' },
      ]},
      { key: 'panjang_km', label: 'Panjang', type: 'number', placeholder: '0.2', unit: 'kms' },
      { key: 'jumlah_fasa', label: 'Jumlah Fasa', type: 'select', options: [
        { value: '3', label: '3 Fasa (R-S-T-N)' }, { value: '1', label: '1 Fasa (F-N)' },
      ]},
    ]
  },
  {
    id: 'switching',
    label: 'Switching & Proteksi',
    icon: <Shield size={18} />,
    color: '#ef4444',
    table: 'tiang_jtm',
    fields: [
      { key: 'nama_tiang', label: 'Lokasi (Tiang/Label)', type: 'text', placeholder: 'LBS-ANG-001', required: true },
      { key: 'penyulang', label: 'Penyulang', type: 'text', placeholder: 'ANGGREK', required: true },
      { key: 'jenisProteksi', label: 'Jenis Peralatan', type: 'select', required: true, options: [
        { value: 'FCO', label: 'Fuse Cut Out (FCO / CO)' },
        { value: 'LBS', label: 'Load Break Switch (LBS)' },
        { value: 'Recloser', label: 'Recloser' },
        { value: 'Sectionalizer', label: 'Sectionalizer' },
        { value: 'LA', label: 'Lightning Arrester (LA)' },
        { value: 'DS', label: 'Disconnecting Switch (DS)' },
        { value: 'AVS', label: 'Automatic Voltage Switch (AVS)' },
      ]},
      { key: 'merk', label: 'Merk / Pabrikan', type: 'text', placeholder: 'Schneider / ABB' },
      { key: 'kapasitasSwitch', label: 'Kapasitas', type: 'select', unit: 'A', options: [
        { value: '200', label: '200 A' }, { value: '400', label: '400 A' },
        { value: '630', label: '630 A' }, { value: '800', label: '800 A' },
      ]},
      { key: 'statusNormal', label: 'Status Normal', type: 'select', options: [
        { value: 'NC', label: 'Normally Closed (Tertutup)' },
        { value: 'NO', label: 'Normally Open (Terbuka/Tie)' },
      ]},
      { key: 'fuseLink', label: 'Fuse Link (untuk FCO)', type: 'select', unit: 'A', options: [
        { value: '3', label: '3A (Tipe K)' }, { value: '5', label: '5A (Tipe K)' },
        { value: '8', label: '8A (Tipe K)' }, { value: '10', label: '10A (Tipe K)' },
        { value: '15', label: '15A (Tipe K)' }, { value: '20', label: '20A (Tipe K)' },
        { value: '30', label: '30A (Tipe K)' }, { value: '40', label: '40A (Tipe K)' },
        { value: '50', label: '50A (Tipe K)' }, { value: '65', label: '65A (Tipe K)' },
      ]},
      { key: 'settingOC', label: 'Setting Overcurrent (A)', type: 'number', placeholder: '20', group: 'Relay Setting' },
      { key: 'delayOC', label: 'Delay OC (detik)', type: 'number', placeholder: '0.05', group: 'Relay Setting' },
      { key: 'settingGF', label: 'Setting Ground Fault (A)', type: 'number', placeholder: '6', group: 'Relay Setting' },
      { key: 'delayGF', label: 'Delay GF (detik)', type: 'number', placeholder: '0.05', group: 'Relay Setting' },
      { key: 'kondisi', label: 'Kondisi', type: 'select', options: [
        { value: 'Baik', label: 'Baik' }, { value: 'Rusak', label: 'Rusak' },
      ]},
    ]
  },
  {
    id: 'phbtr',
    label: 'PHB-TR',
    icon: <Box size={18} />,
    color: '#22c55e',
    table: 'gardus',
    fields: [
      { key: 'nama_phb', label: 'Nama PHB', type: 'text', placeholder: 'PHB-KBH001', required: true },
      { key: 'feeder', label: 'Gardu Induk', type: 'text', placeholder: 'KBH-001', required: true },
      { key: 'jenis_phb', label: 'Jenis PHB', type: 'select', options: [
        { value: 'PHB-TR 1 Fasa', label: 'PHB-TR 1 Fasa' },
        { value: 'PHB-TR 3 Fasa', label: 'PHB-TR 3 Fasa' },
      ]},
      { key: 'jurusan', label: 'Jumlah Jurusan', type: 'number', placeholder: '4' },
      { key: 'merk', label: 'Merk / Pabrikan', type: 'text', placeholder: 'SINTRA' },
      { key: 'kondisi', label: 'Kondisi', type: 'select', options: [
        { value: 'Baik', label: 'Baik' }, { value: 'Rusak', label: 'Rusak' },
      ]},
    ]
  },
  {
    id: 'pelanggan',
    label: 'Pelanggan / APP',
    icon: <Users size={18} />,
    color: '#f97316',
    table: 'pelanggan',
    fields: [
      { key: 'name', label: 'Nama Pelanggan', type: 'text', placeholder: 'Ahmad M.', required: true },
      { key: 'nomorMeter', label: 'No. Meter / ID Pel', type: 'text', placeholder: '54XXXXXXXX', required: true },
      { key: 'feeder', label: 'Gardu Sumber', type: 'text', placeholder: 'KBH-001' },
      { key: 'daya', label: 'Daya Tersambung', type: 'select', unit: 'VA', required: true, options: [
        { value: '450', label: '450 VA' }, { value: '900', label: '900 VA' },
        { value: '1300', label: '1.300 VA' }, { value: '2200', label: '2.200 VA' },
        { value: '3500', label: '3.500 VA' }, { value: '5500', label: '5.500 VA' },
        { value: '7700', label: '7.700 VA' }, { value: '11000', label: '11.000 VA' },
      ]},
      { key: 'tarif', label: 'Golongan Tarif', type: 'select', options: [
        { value: 'R1', label: 'R1 (Rumah Tangga 450-900VA)' },
        { value: 'R1M', label: 'R1M (Rumah Tangga 1300VA)' },
        { value: 'R2', label: 'R2 (Rumah Tangga 3500-5500VA)' },
        { value: 'R3', label: 'R3 (Rumah Tangga >6600VA)' },
        { value: 'B1', label: 'B1 (Bisnis 450-5500VA)' },
        { value: 'B2', label: 'B2 (Bisnis 6600VA-200kVA)' },
        { value: 'S2', label: 'S2 (Sosial)' }, { value: 'P1', label: 'P1 (Pemerintah)' },
      ]},
      { key: 'tipe_meter', label: 'Tipe Meter', type: 'select', options: [
        { value: 'Prabayar', label: 'Prabayar (Token)' }, { value: 'Pascabayar', label: 'Pascabayar' },
      ]},
      { key: 'alamat', label: 'Alamat', type: 'textarea', placeholder: 'Jl. contoh RT XX/RW XX' },
    ]
  },
  {
    id: 'pembangkit',
    label: 'Pembangkitan',
    icon: <CircuitBoard size={18} />,
    color: '#a855f7',
    table: 'pembangkit',
    fields: [
      { key: 'nama', label: 'Nama Pembangkit', type: 'text', placeholder: 'PLTD Kalabahi', required: true },
      { key: 'jenis', label: 'Jenis Pembangkit', type: 'select', required: true, options: [
        { value: 'PLTD', label: 'PLTD (Diesel)' }, { value: 'PLTS', label: 'PLTS (Surya)' },
        { value: 'PLTMH', label: 'PLTMH (Mikro Hidro)' }, { value: 'PLTB', label: 'PLTB (Bayu/Angin)' },
        { value: 'PLTU', label: 'PLTU (Uap)' },
      ]},
      { key: 'daya_terpasang_mw', label: 'Daya Terpasang', type: 'number', placeholder: '5.0', unit: 'MW', required: true },
      { key: 'daya_mampu_mw', label: 'Daya Mampu', type: 'number', placeholder: '4.2', unit: 'MW' },
      { key: 'jumlahMesin', label: 'Jumlah Unit/Mesin', type: 'number', placeholder: '4' },
      { key: 'merk', label: 'Merk Mesin Utama', type: 'text', placeholder: 'Caterpillar / Cummins' },
      { key: 'tahun_operasi', label: 'Tahun Operasi', type: 'number', placeholder: '2015' },
      { key: 'bahan_bakar', label: 'Bahan Bakar', type: 'select', options: [
        { value: 'HSD', label: 'HSD (Solar)' }, { value: 'MFO', label: 'MFO' },
        { value: 'Gas', label: 'Gas' }, { value: 'Solar', label: 'Solar/Matahari' },
      ]},
    ]
  },
];

// ─── Form Styles (inline to match existing pattern) ────────────
const styles = {
  typeGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: 8, marginBottom: 24
  } as React.CSSProperties,
  typeCard: (selected: boolean, color: string) => ({
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 8,
    padding: '16px 8px', borderRadius: 12, cursor: 'pointer',
    background: selected ? `${color}15` : 'rgba(26,34,54,0.6)',
    border: `2px solid ${selected ? color : '#2a3654'}`,
    transition: 'all 0.25s ease', textAlign: 'center' as const,
  }) as React.CSSProperties,
  typeIcon: (selected: boolean, color: string) => ({
    width: 40, height: 40, borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: selected ? `${color}30` : 'rgba(100,116,139,0.15)',
    color: selected ? color : '#94a3b8',
    transition: 'all 0.25s ease',
  }) as React.CSSProperties,
  fieldGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 } as React.CSSProperties,
  fieldFull: { gridColumn: '1 / -1' } as React.CSSProperties,
  label: {
    display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8',
    textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 6,
  } as React.CSSProperties,
  input: {
    width: '100%', padding: '10px 12px', fontSize: 14, borderRadius: 8,
    border: '1px solid #2a3654', background: '#111827', color: '#f1f5f9',
    outline: 'none', transition: 'border-color 0.2s',
  } as React.CSSProperties,
  select: {
    width: '100%', padding: '10px 12px', fontSize: 14, borderRadius: 8,
    border: '1px solid #2a3654', background: '#111827', color: '#f1f5f9',
    outline: 'none', appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
  } as React.CSSProperties,
  textarea: {
    width: '100%', padding: '10px 12px', fontSize: 14, borderRadius: 8,
    border: '1px solid #2a3654', background: '#111827', color: '#f1f5f9',
    outline: 'none', minHeight: 70, resize: 'vertical' as const, fontFamily: 'inherit',
  } as React.CSSProperties,
  groupLabel: {
    gridColumn: '1 / -1', fontSize: 11, fontWeight: 700, color: '#ef4444',
    textTransform: 'uppercase' as const, letterSpacing: '0.08em',
    borderTop: '1px dashed #2a3654', paddingTop: 12, marginTop: 4,
  } as React.CSSProperties,
  card: (color: string) => ({
    background: '#111827', borderRadius: 12, padding: 20,
    border: `1px solid ${color}40`, position: 'relative' as const,
  }) as React.CSSProperties,
  cardBadge: (color: string) => ({
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontSize: 13, fontWeight: 700, color: color,
    marginBottom: 16,
  }) as React.CSSProperties,
};


export default function InputPage() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ fields: true, gps: true, photo: false });

  const activeType = DREAM_ASSET_TYPES.find(t => t.id === selectedType);

  const captureGPS = useCallback(() => {
    setGpsLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGpsLoading(false); },
        () => { setGpsCoords({ lat: CENTER_LAT, lng: CENTER_LNG }); setGpsLoading(false); }
      );
    } else {
      setGpsCoords({ lat: CENTER_LAT, lng: CENTER_LNG }); setGpsLoading(false);
    }
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const updateForm = (key: string, value: string) => setFormData(prev => ({ ...prev, [key]: value }));

  const toggleSection = (key: string) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  const resetForm = () => {
    setFormData({}); setGpsCoords(null); setPhotoPreview(null); setSelectedType(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeType) return;
    
    setSubmitting(true);

    // Prepare data
    const payload = {
      action: 'create',
      asset_table: activeType.table,
      data: {
        ...formData,
        ...(gpsCoords ? { latitude: gpsCoords.lat, longitude: gpsCoords.lng } : {}),
      },
      verified_by: 'input_form',
      latitude: gpsCoords?.lat,
      longitude: gpsCoords?.lng,
    };

    try {
      const res = await fetch('/api/dream/verification', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await res.json();
      if (result.success) {
        setSubmitted(true); 
        setTimeout(() => { setSubmitted(false); resetForm(); }, 3000);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (err) {
      alert(`Gagal simpan: ${err}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Group fields by 'group' property
  const renderFields = (fields: FieldDef[]) => {
    let lastGroup = '';
    return fields.map((field, idx) => {
      const nodes: React.ReactNode[] = [];

      // Insert group header
      if (field.group && field.group !== lastGroup) {
        lastGroup = field.group;
        nodes.push(
          <div key={`grp-${field.group}`} style={styles.groupLabel}>
            {field.group}
          </div>
        );
      }

      const isFullWidth = field.type === 'textarea';

      nodes.push(
        <div key={field.key} style={isFullWidth ? styles.fieldFull : undefined}>
          <label style={styles.label}>
            {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
            {field.unit && <span style={{ color: '#64748b', fontWeight: 400 }}> ({field.unit})</span>}
          </label>
          {field.type === 'select' ? (
            <select
              style={styles.select}
              value={formData[field.key] || ''}
              onChange={e => updateForm(field.key, e.target.value)}
              required={field.required}
              onFocus={e => (e.target.style.borderColor = activeType?.color || '#3b82f6')}
              onBlur={e => (e.target.style.borderColor = '#2a3654')}
            >
              <option value="">— Pilih —</option>
              {field.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ) : field.type === 'textarea' ? (
            <textarea
              style={styles.textarea}
              value={formData[field.key] || ''}
              onChange={e => updateForm(field.key, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              onFocus={e => (e.target.style.borderColor = activeType?.color || '#3b82f6')}
              onBlur={e => (e.target.style.borderColor = '#2a3654')}
            />
          ) : (
            <input
              type={field.type}
              style={styles.input}
              value={formData[field.key] || ''}
              onChange={e => updateForm(field.key, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              step={field.type === 'number' ? '0.01' : undefined}
              onFocus={e => (e.target.style.borderColor = activeType?.color || '#3b82f6')}
              onBlur={e => (e.target.style.borderColor = '#2a3654')}
            />
          )}
        </div>
      );

      return nodes;
    });
  };

  return (
    <>
      {/* Page Header */}
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 700, background: 'rgba(59,130,246,0.15)', color: '#3b82f6', padding: '3px 10px', borderRadius: 6, letterSpacing: '0.08em' }}>DREAM MOBILE</div>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>Input Data Aset</h1>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>Form input standar EAMDIS / IBM Maximo — 8 tipe aset distribusi</p>
        </div>
        {activeType && (
          <button onClick={resetForm} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, border: '1px solid #2a3654', background: '#111827', color: '#94a3b8', cursor: 'pointer' }}>
            ↩ Reset
          </button>
        )}
      </div>

      {/* Success Toast */}
      {submitted && (
        <div style={{
          position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 999,
          background: '#052e16', border: '1px solid #22c55e', borderRadius: 12,
          padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 8px 32px rgba(34,197,94,0.3)', animation: 'slideDown 0.3s ease',
        }}>
          <CheckCircle2 size={22} color="#22c55e" />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#22c55e' }}>Data Berhasil Disimpan!</div>
            <div style={{ fontSize: 12, color: '#86efac' }}>Tersimpan ke database Supabase — terverifikasi otomatis</div>
          </div>
        </div>
      )}

      {/* Step 1: Select Asset Type */}
      <div style={{ ...styles.card('#2a3654'), marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>
          LANGKAH 1 — Pilih Tipe Aset
        </div>
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
          Pilih satu tipe objek aset distribusi untuk di-input. Form isian akan muncul secara otomatis.
        </p>

        <div style={styles.typeGrid}>
          {DREAM_ASSET_TYPES.map(type => (
            <div
              key={type.id}
              onClick={() => { setSelectedType(type.id); setFormData({}); }}
              style={styles.typeCard(selectedType === type.id, type.color)}
            >
              <div style={styles.typeIcon(selectedType === type.id, type.color)}>
                {type.icon}
              </div>
              <span style={{ fontSize: 12, fontWeight: selectedType === type.id ? 700 : 500, color: selectedType === type.id ? '#f1f5f9' : '#94a3b8' }}>
                {type.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step 2: Dynamic Fields */}
      {activeType && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Field Section */}
          <div style={styles.card(activeType.color)}>
            <div 
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} 
              onClick={() => toggleSection('fields')}
            >
              <div style={styles.cardBadge(activeType.color)}>
                {activeType.icon} Data {activeType.label}
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400, marginLeft: 8 }}>
                  {activeType.fields.length} field
                </span>
              </div>
              {expandedSections.fields ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
            </div>

            {expandedSections.fields && (
              <div style={styles.fieldGrid}>
                {renderFields(activeType.fields)}
              </div>
            )}
          </div>

          {/* GPS Section */}
          <div style={styles.card('#3b82f6')}>
            <div 
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} 
              onClick={() => toggleSection('gps')}
            >
              <div style={styles.cardBadge('#3b82f6')}>
                <Navigation size={16} /> Koordinat GPS
                {gpsCoords && <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 400, marginLeft: 8 }}>✓ Captured</span>}
              </div>
              {expandedSections.gps ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
            </div>

            {expandedSections.gps && (
              <div>
                <div 
                  onClick={captureGPS}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: 14, borderRadius: 10,
                    border: '1px dashed #2a3654', cursor: 'pointer', transition: 'all 0.2s',
                    background: gpsCoords ? 'rgba(34,197,94,0.08)' : 'rgba(59,130,246,0.05)',
                  }}
                >
                  <div style={{
                    width: 42, height: 42, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: gpsCoords ? 'rgba(34,197,94,0.2)' : 'rgba(59,130,246,0.2)',
                  }}>
                    {gpsLoading ? <span style={{ animation: 'pulse 1s infinite' }}>📍</span> : <Navigation size={20} color={gpsCoords ? '#22c55e' : '#3b82f6'} />}
                  </div>
                  <div>
                    {gpsCoords ? (
                      <>
                        <div style={{ fontWeight: 700, fontSize: 14, fontFamily: 'monospace', color: '#22c55e' }}>
                          {gpsCoords.lat.toFixed(6)}, {gpsCoords.lng.toFixed(6)}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>Tap untuk perbarui koordinat</div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>Ambil Koordinat GPS</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>Wajib diukur di lokasi aset</div>
                      </>
                    )}
                  </div>
                </div>

                {gpsCoords && (
                  <div style={{ marginTop: 12, borderRadius: 10, overflow: 'hidden', height: 180 }}>
                    <InputPreviewMap gpsCoords={gpsCoords} selectedTypes={[activeType.label]} formData={formData} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Photo Section */}
          <div style={styles.card('#8b5cf6')}>
            <div 
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => toggleSection('photo')}
            >
              <div style={styles.cardBadge('#8b5cf6')}>
                <Camera size={16} /> Bukti Foto
                {photoPreview && <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 400, marginLeft: 8 }}>✓ Attached</span>}
              </div>
              {expandedSections.photo ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
            </div>

            {expandedSections.photo && (
              <div>
                <label htmlFor="photo-input" style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 8, padding: 24, borderRadius: 10, border: '1px dashed #2a3654', cursor: 'pointer',
                  background: 'rgba(139,92,246,0.05)', minHeight: 100,
                }}>
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }} />
                  ) : (
                    <>
                      <Camera size={28} color="#64748b" />
                      <span style={{ fontSize: 13, color: '#64748b' }}>Buka Kamera / Galeri</span>
                    </>
                  )}
                </label>
                <input id="photo-input" type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} style={{ display: 'none' }} />
              </div>
            )}
          </div>

          {/* Notes */}
          <div style={styles.card('#64748b')}>
            <label style={styles.label}>Catatan Tambahan</label>
            <textarea
              style={styles.textarea}
              value={formData._notes || ''}
              onChange={e => updateForm('_notes', e.target.value)}
              placeholder="Catatan opsional (kondisi lingkungan, akses jalan, dll)"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '16px', fontSize: 15, fontWeight: 700,
              borderRadius: 12, border: 'none', cursor: submitting ? 'wait' : 'pointer',
              background: `linear-gradient(135deg, ${activeType.color}, ${activeType.color}cc)`,
              color: '#fff', transition: 'all 0.3s',
              opacity: submitting ? 0.7 : 1,
              boxShadow: `0 4px 20px ${activeType.color}40`,
            }}
          >
            {submitting ? (
              <span style={{ animation: 'pulse 0.8s infinite' }}>Menyimpan...</span>
            ) : (
              <><Send size={18} /> Simpan Data {activeType.label}</>
            )}
          </button>
        </form>
      )}

      {/* Empty State */}
      {!activeType && (
        <div style={{ 
          textAlign: 'center', padding: '60px 20px', color: '#64748b',
          background: '#111827', borderRadius: 12, border: '1px solid #1f2937',
        }}>
          <MapPin size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: '#94a3b8' }}>Pilih tipe aset di atas</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Form input akan muncul sesuai pilihan tipe</div>
        </div>
      )}
    </>
  );
}
