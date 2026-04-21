'use client';
import React, { useState, useEffect } from 'react';
import { DataPageShell } from '@/components/common/DataPageShell';
import { Zap } from 'lucide-react';
import Link from 'next/link';

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
          konstruksi: g.construction || g.tipe_gardu || 'Portal',
          kapasitas_kva: g.capacity_kva || g.kapasitas_kva || 0,
          merk: g.brand || g.merk_trafo || 'N/A',
          kondisi: g.kondisi || '-',
          verified: g.verified || false,
        })));
      })
      .catch(() => setData([]));
  }, []);

  return (
    <DataPageShell
      title="Data Gardu / Trafo Distribusi"
      source="Supabase — gardus"
      icon={<Zap size={24} />}
      accentColor="34d399"
      data={data}
      filterKey="penyulang"
      filterLabel="Penyulang"
      searchKeys={['nama', 'id', 'penyulang', 'merk']}
      columns={[
        { key: 'nama', label: 'Nama Gardu', format: (v) => <span className="font-bold text-white">{v || '-'}</span> },
        { key: 'penyulang', label: 'Penyulang', format: (v) => v && v !== '-' ? (
          <Link href={`/verifikasi?feeder=${encodeURIComponent(v)}`} className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded hover:underline">
            {v}
          </Link>
        ) : <span className="text-[#27272a]">—</span> },
        { key: 'kapasitas_kva', label: 'kVA', align: 'center', format: (v) => <span className="font-mono font-bold text-emerald-400">{v || 0}</span> },
        { key: 'konstruksi', label: 'Tipe', format: (v) => <span className="capitalize text-[#a1a1aa] text-xs">{v || 'Portal'}</span> },
        { key: 'merk', label: 'Merk', format: (v) => <span className="text-xs text-[#71717a]">{v || '-'}</span> },
        { key: 'kondisi', label: 'Kondisi', align: 'center', format: (v) => v && v !== '-' ? (
          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${v === 'Baik' || v === 'BAIK' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{v}</span>
        ) : <span className="text-[#27272a]">—</span> },
        { key: 'phases', label: 'Fasa', align: 'center', format: (v) => <span className="font-mono text-xs">{v || '-'}</span> },
        { key: 'verified', label: 'Verifikasi', align: 'center', format: (v) => (
          v ? <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">✓ Verified</span>
            : <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">Pending</span>
        )},
        { key: 'lat', label: 'Koordinat', align: 'right', format: (_v, row) => (
          row.lat && row.lng ? <span className="font-mono text-[11px] text-[#52525b]">{Number(row.lat).toFixed(5)}, {Number(row.lng).toFixed(5)}</span> : <span className="text-[#27272a]">—</span>
        )},
      ]}
    />
  );
}
