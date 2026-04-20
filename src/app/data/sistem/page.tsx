'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, Search, Download, Moon, Sun, Map, Filter, ChevronRight as ChevronNext, ChevronLeft as ChevronPrev } from 'lucide-react';

const PENYULANG_COLORS: Record<string, string> = {
  MALI: '#3b82f6', MORU: '#ef4444', BATUNIRWALA: '#22c55e',
  BARANUSA: '#f59e0b', KABIR: '#a855f7', MARITAING: '#06b6d4', ILAWE: '#f43f5e',
  'ALOR KECIL': '#14b8a6', PURA: '#e879f9', BINONGKO: '#fb923c',
  'EKSPRES KALABAHI': '#38bdf8', PROBUR: '#a3e635',
};

interface SistemRow {
  penyulang: string;
  tiang: number;
  jtm_kms: number;
  jtr_kms: number;
  gardu: number;
  fco: number;
  rec: number;
  pelanggan: number;
  sub_feeders?: string[];
}

const SystemTableRow = React.memo(({ row, index, isLight, getColor, columns }: any) => {
  const color = getColor(row.penyulang);
  return (
    <tr className={`border-b ${isLight ? 'hover:bg-blue-50/50 border-gray-200' : 'hover:bg-[#18181b] border-[#1c1c1e]/50'} transition-colors`}>
      <td className={`px-3 py-3 text-center font-medium border-r ${isLight ? 'border-gray-200 text-gray-500' : 'border-[#1c1c1e] text-[#3f3f46] font-mono'}`}>
        {index + 1}
      </td>
      <td className={`px-4 py-3 border-r ${isLight ? 'border-gray-200' : 'border-[#1c1c1e]'}`}>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}60` }} />
          <div>
            <span className="font-bold text-sm" style={{ color }}>{row.penyulang}</span>
            {row.sub_feeders && row.sub_feeders.length > 0 && (
              <div className={`text-[9px] mt-0.5 ${isLight ? 'text-gray-400' : 'text-[#52525b]'}`}>
                + {row.sub_feeders.join(', ')}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className={`px-4 py-3 text-center border-r ${isLight ? 'border-gray-200' : 'border-[#1c1c1e]'}`}>
        <span className={`font-bold text-sm ${isLight ? 'text-gray-900' : 'text-white'}`}>{row.tiang.toLocaleString()}</span>
      </td>
      <td className={`px-4 py-3 text-center border-r ${isLight ? 'border-gray-200' : 'border-[#1c1c1e]'}`}>
        <span className="font-mono font-bold text-blue-500">{row.jtm_kms.toFixed(2)}</span>
      </td>
      <td className={`px-4 py-3 text-center border-r ${isLight ? 'border-gray-200' : 'border-[#1c1c1e]'}`}>
        <span className="font-mono font-bold text-cyan-500">{row.jtr_kms.toFixed(2)}</span>
      </td>
      <td className={`px-4 py-3 text-center border-r ${isLight ? 'border-gray-200' : 'border-[#1c1c1e]'}`}>
        <span className={`font-bold ${isLight ? 'text-gray-900' : 'text-emerald-400'}`}>{row.gardu}</span>
      </td>
      <td className={`px-4 py-3 text-center border-r ${isLight ? 'border-gray-200' : 'border-[#1c1c1e]'}`}>
        <span className={`text-xs font-bold px-2 py-0.5 rounded ${row.fco > 0 ? 'bg-sky-500/10 text-sky-400' : isLight ? 'text-gray-400' : 'text-[#3f3f46]'}`}>
          {row.fco || '—'}
        </span>
      </td>
      <td className={`px-4 py-3 text-center border-r ${isLight ? 'border-gray-200' : 'border-[#1c1c1e]'}`}>
        <span className={`text-xs font-bold px-2 py-0.5 rounded ${row.rec > 0 ? 'bg-rose-500/10 text-rose-400' : isLight ? 'text-gray-400' : 'text-[#3f3f46]'}`}>
          {row.rec || '—'}
        </span>
      </td>
      <td className={`px-4 py-3 text-center border-r ${isLight ? 'border-gray-200' : 'border-[#1c1c1e]'}`}>
        <span className={`font-bold text-sm ${isLight ? 'text-gray-900' : 'text-amber-400'}`}>{row.pelanggan.toLocaleString()}</span>
      </td>
      <td className={`px-4 py-3 text-center border-l ${isLight ? 'border-gray-200' : 'border-[#1c1c1e]'}`}>
        <Link
          href={`/peta?penyulang=${encodeURIComponent(row.penyulang)}`}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 border border-indigo-500/20"
        >
          <Map size={12} /> Lihat
        </Link>
      </td>
    </tr>
  );
});
SystemTableRow.displayName = 'SystemTableRow';

export default function DataSistemPage() {
  const [data, setData] = useState<SistemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [currentPage, setCurrentPage] = useState(1);
  const ROWS_PER_PAGE = 20;

  useEffect(() => {
    const saved = localStorage.getItem('table-theme');
    if (saved === 'dark' || saved === 'light') setTheme(saved);
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('table-theme', newTheme);
  }, [theme]);

  useEffect(() => {
    setLoading(true);
    fetch('/api/sistem')
      .then(r => r.ok ? r.json() : [])
      .then(d => { setData(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => { setData([]); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    if (!search) return data;
    const term = search.toLowerCase();
    return data.filter(d => d.penyulang.toLowerCase().includes(term));
  }, [data, search]);

  const totals = useMemo(() => {
    return filtered.reduce((acc, r) => ({
      tiang: acc.tiang + r.tiang,
      jtm_kms: acc.jtm_kms + r.jtm_kms,
      jtr_kms: acc.jtr_kms + r.jtr_kms,
      gardu: acc.gardu + r.gardu,
      fco: acc.fco + r.fco,
      rec: acc.rec + r.rec,
      pelanggan: acc.pelanggan + r.pelanggan,
    }), { tiang: 0, jtm_kms: 0, jtr_kms: 0, gardu: 0, fco: 0, rec: 0, pelanggan: 0 });
  }, [filtered]);

  const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return filtered.slice(start, start + ROWS_PER_PAGE);
  }, [filtered, currentPage]);

  const handleExport = useCallback(() => {
    const headers = ['Penyulang', 'Tiang', 'JTM (KMS)', 'JTR (KMS)', 'Gardu', 'FCO', 'REC', 'Pelanggan'];
    const rows = filtered.map(d => [d.penyulang, d.tiang, d.jtm_kms, d.jtr_kms, d.gardu, d.fco, d.rec, d.pelanggan]);
    rows.push(['TOTAL', totals.tiang, totals.jtm_kms.toFixed(2), totals.jtr_kms.toFixed(2), totals.gardu, totals.fco, totals.rec, totals.pelanggan]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'data-sistem.csv'; a.click();
    URL.revokeObjectURL(url);
  }, [filtered, totals]);

  const isLight = theme === 'light';
  const accent = '#6366f1';

  const bgMain = isLight ? 'bg-gray-50' : 'bg-[#09090b]';
  const textMain = isLight ? 'text-gray-800' : 'text-[#d4d4d8]';
  const bgHeader = isLight ? 'bg-white' : 'bg-[#09090b]';
  const headerBorder = isLight ? 'border-gray-200' : 'border-[#1c1c1e]';
  const btnBg = isLight ? 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300' : 'bg-[#18181b] hover:bg-[#1c1c1e] text-[#a1a1aa] hover:text-white border-[#27272a] hover:border-[#3f3f46]';
  const inputBg = isLight ? 'bg-white border-gray-300 text-gray-800 placeholder-gray-400' : 'bg-[#18181b] border-[#27272a] text-white placeholder-[#3f3f46]';
  const inputFocus = isLight ? 'focus:border-blue-500 focus:ring-blue-500' : 'focus:border-[#3f3f46] focus:ring-[#3f3f46]';
  const tableBorder = isLight ? 'border-gray-300 shadow-sm' : 'border-[#1c1c1e]';
  const thBg = isLight ? 'bg-[#f8fafc] text-gray-700 border-gray-300' : 'bg-[#0f0f11] text-[#71717a] border-[#1c1c1e]';
  const trBorder = isLight ? 'border-gray-200' : 'border-[#1c1c1e]/50';

  const columns = [
    { key: 'penyulang', label: 'Penyulang', align: 'left' as const },
    { key: 'tiang', label: 'Tiang', align: 'center' as const },
    { key: 'jtm_kms', label: 'JTM (KMS)', align: 'center' as const },
    { key: 'jtr_kms', label: 'JTR (KMS)', align: 'center' as const },
    { key: 'gardu', label: 'Gardu', align: 'center' as const },
    { key: 'fco', label: 'FCO', align: 'center' as const },
    { key: 'rec', label: 'REC', align: 'center' as const },
    { key: 'pelanggan', label: 'Pelanggan', align: 'center' as const },
  ];

  const getColor = (p: string) => PENYULANG_COLORS[p.toUpperCase()] || '#94a3b8';

  return (
    <div className={`min-h-screen ${bgMain} ${textMain} font-sans transition-colors duration-200`}>
      {/* Header */}
      <div className={`${bgHeader} border-b ${headerBorder} transition-colors duration-200`} style={!isLight ? { background: `linear-gradient(135deg, #09090b 0%, rgba(99,102,241,0.03) 100%)` } : {}}>
        <div className="max-w-[1800px] mx-auto px-6 py-6">
          <Link href="/" className={`inline-flex items-center gap-1 text-sm mb-4 font-semibold transition-colors ${isLight ? 'text-gray-500 hover:text-blue-600' : 'text-[#52525b] hover:text-white'}`}>
            <ChevronLeft size={16} /> Dashboard
          </Link>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 flex items-center justify-center border rounded-lg shadow-sm`}
                style={{
                  color: accent,
                  backgroundColor: isLight ? '#f8fafc' : `${accent}15`,
                  borderColor: isLight ? '#e2e8f0' : `${accent}30`,
                }}>
                <Filter size={24} />
              </div>
              <div>
                <h1 className={`text-2xl font-bold tracking-tight ${isLight ? 'text-gray-900' : 'text-white'}`}>Data Sistem</h1>
                <div className="flex items-center gap-3 mt-1 text-sm">
                  <span className={`font-mono text-xs px-2 py-0.5 border rounded ${isLight ? 'bg-gray-100 text-gray-600 border-gray-200' : 'bg-[#18181b] text-white border-[#27272a]'}`}>
                    ringkasan per penyulang
                  </span>
                  <span className={isLight ? 'text-gray-300' : 'text-[#3f3f46]'}>|</span>
                  <span className={isLight ? 'text-gray-500' : 'text-[#71717a]'}>
                    <span className={`font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>{filtered.length}</span> penyulang
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={toggleTheme} className={`p-2.5 rounded-lg border transition-all ${isLight ? 'bg-white border-gray-300 text-gray-500 hover:text-gray-800 hover:bg-gray-50' : 'bg-[#18181b] border-[#27272a] text-[#a1a1aa] hover:text-white hover:bg-[#1c1c1e]'}`}>
                {isLight ? <Moon size={16} /> : <Sun size={16} />}
              </button>
              <button onClick={handleExport} className={`flex items-center gap-2 px-4 py-2 border rounded text-sm font-semibold shadow-sm transition-all ${btnBg}`}>
                <Download size={16} /> Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="max-w-[1800px] mx-auto px-6 py-4 flex gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-gray-400' : 'text-[#3f3f46]'}`} size={16} />
          <input
            type="text"
            placeholder="Cari penyulang..."
            className={`w-full border rounded py-2 pl-9 pr-3 outline-none transition-all text-sm shadow-sm font-medium ${inputBg} ${inputFocus}`}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-[#71717a]'}`}>
          Halaman {currentPage} dari {totalPages || 1}
        </div>
      </div>

      {/* Table */}
      <div className="max-w-[1800px] mx-auto px-6 pb-12 transition-colors duration-200">
        <div className={`overflow-x-auto border ${tableBorder} ${isLight ? 'bg-white' : 'bg-[#0f0f11]'} rounded-lg`}>
          <table className={`w-full text-left border-collapse whitespace-nowrap ${isLight ? 'text-[12px]' : 'text-sm'}`}>
            <thead className="sticky top-0 z-20">
              <tr className={`${thBg} ${isLight ? 'border-b-2' : 'border-b'}`}>
                <th className={`px-3 py-3 font-bold uppercase tracking-wider text-center border-r ${isLight ? 'border-gray-200' : 'border-[#1c1c1e]'} sticky left-0 z-30 w-10 text-[10px] ${thBg}`}>
                  No
                </th>
                {columns.map(col => (
                  <th key={col.key} className={`px-4 py-3 font-bold uppercase tracking-wider text-[10px] border-r ${isLight ? 'border-gray-200' : 'border-[#1c1c1e]'} ${col.align === 'center' ? 'text-center' : ''}`}>
                    {col.label}
                  </th>
                ))}
                <th className={`px-4 py-3 font-bold uppercase tracking-wider text-center text-[10px] border-l ${isLight ? 'border-gray-200' : 'border-[#1c1c1e]'} w-16`}>
                  PETA
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`skel-${i}`} className={`border-b ${trBorder}`}>
                    <td className={`px-3 py-3 border-r ${isLight ? 'border-gray-200' : 'border-[#1c1c1e]'}`}><div className="skeleton w-6 h-4 mx-auto" /></td>
                    {columns.map(col => (
                      <td key={col.key} className={`px-4 py-3 border-r ${isLight ? 'border-gray-200' : 'border-[#1c1c1e]'}`}>
                        <div className={`skeleton h-4 ${col.key === 'penyulang' ? 'w-24' : 'w-12 mx-auto'}`} />
                      </td>
                    ))}
                    <td className={`px-4 py-3 border-l ${isLight ? 'border-gray-200' : 'border-[#1c1c1e]'}`}>
                      <div className="skeleton w-8 h-4 mx-auto" />
                    </td>
                  </tr>
                ))
              ) : paginatedData.length > 0 ? (
                <>
                  {paginatedData.map((row, i) => (
                    <SystemTableRow 
                      key={row.penyulang}
                      row={row}
                      index={(currentPage - 1) * ROWS_PER_PAGE + i}
                      isLight={isLight}
                      getColor={getColor}
                      columns={columns}
                    />
                  ))}

                  {/* TOTAL ROW */}
                  <tr className={`${isLight ? 'bg-gray-100 border-t-2 border-gray-300' : 'bg-[#18181b] border-t-2 border-[#3f3f46]'} font-bold`}>
                    <td className={`px-3 py-3 text-center border-r ${isLight ? 'border-gray-300' : 'border-[#3f3f46]'}`} />
                    <td className={`px-4 py-3 border-r ${isLight ? 'border-gray-300 text-gray-900' : 'border-[#3f3f46] text-white'} text-sm uppercase tracking-wider`}>
                      TOTAL
                    </td>
                    <td className={`px-4 py-3 text-center border-r ${isLight ? 'border-gray-300 text-gray-900' : 'border-[#3f3f46] text-white'} text-sm`}>
                      {totals.tiang.toLocaleString()}
                    </td>
                    <td className={`px-4 py-3 text-center border-r ${isLight ? 'border-gray-300' : 'border-[#3f3f46]'} text-blue-500 font-mono text-sm`}>
                      {totals.jtm_kms.toFixed(2)}
                    </td>
                    <td className={`px-4 py-3 text-center border-r ${isLight ? 'border-gray-300' : 'border-[#3f3f46]'} text-cyan-500 font-mono text-sm`}>
                      {totals.jtr_kms.toFixed(2)}
                    </td>
                    <td className={`px-4 py-3 text-center border-r ${isLight ? 'border-gray-300 text-gray-900' : 'border-[#3f3f46] text-emerald-400'} text-sm`}>
                      {totals.gardu}
                    </td>
                    <td className={`px-4 py-3 text-center border-r ${isLight ? 'border-gray-300' : 'border-[#3f3f46]'} text-sky-400 text-sm`}>
                      {totals.fco}
                    </td>
                    <td className={`px-4 py-3 text-center border-r ${isLight ? 'border-gray-300' : 'border-[#3f3f46]'} text-rose-400 text-sm`}>
                      {totals.rec}
                    </td>
                    <td className={`px-4 py-3 text-center border-r ${isLight ? 'border-gray-300 text-gray-900' : 'border-[#3f3f46] text-amber-400'} text-sm`}>
                      {totals.pelanggan.toLocaleString()}
                    </td>
                    <td className={`px-4 py-3 border-l ${isLight ? 'border-gray-300' : 'border-[#3f3f46]'}`} />
                  </tr>
                </>
              ) : (
                <tr>
                  <td colSpan={columns.length + 2} className={`py-8 text-center text-xs font-mono ${isLight ? 'text-gray-400' : 'text-[#3f3f46]'}`}>
                    {search ? `Tidak ditemukan penyulang "${search}"` : 'Memuat data sistem...'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border font-medium transition-all ${
                isLight
                  ? `border-gray-300 ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`
                  : `border-[#27272a] ${currentPage === 1 ? 'bg-[#09090b] text-[#3f3f46] cursor-not-allowed' : 'bg-[#18181b] text-[#a1a1aa] hover:bg-[#1c1c1e] hover:text-white'}`
              }`}
            >
              <ChevronPrev size={16} /> Sebelumnya
            </button>

            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              let page = i + 1;
              if (totalPages > 5 && currentPage > 3) {
                page = currentPage - 2 + i;
              }
              if (page > totalPages) return null;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-lg border font-bold transition-all ${
                    currentPage === page
                      ? isLight
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-[#6366f1] text-white border-[#6366f1]'
                      : isLight
                      ? 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      : 'bg-[#18181b] text-[#a1a1aa] border-[#27272a] hover:bg-[#1c1c1e] hover:text-white'
                  }`}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border font-medium transition-all ${
                isLight
                  ? `border-gray-300 ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`
                  : `border-[#27272a] ${currentPage === totalPages ? 'bg-[#09090b] text-[#3f3f46] cursor-not-allowed' : 'bg-[#18181b] text-[#a1a1aa] hover:bg-[#1c1c1e] hover:text-white'}`
              }`}
            >
              Selanjutnya <ChevronNext size={16} />
            </button>
          </div>
        )}

        {/* Summary Cards */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mt-6">
            {[
              { label: 'Penyulang', value: filtered.length, color: '#6366f1', icon: '⚡' },
              { label: 'Total Tiang', value: totals.tiang.toLocaleString(), color: '#94a3b8', icon: '📍' },
              { label: 'JTM (KMS)', value: totals.jtm_kms.toFixed(2), color: '#3b82f6', icon: '🔵' },
              { label: 'JTR (KMS)', value: totals.jtr_kms.toFixed(2), color: '#06b6d4', icon: '🔌' },
              { label: 'Total Gardu', value: totals.gardu, color: '#22c55e', icon: '🏭' },
              { label: 'FCO', value: totals.fco, color: '#0ea5e9', icon: '🔵' },
              { label: 'Recloser', value: totals.rec, color: '#e11d48', icon: '🔴' },
              { label: 'Pelanggan', value: totals.pelanggan.toLocaleString(), color: '#f59e0b', icon: '👥' },
            ].map((card, i) => (
              <div key={i} className={`rounded-lg border p-3 transition-all ${isLight ? 'bg-white border-gray-200 shadow-sm' : 'bg-[#18181b] border-[#27272a]'}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-sm">{card.icon}</span>
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${isLight ? 'text-gray-500' : 'text-[#52525b]'}`}>{card.label}</span>
                </div>
                <div className="text-lg font-extrabold" style={{ color: card.color }}>{card.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
