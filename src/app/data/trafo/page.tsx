'use client';
import React, { useState, useEffect } from 'react';
import { DataPageShell } from '@/components/common/DataPageShell';
import { Zap } from 'lucide-react';

// Sample data from GeoJSON (fallback if API fails)
const SAMPLE_GARDU = [
  { id: '1', nama: 'Gardu MORU 1', penyulang: 'MORU', konstruksi: 'CANTOL', kapasitas_kva: 50, merk: 'B&;D', lat: -8.25427, lng: 124.52789 },
  { id: '2', nama: 'Gardu MORU 2', penyulang: 'MORU', konstruksi: 'CANTOL', kapasitas_kva: 50, merk: 'N/A', lat: -8.26338, lng: 124.52134 },
  { id: '3', nama: 'Gardu MORU 3', penyulang: 'MORU', konstruksi: 'CANTOL', kapasitas_kva: 25, merk: 'STARLITE', lat: -8.25002, lng: 124.51409 },
  { id: '4', nama: 'Gardu MORU 4', penyulang: 'MORU', konstruksi: 'PORTAL', kapasitas_kva: 100, merk: 'N/A', lat: -8.37339, lng: 124.41683 },
  { id: '5', nama: 'Gardu MORU 5', penyulang: 'MORU', konstruksi: 'PORTAL', kapasitas_kva: 50, merk: 'N/A', lat: -8.35434, lng: 124.41845 },
  { id: '6', nama: 'Gardu MORU 6', penyulang: 'MORU', konstruksi: 'PORTAL', kapasitas_kva: 50, merk: 'N/A', lat: -8.32525, lng: 124.42751 },
];

export default function TrafoDataPage() {
  const [data, setData] = useState(SAMPLE_GARDU);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to fetch from API, fallback to sample data
    fetch('/api/assets?type=gardu')
      .then(r => r.ok ? r.json() : null)
      .then(apiData => {
        if (apiData && Array.isArray(apiData) && apiData.length > 0) {
          const mapped = apiData.map((g: any) => ({
            id: g.id || Math.random().toString(),
            nama: g.namaGardu || g.name || '-',
            penyulang: g.feeder || g.penyulang || '-',
            konstruksi: g.construction || 'Portal',
            kapasitas_kva: g.capacity_kva || 0,
            merk: g.brand || 'N/A',
            lat: g.lat || 0,
            lng: g.lng || 0,
          }));
          setData(mapped);
        } else {
          setData(SAMPLE_GARDU);
        }
      })
      .catch(() => setData(SAMPLE_GARDU))
      .finally(() => setLoading(false));
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
      searchKeys={['nama', 'penyulang']}
      tableName="gardu"
      columns={[
        { key: 'nama', label: 'Nama Gardu', format: (v) => <span className="font-bold">{v || '-'}</span> },
        { key: 'penyulang', label: 'Penyulang', format: (v) => v && v !== '-' ? <span className="text-xs font-bold bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded">{v}</span> : <span>—</span> },
        { key: 'kapasitas_kva', label: 'kVA', align: 'center', format: (v) => <span className="font-mono font-bold text-cyan-300">{v || 0}</span> },
        { key: 'konstruksi', label: 'Konstruksi', format: (v) => <span className="capitalize text-sm">{v || 'Portal'}</span> },
        { key: 'merk', label: 'Merk', format: (v) => <span className="text-sm">{v || '-'}</span> },
        { key: 'lat', label: 'Koordinat', align: 'right', format: (_v, row) => (
          row.lat && row.lng ? <span className="font-mono text-[11px]">{Number(row.lat).toFixed(5)}, {Number(row.lng).toFixed(5)}</span> : <span>—</span>
        )},
      ]}
    />
  );
}
