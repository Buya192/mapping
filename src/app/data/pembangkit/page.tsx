'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search, Filter, Download, X, Check, AlertCircle, MapPin } from 'lucide-react';
import Link from 'next/link';

interface Pembangkit {
  id: string;
  name: string;
  konfigurasi: string;
  kapasitas_kw: number;
  tegangan_kv: number;
  merk: string;
  status: string;
  lat: number;
  lng: number;
  created_at?: string;
}

export default function PembangkitPage() {
  const [data, setData] = useState<Pembangkit[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Pembangkit>>({});
  const [loading, setLoading] = useState(true);

  // Load data
  useEffect(() => {
    setLoading(true);
    fetch('/api/hardware?type=pembangkit')
      .then(r => r.ok ? r.json() : [])
      .then(d => {
        setData(Array.isArray(d) ? d.map((item: any, idx: number) => ({
          id: item.id || `pbk-${idx}`,
          ...item
        })) : []);
        setLoading(false);
      })
      .catch(() => { setData([]); setLoading(false); });
  }, []);

  // Filter & Search
  const filtered = useMemo(() => {
    return data.filter(item => {
      const matchSearch = search === '' || 
        item.name?.toLowerCase().includes(search.toLowerCase()) ||
        item.merk?.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filterType === 'all' || item.konfigurasi === filterType;
      return matchSearch && matchFilter;
    });
  }, [data, search, filterType]);

  const types = useMemo(() => {
    const set = new Set(data.map(d => d.konfigurasi).filter(Boolean));
    return Array.from(set).sort();
  }, [data]);

  const handleAdd = () => {
    setEditingId(null);
    setFormData({});
    setShowForm(true);
  };

  const handleEdit = (item: Pembangkit) => {
    setEditingId(item.id);
    setFormData(item);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!formData.name) return alert('Nama pembangkit harus diisi');
    
    if (editingId) {
      setData(data.map(item => item.id === editingId ? { ...item, ...formData } as Pembangkit : item));
    } else {
      const newItem: Pembangkit = {
        id: `pbk-${Date.now()}`,
        name: formData.name || '',
        konfigurasi: formData.konfigurasi || 'Diesel',
        kapasitas_kw: formData.kapasitas_kw || 0,
        tegangan_kv: formData.tegangan_kv || 20,
        merk: formData.merk || '',
        status: formData.status || 'Aktif',
        lat: formData.lat || -8.3,
        lng: formData.lng || 124.3,
      };
      setData([...data, newItem]);
    }
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus pembangkit ini?')) {
      setData(data.filter(item => item.id !== id));
    }
  };

  const handleExport = () => {
    const headers = ['Nama', 'Jenis', 'Kapasitas (kW)', 'Tegangan (kV)', 'Merk', 'Status', 'Lat', 'Lng'];
    const rows = filtered.map(d => [d.name, d.konfigurasi, d.kapasitas_kw, d.tegangan_kv, d.merk, d.status, d.lat, d.lng]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); 
    a.href = url; 
    a.download = 'pembangkit.csv'; 
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#d4d4d8] font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#09090b] to-[#f9731615] border-b border-[#1c1c1e] sticky top-0 z-30">
        <div className="max-w-[1800px] mx-auto px-6 py-6">
          <Link href="/" className="inline-flex items-center gap-1 text-sm mb-4 font-semibold text-[#52525b] hover:text-white">
            ← Dashboard
          </Link>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 flex items-center justify-center border border-[#f9731630] rounded-lg bg-[#f9731610]">
                <svg className="w-6 h-6 text-[#f97316]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Data Pembangkit (PLTS & PLTD)</h1>
                <p className="text-sm text-[#71717a] mt-1">Kelola data pembangkit listrik</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#27272a] hover:bg-[#18181b] text-sm font-medium transition-colors">
                <Download size={16} /> Export
              </button>
              <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#f97316] hover:bg-[#ea580c] text-white font-semibold transition-colors">
                <Plus size={18} /> Tambah
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-6 py-6">
        {/* Toolbar */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3f3f46]" size={18} />
            <input
              type="text"
              placeholder="Cari nama pembangkit atau merk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#18181b] border border-[#27272a] rounded-lg text-white placeholder-[#3f3f46] focus:outline-none focus:border-[#f97316] transition-colors"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2.5 bg-[#18181b] border border-[#27272a] rounded-lg text-white focus:outline-none focus:border-[#f97316] transition-colors text-sm"
          >
            <option value="all">Semua Jenis</option>
            {types.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <div className="flex items-center gap-2 border border-[#27272a] rounded-lg bg-[#18181b] p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === 'table' ? 'bg-[#f97316] text-white' : 'text-[#71717a] hover:text-white'}`}
            >
              Tabel
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === 'card' ? 'bg-[#f97316] text-white' : 'text-[#71717a] hover:text-white'}`}
            >
              Kartu
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#18181b] border border-[#27272a] rounded-lg p-4">
            <div className="text-[12px] font-bold text-[#52525b] uppercase tracking-wider mb-2">Total</div>
            <div className="text-2xl font-bold text-white">{filtered.length}</div>
            <div className="text-xs text-[#71717a] mt-1">dari {data.length} pembangkit</div>
          </div>
          <div className="bg-[#18181b] border border-[#27272a] rounded-lg p-4">
            <div className="text-[12px] font-bold text-[#52525b] uppercase tracking-wider mb-2">Total Kapasitas</div>
            <div className="text-2xl font-bold text-[#fbbf24]">{(filtered.reduce((s, d) => s + (d.kapasitas_kw || 0), 0) / 1000).toFixed(2)} MW</div>
          </div>
          <div className="bg-[#18181b] border border-[#27272a] rounded-lg p-4">
            <div className="text-[12px] font-bold text-[#52525b] uppercase tracking-wider mb-2">Aktif</div>
            <div className="text-2xl font-bold text-[#22c55e]">{filtered.filter(d => d.status === 'Aktif').length}</div>
          </div>
          <div className="bg-[#18181b] border border-[#27272a] rounded-lg p-4">
            <div className="text-[12px] font-bold text-[#52525b] uppercase tracking-wider mb-2">Jenis</div>
            <div className="text-2xl font-bold text-[#60a5fa]">{types.length}</div>
          </div>
        </div>

        {/* Table View */}
        {viewMode === 'table' && (
          <div className="bg-[#18181b] border border-[#27272a] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#27272a] bg-[#0f0f11]">
                    <th className="px-4 py-3 text-left font-bold text-[#71717a] text-xs uppercase tracking-wider w-8">#</th>
                    <th className="px-4 py-3 text-left font-bold text-[#71717a] text-xs uppercase tracking-wider">Nama</th>
                    <th className="px-4 py-3 text-left font-bold text-[#71717a] text-xs uppercase tracking-wider">Jenis</th>
                    <th className="px-4 py-3 text-center font-bold text-[#71717a] text-xs uppercase tracking-wider">Kapasitas</th>
                    <th className="px-4 py-3 text-center font-bold text-[#71717a] text-xs uppercase tracking-wider">Tegangan</th>
                    <th className="px-4 py-3 text-left font-bold text-[#71717a] text-xs uppercase tracking-wider">Merk</th>
                    <th className="px-4 py-3 text-center font-bold text-[#71717a] text-xs uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-center font-bold text-[#71717a] text-xs uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={`skeleton-${i}`} className="border-b border-[#27272a] animate-pulse">
                        <td colSpan={8} className="px-4 py-3 h-12 bg-[#1c1c1e] rounded" />
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-[#52525b]">
                        Tidak ada pembangkit ditemukan
                      </td>
                    </tr>
                  ) : (
                    filtered.map((item, idx) => (
                      <tr key={item.id} className="border-b border-[#27272a] hover:bg-[#1c1c1e] transition-colors">
                        <td className="px-4 py-3 text-[#52525b] font-mono text-xs">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-white">{item.name}</div>
                          <div className="text-xs text-[#71717a] mt-0.5">{item.merk}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-bold px-2 py-1 rounded ${
                            item.konfigurasi === 'Solar PV' 
                              ? 'bg-[#fbbf2415] text-[#fbbf24]' 
                              : 'bg-[#60a5fa15] text-[#60a5fa]'
                          }`}>
                            {item.konfigurasi}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-[#22c55e]">
                          {item.kapasitas_kw >= 1000 ? `${(item.kapasitas_kw / 1000).toFixed(1)} MW` : `${item.kapasitas_kw} kW`}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-[#a1a1aa]">{item.tegangan_kv} kV</td>
                        <td className="px-4 py-3 text-sm text-[#a1a1aa]">{item.merk || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs font-bold px-2 py-1 rounded ${
                            item.status === 'Aktif'
                              ? 'bg-[#22c55e15] text-[#22c55e]'
                              : 'bg-[#fbbf2415] text-[#fbbf24]'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-1.5 rounded hover:bg-[#27272a] text-[#60a5fa] hover:text-white transition-colors"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 rounded hover:bg-[#27272a] text-[#ef4444] hover:text-[#fca5a5] transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Card View */}
        {viewMode === 'card' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={`skeleton-${i}`} className="h-64 bg-[#18181b] border border-[#27272a] rounded-lg animate-pulse" />
              ))
            ) : filtered.length === 0 ? (
              <div className="col-span-full text-center py-12 text-[#52525b]">
                Tidak ada pembangkit ditemukan
              </div>
            ) : (
              filtered.map((item) => (
                <div key={item.id} className="bg-[#18181b] border border-[#27272a] rounded-lg p-4 hover:border-[#f97316] transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-sm">{item.name}</h3>
                      <p className="text-xs text-[#71717a] mt-1">{item.merk}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded whitespace-nowrap ml-2 ${
                      item.konfigurasi === 'Solar PV' 
                        ? 'bg-[#fbbf2415] text-[#fbbf24]' 
                        : 'bg-[#60a5fa15] text-[#60a5fa]'
                    }`}>
                      {item.konfigurasi}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[#71717a]">Kapasitas</span>
                      <span className="font-bold text-[#22c55e] font-mono">
                        {item.kapasitas_kw >= 1000 ? `${(item.kapasitas_kw / 1000).toFixed(1)} MW` : `${item.kapasitas_kw} kW`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[#71717a]">Tegangan</span>
                      <span className="font-mono text-[#a1a1aa]">{item.tegangan_kv} kV</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[#71717a]">Status</span>
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                        item.status === 'Aktif'
                          ? 'bg-[#22c55e15] text-[#22c55e]'
                          : 'bg-[#fbbf2415] text-[#fbbf24]'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    {item.lat && item.lng && (
                      <div className="flex items-center gap-1.5 text-sm text-[#60a5fa]">
                        <MapPin size={14} />
                        <span className="font-mono text-xs">{Number(item.lat).toFixed(4)}, {Number(item.lng).toFixed(4)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-[#27272a]">
                    <button
                      onClick={() => handleEdit(item)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-[#27272a] hover:bg-[#3f3f46] text-[#60a5fa] hover:text-white rounded transition-colors text-sm font-medium"
                    >
                      <Pencil size={14} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-[#27272a] hover:bg-[#3f3f46] text-[#ef4444] hover:text-[#fca5a5] rounded transition-colors text-sm font-medium"
                    >
                      <Trash2 size={14} /> Hapus
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#18181b] border border-[#27272a] rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[#27272a]">
              <h2 className="text-lg font-bold text-white">{editingId ? 'Edit' : 'Tambah'} Pembangkit</h2>
              <button onClick={() => setShowForm(false)} className="text-[#71717a] hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#d4d4d8] mb-2">Nama Pembangkit *</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#27272a] border border-[#3f3f46] rounded text-white placeholder-[#52525b] focus:outline-none focus:border-[#f97316]"
                  placeholder="Nama pembangkit"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#d4d4d8] mb-2">Jenis</label>
                  <select
                    value={formData.konfigurasi || 'Diesel'}
                    onChange={(e) => setFormData({ ...formData, konfigurasi: e.target.value })}
                    className="w-full px-3 py-2 bg-[#27272a] border border-[#3f3f46] rounded text-white focus:outline-none focus:border-[#f97316]"
                  >
                    <option>Diesel</option>
                    <option>Solar PV</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#d4d4d8] mb-2">Status</label>
                  <select
                    value={formData.status || 'Aktif'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-[#27272a] border border-[#3f3f46] rounded text-white focus:outline-none focus:border-[#f97316]"
                  >
                    <option>Aktif</option>
                    <option>Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#d4d4d8] mb-2">Kapasitas (kW)</label>
                  <input
                    type="number"
                    value={formData.kapasitas_kw || ''}
                    onChange={(e) => setFormData({ ...formData, kapasitas_kw: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#27272a] border border-[#3f3f46] rounded text-white placeholder-[#52525b] focus:outline-none focus:border-[#f97316]"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#d4d4d8] mb-2">Tegangan (kV)</label>
                  <input
                    type="number"
                    value={formData.tegangan_kv || ''}
                    onChange={(e) => setFormData({ ...formData, tegangan_kv: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#27272a] border border-[#3f3f46] rounded text-white placeholder-[#52525b] focus:outline-none focus:border-[#f97316]"
                    placeholder="20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#d4d4d8] mb-2">Merk / Vendor</label>
                <input
                  type="text"
                  value={formData.merk || ''}
                  onChange={(e) => setFormData({ ...formData, merk: e.target.value })}
                  className="w-full px-3 py-2 bg-[#27272a] border border-[#3f3f46] rounded text-white placeholder-[#52525b] focus:outline-none focus:border-[#f97316]"
                  placeholder="Merk/Vendor"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#d4d4d8] mb-2">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.lat || ''}
                    onChange={(e) => setFormData({ ...formData, lat: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#27272a] border border-[#3f3f46] rounded text-white placeholder-[#52525b] focus:outline-none focus:border-[#f97316]"
                    placeholder="-8.3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#d4d4d8] mb-2">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.lng || ''}
                    onChange={(e) => setFormData({ ...formData, lng: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#27272a] border border-[#3f3f46] rounded text-white placeholder-[#52525b] focus:outline-none focus:border-[#f97316]"
                    placeholder="124.3"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-[#27272a]">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2.5 border border-[#27272a] rounded-lg hover:bg-[#27272a] text-white font-medium transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#f97316] hover:bg-[#ea580c] rounded-lg text-white font-medium transition-colors"
              >
                <Check size={18} /> Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
