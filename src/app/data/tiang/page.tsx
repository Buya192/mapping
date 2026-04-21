'use client';
import React, { useState, useEffect } from 'react';
import { DataPageShell } from '@/components/common/DataPageShell';
import { MapPin, Navigation2 } from 'lucide-react';
import Link from 'next/link';

export default function TiangDataPage() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    // Load from GeoJSON (primary source) and enrich with Supabase verified status
    Promise.all([
      fetch('/data/tiang-arcgis.geojson').then(r => r.ok ? r.json() : { features: [] }),
      fetch('/api/dream/asset?table=tiang_jtm&limit=5000').then(r => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] })),
    ]).then(([geo, db]) => {
      // Build verified lookup from Supabase
      const verifiedMap = new Map<string, boolean>();
      if (db?.data) {
        db.data.forEach((item: any) => {
          const key = item.nama_tiang || item.NOTIANG || '';
          if (key) verifiedMap.set(key.toUpperCase(), !!item.verified);
        });
      }

      if (geo?.features) {
        const mapped = geo.features.map((f: any) => {
          const nama = f.properties.NOTIANG || f.properties.NOTIANGTR || f.properties.Name || '-';
          return {
            ...f.properties,
            lat: f.geometry?.coordinates?.[1] || 0,
            lng: f.geometry?.coordinates?.[0] || 0,
            nama_tiang: nama,
            penyulang: f.properties.NAMAPENYULANG || '-',
            namaGardu: f.properties.NAMAGD || '-',
            jenis_tiang: f.properties.JENIS_TIANG || '-',
            ukuranTiang: f.properties.UKURAN_TIANG || '-',
            konstruksi_1: f.properties.KODE_KONSTRUKSI_1 || '-',
            kondisiTiang: f.properties.KONDISI_TIANG || '-',
            jenis_hantaran_1: f.properties.JENIS_PENGHANTAR || '-',
            ukuran_hantaran_1: f.properties.UKURAN_PENGHANTAR || '-',
            verified: verifiedMap.get(nama.toUpperCase()) || false,
          };
        });
        setData(mapped);
      }
    }).catch(() => setData([]));
  }, []);

  return (
    <DataPageShell
      title="Data Tiang"
      source="tiang-arcgis.geojson + Supabase"
      icon={<MapPin size={24} />}
      accentColor="3b82f6"
      data={data}
      filterKey="penyulang"
      filterLabel="Penyulang"
      searchKeys={['nama_tiang', 'penyulang', 'namaGardu']}
      columns={[
        { key: 'nama_tiang', label: 'No Tiang', format: (v) => <span className="font-bold text-gray-800 dark:text-white">{v || '-'}</span> },
        { key: 'penyulang', label: 'Penyulang', format: (v) => v && v !== '-' ? (
          <Link href={`/verifikasi?feeder=${encodeURIComponent(v)}`} className="text-xs font-bold text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-400/10 px-2 py-0.5 rounded hover:underline">
            {v}
          </Link>
        ) : <span className="text-gray-400 dark:text-[#27272a]">—</span> },
        { key: 'namaGardu', label: 'Gardu', format: (v) => <span className="text-xs text-blue-600 dark:text-cyan-400 font-medium">{v || '-'}</span> },
        { key: 'jenis_tiang', label: 'Bahan', format: (v) => <span className="text-xs text-gray-500 dark:text-[#a1a1aa]">{v || '-'}</span> },
        { key: 'ukuranTiang', label: 'Ukuran', align: 'center', format: (v) => <span className="font-mono text-xs text-gray-600 dark:text-[#d4d4d8]">{v || '-'}</span> },
        { key: 'konstruksi_1', label: 'Konstruksi', format: (v) => <span className="text-xs text-gray-500 dark:text-[#71717a]">{v || '-'}</span> },
        { key: 'kondisiTiang', label: 'Kondisi', align: 'center', format: (v) => v && v !== '-' ? (
          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${v === 'BAIK' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>{v}</span>
        ) : <span className="text-gray-400 dark:text-[#27272a]">—</span> },
        { key: 'jenis_hantaran_1', label: 'Penghantar', format: (v, row) => (
          <span className="text-xs text-gray-500 dark:text-[#a1a1aa]">{v || '-'} {row.ukuran_hantaran_1 && row.ukuran_hantaran_1 !== '-' ? `${row.ukuran_hantaran_1}mm²` : ''}</span>
        )},
        { key: 'verified', label: 'Verifikasi', align: 'center', format: (v) => (
          v ? <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">✓ Verified</span>
            : <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">Pending</span>
        )},
      ]}
    />
  );
}
