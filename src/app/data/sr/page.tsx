'use client';
import React, { useState, useEffect } from 'react';
import { DataPageShell } from '@/components/common/DataPageShell';
import { Cable } from 'lucide-react';

export default function SRDataPage() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/sr-lines')
      .then(r => r.ok ? r.json() : [])
      .then(d => setData(d))
      .catch(() => setData([]));
  }, []);

  return (
    <DataPageShell
      title="Data SR (Sambungan Rumah)"
      source="sr-lines.geojson"
      icon={<Cable size={24} />}
      accentColor="06b6d4"
      data={data}
      filterKey="namaGardu"
      filterLabel="Gardu"
      searchKeys={['namaGardu', 'id']}
      tableName="sr"
      columns={[
        { key: 'id', label: 'ID', format: (v) => <span className="font-mono text-xs text-[#52525b]">{v || '-'}</span> },
        { key: 'namaGardu', label: 'Nama Gardu', format: (v) => <span className="font-bold text-white">{v || '-'}</span> },
        { key: 'shapeLength', label: 'Panjang (m)', align: 'right', format: (v) => <span className="font-mono text-xs text-emerald-400">{v ? Number(v).toFixed(2) : '-'}</span> },
        { key: 'userGambar', label: 'Surveyor', format: (v) => <span className="text-xs text-[#71717a]">{v || '-'}</span> },
        { key: 'status', label: 'Status', align: 'center', format: (v) => (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">{v || 'aktif'}</span>
        )},
      ]}
    />
  );
}
