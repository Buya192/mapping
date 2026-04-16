'use client';
import React, { useState, useEffect } from 'react';
import { DataPageShell } from '@/components/common/DataPageShell';
import { Users } from 'lucide-react';

export default function PelangganDataPage() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/pelanggan')
      .then(r => r.ok ? r.json() : [])
      .then(d => setData(d))
      .catch(() => setData([]));
  }, []);

  return (
    <DataPageShell
      title="Data Pelanggan"
      source="pelanggan.geojson"
      icon={<Users size={24} />}
      accentColor="ec4899"
      data={data}
      filterKey="penyulang"
      filterLabel="Penyulang"
      searchKeys={['namaGardu', 'penyulang', 'noKwhMeter', 'ulp']}
      columns={[
        { key: 'namaGardu', label: 'Gardu', format: (v) => <span className="font-bold text-white">{v || '-'}</span> },
        { key: 'penyulang', label: 'Penyulang', format: (v) => v ? <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">{v}</span> : <span className="text-[#27272a]">—</span> },
        { key: 'ulp', label: 'ULP', format: (v) => <span className="text-xs text-[#a1a1aa]">{v || '-'}</span> },
        { key: 'fasa', label: 'Fasa', align: 'center', format: (v) => <span className="font-mono text-xs">{v || '-'}</span> },
        { key: 'jenisKwh', label: 'Jenis KWH', format: (v) => v ? (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${v === 'PRABAYAR' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>{v}</span>
        ) : <span className="text-[#27272a]">—</span> },
        { key: 'noKwhMeter', label: 'No KWH Meter', format: (v) => <span className="font-mono text-[11px] text-[#71717a]">{v || '-'}</span> },
        { key: 'kondisiSR', label: 'Kondisi SR', align: 'center', format: (v) => v ? (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${v === 'BAIK' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{v}</span>
        ) : <span className="text-[#27272a]">—</span> },
        { key: 'panjangHantaran', label: 'Panjang (m)', align: 'right', format: (v) => <span className="font-mono text-xs text-emerald-400">{v ? Number(v).toFixed(1) : '-'}</span> },
      ]}
    />
  );
}
