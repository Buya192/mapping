'use client';
import React, { useState, useEffect } from 'react';
import { DataPageShell } from '@/components/common/DataPageShell';
import { Zap } from 'lucide-react';

export default function PembangkitDataPage() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/hardware?type=pembangkit')
      .then(r => r.ok ? r.json() : [])
      .then(d => setData(Array.isArray(d) ? d : []))
      .catch(() => setData([]));
  }, []);

  return (
    <DataPageShell
      title="Data Pembangkit (PLTS & PLTD)"
      source="hardware-data.ts"
      icon={<Zap size={24} />}
      accentColor="f97316"
      data={data}
      filterKey="konfigurasi"
      filterLabel="Jenis Pembangkit"
      searchKeys={['name', 'merk', 'konfigurasi', 'status']}
      columns={[
        { key: 'name', label: 'Nama Pembangkit', format: (v) => {
          const isSolar = v?.includes('PLTS');
          return <span className={`font-bold ${isSolar ? 'text-amber-400' : 'text-cyan-400'}`}>{v || '-'}</span>;
        }},
        { key: 'konfigurasi', label: 'Jenis', format: (v) => v ? (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${v === 'Solar PV' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'}`}>{v}</span>
        ) : <span className="text-[#27272a]">—</span> },
        { key: 'kapasitas_kw', label: 'Kapasitas', align: 'center', format: (v) => {
          const kw = Number(v) || 0;
          const display = kw >= 1000 ? `${(kw/1000).toFixed(1)} MW` : `${kw} kW`;
          return <span className="font-mono font-bold text-emerald-400">{display}</span>;
        }},
        { key: 'tegangan_kv', label: 'Tegangan', align: 'center', format: (v) => <span className="font-mono text-xs text-[#d4d4d8]">{v ? `${v} kV` : '-'}</span> },
        { key: 'merk', label: 'Merk / Vendor', format: (v) => <span className="text-xs text-[#a1a1aa]">{v || '-'}</span> },
        { key: 'status', label: 'Status', align: 'center', format: (v) => (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${v === 'Aktif' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{v || 'Aktif'}</span>
        )},
        { key: 'lat', label: 'Koordinat', align: 'right', format: (_v, row) => (
          row.lat && row.lng ? <span className="font-mono text-[11px] text-[#52525b]">{Number(row.lat).toFixed(5)}, {Number(row.lng).toFixed(5)}</span> : <span className="text-[#27272a]">—</span>
        )},
      ]}
    />
  );
}
