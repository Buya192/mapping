'use client';
import React, { useState, useEffect } from 'react';
import { DataPageShell } from '@/components/common/DataPageShell';
import { MapPin } from 'lucide-react';

export default function TiangDataPage() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    // Memuat data secara statis dari GeoJSON agar lebih cepat dan tidak membebani server/database
    fetch('/data/tiang-arcgis.geojson')
      .then(r => r.ok ? r.json() : { features: [] })
      .then(d => {
        if (d && d.features) {
          const mapped = d.features.map((f: any) => ({
             ...f.properties,
             lat: f.geometry?.coordinates?.[1] || 0,
             lng: f.geometry?.coordinates?.[0] || 0,
             nama_tiang: f.properties.NOTIANG || f.properties.NOTIANGTR || f.properties.Name || '-',
             penyulang: f.properties.NAMAPENYULANG || '-',
             namaGardu: f.properties.NAMAGD || '-',
             jenis_tiang: f.properties.JENIS_TIANG || '-',
             ukuranTiang: f.properties.UKURAN_TIANG || '-',
             konstruksi_1: f.properties.KODE_KONSTRUKSI_1 || '-',
             kondisiTiang: f.properties.KONDISI_TIANG || '-',
             jenis_hantaran_1: f.properties.JENIS_PENGHANTAR || '-',
             ukuran_hantaran_1: f.properties.UKURAN_PENGHANTAR || '-',
          }));
          setData(mapped);
        } else {
          setData([]);
        }
      })
      .catch((e) => {
        console.error('Error loading tiang:', e);
        setData([]);
      });
  }, []);

  return (
    <DataPageShell
      title="Data Tiang"
      source="tiang-arcgis.geojson"
      icon={<MapPin size={24} />}
      accentColor="3b82f6"
      data={data}
      filterKey="penyulang"
      filterLabel="Penyulang"
      searchKeys={['nama_tiang', 'penyulang', 'namaGardu']}
      tableName="tiang"
      columns={[
        { key: 'nama_tiang', label: 'No Tiang', format: (v) => <span className="font-bold text-gray-800 dark:text-white">{v || '-'}</span> },
        { key: 'penyulang', label: 'Penyulang', format: (v) => v && v !== '-' ? <span className="text-xs font-bold text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-400/10 px-2 py-0.5 rounded">{v}</span> : <span className="text-gray-400 dark:text-[#27272a]">—</span> },
        { key: 'namaGardu', label: 'Gardu', format: (v) => <span className="text-xs text-blue-600 dark:text-cyan-400 font-medium">{v || '-'}</span> },
        { key: 'jenis_tiang', label: 'Bahan', format: (v) => <span className="text-xs text-gray-500 dark:text-[#a1a1aa]">{v || '-'}</span> },
        { key: 'ukuranTiang', label: 'Ukuran', align: 'center', format: (v) => <span className="font-mono text-xs text-gray-600 dark:text-[#d4d4d8]">{v || '-'}</span> },
        { key: 'konstruksi_1', label: 'Konstruksi 1', format: (v) => <span className="text-xs text-gray-500 dark:text-[#71717a]">{v || '-'}</span> },
        { key: 'kondisiTiang', label: 'Kondisi', align: 'center', format: (v) => v && v !== '-' ? (
          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${v === 'BAIK' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>{v}</span>
        ) : <span className="text-gray-400 dark:text-[#27272a]">—</span> },
        { key: 'jenis_hantaran_1', label: 'Penghantar', format: (v, row) => (
          <span className="text-xs text-gray-500 dark:text-[#a1a1aa]">{v || '-'} {row.ukuran_hantaran_1 && row.ukuran_hantaran_1 !== '-' ? `${row.ukuran_hantaran_1}mm²` : ''}</span>
        )},
      ]}
    />
  );
}
