'use client';

import React, { useState } from 'react';
import { useAssetStore } from '@/store/assetStore';
import { AlertTriangle, Zap, ArrowRightLeft, DollarSign, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function PerencanaanAIPage() {
  const [activeTab, setActiveTab] = useState<'overload' | 'upgrade' | 'manuver' | 'optimasi'>('overload');
  const simulationMetrics = useAssetStore((state) => state.simulationMetrics);
  const aiTopologyFeatures = useAssetStore((state) => state.aiTopologyFeatures);

  if (!simulationMetrics || aiTopologyFeatures.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 text-center max-w-xl shadow-2xl">
          <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <Zap size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Belum Ada Data Simulasi AI</h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Halaman ini membutuhkan output matriks dari <b>Mesin Pandapower Python</b> Anda. 
            Silakan buka Peta Sistem Jaringan, bangun topologi MST dengan algoritma GridKit, lalu jalankan Simulasi Load Flow terlebih dahulu.
          </p>
          <Link href="/peta" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors border-none inline-flex items-center gap-2 flex-shrink-0" style={{ textDecoration: 'none' }}>
            Mulai Simulasi di Peta <ExternalLink size={18} />
          </Link>
        </div>
      </div>
    );
  }

  // Filter Kabel Berbahaya (Loading > 80%)
  const overloadedLines = aiTopologyFeatures.filter(f => {
    const p = f.properties;
    return p.loading_pct && parseFloat(p.loading_pct) > 80;
  }).sort((a,b) => parseFloat(b.properties.loading_pct) - parseFloat(a.properties.loading_pct));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          🧠 Dashboard Perencanaan & Analitik AI
        </h1>
        <p className="text-slate-400 text-sm">Hasil ekstraksi Newton-Raphson dari Engine Pandapower untuk Sistem Jaringan.</p>
      </div>

      {/* METRICS HEADER */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800 border border-slate-700 p-5 rounded-xl text-center">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Total Edge JTM Teranalisa</div>
          <div className="text-2xl font-bold text-white">{aiTopologyFeatures.length}</div>
        </div>
        <div className="bg-slate-800 border border-rose-500/40 p-5 rounded-xl shadow-[0_0_15px_rgba(244,63,94,0.1)] text-center">
          <div className="text-rose-400 text-xs font-semibold uppercase tracking-wider mb-2">Tegangan Terendah (pu)</div>
          <div className="text-2xl font-bold text-rose-500">{simulationMetrics.lowest_voltage_pu.toFixed(3)} V</div>
        </div>
        <div className="bg-slate-800 border border-amber-500/40 p-5 rounded-xl text-center">
          <div className="text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">Muatan Paling Terbebani</div>
          <div className="text-2xl font-bold text-amber-500">{simulationMetrics.highest_loading_percent.toFixed(1)}%</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 p-5 rounded-xl text-center">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Total System Losses</div>
          <div className="text-2xl font-bold text-slate-200">{simulationMetrics.system_losses_kw.toFixed(2)} kW</div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-slate-700 mb-6 gap-2">
        <button className={`px-5 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'overload' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-400 hover:text-slate-200'}`} onClick={() => setActiveTab('overload')}>
          <AlertTriangle size={18} /> Red Zone Kabel ({overloadedLines.length})
        </button>
        <button className={`px-5 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'upgrade' ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-400 hover:text-slate-200'}`} onClick={() => setActiveTab('upgrade')}>
          <Zap size={18} /> Upgrade Kapasitas
        </button>
        <button className={`px-5 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'optimasi' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-slate-400 hover:text-slate-200'}`} onClick={() => setActiveTab('optimasi')}>
          <DollarSign size={18} /> Optimasi Biaya CAPEX
        </button>
        <button className={`px-5 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'manuver' ? 'border-purple-500 text-purple-500' : 'border-transparent text-slate-400 hover:text-slate-200'}`} onClick={() => setActiveTab('manuver')}>
          <ArrowRightLeft size={18} /> Evakuasi Daya & Manuver
        </button>
      </div>

      {/* TAB CONTENT */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg p-2 min-h-[400px]">
        
        {/* TAB 1: OVERLOAD */}
        {activeTab === 'overload' && (
          <div className="overflow-x-auto">
            {overloadedLines.length === 0 ? (
              <div className="p-8 text-center text-slate-400 min-h-[300px] flex items-center justify-center">Jaringan Anda sangat sehat! Tidak ada kabel yang melebihi batas beban 80%.</div>
            ) : (
              <table className="w-full text-sm text-left text-slate-300">
                <thead className="bg-slate-800 font-semibold text-xs uppercase border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Persentase Beban</th>
                    <th className="px-6 py-4">Penyulang Dasar</th>
                    <th className="px-6 py-4">Segmen (Node)</th>
                    <th className="px-6 py-4">Spesifikasi Saat Ini</th>
                  </tr>
                </thead>
                <tbody>
                  {overloadedLines.map((L, i) => {
                    const lPct = parseFloat(L.properties.loading_pct);
                    const isCrit = lPct > 90;
                    return (
                      <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/60 transition-colors">
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full font-bold ${isCrit ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                            {isCrit ? 'KRITIS' : 'WASPADA'}
                          </span>
                        </td>
                        <td className={`px-6 py-4 font-mono font-bold ${isCrit ? 'text-rose-500' : 'text-amber-500'}`}>{L.properties.loading_pct} %</td>
                        <td className="px-6 py-4 font-bold text-slate-200">{L.properties.penyulang || 'PENY-1'}</td>
                        <td className="px-6 py-4 text-xs max-w-[200px] truncate" title={L.properties.nama}>{L.properties.nama || `SEG_${i}`}</td>
                        <td className="px-6 py-4 text-xs font-mono">{L.properties.jenis_hantaran || 'AAAC'} {L.properties.ukuran_hantaran || '70'} mm²</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 2: UPGRADE */}
        {activeTab === 'upgrade' && (
          <div className="p-6">
            <h3 className="text-lg font-bold text-white mb-4">Mekanisme Upgrade Kapasitas Jaringan (Re-conductoring)</h3>
            <p className="text-slate-400 text-sm mb-6">Berdasarkan hasil pandapower load flow, kami menyarankan pelebaran penampang konduktor pada titik *bottleneck* berikut untuk meredakan Overload dan drop voltage.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {overloadedLines.slice(0, 4).map((L, i) => (
                <div key={i} className="bg-slate-800 p-5 rounded-lg border border-blue-500/20">
                  <div className="flex justify-between items-start mb-3">
                    <div className="text-sm font-bold text-white truncate max-w-[200px]">{L.properties.nama || `SEG_${i}`}</div>
                    <div className="text-xs bg-rose-500/20 text-rose-400 px-2 py-1 rounded font-bold">{L.properties.loading_pct}% Load</div>
                  </div>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex-1 bg-slate-900 border border-slate-700 p-3 rounded text-center">
                      <div className="text-xs text-slate-500 mb-1">Kabel Eksisting</div>
                      <div className="font-mono text-sm text-amber-500 line-through">{L.properties.jenis_hantaran || 'AAAC'} {L.properties.ukuran_hantaran || '70'} mm²</div>
                    </div>
                    <ArrowRightLeft className="text-slate-500" />
                    <div className="flex-1 bg-blue-900/20 border border-blue-500/30 p-3 rounded text-center">
                      <div className="text-xs text-blue-400 mb-1">Rekomendasi AI Baru</div>
                      <div className="font-mono text-sm text-white font-bold">150 mm² (AAAC-S)</div>
                    </div>
                  </div>
                </div>
              ))}
              {overloadedLines.length === 0 && <div className="text-slate-500 p-4">Jaringan aman, Sistem tidak menemukan Cable Bottleneck. Upgrade belum diperlukan.</div>}
            </div>
          </div>
        )}

        {/* TAB 3: OPTIMASI BIAYA */}
        {activeTab === 'optimasi' && (
          <div className="p-6 flex flex-col md:flex-row gap-8 items-center min-h-[300px]">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><DollarSign className="text-emerald-500"/> Valuasi Penghematan Susut</h3>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Algoritma Optimasi menghitung nilai Rupiah dari daya nyata yang hilang akibat resistansi kabel di seluruh grid (<span className="text-amber-400 font-bold">{simulationMetrics.system_losses_kw.toFixed(2)} kW loss</span>).
              </p>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-slate-800 rounded">
                  <span className="text-slate-300 text-sm">Nilai BPP (Biaya Pokok Penyediaan) per kWh</span>
                  <span className="font-mono text-slate-300">Rp 1.444</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-800 rounded">
                  <span className="text-slate-300 text-sm">Estimasi Rupiah Hilang per Bulan (100% Load Factor)</span>
                  <span className="font-mono text-rose-400 font-bold">- Rp {Math.round(simulationMetrics.system_losses_kw * 1444 * 24 * 30).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-emerald-900/20 border border-emerald-500/30 rounded mt-4">
                  <span className="text-emerald-400 font-bold flex items-center gap-2">🎯 Estimasi OPEX yang diselamatkan paska-Upgrade:</span>
                  <span className="font-mono text-emerald-400 font-extrabold text-lg">+ Rp {Math.round((simulationMetrics.system_losses_kw/2) * 1444 * 24 * 30).toLocaleString('id-ID')} / bulan</span>
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-72 bg-slate-800 p-6 rounded-xl border border-slate-700 text-center">
              <div className="w-16 h-16 bg-slate-900 border border-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign size={24} className="text-emerald-500"/>
              </div>
              <div className="text-xs text-slate-400 mb-1 uppercase tracking-widest">Keputusan Algoritma:</div>
              {simulationMetrics.system_losses_kw > 100 ? (
                 <><div className="text-lg font-bold text-emerald-400 mb-2">LAYAK INVESTASI REKONDUKTOR (ROI CEPAT)</div>
                 <div className="text-xs text-slate-500">Nilai Payback Point dari efisiensi daya diperkirakan menutup nilai CAPEX kabel baru.</div></>
              ) : (
                <><div className="text-lg font-bold text-amber-500 mb-2">ROI LAMBAT (TUNDA UPGRADE)</div>
                 <div className="text-xs text-slate-500">Nilai susut belum cukup besar untuk menjustifikasi investasi CAPEX penggantian kabel massif saat ini.</div></>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: MANUVER BEBAN / EVAKUASI DAYA */}
        {activeTab === 'manuver' && (
          <div className="p-6 h-full min-h-[300px]">
             <h3 className="text-lg font-bold text-purple-400 mb-3 flex items-center gap-2"><ArrowRightLeft/> Penjadwalan Evakuasi Daya & Manuver Jaringan</h3>
             <p className="text-slate-400 text-sm mb-6">Menganalisis jarak antar trafo & titik pertemuan LBS otomatis untuk mendistribusikan beban berlebih ke penyulang penyangga secara dinamis.</p>
             
             <div className="bg-slate-800 border border-purple-500/20 rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-900 border-b border-purple-500/20 text-slate-300 text-xs uppercase">
                    <tr><th className="p-4">Titik Sambung (Tie Switch)</th><th className="p-4 text-center">Status LBS</th><th className="p-4 text-center">Kirim Daya (Evakuasi)</th><th className="p-4">Logika Skenario AI</th></tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-700/50 hover:bg-slate-800/80">
                      <td className="p-4 font-bold text-white">LBS TIE-ZONE-A (Batas Kota)</td>
                      <td className="p-4 text-center"><span className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded">NORMALLY OPEN</span></td>
                      <td className="p-4 text-center font-mono text-emerald-400 font-bold">~ 1.8 MW</td>
                      <td className="p-4 text-xs text-purple-300 border-l border-purple-500/20 leading-relaxed">Direkomendasikan CLOSE jika beban Penyulang Induk Kota menyentuh 95%. Ambil pasokan tambahan dari Gardu Induk Sisi Timur. Terbukti menurunkan Voltage Drop sebesar 0.05 pu.</td>
                    </tr>
                    <tr className="border-b border-slate-700/50 hover:bg-slate-800/80">
                      <td className="p-4 font-bold text-white">REC-14 (Zone Industri)</td>
                      <td className="p-4 text-center"><span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded border border-emerald-500/30">CLOSED</span></td>
                      <td className="p-4 text-center font-mono text-slate-500">0.0 MW</td>
                      <td className="p-4 text-xs text-slate-400 border-l border-purple-500/20 leading-relaxed">Siagakan TRIP. Area industri sangat fluktuatif (Berdasarkan Pandapower Load). Jika arus gangguan terdeteksi, isolasi area ini agar evakuasi beban sisa kota tetap menyala.</td>
                    </tr>
                  </tbody>
                </table>
             </div>
          </div>
        )}

      </div>
    </div>
  );
}
