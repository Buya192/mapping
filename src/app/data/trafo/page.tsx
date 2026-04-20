'use client';
import React, { useState, useEffect } from 'react';
import { DataPageShell } from '@/components/common/DataPageShell';
import { Zap } from 'lucide-react';

export default function TrafoDataPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load REAL data from GeoJSON file
    fetch('/data/gardu-arcgis.geojson')
      .then(r => r.json())
      .then(geojson => {
        if (geojson?.features && Array.isArray(geojson.features)) {
          const mapped = geojson.features
            .filter((f: any) => f.properties)
            .map((f: any, idx: number) => {
              const props = f.properties;
              return {
                id: props.id || `gardu_${idx}`,
                nama: props.NAMAGD || props.Name || '-',
                penyulang: props.NAMAPENYULANG || props.PENYULANG || '-',
                kapasitas_kva: parseInt(props.KAPASITAS) || 0,
                konstruksi: props.RUJUKAN_KONSTRUKSI || 'PORTAL',
                merk: props.MANUFACTURER || 'N/A',
                fasa: props.FASA_TRAFO || '3',
                lat: parseFloat(props.LATITUDEY) || 0,
                lng: parseFloat(props.LONGITUDEX) || 0,
                ulp: props.ULP || '-',
                surveyor: props.NAMA_SURVEYOR || '-',
              };
            });
          setData(mapped);
        }
      })
      .catch(err => console.log("[v0] Error loading GeoJSON:", err))
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
        { key: 'konstruksi', label: 'Konstruksi', format: (v) => <span className="capitalize text-sm">{v || '-'}</span> },
        { key: 'merk', label: 'Merk', format: (v) => <span className="text-sm">{v || '-'}</span> },
        { key: 'fasa', label: 'Fasa', align: 'center', format: (v) => <span className="font-mono text-sm">{v || '-'}</span> },
        { key: 'lat', label: 'Koordinat', align: 'right', format: (_v, row) => (
          row.lat && row.lng ? <span className="font-mono text-[11px]">{Number(row.lat).toFixed(5)}, {Number(row.lng).toFixed(5)}</span> : <span>—</span>
        )},
      ]}
    />
  );
}
