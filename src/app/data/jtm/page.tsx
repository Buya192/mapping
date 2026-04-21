'use client';
import React, { useState, useEffect } from 'react';
import { DataPageShell } from '@/components/common/DataPageShell';
import { Activity, Cable } from 'lucide-react';
import Link from 'next/link';

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
      title="Data Segmen JTM (Jaringan Tegangan Menengah)"
      source="Supabase — jtm_segments"
      icon={<Activity size={24} />}
      accentColor="8b5cf6"
      data={data}
      filterKey="feeder"
      filterLabel="Penyulang"
      searchKeys={['name', 'feeder', 'city', 'location', 'jenisTiang']}
      columns={[
        { key: 'name', label: 'Nama / Desc', format: (v: string) => <span className="font-bold text-white">{v || '-'}</span> },
        { key: 'feeder', label: 'Penyulang', format: (v: string) => v ? (
          <Link href={`/verifikasi?feeder=${encodeURIComponent(v)}`}
            className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded no-underline hover:bg-amber-400/20 transition-colors"
          >{v}</Link>
        ) : <span className="text-[#27272a]">—</span> },
        { key: 'city', label: 'Unit', format: (v: string) => <span className="text-xs text-[#a1a1aa]">{v || '-'}</span> },
        { key: 'jenisTiang', label: 'Jenis Tiang', format: (v: string) => <span className="text-xs text-[#a1a1aa]">{v || '-'}</span> },
        { key: 'size_mm2', label: 'Ukuran', align: 'center' as const, format: (v: string) => v ? (
          <span className="font-mono text-xs font-bold text-orange-300 bg-orange-400/10 px-2 py-0.5 rounded">{v}</span>
        ) : <span className="text-[#27272a]">—</span> },
        { key: 'conductor_type', label: '🔌 Penghantar', format: (v: string) => v ? (
          <div className="flex items-center gap-1">
            <Cable size={12} className="text-purple-400" />
            <span className="text-xs font-semibold text-purple-300">{v}</span>
          </div>
        ) : <span className="text-[#27272a]">—</span> },
        { key: 'typePondasi', label: 'Pondasi', format: (v: string) => <span className="text-xs text-[#71717a]">{v || '-'}</span> },
        { key: 'verified', label: 'Status', align: 'center' as const, format: (v: boolean) => (
          v ? <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">✓ Verified</span>
            : <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">Pending</span>
        )},
        { key: 'lat', label: 'Koordinat', align: 'right' as const, format: (_v: unknown, row: any) => (
          row.lat && row.lng ? <span className="font-mono text-[11px] text-[#52525b]">{Number(row.lat).toFixed(5)}, {Number(row.lng).toFixed(5)}</span> : <span className="text-[#27272a]">—</span>
        )},
      ]}
    />
  );
}
