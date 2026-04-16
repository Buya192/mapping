'use client';
import React, { useState, useEffect } from 'react';
import { DataPageShell } from '@/components/common/DataPageShell';
import { Cable } from 'lucide-react';

export default function JTRDataPage() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/jtr-segments')
      .then(r => r.ok ? r.json() : [])
      .then(d => setData(d))
      .catch(() => setData([]));
  }, []);

  return (
    <DataPageShell
      title="Data JTR (Jaringan Tegangan Rendah)"
      source="jtr-lines.geojson"
      icon={<Cable size={24} />}
      accentColor="f59e0b"
      data={data}
      filterKey="penyulang"
      filterLabel="Penyulang"
      searchKeys={['namaGardu', 'penyulang', 'description', 'jurusan']}
      columns={[
        { key: 'description', label: 'Deskripsi', format: (v) => <span className="font-bold text-white text-xs">{v || '-'}</span> },
        { key: 'namaGardu', label: 'Gardu', format: (v) => <span className="text-xs font-bold text-cyan-400">{v || '-'}</span> },
        { key: 'penyulang', label: 'Penyulang', format: (v) => v ? <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">{v}</span> : <span className="text-[#27272a]">—</span> },
        { key: 'feature', label: 'Feature', format: (v) => <span className="text-xs text-purple-400">{v || '-'}</span> },
        { key: 'fasaJaringan', label: 'Fasa', align: 'center', format: (v) => <span className="font-mono text-xs">{v || '-'}</span> },
        { key: 'jenisKabel', label: 'Kabel', format: (v) => <span className="text-xs text-[#a1a1aa]">{v || '-'}</span> },
        { key: 'ukuranKawat', label: 'Ukuran', format: (v) => <span className="font-mono text-xs text-[#d4d4d8]">{v || '-'}</span> },
        { key: 'jurusan', label: 'Jurusan', align: 'center', format: (v) => <span className="text-xs text-amber-300">{v || '-'}</span> },
        { key: 'panjangHantaran', label: 'Panjang (km)', align: 'right', format: (v) => <span className="font-mono text-xs text-emerald-400">{v ? Number(v).toFixed(3) : '-'}</span> },
      ]}
    />
  );
}
