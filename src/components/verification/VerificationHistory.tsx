'use client';
import React, { useState, useMemo } from 'react';
import { Search, Download, Filter, MapPin, Camera, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface VerificationRecord {
  id: string;
  asset_id: string;
  asset_type: string;
  verified_by?: string;
  verified_at: string;
  gps_lat: number;
  gps_lng: number;
  overall_condition: string;
  issues_found: string;
  recommendation: string;
  priority: string;
  photos: any[];
  synced_to_server: boolean;
}

interface VerificationHistoryProps {
  records: VerificationRecord[];
  onExport?: () => void;
}

const statusColors = {
  excellent: 'bg-color-healthy/20 text-color-healthy border border-color-healthy/30',
  good: 'bg-color-info/20 text-color-info border border-color-info/30',
  fair: 'bg-color-warning/20 text-color-warning border border-color-warning/30',
  poor: 'bg-color-critical/20 text-color-critical border border-color-critical/30',
};

const recommendationColors = {
  no_action: 'text-text-tertiary',
  maintenance: 'text-color-warning',
  replacement: 'text-color-critical',
  urgent: 'text-color-critical font-bold',
};

export function VerificationHistory({ records, onExport }: VerificationHistoryProps) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCondition, setFilterCondition] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const matchesSearch = record.asset_id.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === 'all' || record.asset_type === filterType;
      const matchesCondition = filterCondition === 'all' || record.overall_condition === filterCondition;
      const matchesPriority = filterPriority === 'all' || record.priority === filterPriority;
      return matchesSearch && matchesType && matchesCondition && matchesPriority;
    });
  }, [records, search, filterType, filterCondition, filterPriority]);

  const stats = useMemo(
    () => ({
      total: records.length,
      synced: records.filter((r) => r.synced_to_server).length,
      critical: records.filter((r) => r.priority === 'critical').length,
      urgent: records.filter((r) => r.recommendation === 'urgent').length,
    }),
    [records],
  );

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-card">
          <div className="text-sm text-text-secondary">Total Verifikasi</div>
          <div className="text-2xl font-bold text-text-primary mt-1">{stats.total}</div>
        </div>
        <div className="glass-card">
          <div className="text-sm text-text-secondary">Tersinkronisasi</div>
          <div className="text-2xl font-bold text-color-success mt-1">{stats.synced}</div>
        </div>
        <div className="glass-card">
          <div className="text-sm text-text-secondary">Kritis</div>
          <div className="text-2xl font-bold text-color-critical mt-1">{stats.critical}</div>
        </div>
        <div className="glass-card">
          <div className="text-sm text-text-secondary">Urgent</div>
          <div className="text-2xl font-bold text-color-warning mt-1">{stats.urgent}</div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="glass-card space-y-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
            <input
              type="text"
              placeholder="Cari Asset ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-gray-700/30 border border-glass-border rounded text-text-primary placeholder-text-tertiary focus:border-color-info"
            />
          </div>
          {onExport && (
            <button
              onClick={onExport}
              className="px-4 py-2 bg-color-info/20 border border-color-info rounded text-color-info hover:bg-color-info/30 transition-colors flex items-center gap-2"
            >
              <Download size={16} />
              Export
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-gray-700/30 border border-glass-border rounded text-text-primary text-sm"
          >
            <option value="all">Semua Tipe Aset</option>
            <option value="tiang">Tiang</option>
            <option value="trafo">Trafo</option>
            <option value="proteksi">Proteksi</option>
            <option value="jtm">JTM</option>
          </select>

          <select
            value={filterCondition}
            onChange={(e) => setFilterCondition(e.target.value)}
            className="px-3 py-2 bg-gray-700/30 border border-glass-border rounded text-text-primary text-sm"
          >
            <option value="all">Semua Kondisi</option>
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 bg-gray-700/30 border border-glass-border rounded text-text-primary text-sm"
          >
            <option value="all">Semua Prioritas</option>
            <option value="low">Rendah</option>
            <option value="medium">Sedang</option>
            <option value="high">Tinggi</option>
            <option value="critical">Kritis</option>
          </select>
        </div>
      </div>

      {/* Records Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-glass-border bg-gray-700/20">
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary">Asset ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary">Tipe</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary">Kondisi</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary">Rekomendasi</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary">Prioritas</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary">Tanggal</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="border-b border-glass-border/30 hover:bg-gray-700/10 transition-colors">
                    <td className="px-4 py-3 text-sm text-text-primary font-mono">{record.asset_id}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary capitalize">{record.asset_type}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[record.overall_condition as keyof typeof statusColors]}`}>
                        {record.overall_condition}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`capitalize ${recommendationColors[record.recommendation as keyof typeof recommendationColors]}`}>
                        {record.recommendation.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm capitalize text-text-secondary">{record.priority}</td>
                    <td className="px-4 py-3 text-sm text-text-tertiary">{new Date(record.verified_at).toLocaleDateString('id-ID')}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        {record.photos?.length > 0 && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-color-info/10 rounded text-color-info text-xs">
                            <Camera size={12} />
                            {record.photos.length}
                          </div>
                        )}
                        {record.synced_to_server ? (
                          <div className="flex items-center gap-1 px-2 py-1 bg-color-success/10 rounded text-color-success text-xs">
                            <CheckCircle2 size={12} />
                            Synced
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 px-2 py-1 bg-color-warning/10 rounded text-color-warning text-xs">
                            <AlertTriangle size={12} />
                            Pending
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-text-tertiary">
                    Tidak ada data verifikasi yang cocok
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
