'use client';

import React, { useRef, useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Gardu, Penyulang, demoPenyulang } from '@/lib/demo-data';
import { useAssetStore, TiangJTM, UsulanTiang, UsulanGardu, UsulanJalur } from '@/store/assetStore';
import { HardwareItem } from '@/lib/hardware-data';
import toast from 'react-hot-toast';

export default function PerencanaanPage() {
  const [activeTab, setActiveTab] = useState<'gardu' | 'jtm' | 'jtr' | 'pelanggan' | 'tiang' | 'tiang_arcgis' | 'hardware' | 'usulan'>('gardu');
  const [editingHardwareId, setEditingHardwareId] = useState<string | null>(null);
  const [editingHardwareForm, setEditingHardwareForm] = useState<Partial<HardwareItem>>({});
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // ArcGIS Native state
  const [arcgisCounts, setArcgisCounts] = useState({ pelanggan: 0, jtr: 0, jtm: 0, sr: 0, tiang_arcgis: 0 });
  const [geoData, setGeoData] = useState<any[]>([]);
  const [isGeoLoading, setIsGeoLoading] = useState(false);
  
  const gardus = useAssetStore((state) => state.gardus);
  const addGardus = useAssetStore((state) => state.addGardus);
  const jtmSegments = useAssetStore((state) => state.jtmSegments);
  const { clearGardus, addJTMSegments, clearJTMSegments, tiangJTM, addTiangJTM, clearTiangJTM, 
    usulanTiang, usulanGardu, usulanJalur, deleteUsulanTiang, deleteUsulanGardu, deleteUsulanJalur,
    hardwareAssets, addHardwareAsset, updateHardwareAsset, deleteHardwareAsset
  } = useAssetStore();

  // Load ArcGIS counts metadata on mount
  useEffect(() => {
    fetch('/data/metadata.json')
      .then(res => res.json())
      .then(data => setArcgisCounts(data))
      .catch(() => {});
  }, []);

  // Auto-fill Gardu from ArcGIS if empty
  useEffect(() => {
    if (gardus.length === 0) {
      fetch('/data/gardu-arcgis.geojson')
        .then(res => res.json())
        .then(data => {
          if (data && data.features) {
            const parsed = data.features.map((f: any, i: number) => ({
              id: f.properties.NAMAGD || `GD-${i}`,
              nama: f.properties.NAMAGD || `Gardu-${i}`,
              fasa: f.properties.FASA_TRAFO || 3,
              kapasitas_kva: parseFloat(f.properties.KAPASITAS || '0'),
              merk_trafo: f.properties.MANUFACTURER?.replace(' (PENANGANAN)', '') || 'N/A',
              jenis_konstruksi: f.properties.RUJUKAN_KONSTRUKSI || 'Portal',
              penyulang: f.properties.NAMAPENYULANG || '-',
              lat: f.geometry.coordinates[1],
              lng: f.geometry.coordinates[0],
              latitude: f.geometry.coordinates[1],
              longitude: f.geometry.coordinates[0],
            }));
            addGardus(parsed);
          }
        })
        .catch(e => console.error("Auto load gardu err", e));
    }
  }, [gardus.length, addGardus]);

  // Fetch massive geojson selectively
  useEffect(() => {
    if (activeTab === 'jtm' || activeTab === 'jtr' || activeTab === 'pelanggan' || activeTab === 'tiang_arcgis') {
      setIsGeoLoading(true);
      const url = activeTab === 'jtm' ? '/data/jtm-lines.geojson' 
                : activeTab === 'jtr' ? '/data/jtr-lines.geojson' 
                : activeTab === 'tiang_arcgis' ? '/data/tiang-arcgis.geojson'
                : '/data/pelanggan.geojson';
      
      fetch(url)
        .then(res => res.json())
        .then(data => {
          if (data && data.features) {
             // For rendering performance, we slice the first 150 items.
             setGeoData(data.features.slice(0, 150));
          }
          setIsGeoLoading(false);
        })
        .catch(err => {
          console.error(err);
          setGeoData([]);
          setIsGeoLoading(false);
        });
    } else {
      setGeoData([]);
    }
  }, [activeTab]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const processParsedData = (data: any[]) => {
      const firstRow = data[0];
      const isTiang = ('nama_tiang' in firstRow) || ('urutan_tiang' in firstRow) || ('jenis_tiang' in firstRow);
      const isJTM = ('nama_jtm' in firstRow) || ('panjang_hantaran' in firstRow) || ('Shape_Length' in firstRow);

      if (isTiang) {
        // ===== TIANG JTM CSV PARSER =====
        const parsedTiang: TiangJTM[] = data.map((row: any) => {
          const lat = parseFloat(String(row.latitude || '0').replace(',', '.'));
          const lng = parseFloat(String(row.longitude || '0').replace(',', '.'));
          if (isNaN(lat) || lat === 0 || isNaN(lng) || lng === 0) return null;

          return {
            objectId: parseInt(row.OBJECTID) || undefined,
            nama_tiang: row.nama_tiang || '',
            urutan_tiang: parseInt(row.urutan_tiang) || undefined,
            ulp: row.ulp || '',
            sulp: row.sulp || '',
            penyulang: row.penyulang || '',
            jenis_aset: row.jenis_aset || '',
            asset_p3: row.asset_p3 || '',
            jenis_tiang: row.jenis_tiang || '',
            tipe_tiang: row.tipe_tiang || '',
            pondasi_tiang: row.pondasi_tiang || '',
            kekuatan_tiang: parseInt(row.kekuatan_tiang) || undefined,
            penopang: row.penopang || '',
            konstruksi_1: row.konstruksi_1 || '',
            konstruksi_2: row.konstruksi_2 || '',
            jenis_hantaran_1: row.jenis_hantaran_1 || '',
            jenis_hantaran_2: row.jenis_hantaran_2 || '',
            ukuran_hantaran_1: row.ukuran_hantaran_1 || '',
            ukuran_hantaran_2: row.ukuran_hantaran_2 || '',
            under_built: row.under_built_jtm_1 || '',
            prioritas: parseInt(row.prioritas) || undefined,
            vendor: row.vendor || '',
            install_date: row.install_date || '',
            operating_date: row.operating_date || '',
            alamat: row.street_address || '',
            kepemilikan: row.switching_status_kepemilikan || '',
            latitude: lat,
            longitude: lng,
            lat: lat,
            lng: lng
          } as TiangJTM;
        }).filter(Boolean) as TiangJTM[];

        addTiangJTM(parsedTiang);
        toast.success(`Berhasil mengimpor ${parsedTiang.length} Tiang JTM ke Cloud!`);
        setActiveTab('tiang');
      } else if (isJTM) {
        // Fallback or deprecated handler if user uploads manual JTM
        toast.success(`Modul CSV manual disensor, data ArcGIS (${arcgisCounts.jtm} segments) menjadi sumber utama!`);
        setActiveTab('jtm');
      } else {
        const parsedGardu = data.map((row: any) => {
          let lat = parseFloat(String(row.latitude || '').replace(',', '.'));
          let lng = parseFloat(String(row.longitude || '').replace(',', '.'));

          // Fallback to WKT for Gardu
          if (isNaN(lat) || isNaN(lng)) {
            const wkt = row.geometry_wkt || row.wkt || '';
            if (wkt.toUpperCase().startsWith('POINT')) {
              const matches = wkt.match(/\(([^)]+)\)/);
              if (matches) {
                const [wktLng, wktLat] = matches[1].trim().split(/\s+/).map(Number);
                lat = wktLat;
                lng = wktLng;
              }
            }
          }

          if(isNaN(lat) || isNaN(lng)) return null;

          return {
            id: 'TRF_' + (row.nama_gardu || Math.random().toString(36).substring(7)),
            nama: 'Trafo ' + (row.nama_gardu || 'Unnamed'),
            tipe: 'Trafo',
            lat: lat,
            lng: lng,
            latitude: lat,
            longitude: lng,
            kapasitas_kva: parseInt(row.kapasitas_trafo) || 50,
            kapasitas_mva: (parseInt(row.kapasitas_trafo) || 50) / 1000,
            status: 'aktif',
            last_maintenance: row.data_collected_time || '',
            penyulang: row.penyulang || '-',
            jenis_konstruksi: row.jenis_gardu || '',
            merk_trafo: row.merk_trafo || '',
            tahun_buat: row.tahun_buat_trafo || '',
            fasa: row.fasa_trafo || '',
            alamat_lengkap: row.gardu_format_address || row.gardu_street_address || ''
          } as Gardu;
        }).filter(Boolean) as Gardu[];
        
        addGardus(parsedGardu);
        toast.success(`Berhasil mengimpor ${parsedGardu.length} Gardu/Trafo ke Cloud!`);
        setActiveTab('gardu');
      }

      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<any>) => {
        if (results.data.length === 0) return;

        let firstRow = results.data[0];
        const rawKeys = Object.keys(firstRow);
        
        if (rawKeys.length === 1 && rawKeys[0].includes(';')) {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            delimiter: ';',
            complete: (retryResults) => processParsedData(retryResults.data)
          });
          return;
        }

        processParsedData(results.data);
      }
    });
  };

  const handleDownloadTemplates = () => {
    const garduHeader = "nama_gardu,kapasitas_trafo,jenis_gardu,merk_trafo,fasa_trafo,penyulang,latitude,longitude,geometry_wkt\nContoh_Trafo,50,Portal,B&D,3 Fasa,ILW,-8.24,124.52,POINT(124.52 -8.24)";
    const jtmHeader = "nama_jtm,penyulang,panjang_hantaran,tegangan_jtm,jenis_konduktor_1,ukuran_hantaran_1,geometry_wkt\nSEGMENT-01,ILW,1.5,20kV,AAAC,70,LINESTRING(124.52 -8.24, 124.53 -8.25)";
    
    const blob1 = new Blob([garduHeader], { type: 'text/csv' });
    const blob2 = new Blob([jtmHeader], { type: 'text/csv' });
    
    const link1 = document.createElement('a');
    link1.href = window.URL.createObjectURL(blob1);
    link1.download = 'template_impor_gardu.csv';
    link1.click();

    setTimeout(() => {
      const link2 = document.createElement('a');
      link2.href = window.URL.createObjectURL(blob2);
      link2.download = 'template_impor_jtm.csv';
      link2.click();
    }, 500);
  };

  const filteredGardu = gardus.filter((g) => {
    const matchesSearch = g.nama.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterType === 'all') return matchesSearch;
    if (filterType === 'portal' && g.jenis_konstruksi?.toLowerCase().includes('portal')) return matchesSearch;
    if (filterType === 'cantol' && g.jenis_konstruksi?.toLowerCase().includes('cantol')) return matchesSearch;
    if (filterType === 'normal' && !g.jenis_konstruksi?.toLowerCase().includes('portal') && !g.jenis_konstruksi?.toLowerCase().includes('cantol')) return matchesSearch;
    return false;
  });

  const filteredJTM = jtmSegments.filter((j) => {
    return j.nama.toLowerCase().includes(searchTerm.toLowerCase()) || (j.penyulang || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredTiang = tiangJTM.filter((t) => {
    const s = searchTerm.toLowerCase();
    return (t.nama_tiang || '').toLowerCase().includes(s) ||
      (t.penyulang || '').toLowerCase().includes(s) ||
      (t.vendor || '').toLowerCase().includes(s) ||
      (t.alamat || '').toLowerCase().includes(s);
  });

  const handleEditHardware = (h: HardwareItem) => {
    setEditingHardwareId(h.id);
    setEditingHardwareForm(h);
  };
  
  const handleSaveHardware = () => {
    if (editingHardwareId && editingHardwareForm.name) {
      updateHardwareAsset(editingHardwareId, editingHardwareForm);
    }
    setEditingHardwareId(null);
  };

  const handleCreateHardware = (type: 'pembangkit' | 'fco' | 'recloser') => {
    const newAsset: HardwareItem = {
      id: `${type}_` + Math.random().toString(36).substring(7),
      type,
      name: `NEW ${type.toUpperCase()}`,
      lat: -8.25, lng: 124.5,
      status: 'Aktif'
    };
    addHardwareAsset(newAsset);
    setEditingHardwareId(newAsset.id);
    setEditingHardwareForm(newAsset);
  };

  const handleDeleteHardware = (id: string) => {
    if (window.confirm("Yakin ingin menghapus aset hardware ini?")) {
      deleteHardwareAsset(id);
    }
  };

  const updateEditForm = (key: keyof HardwareItem, value: any) => {
    setEditingHardwareForm(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-white mb-2">Database Pemetaan Jaringan ArcGIS</h1>
           <div className="flex flex-wrap gap-2 items-center">
             <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
             <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
             >
                + Upload CSV Data Aset
             </button>
             <button 
                onClick={handleDownloadTemplates}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 rounded-md text-sm font-medium transition-colors"
             >
                Download Template Format
             </button>
             <button 
                onClick={() => { clearGardus(); clearJTMSegments(); clearTiangJTM(); }}
                className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/20 rounded-md text-sm font-medium transition-colors"
             >
                Reset Semua Data
             </button>
           </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto mt-4 lg:mt-0">
          <input 
            type="text" 
            placeholder="Cari Data..." 
            className="px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-md flex-1 sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {activeTab === 'gardu' && (
            <select 
              className="px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">Semua Konstruksi</option>
              <option value="portal">Portal / H-Frame</option>
              <option value="cantol">Cantol</option>
              <option value="normal">Normal / Gardu Distribusi</option>
            </select>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700 mb-6 flex-wrap font-sans">
        <button
          className={'px-5 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ' + (activeTab === 'gardu' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-400 hover:text-slate-300')}
          onClick={() => setActiveTab('gardu')}
        >
          ⚡ Data Gardu & Trafo ({filteredGardu.length})
        </button>
        <button
          className={'px-5 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ' + (activeTab === 'jtm' ? 'border-amber-500 text-amber-400 bg-amber-500/5' : 'border-transparent text-slate-400 hover:text-slate-300')}
          onClick={() => setActiveTab('jtm')}
        >
          🗺️ Geospasial JTM ({arcgisCounts.jtm || 0})
        </button>
        <button
          className={'px-5 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ' + (activeTab === 'jtr' ? 'border-orange-500 text-orange-400 bg-orange-500/5' : 'border-transparent text-slate-400 hover:text-slate-300')}
          onClick={() => setActiveTab('jtr')}
        >
          🗺️ Geospasial JTR ({arcgisCounts.jtr || 0})
        </button>

        <button
          className={'px-5 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ' + (activeTab === 'pelanggan' ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' : 'border-transparent text-slate-400 hover:text-slate-300')}
          onClick={() => setActiveTab('pelanggan')}
        >
          🏠 Pelanggan & Hantaran ({arcgisCounts.pelanggan || 0})
        </button>
        <button
          className={'px-5 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ' + (activeTab === 'tiang_arcgis' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-400 hover:text-slate-300')}
          onClick={() => setActiveTab('tiang_arcgis')}
        >
          📍 Tiang & Konstruksi ({arcgisCounts.tiang_arcgis || 0})
        </button>
        <button
          className={'px-5 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ' + (activeTab === 'hardware' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-400 hover:text-slate-300')}
          onClick={() => setActiveTab('hardware')}
        >
          ⚙️ Aset Hardware ({hardwareAssets.length})
        </button>
        <button
          className={'px-5 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ' + (activeTab === 'usulan' ? 'border-yellow-400 text-yellow-300 bg-yellow-400/5' : 'border-transparent text-slate-400 hover:text-slate-300')}
          onClick={() => setActiveTab('usulan')}
        >
          🟡 Data Usulan ({usulanTiang.length + usulanGardu.length + usulanJalur.length})
        </button>
      </div>

      <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          {activeTab === 'gardu' && (
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="bg-[#1e293b] text-slate-200 uppercase font-bold text-xs border-b-2 border-slate-700 shadow-sm tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-4 rounded-tl-lg">Nama / ID Gardu</th>
                  <th scope="col" className="px-6 py-4">Fasa</th>
                  <th scope="col" className="px-6 py-4">Konstruksi</th>
                  <th scope="col" className="px-6 py-4">Kapasitas (kVA)</th>
                  <th scope="col" className="px-6 py-4">Merk Trafo</th>
                  <th scope="col" className="px-6 py-4">Penyulang</th>
                  <th scope="col" className="px-6 py-4 text-center rounded-tr-lg">Pemetaan (GPS)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredGardu.length > 0 ? (
                  filteredGardu.map((g) => (
                    <tr key={g.id} className="bg-slate-900 hover:bg-[#1e293b]/60 transition-all duration-200 group">
                      <td className="px-6 py-4 font-medium text-white whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg group-hover:bg-indigo-500/20 transition-colors">
                            ⚡
                          </div>
                          <div>
                            <span className="text-[15px] block">{g.nama}</span>
                            <span className="text-[11px] text-slate-500 font-mono tracking-tight">{g.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 text-xs rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                          {g.fasa ? `${g.fasa} Fasa` : '3 Fasa'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-300 font-medium capitalize">
                        {g.jenis_konstruksi || 'Portal'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${(!g.kapasitas_kva || g.kapasitas_kva <= 50) ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                            {g.kapasitas_kva || '?'} kVA
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-medium tracking-wide">
                        {g.merk_trafo || '-'}
                      </td>
                      <td className="px-6 py-4 font-bold text-amber-500/90 whitespace-nowrap tracking-wide">
                        {g.penyulang || '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {g.latitude ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)] border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            Tervalidasi
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-slate-800 text-slate-500">
                            N/A
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-3">
                        <span className="text-4xl">📭</span>
                        <p>Tidak ada data trafo / gardu ditemukan.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'jtm' && (
            <div className="overflow-x-auto pb-4">
              <table className="w-full text-sm text-left text-slate-300 whitespace-nowrap">
                <thead className="bg-[#1e293b] text-slate-200 uppercase font-bold text-[11px] border-b-2 border-slate-700 shadow-sm tracking-wider">
                  <tr>
                    <th scope="col" className="px-4 py-4 rounded-tl-lg">No</th>
                    <th scope="col" className="px-4 py-4">ID / Unit JTM</th>
                    <th scope="col" className="px-4 py-4">Penyulang Induk</th>
                    <th scope="col" className="px-4 py-4">Spesifikasi Material</th>
                    <th scope="col" className="px-4 py-4 bg-amber-900/20">Panjang Hantaran (m)</th>
                    <th scope="col" className="px-4 py-4">Konstruksi GIS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {isGeoLoading ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-amber-500 animate-pulse">Memuat Topologi JTM ArcGIS...</td></tr>
                  ) : geoData.length > 0 ? (
                    geoData.map((j, idx) => (
                      <tr key={idx} className="bg-slate-900/60 hover:bg-[#1e293b] transition-all duration-200">
                        <td className="px-4 py-3 font-mono text-slate-500">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-white">
                          <span className="block font-bold">{j.properties.CXUNIT || j.properties.DESCRIPTION || j.properties.Name || `JTM-Segmen-${idx}`}</span>
                          <span className="text-[10px] text-slate-500 uppercase">{j.properties.CXCLASSIFICATIONDESC || 'Jalur Distribusi Medium Vol'}</span>
                        </td>
                        <td className="px-4 py-3 font-bold text-amber-400">
                          PY. {j.properties.Penyulang_KMZ || j.properties.penyulang || '-'}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">
                          <span className="block text-slate-300">{j.properties.JENIS_TIANG ? `Tiang ${j.properties.JENIS_TIANG} ${j.properties.UKURAN_TIANG_TM || ''}` : '-'}</span>
                          <span className="font-mono mt-0.5 inline-block text-[10px] uppercase bg-slate-800 px-1.5 py-0.5 rounded text-amber-300/80">
                            {j.properties.FASA_JARINGAN ? `${j.properties.FASA_JARINGAN} FAS` : '3 FAS'} | KONS: {j.properties.KODE_KONSTRUKSI_1 || 'TM/A3'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-amber-400 bg-amber-900/10 font-bold border-l border-r border-slate-800/50">
                          {j.properties.PANJANG_HANTARAN ? `${j.properties.PANJANG_HANTARAN} m` : '± ? m'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-emerald-400 text-[10px] font-bold px-2 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 shadow-sm inline-flex items-center gap-1">
                             <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> LineString 3D
                          </span>
                          {j.properties.STATUS && <span className="ml-2 text-[10px] text-slate-500 uppercase">{j.properties.STATUS}</span>}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">Tidak ada data JTM ditemukan.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'jtr' && (
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="bg-[#1e293b] text-slate-200 uppercase font-bold text-xs border-b-2 border-slate-700 shadow-sm tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-4 rounded-tl-lg">No</th>
                  <th scope="col" className="px-6 py-4">Nama / Jurusan</th>
                  <th scope="col" className="px-6 py-4">Tipe Kabel & Fasa</th>
                  <th scope="col" className="px-6 py-4">Panjang (m)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {isGeoLoading ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-orange-500 animate-pulse">Memuat Topologi JTR ArcGIS...</td></tr>
                ) : geoData.length > 0 ? (
                  geoData.map((j, idx) => (
                    <tr key={idx} className="bg-slate-900 hover:bg-[#1e293b]/60 transition-all duration-200">
                      <td className="px-6 py-4 font-mono text-slate-500">{idx + 1}</td>
                      <td className="px-6 py-4 font-medium text-white">JTR Gardu {j.properties.NAMAGD || '-'} (Jur: {j.properties.JURUSAN || '-'})</td>
                      <td className="px-6 py-4 text-orange-300 font-mono tracking-tight">{j.properties.UKURAN_KAWAT || '3x50'} {j.properties.JENIS_KABEL} - {j.properties.FASA_JARINGAN}F</td>
                      <td className="px-6 py-4 text-emerald-400 font-bold font-mono">
                        {j.properties.PANJANG_HANTARAN ? parseFloat(j.properties.PANJANG_HANTARAN).toFixed(1) : '-'} m
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">Tidak ada data JTR ditemukan.</td></tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'pelanggan' && (
            <div className="overflow-x-auto pb-4">
              <table className="w-full text-sm text-left text-slate-300 whitespace-nowrap">
                <thead className="bg-[#1e293b] text-slate-200 uppercase font-bold text-[11px] border-b-2 border-slate-700 shadow-sm tracking-wider">
                  <tr>
                    <th scope="col" className="px-4 py-4 rounded-tl-lg">No</th>
                    <th scope="col" className="px-4 py-4">KWH Meter / ID Pelanggan</th>
                    <th scope="col" className="px-4 py-4">Tarif & Daya</th>
                    <th scope="col" className="px-4 py-4">Jenis SR</th>
                    <th scope="col" className="px-4 py-4 bg-sky-900/20">Panjang Hantaran (m)</th>
                    <th scope="col" className="px-4 py-4">Tarikan Tiang Ke</th>
                    <th scope="col" className="px-4 py-4">Gardu & Jurusan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {isGeoLoading ? (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-emerald-500 animate-pulse">Memuat Node Pelanggan & Hantaran ArcGIS...</td></tr>
                  ) : geoData.length > 0 ? (
                    geoData.map((p, idx) => (
                      <tr key={idx} className="bg-slate-900/60 hover:bg-[#1e293b] transition-all duration-200">
                        <td className="px-4 py-3 font-mono text-slate-500">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <span className="block font-bold text-white min-w-[120px]">{p.properties.NOKWHMETER || p.properties.IDPELANGGAN || '-'}</span>
                          <span className="text-[11px] font-medium text-emerald-400 capitalize">{p.properties.NAMAPELANGGAN?.toLowerCase() || p.properties.NAMAPENGHUNI?.toLowerCase() || 'Anonim'}</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-300">
                          <span className="bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
                            {p.properties.TARIF || 'R1'} <span className="text-emerald-400">/</span> {p.properties.DAYA || '450'} VA
                          </span>
                        </td>
                        <td className="px-4 py-3 uppercase text-xs font-semibold text-slate-400">
                          {p.properties.JENIS_HANTARAN || 'Twisted'} <br/>
                          <span className="text-slate-500">{p.properties.UKURAN_KAWAT || 'SR Standar'}</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-sky-400 bg-sky-900/10 font-bold border-l border-r border-slate-800/50">
                          {p.properties.PANJANG_HANTARAN ? `${p.properties.PANJANG_HANTARAN} m` : '± 15.0 m'}
                        </td>
                        <td className="px-4 py-3">
                           <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                             Tiang {p.properties.TARIKAN_KE || p.properties.KODE_TIANG_TR || '?'}
                           </span>
                        </td>
                        <td className="px-4 py-3 text-teal-300 font-medium whitespace-nowrap">
                           Gardu {p.properties.NAMAGD || '?'}
                           <span className="block text-[10px] items-center gap-1 mt-0.5">
                              <span className="text-teal-500/70 uppercase font-bold mr-2">JUR {p.properties.JURUSAN || '-'}</span>
                              <span className="text-slate-400 font-mono tracking-tighter">
                                📌 {(p.geometry?.coordinates && typeof p.geometry.coordinates[0] === 'number' && typeof p.geometry.coordinates[1] === 'number') 
                                      ? `${p.geometry.coordinates[1].toFixed(5)}, ${p.geometry.coordinates[0].toFixed(5)}` 
                                      : '-'}
                              </span>
                           </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">Tidak ada data Pelanggan ditemukan.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'tiang_arcgis' && (
            <div className="overflow-x-auto pb-4">
              <table className="w-full text-sm text-left text-slate-300 whitespace-nowrap">
                <thead className="bg-[#1e293b] text-slate-200 uppercase font-bold text-[11px] border-b-2 border-slate-700 shadow-sm tracking-wider">
                  <tr>
                    <th scope="col" className="px-4 py-4 rounded-tl-lg">No</th>
                    <th scope="col" className="px-4 py-4">ID Tiang / Aset</th>
                    <th scope="col" className="px-4 py-4">Fisik Tiang</th>
                    <th scope="col" className="px-4 py-4 bg-indigo-900/20">Konstruksi & Penopang</th>
                    <th scope="col" className="px-4 py-4">Hantaran & Penyulang</th>
                    <th scope="col" className="px-4 py-4">Kondisi</th>
                    <th scope="col" className="px-4 py-4">Relasi Gardu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {isGeoLoading ? (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-indigo-500 animate-pulse">Memuat Node Tiang & Konstruksi ArcGIS...</td></tr>
                  ) : geoData.length > 0 ? (
                    geoData.map((p, idx) => (
                      <tr key={idx} className="bg-slate-900/60 hover:bg-[#1e293b] transition-all duration-200">
                        <td className="px-4 py-3 font-mono text-slate-500">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <span className="block font-bold text-white min-w-[100px]">{p.properties.NOTIANGTR || p.properties.NOTIANG || 'TIANG-TR'}</span>
                          <span className="text-[11px] font-medium text-indigo-400">{p.properties.CLASSIFICATION || 'TIANG TR'}</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-300">
                          <span className="bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700 uppercase">
                            {p.properties.JENIS_TIANG || 'Besi'} <span className="text-indigo-400">|</span> {p.properties.UKURAN_TIANG ? `${p.properties.UKURAN_TIANG} daN` : '9/100'} 
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-indigo-300 bg-indigo-900/10 font-bold border-l border-r border-slate-800/50">
                           <div className="flex flex-col gap-1">
                             <span>[{p.properties.KODE_KONSTRUKSI_1 || 'FDE'}{p.properties.KODE_KONSTRUKSI_2 ? ` / ${p.properties.KODE_KONSTRUKSI_2}` : ''}{p.properties.KODE_KONSTRUKSI_4 ? ` / ${p.properties.KODE_KONSTRUKSI_4}` : ''}]</span>
                             {(p.properties.SA || p.properties.DRUCK_SCHOOR || p.properties.TRECK_SCHOOR || p.properties.KONTRAMAST) && (
                               <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1 py-0.5 rounded mr-1">Trmsk Penopang</span>
                             )}
                           </div>
                        </td>
                        <td className="px-4 py-3 uppercase text-xs font-semibold text-slate-400">
                          {p.properties.UKURAN_PENGHANTAR || '-'} <span className="text-slate-500">{p.properties.JENIS_PENGHANTAR || '-'}</span>
                          <span className="block text-amber-500/70 mt-0.5">PY. {p.properties.NAMAPENYULANG || 'UMUM'}</span>
                        </td>
                        <td className="px-4 py-3">
                           <span className={`font-bold px-2 py-1 rounded text-xs border ${
                             p.properties.KONDISI_TIANG === 'BAIK' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 
                             'text-rose-400 bg-rose-500/10 border-rose-500/20'
                           }`}>
                             {p.properties.KONDISI_TIANG || 'BAIK'}
                           </span>
                        </td>
                        <td className="px-4 py-3 text-teal-300 font-medium whitespace-nowrap">
                           Gardu {p.properties.NAMAGD || '?'}
                           <span className="block text-[10px] items-center gap-1 mt-0.5">
                              <span className="text-teal-500/70 uppercase font-bold mr-2">JUR {p.properties.JURUSAN || '-'}</span>
                              <span className="text-slate-400 font-mono tracking-tighter">
                                📌 {p.geometry?.coordinates ? `${p.geometry.coordinates[1].toFixed(5)}, ${p.geometry.coordinates[0].toFixed(5)}` : '-'}
                              </span>
                           </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">Tidak ada data Tiang ditemukan.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'hardware' && (
            <div className="p-4">
              <div className="flex gap-2 mb-4">
                <button onClick={() => handleCreateHardware('pembangkit')} className="px-4 py-2 bg-yellow-600/20 text-yellow-500 border border-yellow-500/30 rounded hover:bg-yellow-600/30 font-medium text-sm">+ Pembangkit</button>
                <button onClick={() => handleCreateHardware('fco')} className="px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-600/30 font-medium text-sm">+ FCO</button>
                <button onClick={() => handleCreateHardware('recloser')} className="px-4 py-2 bg-red-600/20 text-red-500 border border-red-500/30 rounded hover:bg-red-600/30 font-medium text-sm">+ Recloser / LBS</button>
              </div>
              <div className="overflow-x-auto rounded-lg border border-slate-700">
                <table className="w-full text-sm text-left text-slate-300">
                  <thead className="bg-[#1e293b] text-slate-200 uppercase font-bold text-xs border-b-2 border-slate-700 shadow-sm tracking-wider">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Tipe Aset</th>
                      <th className="px-4 py-3">Nama Peralatan</th>
                      <th className="px-4 py-3">Rating / Kapasitas</th>
                      <th className="px-4 py-3">Tegangan (kV)</th>
                      <th className="px-4 py-3">Merk / Info</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-center rounded-tr-lg">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hardwareAssets.map(t => editingHardwareId === t.id ? (
                      <tr key={t.id} className="bg-slate-800/80 border-b border-slate-700">
                        <td className="p-2 text-slate-400 text-xs uppercase">{t.type}</td>
                        <td className="p-2"><input className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded" value={editingHardwareForm.name || ''} onChange={(e) => updateEditForm('name', e.target.value)} /></td>
                        <td className="p-2">
                          {t.type === 'pembangkit' ? (
                            <input type="number" className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded" placeholder="kW" value={editingHardwareForm.kapasitas_kw || ''} onChange={(e) => updateEditForm('kapasitas_kw', parseFloat(e.target.value))} />
                          ) : (
                            <input type="number" className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded" placeholder="Ampere" value={editingHardwareForm.rating_arus_ampere || ''} onChange={(e) => updateEditForm('rating_arus_ampere', parseFloat(e.target.value))} />
                          )}
                        </td>
                        <td className="p-2"><input type="number" className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded" value={editingHardwareForm.tegangan_kv || ''} onChange={(e) => updateEditForm('tegangan_kv', parseFloat(e.target.value))} /></td>
                        <td className="p-2"><input className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded" value={editingHardwareForm.merk || ''} onChange={(e) => updateEditForm('merk', e.target.value)} /></td>
                        <td className="p-2">
                          <input className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded" value={editingHardwareForm.status || ''} onChange={(e) => updateEditForm('status', e.target.value)} />
                        </td>
                        <td className="p-2 text-center whitespace-nowrap">
                          <button onClick={handleSaveHardware} className="text-emerald-400 font-bold mr-2 hover:underline">Simpan</button>
                          <button onClick={() => setEditingHardwareId(null)} className="text-slate-400 hover:underline">Batal</button>
                        </td>
                      </tr>
                    ) : (
                      <tr key={t.id} className="border-b border-slate-800 hover:bg-[#1e293b]/60 transition-colors whitespace-nowrap">
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs uppercase ${
                            t.type === 'pembangkit' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 
                            t.type === 'recloser' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                            'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            {t.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-white">{t.name}</td>
                        <td className="px-4 py-3 font-mono">
                          {t.type === 'pembangkit' 
                            ? (t.kapasitas_kw ? (t.kapasitas_kw >= 1000 ? (t.kapasitas_kw/1000) + ' MW' : t.kapasitas_kw + ' kW') : '-')
                            : (t.rating_arus_ampere ? t.rating_arus_ampere + ' A' : '-')
                          }
                        </td>
                        <td className="px-4 py-3">{t.tegangan_kv ? t.tegangan_kv + ' kV' : '-'}</td>
                        <td className="px-4 py-3 text-xs">{t.merk || '-'}</td>
                        <td className="px-4 py-3 font-bold text-xs text-slate-300">{t.status || 'Active'}</td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <button onClick={() => handleEditHardware(t)} className="text-indigo-400 hover:underline mr-3">Edit</button>
                          <button onClick={() => handleDeleteHardware(t.id)} className="text-rose-400 hover:underline">Hapus</button>
                        </td>
                      </tr>
                    ))}
                    {hardwareAssets.length === 0 && (
                       <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">Tidak ada aset Hardware.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'usulan' && (
            <div className="p-4 space-y-6">
              
              {/* Tiang Usulan list below */}

              {/* Tiang Usulan */}
              <div>
                <h3 className="text-white font-semibold mb-3">📍 Tiang Usulan ({usulanTiang.length})</h3>
                <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                  <table className="w-full text-sm text-left text-slate-300">
                    <thead className="bg-slate-700/50 text-slate-200">
                      <tr><th>Nama</th><th>Penyulang</th><th>Status</th><th>Tanggal</th><th>Lat, Lng</th><th>Aksi</th></tr>
                    </thead>
                    <tbody>
                      {usulanTiang.map(t => (
                        <tr key={t.id} className="border-b border-slate-700/50">
                          <td className="p-3 font-medium text-white">{t.nama_tiang}</td><td className="p-3 text-amber-400">{t.penyulang || '-'}</td>
                          <td className="p-3"><span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-xs">{(t.status || 'N/A').toUpperCase()}</span></td>
                          <td className="p-3">{new Date(t.createdAt).toLocaleDateString()}</td>
                          <td className="p-3 font-mono text-xs">{t.latitude.toFixed(5)}, {t.longitude.toFixed(5)}</td>
                          <td className="p-3"><button onClick={() => { deleteUsulanTiang(t.id); toast.success('Dihapus') }} className="text-rose-400 text-xs">Hapus</button></td>
                        </tr>
                      ))}
                      {usulanTiang.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-slate-500">Belum ada usulan tiang.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Gardu Usulan */}
              <div>
                <h3 className="text-white font-semibold mb-3">⚡ Gardu/Trafo Usulan ({usulanGardu.length})</h3>
                <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                  <table className="w-full text-sm text-left text-slate-300">
                    <thead className="bg-slate-700/50 text-slate-200">
                      <tr><th>Nama</th><th>Penyulang</th><th>Kapasitas</th><th>Status</th><th>Lat, Lng</th><th>Aksi</th></tr>
                    </thead>
                    <tbody>
                      {usulanGardu.map(g => (
                        <tr key={g.id} className="border-b border-slate-700/50">
                          <td className="p-3 font-medium text-white">{g.nama}</td><td className="p-3 text-amber-400">{g.penyulang || '-'}</td>
                          <td className="p-3">{g.kapasitas_kva} kVA</td>
                          <td className="p-3"><span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-xs">{(g.status || 'N/A').toUpperCase()}</span></td>
                          <td className="p-3 font-mono text-xs">{g.latitude.toFixed(5)}, {g.longitude.toFixed(5)}</td>
                          <td className="p-3"><button onClick={() => { deleteUsulanGardu(g.id); toast.success('Dihapus') }} className="text-rose-400 text-xs">Hapus</button></td>
                        </tr>
                      ))}
                      {usulanGardu.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-slate-500">Belum ada usulan gardu.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Jalur Usulan */}
              <div>
                <h3 className="text-white font-semibold mb-3">〰️ Jalur Usulan ({usulanJalur.length})</h3>
                <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                  <table className="w-full text-sm text-left text-slate-300">
                    <thead className="bg-slate-700/50 text-slate-200">
                      <tr><th>Nama Jalur</th><th>Penyulang</th><th>Status</th><th>Jumlah Titik</th><th>Aksi</th></tr>
                    </thead>
                    <tbody>
                      {usulanJalur.map(j => (
                        <tr key={j.id} className="border-b border-slate-700/50">
                          <td className="p-3 font-medium text-white">{j.nama}</td><td className="p-3 text-amber-400">{j.penyulang || '-'}</td>
                          <td className="p-3"><span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-xs">{(j.status || 'N/A').toUpperCase()}</span></td>
                          <td className="p-3">{j.coordinates.length} titik koordinat</td>
                          <td className="p-3"><button onClick={() => { deleteUsulanJalur(j.id); toast.success('Dihapus') }} className="text-rose-400 text-xs">Hapus</button></td>
                        </tr>
                      ))}
                      {usulanJalur.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-slate-500">Belum ada usulan jalur.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
