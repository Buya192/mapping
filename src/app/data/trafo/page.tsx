'use client';
import React, { useState, useEffect } from 'react';
import { DataPageShell } from '@/components/common/DataPageShell';
import { Zap } from 'lucide-react';

export default function TrafoDataPage() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/assets?type=gardu')
      .then(r => r.ok ? r.json() : [])
      .then(d => {
        const arr = Array.isArray(d) ? d : (d?.gardus || []);
        setData(arr.map((g: any) => ({
          ...g,
          nama: g.namaGardu || g.name || '-',
          penyulang: g.feeder || '-',
          konstruksi: g.construction || 'Portal',
          kapasitas_kva: g.capacity_kva || 0,
          merk: g.brand || 'N/A',
        })));
      })
      .catch(() => setData([]));
  }, []);

  return (
    <DataPageShell
      title="Data Gardu / Trafo Distribusi"
      source="gardu-arcgis.geojson"
      icon={<Zap size={24} />}
      accentColor="34d399"
      data={data}
      filterKey="penyulang"
      filterLabel="Penyulang"
      searchKeys={['nama', 'id', 'penyulang']}
      tableName="gardu"
      columns={[
        { key: 'nama', label: 'Nama Gardu', format: (v) => <span className="font-bold text-white">{v || '-'}</span> },
        { key: 'penyulang', label: 'Penyulang', format: (v) => v && v !== '-' ? <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">{v}</span> : <span className="text-[#27272a]">—</span> },
        { key: 'kapasitas_kva', label: 'kVA', align: 'center', format: (v) => <span className="font-mono font-bold text-emerald-400">{v || 0}</span> },
        { key: 'konstruksi', label: 'Konstruksi', format: (v) => <span className="capitalize text-[#a1a1aa] text-xs">{v || 'Portal'}</span> },
        { key: 'merk', label: 'Merk', format: (v) => <span className="text-xs text-[#71717a]">{v || '-'}</span> },
        { key: 'phases', label: 'Fasa', align: 'center', format: (v) => <span className="font-mono text-xs">{v || '-'}</span> },
        { key: 'lat', label: 'Koordinat', align: 'right', format: (_v, row) => (
          row.lat && row.lng ? <span className="font-mono text-[11px] text-[#52525b]">{Number(row.lat).toFixed(5)}, {Number(row.lng).toFixed(5)}</span> : <span className="text-[#27272a]">—</span>
        )},
      ]}
    />
  );
}
