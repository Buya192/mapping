'use client';
import React, { useState, useEffect } from 'react';
import { DataPageShell } from '@/components/common/DataPageShell';
import { Activity } from 'lucide-react';

export default function JTMDataPage() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/jtm-segments')
      .then(r => r.ok ? r.json() : [])
      .then(d => setData(d))
      .catch(() => setData([]));
  }, []);

  return (
    <DataPageShell
      title="Data Tiang JTM"
      source="jtm-lines.geojson"
      icon={<Activity size={24} />}
      accentColor="8b5cf6"
      data={data}
      filterKey="feeder"
      filterLabel="Penyulang"
      searchKeys={['name', 'feeder', 'city', 'location']}
      columns={[
        { key: 'name', label: 'Nama / Desc', format: (v) => <span className="font-bold text-white">{v || '-'}</span> },
        { key: 'feeder', label: 'Penyulang', format: (v) => v ? <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">{v}</span> : <span className="text-[#27272a]">—</span> },
        { key: 'city', label: 'Unit', format: (v) => <span className="text-xs text-[#a1a1aa]">{v || '-'}</span> },
        { key: 'jenisTiang', label: 'Jenis Tiang', format: (v) => <span className="text-xs text-[#a1a1aa]">{v || '-'}</span> },
        { key: 'size_mm2', label: 'Ukuran', align: 'center', format: (v) => <span className="font-mono text-xs text-[#d4d4d8]">{v || '-'}</span> },
        { key: 'typePondasi', label: 'Pondasi', format: (v) => <span className="text-xs text-[#71717a]">{v || '-'}</span> },
        { key: 'asset_type', label: 'Klasifikasi', format: (v) => <span className="text-[10px] font-mono text-purple-400">{v || '-'}</span> },
        { key: 'lat', label: 'Koordinat', align: 'right', format: (_v, row) => (
          row.lat && row.lng ? <span className="font-mono text-[11px] text-[#52525b]">{Number(row.lat).toFixed(5)}, {Number(row.lng).toFixed(5)}</span> : <span className="text-[#27272a]">—</span>
        )},
      ]}
    />
  );
}
