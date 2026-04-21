'use client';
import React, { useState, useEffect } from 'react';
import { DataPageShell } from '@/components/common/DataPageShell';
import { Cable } from 'lucide-react';
import Link from 'next/link';

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
      source="Supabase — jtr_segments"
      icon={<Cable size={24} />}
      accentColor="f59e0b"
      data={data}
      filterKey="penyulang"
      filterLabel="Penyulang"
      searchKeys={['namaGardu', 'penyulang', 'description', 'jurusan', 'jenisKabel']}
      columns={[
        { key: 'description', label: 'Deskripsi', format: (v: string) => <span className="font-bold text-white text-xs">{v || '-'}</span> },
        { key: 'namaGardu', label: 'Gardu', format: (v: string) => <span className="text-xs font-bold text-cyan-400">{v || '-'}</span> },
        { key: 'penyulang', label: 'Penyulang', format: (v: string) => v ? (
          <Link href={`/verifikasi?feeder=${encodeURIComponent(v)}`}
            className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded no-underline hover:bg-amber-400/20 transition-colors"
          >{v}</Link>
        ) : <span className="text-[#27272a]">—</span> },
        { key: 'fasaJaringan', label: 'Fasa', align: 'center' as const, format: (v: string) => v ? (
          <span className="font-mono text-xs font-bold text-blue-300 bg-blue-400/10 px-2 py-0.5 rounded">{v}</span>
        ) : <span className="text-[#27272a]">—</span> },
        { key: 'jenisKabel', label: '🔌 Kabel', format: (v: string) => v ? (
          <div className="flex items-center gap-1">
            <Cable size={12} className="text-amber-400" />
            <span className="text-xs font-semibold text-amber-300">{v}</span>
          </div>
        ) : <span className="text-[#27272a]">—</span> },
        { key: 'ukuranKawat', label: 'Ukuran', format: (v: string) => v ? (
          <span className="font-mono text-xs font-bold text-orange-300 bg-orange-400/10 px-1.5 py-0.5 rounded">{v}</span>
        ) : <span className="text-[#27272a]">—</span> },
        { key: 'jurusan', label: 'Jurusan', align: 'center' as const, format: (v: string) => <span className="text-xs text-amber-300">{v || '-'}</span> },
        { key: 'panjangHantaran', label: 'Panjang (km)', align: 'right' as const, format: (v: number) => <span className="font-mono text-xs text-emerald-400">{v ? Number(v).toFixed(3) : '-'}</span> },
        { key: 'verified', label: 'Status', align: 'center' as const, format: (v: boolean) => (
          v ? <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">✓ Verified</span>
            : <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">Pending</span>
        )},
      ]}
    />
  );
}
