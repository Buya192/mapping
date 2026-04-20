'use client';
import React, { useState } from 'react';
import { MapPin, Plus, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface AddAssetModalProps {
  onClose: () => void;
  onAdd: (asset: any) => void;
  mapCoords?: { lat: number; lng: number };
}

export function AddAssetModal({ onClose, onAdd, mapCoords }: AddAssetModalProps) {
  const [method, setMethod] = useState<'map' | 'gps' | 'import' | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'tiang',
    penyulang: '',
    gps_lat: mapCoords?.lat || '',
    gps_lng: mapCoords?.lng || '',
  });

  const handleQuickAdd = async () => {
    if (!formData.name || !formData.penyulang) {
      toast.error('Nama dan Penyulang harus diisi');
      return;
    }

    const newAsset = {
      id: `NEW_${Date.now()}`,
      name: formData.name,
      type: formData.type,
      penyulang: formData.penyulang,
      lat: parseFloat(formData.gps_lat as string),
      lng: parseFloat(formData.gps_lng as string),
      status: 'pending_verification',
      created_at: new Date().toISOString(),
    };

    onAdd(newAsset);
    toast.success('Aset baru berhasil ditambahkan!');
    onClose();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

        const assets = lines.slice(1).map((line) => {
          const values = line.split(',');
          const asset: any = {};
          headers.forEach((header, idx) => {
            asset[header] = values[idx]?.trim();
          });
          return {
            id: `IMP_${Date.now()}_${Math.random()}`,
            ...asset,
            status: 'pending_verification',
            created_at: new Date().toISOString(),
          };
        });

        assets.forEach((asset) => {
          if (asset.name && asset.penyulang) {
            onAdd(asset);
          }
        });

        toast.success(`${assets.length} aset berhasil diimpor!`);
        onClose();
      } catch (error) {
        toast.error('Gagal mengimpor file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text-primary">Tambah Aset Baru</h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary">
            <X size={20} />
          </button>
        </div>

        {!method ? (
          <div className="space-y-3">
            <button
              onClick={() => setMethod('map')}
              className="w-full p-4 border border-glass-border rounded-lg hover:bg-glass-hover transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <MapPin className="text-color-info" />
                <div>
                  <div className="font-semibold text-text-primary">Klik di Peta</div>
                  <div className="text-xs text-text-tertiary">Cepat dan intuitif</div>
                </div>
              </div>
            </button>
            <button
              onClick={() => setMethod('gps')}
              className="w-full p-4 border border-glass-border rounded-lg hover:bg-glass-hover transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <Plus className="text-color-success" />
                <div>
                  <div className="font-semibold text-text-primary">GPS Form</div>
                  <div className="text-xs text-text-tertiary">Lokasi presisi & detail lengkap</div>
                </div>
              </div>
            </button>
            <button
              onClick={() => setMethod('import')}
              className="w-full p-4 border border-glass-border rounded-lg hover:bg-glass-hover transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <Upload className="text-color-warning" />
                <div>
                  <div className="font-semibold text-text-primary">Import CSV</div>
                  <div className="text-xs text-text-tertiary">Tambah banyak aset sekaligus</div>
                </div>
              </div>
            </button>
          </div>
        ) : method === 'map' ? (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">Klik pada peta untuk menentukan lokasi aset baru</p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nama Aset"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700/30 border border-glass-border rounded text-text-primary"
              />
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700/30 border border-glass-border rounded text-text-primary"
              >
                <option value="tiang">Tiang</option>
                <option value="trafo">Trafo</option>
                <option value="proteksi">Proteksi</option>
                <option value="jtm">JTM</option>
              </select>
              <input
                type="text"
                placeholder="Penyulang"
                value={formData.penyulang}
                onChange={(e) => setFormData({ ...formData, penyulang: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700/30 border border-glass-border rounded text-text-primary"
              />
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="px-2 py-1 bg-gray-700/20 rounded text-text-secondary">
                  Lat: {formData.gps_lat || 'Auto'}
                </div>
                <div className="px-2 py-1 bg-gray-700/20 rounded text-text-secondary">
                  Lng: {formData.gps_lng || 'Auto'}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setMethod(null)}
                className="flex-1 px-4 py-2 bg-gray-700/30 border border-glass-border rounded text-text-primary hover:bg-gray-700/50 transition-colors"
              >
                Kembali
              </button>
              <button
                onClick={handleQuickAdd}
                className="flex-1 px-4 py-2 bg-color-info text-white rounded hover:bg-color-info/80 transition-colors font-medium"
              >
                Tambahkan
              </button>
            </div>
          </div>
        ) : method === 'gps' ? (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">Gunakan GPS device untuk lokasi presisi</p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nama Aset"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700/30 border border-glass-border rounded text-text-primary"
              />
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700/30 border border-glass-border rounded text-text-primary"
              >
                <option value="tiang">Tiang</option>
                <option value="trafo">Trafo</option>
                <option value="proteksi">Proteksi</option>
                <option value="jtm">JTM</option>
              </select>
              <input
                type="text"
                placeholder="Penyulang"
                value={formData.penyulang}
                onChange={(e) => setFormData({ ...formData, penyulang: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700/30 border border-glass-border rounded text-text-primary"
              />
              <input
                type="number"
                placeholder="Latitude"
                value={formData.gps_lat}
                onChange={(e) => setFormData({ ...formData, gps_lat: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700/30 border border-glass-border rounded text-text-primary"
                step="0.00001"
              />
              <input
                type="number"
                placeholder="Longitude"
                value={formData.gps_lng}
                onChange={(e) => setFormData({ ...formData, gps_lng: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700/30 border border-glass-border rounded text-text-primary"
                step="0.00001"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setMethod(null)}
                className="flex-1 px-4 py-2 bg-gray-700/30 border border-glass-border rounded text-text-primary hover:bg-gray-700/50 transition-colors"
              >
                Kembali
              </button>
              <button
                onClick={handleQuickAdd}
                className="flex-1 px-4 py-2 bg-color-success text-white rounded hover:bg-color-success/80 transition-colors font-medium"
              >
                Tambahkan
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">Upload file CSV dengan kolom: name, type, penyulang, gps_lat, gps_lng</p>
            <input
              type="file"
              accept=".csv"
              onChange={handleImport}
              className="w-full px-3 py-2 bg-gray-700/30 border border-dashed border-glass-border rounded text-text-primary"
            />
            <button
              onClick={() => setMethod(null)}
              className="w-full px-4 py-2 bg-gray-700/30 border border-glass-border rounded text-text-primary hover:bg-gray-700/50 transition-colors"
            >
              Kembali
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
