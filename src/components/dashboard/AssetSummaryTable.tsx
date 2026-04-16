'use client';

import React, { useEffect, useState } from 'react';
import { useAssetStore } from '@/store/assetStore';
import Link from 'next/link';
import { Server, Database, MapPin, Radar, Crosshair, Network } from 'lucide-react';

type TabType = 'gardu' | 'tiang' | 'jtm' | 'arcgis';

export function AssetSummaryTable() {
  const { gardus, tiangJTM, jtmSegments } = useAssetStore();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('arcgis');
  const [arcgisData, setArcgisData] = useState<any[]>([]);
  const [loadingArcgis, setLoadingArcgis] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (activeTab === 'arcgis' && arcgisData.length === 0) {
      setLoadingArcgis(true);
      fetch('/api/arcgis')
        .then(res => res.json())
        .then(data => {
          if (data.success) setArcgisData(data.data);
          setLoadingArcgis(false);
        })
        .catch(() => setLoadingArcgis(false));
    }
  }, [activeTab]);

  if (!mounted) return null;

  const renderFooter = (target: string) => (
    <div className="p-3 bg-[#18181b] border-t-2 border-[#27272a] flex justify-center">
      <Link 
        href={`/data/${target}`} 
        className="text-[10px] font-mono tracking-widest text-[#71717a] hover:text-[#34d399] uppercase transition-colors flex items-center gap-2"
      >
        [ Access Full {target.toUpperCase()} Database ]
      </Link>
    </div>
  );

  const renderGardu = () => (
    <table className="w-full text-left font-sans">
      <thead className="bg-[#18181b] text-[#71717a] text-[10px] uppercase font-mono tracking-[0.2em]">
        <tr>
          <th className="px-4 py-3 border-b-2 border-[#3f3f46]">ID / Node Name</th>
          <th className="px-4 py-3 border-b-2 border-[#3f3f46]">Feeder</th>
          <th className="px-4 py-3 border-b-2 border-[#3f3f46] text-center">CAP (kVA)</th>
          <th className="px-4 py-3 border-b-2 border-[#3f3f46]">Construct</th>
          <th className="px-4 py-3 border-b-2 border-[#3f3f46]">Load STS</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[#27272a]">
        {gardus.slice(0, 10).map((g, i) => (
          <tr key={`${g.id}-${i}`} className="hover:bg-[#18181b] transition-colors group">
            <td className="px-4 py-3 font-medium text-[#d4d4d8] border-r border-[#27272a]/50"><Server size={12} className="inline mr-2 text-[#34d399]"/> {g.nama}</td>
            <td className="px-4 py-3 text-[10px] font-mono text-[#fcd34d] border-r border-[#27272a]/50">{g.penyulang}</td>
            <td className="px-4 py-3 text-center font-mono text-xs text-[#34d399] border-r border-[#27272a]/50">{g.kapasitas_kva || g.kapasitas_mva * 1000}</td>
            <td className="px-4 py-3 text-xs text-[#a1a1aa] capitalize border-r border-[#27272a]/50">{g.jenis_konstruksi || 'Portal'}</td>
            <td className="px-4 py-3">
              <div className="w-full bg-[#27272a] h-1 rounded-none overflow-hidden max-w-[100px]">
                <div className="bg-[#34d399] h-full w-[45%]" />
              </div>
              <span className="text-[9px] font-mono text-[#71717a] mt-1 block">NRML_45%</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderTiang = () => (
    <table className="w-full text-left font-sans">
      <thead className="bg-[#18181b] text-[#71717a] text-[10px] uppercase font-mono tracking-[0.2em]">
        <tr>
          <th className="px-4 py-3 border-b-2 border-[#3f3f46]">Pole Ident</th>
          <th className="px-4 py-3 border-b-2 border-[#3f3f46]">Feeder</th>
          <th className="px-4 py-3 border-b-2 border-[#3f3f46]">Rating/Spec</th>
          <th className="px-4 py-3 border-b-2 border-[#3f3f46]">Conductor</th>
          <th className="px-4 py-3 border-b-2 border-[#3f3f46]">Support</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[#27272a]">
        {tiangJTM.slice(0, 10).map((t, i) => (
          <tr key={i} className="hover:bg-[#18181b] transition-colors group cursor-default">
            <td className="px-4 py-3 font-medium text-[#d4d4d8] border-r border-[#27272a]/50"><Database size={12} className="inline mr-2 text-[#60a5fa]"/> {t.nama_tiang}</td>
            <td className="px-4 py-3 text-[10px] font-mono text-[#fcd34d] border-r border-[#27272a]/50">{t.penyulang}</td>
            <td className="px-4 py-3 font-mono text-xs text-[#a1a1aa] border-r border-[#27272a]/50">{t.tipe_tiang}m / {t.kekuatan_tiang}daN</td>
            <td className="px-4 py-3 text-xs text-[#d4d4d8] border-r border-[#27272a]/50">{t.jenis_hantaran_1} <span className="font-mono text-[10px]">{t.ukuran_hantaran_1}mm²</span></td>
            <td className="px-4 py-3">
               <span className={`px-2 py-0.5 text-[9px] font-mono uppercase tracking-widest ${t.penopang ? 'bg-[#27272a] text-[#a1a1aa] border border-[#3f3f46]' : 'text-[#71717a]'}`}>
                {t.penopang || 'Tumpu'}
               </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="bg-[#09090b] border border-[#27272a] shadow-2xl relative">
      {/* Tab Header */}
      <div className="flex bg-[#0a0a0b] border-b-2 border-[#27272a] divide-x divide-[#27272a]">
        {[
          { id: 'arcgis', label: 'arg.gdb (TITIK EKSTRA)', icon: <Radar size={14}/> },
          { id: 'gardu', label: 'gardu-arcgis.geojson', icon: <Server size={14}/> },
          { id: 'tiang', label: 'tiang-arcgis.geojson', icon: <Database size={14}/> },
          { id: 'jtm', label: 'jtm-lines.geojson', icon: <Network size={14}/> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 text-[10px] font-mono tracking-widest uppercase transition-all ${
              activeTab === tab.id 
                ? 'bg-[#18181b] text-[#34d399] border-t-2 border-t-[#34d399]' 
                : 'text-[#71717a] hover:text-[#a1a1aa] hover:bg-[#18181b]/50 border-t-2 border-t-transparent'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="max-h-[500px] overflow-y-auto overflow-x-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#3f3f46 #09090b' }}>
        {activeTab === 'gardu' && (
          <>
            {renderGardu()}
            {renderFooter('trafo')}
          </>
        )}
        {activeTab === 'tiang' && (
          <>
            {renderTiang()}
            {renderFooter('tiang')}
          </>
        )}
        {activeTab === 'jtm' && (
          <>
            <div className="p-20 text-center text-slate-500 text-sm">
              <div className="text-4xl mb-4">➰</div>
              Data Jaringan Line sedang diproses...
            </div>
            {renderFooter('jtm')}
          </>
        )}
        {activeTab === 'arcgis' && (
          <>
            <table className="w-full text-left font-sans min-w-[700px]">
              <thead className="bg-[#18181b] text-[#71717a] text-[10px] uppercase font-mono tracking-[0.2em] sticky top-0 border-b-2 border-[#3f3f46]">
                <tr>
                  <th className="px-4 py-3 border-r border-[#27272a]/50 text-center w-10">STS</th>
                  <th className="px-4 py-3 border-r border-[#27272a]/50">ArcGIS Element Name</th>
                  <th className="px-4 py-3 border-r border-[#27272a]/50">Node Type</th>
                  <th className="px-4 py-3 border-r border-[#27272a]/50 text-right">Coord Map [LAT,LNG]</th>
                  <th className="px-4 py-3 text-center">SymMap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]">
                {loadingArcgis ? (
                  <tr><td colSpan={5} className="p-8 text-center text-[#71717a] font-mono text-[10px]">INDEXING DATABASE...</td></tr>
                ) : arcgisData.length > 0 ? (
                  arcgisData.slice(0,10).map((p, i) => (
                    <tr key={p.id || i} className="hover:bg-[#18181b] transition-colors group">
                      <td className="px-4 py-3 border-r border-[#27272a]/50 text-center">
                        <div className={`w-2 h-2 mx-auto rounded-none ${p.status === 'aktif' ? 'bg-[#34d399]' : 'bg-[#ef4444]'}`}></div>
                      </td>
                      <td className="px-4 py-3 font-medium text-[#e4e4e7] border-r border-[#27272a]/50"><Crosshair size={12} className="inline mr-2 text-[#71717a]"/> {p.name || 'UNKNOWN'}</td>
                      <td className="px-4 py-3 border-r border-[#27272a]/50">
                        <span className="bg-[#27272a] text-[#a1a1aa] border border-[#3f3f46] px-2 py-0.5 text-[9px] font-mono tracking-widest uppercase">
                          {p.folderPath || 'ORPHAN'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-[#71717a] border-r border-[#27272a]/50">
                        <span className="text-[#34d399]">{p.lat?.toFixed(5)}</span> / {p.lng?.toFixed(5)}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-[10px] text-[#fcd34d]">
                        {p.symbolID ?? '---'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={5} className="p-8 text-center text-[#71717a] font-mono text-[10px]">[ NO ARCGIS RECORDS FOUND ]</td></tr>
                )}
              </tbody>
            </table>
            {renderFooter('arcgis')}
          </>
        )}
      </div>
    </div>
  );
}
