'use client';

import { useState, useCallback } from 'react';
import VerificationMap from '@/components/map/VerificationMap';
import { VerificationForm } from '@/components/verification/VerificationForm';
import { AddAssetModal } from '@/components/verification/AddAssetModal';
import { VerificationHistory } from '@/components/verification/VerificationHistory';
import { Plus, MapPin, History } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VerifikasiPage() {
  const [activeTab, setActiveTab] = useState<'map' | 'history'>('map');
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [mapClickCoords, setMapClickCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [verificationRecords, setVerificationRecords] = useState<any[]>([]);
  const [allAssets, setAllAssets] = useState<any[]>([]);

  const handleMapClick = useCallback((coords: { lat: number; lng: number }) => {
    setMapClickCoords(coords);
    setShowAddModal(true);
  }, []);

  const handleSelectAsset = useCallback((asset: any) => {
    setSelectedAsset(asset);
  }, []);

  const handleAddAsset = useCallback((asset: any) => {
    setAllAssets((prev) => [...prev, asset]);
    toast.success('Aset baru ditambahkan ke peta');
  }, []);

  const handleVerificationSubmit = useCallback((data: any) => {
    const record = {
      id: `VER_${Date.now()}`,
      ...data,
      synced_to_server: false,
    };
    setVerificationRecords((prev) => [...prev, record]);
    setSelectedAsset(null);
    toast.success('Verifikasi berhasil disimpan!');
  }, []);

  const handleExportHistory = useCallback(() => {
    const csv = [
      ['Asset ID', 'Tipe', 'Kondisi', 'Rekomendasi', 'Prioritas', 'Tanggal', 'Masalah'].join(','),
      ...verificationRecords.map((r) =>
        [r.asset_id, r.asset_type, r.overall_condition, r.recommendation, r.priority, new Date(r.verified_at).toLocaleDateString('id-ID'), r.issues_found].join(','),
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verifikasi_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [verificationRecords]);

  return (
    <div className="main-content max-w-7xl mx-auto">
      {/* Header */}
      <div className="dashboard-hero mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="mb-2">Verifikasi Lapangan</h1>
            <p>Verifikasi aset jaringan, tambah data baru, dan pantau status lapangan secara real-time</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            Tambah Aset
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-glass-border">
        <button
          onClick={() => setActiveTab('map')}
          className={`px-4 py-3 font-semibold transition-colors border-b-2 ${
            activeTab === 'map'
              ? 'text-color-info border-color-info'
              : 'text-text-secondary border-transparent hover:text-text-primary'
          }`}
        >
          <div className="flex items-center gap-2">
            <MapPin size={16} />
            Peta Verifikasi
          </div>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-3 font-semibold transition-colors border-b-2 ${
            activeTab === 'history'
              ? 'text-color-info border-color-info'
              : 'text-text-secondary border-transparent hover:text-text-primary'
          }`}
        >
          <div className="flex items-center gap-2">
            <History size={16} />
            Riwayat Verifikasi ({verificationRecords.length})
          </div>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'map' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map - 2/3 width */}
          <div className="lg:col-span-2 glass-card h-[600px] overflow-hidden">
            <VerificationMap
              onAssetSelect={handleSelectAsset}
              onMapClick={handleMapClick}
              verifiedAssets={verificationRecords}
              assets={allAssets}
            />
          </div>

          {/* Info Panel - 1/3 width */}
          <div className="glass-card">
            <div className="glass-card-header mb-4">
              <MapPin size={14} />
              Informasi Aset
            </div>
            {selectedAsset ? (
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-text-tertiary uppercase tracking-wide">Nama Aset</div>
                  <div className="text-lg font-semibold text-text-primary mt-1">{selectedAsset.name}</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-text-tertiary uppercase tracking-wide">Tipe</div>
                    <div className="text-sm font-semibold text-text-primary mt-1 capitalize">{selectedAsset.type}</div>
                  </div>
                  <div>
                    <div className="text-xs text-text-tertiary uppercase tracking-wide">Penyulang</div>
                    <div className="text-sm font-semibold text-text-primary mt-1">{selectedAsset.penyulang}</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-text-tertiary uppercase tracking-wide">Koordinat</div>
                  <div className="text-xs font-mono text-text-secondary mt-1">
                    {selectedAsset.lat}, {selectedAsset.lng}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-text-tertiary uppercase tracking-wide">Status</div>
                  <div className="text-sm font-semibold text-text-primary mt-1 capitalize">
                    {selectedAsset.status || 'Belum diverifikasi'}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="w-full px-4 py-2 bg-color-info text-white rounded font-semibold hover:bg-color-info/80 transition-colors"
                >
                  Verifikasi Aset
                </button>
              </div>
            ) : (
              <div className="text-center py-8 text-text-tertiary">
                <MapPin size={32} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">Pilih aset di peta untuk memulai verifikasi</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <VerificationHistory records={verificationRecords} onExport={handleExportHistory} />
      )}

      {/* Modals */}
      {selectedAsset && (
        <VerificationForm
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          onSubmit={handleVerificationSubmit}
        />
      )}

      {showAddModal && (
        <AddAssetModal
          onClose={() => {
            setShowAddModal(false);
            setMapClickCoords(null);
          }}
          onAdd={handleAddAsset}
          mapCoords={mapClickCoords || undefined}
        />
      )}
    </div>
  );
}

