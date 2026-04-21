'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, Search, Filter, Download, ChevronDown, Moon, Sun } from 'lucide-react';
import Link from 'next/link';

interface DataPageShellProps {
  title: string;
  source: string;
  icon: React.ReactNode;
  accentColor: string; // hex without #
  data: any[];
  columns: { key: string; label: string; align?: 'left' | 'center' | 'right'; format?: (v: any, row: any) => React.ReactNode }[];
  filterKey?: string;
  filterLabel?: string;
  searchKeys?: string[];
  renderExpanded?: (row: any) => React.ReactNode;
  renderBeforeTable?: React.ReactNode;
  headerActions?: React.ReactNode;
}

export function DataPageShell({ title, source, icon, accentColor, data, columns, filterKey, filterLabel, searchKeys = [], renderExpanded, renderBeforeTable, headerActions }: DataPageShellProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | number | null>(null);
  const [page, setPage] = useState(0);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const PAGE_SIZE = 100;

  // Set theme from local storage if exists
  useEffect(() => {
    const saved = localStorage.getItem('table-theme');
    if (saved === 'dark' || saved === 'light') {
      setTheme(saved);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('table-theme', newTheme);
  };

  const filterValues = useMemo(() => {
    if (!filterKey || !data || !Array.isArray(data) || !data.length) return [];
    const set = new Set<string>();
    // Use standard loop for speed
    for (let i = 0; i < data.length; i++) {
        if (!data[i]) continue;
        const v = data[i][filterKey];
        if (v) set.add(String(v).toUpperCase());
    }
    return Array.from(set).sort();
  }, [data, filterKey]);

  const filtered = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    if (!search && filter === 'all') return data.filter(Boolean); // Clean any nulls
    
    const term = search.toLowerCase();
    
    return data.filter(d => {
      if (!d) return false;
      // Fast path checking if there's a search term
      let matchSearch = true;
      if (term) {
        // Only check specified keys for faster matching
        if (searchKeys.length > 0) {
           matchSearch = searchKeys.some(k => String(d[k] || '').toLowerCase().includes(term));
        } else {
           // Fallback to iterating 5 common keys to prevent browser crash 
           const keys = Object.keys(d).slice(0, 8); 
           matchSearch = keys.some(k => String(d[k] || '').toLowerCase().includes(term));
        }
      }
      
      const matchFilter = filter === 'all' || !filterKey || String(d[filterKey] || '').toUpperCase() === filter;
      return matchSearch && matchFilter;
    });
  }, [data, search, filter, filterKey, searchKeys]);

  const paginated = useMemo(() => {
    return filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const handleExport = () => {
    const headers = columns.map(c => c.label);
    const rows = filtered.map(d => columns.map(c => String(d[c.key] || '-')));
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${source.replace('.geojson','')}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const accent = `#${accentColor}`;
  const isLight = theme === 'light';

  // --- Dynamic Tailwind Classes based on Theme ---
  const bgMain = isLight ? "bg-gray-50" : "bg-[#09090b]";
  const textMain = isLight ? "text-gray-800" : "text-[#d4d4d8]";
  const bgHeader = isLight ? "bg-white" : "bg-[#09090b]";
  const headerBorder = isLight ? "border-gray-200" : "border-[#1c1c1e]";
  const btnExportBg = isLight ? "bg-white hover:bg-gray-50 text-gray-700 border-gray-300" : "bg-[#18181b] hover:bg-[#1c1c1e] text-[#a1a1aa] hover:text-white border-[#27272a] hover:border-[#3f3f46]";
  const inputBg = isLight ? "bg-white border-gray-300 text-gray-800 placeholder-gray-400" : "bg-[#18181b] border-[#27272a] text-white placeholder-[#3f3f46]";
  const inputFocus = isLight ? "focus:border-blue-500 focus:ring-blue-500" : "focus:border-[#3f3f46] focus:ring-[#3f3f46]";
  
  // Table classes
  const tableContainerBorder = isLight ? "border-gray-300 shadow-sm" : "border-[#1c1c1e]";
  const thBg = isLight ? "bg-[#f8fafc] text-gray-700 border-gray-300" : "bg-[#0f0f11] text-[#71717a] border-[#1c1c1e] text-[10px]";
  const trHover = isLight ? "hover:bg-blue-50/50" : "hover:bg-[#18181b]";
  const trBorder = isLight ? "border-gray-200" : "border-[#1c1c1e]/50";
  const expandedBg = isLight ? "bg-[#f8fafc] shadow-inner" : "bg-[#0c0c0e]";
  
  // Zebra
  const getTrBg = (i: number) => {
    if (isLight) return i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50';
    return ''; // dark mode doesn't use zebra by default
  };

  return (
    <div className={`min-h-screen ${bgMain} ${textMain} font-sans transition-colors duration-200`}>
      {/* Header Banner */}
      <div className={`${bgHeader} border-b ${headerBorder} transition-colors duration-200`} style={!isLight ? { background: `linear-gradient(135deg, #09090b 0%, #${accentColor}08 100%)` } : {}}>
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
                     borderColor: isLight ? '#e2e8f0' : `${accent}30` 
                   }}>
                {icon}
              </div>
              <div>
                <h1 className={`text-2xl font-bold tracking-tight ${isLight ? 'text-gray-900' : 'text-white'}`}>{title}</h1>
                <div className="flex items-center gap-3 mt-1 text-sm">
                  <span className={`font-mono text-xs px-2 py-0.5 border rounded ${isLight ? 'bg-gray-100 text-gray-600 border-gray-200' : 'bg-[#18181b] text-white border-[#27272a]'}`}>
                    {source}
                  </span>
                  <span className={isLight ? "text-gray-300" : "text-[#3f3f46]"}>|</span>
                  <span className={isLight ? "text-gray-500" : "text-[#71717a]"}>
                    <span className={`font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>{filtered.length.toLocaleString()}</span> / {data.length.toLocaleString()} record
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {headerActions}
              <button onClick={toggleTheme} className={`p-2.5 rounded-lg border transition-all ${isLight ? 'bg-white border-gray-300 text-gray-500 hover:text-gray-800 hover:bg-gray-50' : 'bg-[#18181b] border-[#27272a] text-[#a1a1aa] hover:text-white hover:bg-[#1c1c1e]'}`}>
                {isLight ? <Moon size={16} /> : <Sun size={16} />}
              </button>
              <button onClick={handleExport} 
                      className={`flex items-center gap-2 px-4 py-2 border rounded text-sm font-semibold shadow-sm transition-all ${btnExportBg}`}>
                <Download size={16} /> Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="max-w-[1800px] mx-auto px-6 py-4 flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-gray-400' : 'text-[#3f3f46]'}`} size={16} />
          <input
            type="text"
            placeholder="Cari detail data..."
            className={`w-full border rounded py-2 pl-9 pr-3 outline-none transition-all text-sm shadow-sm font-medium ${inputBg} ${inputFocus}`}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
        {filterKey && (
          <div className="relative min-w-[200px]">
            <Filter className={`absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-gray-400' : 'text-[#3f3f46]'}`} size={16} />
            <select
              className={`w-full border rounded py-2 pl-9 pr-3 outline-none appearance-none cursor-pointer text-sm shadow-sm font-medium ${inputBg} ${inputFocus}`}
              value={filter}
              onChange={(e) => { setFilter(e.target.value); setPage(0); }}
            >
              <option value="all">Semua {filterLabel || filterKey}</option>
              {filterValues.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Spreadsheet Table */}
      <div className="max-w-[1800px] mx-auto px-6 pb-12 transition-colors duration-200">
        {renderBeforeTable}
        <div className={`overflow-x-auto max-h-[70vh] border ${tableContainerBorder} ${isLight ? 'bg-white' : 'bg-[#0f0f11]'}`}>
          <table className={`w-full text-left border-collapse whitespace-nowrap ${isLight ? 'text-[11px]' : 'text-sm'}`}>
            <thead className="sticky top-0 z-20">
              <tr className={`${thBg} ${isLight ? 'border-b-2' : 'border-b'}`}>
                <th className={`px-3 py-2 font-bold uppercase tracking-wider text-center border-r ${isLight ? 'border-gray-200' : 'border-[#1c1c1e]'} sticky left-0 z-30 w-10 ${thBg}`}>
                  No
                </th>
                {columns.map(col => (
                  <th key={col.key} className={`px-3 py-2 font-bold uppercase tracking-wider border-r ${isLight ? 'border-gray-200' : 'border-[#1c1c1e]'} ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}`}>
                    {col.label}
                  </th>
                ))}
                <th className={`px-3 py-2 font-bold text-center border-l ${isLight ? 'border-gray-200' : 'border-[#1c1c1e]'} w-8`}>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.length > 0 ? paginated.map((d, i) => {
                const rowId = d.id || i;
                const isExpanded = expandedId === rowId;
                return (
                 <React.Fragment key={rowId}>
                  <tr
                    className={`border-b border-r border-l ${trBorder} ${trHover} cursor-pointer transition-colors ${getTrBg(i)}`}
                    onClick={() => setExpandedId(isExpanded ? null : rowId)}
                  >
                    <td className={`px-3 py-2 text-center font-medium border-r ${isLight ? 'border-gray-200 text-gray-500 shadow-[1px_0_0_0_#e5e7eb] bg-inherit' : 'border-[#1c1c1e] text-[#3f3f46] font-mono'}`}>
                      {page * PAGE_SIZE + i + 1}
                    </td>
                    {columns.map(col => (
                      <td key={col.key} className={`px-3 py-2 border-r ${isLight ? 'border-gray-200' : 'border-[#1c1c1e]'} ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}>
                        {col.format ? col.format(d[col.key], d) : (
                          <span className={`font-medium ${isLight ? 'text-gray-700' : 'text-[#d4d4d8]'}`}>
                            {d[col.key] != null && String(d[col.key]).trim() ? String(d[col.key]) : <span className={isLight ? 'text-gray-300' : 'text-[#27272a]'}>—</span>}
                          </span>
                        )}
                      </td>
                    ))}
                    <td className={`px-3 py-2 text-center border-l ${isLight ? 'border-gray-200' : 'border-[#1c1c1e]'}`}>
                      <ChevronDown size={14} className={`${isLight ? 'text-gray-400' : 'text-[#3f3f46]'} transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </td>
                  </tr>
                  
                  {isExpanded && (
                     renderExpanded ? renderExpanded(d) : (
                     <tr className={`${expandedBg} border-b ${trBorder}`}>
                       <td colSpan={columns.length + 2} className="px-8 py-5">
                         <div className={`text-xs font-bold mb-3 uppercase tracking-widest border-b pb-2 inline-block ${isLight ? 'text-gray-600 border-gray-300' : 'text-[#52525b] border-[#1c1c1e] font-mono'}`}>
                           📋 Atribut ArcGIS
                         </div>
                         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-4">
                           {Object.entries(d).map(([k, v]) => {
                             if (typeof v === 'object' && v !== null) return null;
                             const val = v != null && String(v).trim() ? String(v) : '';
                             return (
                               <div key={k} className="flex flex-col">
                                 <span className={`text-[10px] uppercase font-bold tracking-wide truncate ${isLight ? 'text-gray-500' : 'text-[#52525b] font-mono'}`}>{k}</span>
                                 <span className={`text-xs mt-0.5 break-words font-medium ${val ? (isLight ? 'text-gray-900' : 'text-[#d4d4d8]') : (isLight ? 'text-gray-400' : 'text-[#27272a]')}`}>
                                   {val || '—'}
                                 </span>
                               </div>
                             );
                           })}
                         </div>
                       </td>
                     </tr>
                     )
                   )}
                 </React.Fragment>
                );
              }) : (
                <>
                  {/* Skeleton loading rows */}
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <tr key={`skel-${idx}`} className={`border-b ${trBorder}`}>
                      <td className={`px-3 py-3 border-r ${isLight ? 'border-gray-200' : 'border-[#1c1c1e]'}`}>
                        <div className="skeleton w-6 h-4 mx-auto" />
                      </td>
                      {columns.map(col => (
                        <td key={col.key} className={`px-3 py-3 border-r ${isLight ? 'border-gray-200' : 'border-[#1c1c1e]'}`}>
                          <div className={`skeleton h-4 ${col.align === 'center' ? 'w-12 mx-auto' : col.align === 'right' ? 'w-16 ml-auto' : 'w-24'}`} />
                        </td>
                      ))}
                      <td className={`px-3 py-3 border-l ${isLight ? 'border-gray-200' : 'border-[#1c1c1e]'}`}>
                        <div className="skeleton w-4 h-4 mx-auto" />
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={columns.length + 2} className={`py-6 text-center text-xs font-mono ${isLight ? 'text-gray-400' : 'text-[#3f3f46]'}`}>
                      ⏳ Memuat data dari sumber GeoJSON...
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={`flex items-center justify-between mt-4 p-4 rounded-b-lg border-t-0 border ${tableContainerBorder} ${isLight ? 'bg-white' : 'bg-[#09090b]'}`}>
            <div className={`text-xs font-medium ${isLight ? 'text-gray-500' : 'text-[#52525b]'}`}>
              Page <span className={`font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>{page + 1}</span> of {totalPages}
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                className={`px-3 py-1.5 rounded border disabled:opacity-50 disabled:cursor-not-allowed font-medium text-[11px] transition-colors ${
                  isLight ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50' : 'border-[#27272a] bg-[#0c0c0e] text-[#a1a1aa] hover:bg-[#18181b] hover:text-white'
                }`}
              >
                Previous
              </button>
              <div className="flex gap-1 mx-2">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let p = page;
                  if (page < 2) p = i;
                  else if (page > totalPages - 3) p = totalPages - 5 + i;
                  else p = page - 2 + i;
                  
                  if (p < 0 || p >= totalPages) return null;
                  
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-7 h-7 flex items-center justify-center rounded text-[11px] font-bold transition-all ${
                        page === p ? 'bg-blue-600 text-white' : (isLight ? 'hover:bg-gray-100 text-gray-600 border border-transparent hover:border-gray-300' : 'hover:bg-[#18181b] text-[#52525b] border border-transparent hover:border-[#27272a]')
                      }`}
                    >
                      {p + 1}
                    </button>
                  );
                })}
              </div>
              <button
                disabled={page === totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                className={`px-3 py-1.5 rounded border disabled:opacity-50 disabled:cursor-not-allowed font-medium text-[11px] transition-colors ${
                  isLight ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50' : 'border-[#27272a] bg-[#0c0c0e] text-[#a1a1aa] hover:bg-[#18181b] hover:text-white'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
