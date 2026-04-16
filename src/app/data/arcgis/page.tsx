'use client';
import React, { useState, useEffect } from 'react';
import { DataPageShell } from '@/components/common/DataPageShell';
import { Radio } from 'lucide-react';

export default function ArcgisDataPage() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/arcgis')
      .then(r => r.ok ? r.json() : [])
      .then(d => setData(Array.isArray(d) ? d : (d?.data || [])))
      .catch(() => setData([]));
  }, []);

  return (
    <DataPageShell
      title="Titik GIS Ekstra (arg.gdb)"
      source="arg.gdb · Points layer"
      icon={<Radio size={24} />}
      accentColor="fcd34d"
      data={data}
      filterKey="folderPath"
      filterLabel="Folder"
      searchKeys={['name', 'folderPath']}
      columns={[
        { key: 'name', label: 'Nama Titik', format: (v) => <span className="font-bold text-white">{v || '-'}</span> },
        { key: 'folderPath', label: 'Folder / Sheet', format: (v) => v ? <span className="text-xs font-mono text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">{v}</span> : <span className="text-[#27272a]">—</span> },
        { key: 'lat', label: 'Latitude', align: 'right', format: (v) => <span className="font-mono text-xs text-emerald-400">{v ? Number(v).toFixed(6) : '-'}</span> },
        { key: 'lng', label: 'Longitude', align: 'right', format: (v) => <span className="font-mono text-xs text-emerald-400">{v ? Number(v).toFixed(6) : '-'}</span> },
        { key: 'alt', label: 'Altitude', align: 'center', format: (v) => <span className="font-mono text-xs text-[#a1a1aa]">{v ? Number(v).toFixed(2) : '0.00'}m</span> },
        { key: 'popupInfo', label: 'Keterangan', format: (v) => {
          if (!v) return <span className="text-[#27272a]">—</span>;
          const match = String(v).match(/Decription\s*:\s*<\/b><\/td><td class='cv'>([^<]+)/);
          const desc = match ? match[1].trim() : '';
          return desc ? <span className="text-xs text-yellow-400">{desc}</span> : <span className="text-[10px] text-[#3f3f46]">HTML RAW</span>;
        }},
      ]}
    />
  );
}
