'use client';

import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { DataReconciliation } from './DataReconciliation';
import { LineConnectivity } from './LineConnectivity';
import toast from 'react-hot-toast';

interface VerificationFormProps {
  asset: any;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export function VerificationForm({ asset, onClose, onSubmit }: VerificationFormProps) {
  const [fieldData, setFieldData] = useState({
    name: asset?.name || '',
    type: asset?.type || '',
    penyulang: asset?.penyulang || '',
    capacity: asset?.capacity || '',
    voltage: asset?.voltage || '',
    material: asset?.material || '',
    status: asset?.status || '',
  });

  const [additionalData, setAdditionalData] = useState({
    gps_lat: asset?.lat || '',
    gps_lng: asset?.lng || '',
    verifier_notes: '',
    found_at_location: true,
    data_matches: true,
  });

  const [expandedSections, setExpandedSections] = useState({
    reconciliation: true,
    connectivity: true,
    additional: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleFieldUpdate = (field: string, value: any) => {
    setFieldData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!additionalData.found_at_location) {
      toast.error('Aset tidak ditemukan di lapangan. Silakan perbaiki data atau tambah sebagai aset baru.');
      return;
    }

    onSubmit({
      asset_id: asset?.id,
      asset_type: asset?.type,
      penyulang: asset?.penyulang,
      gps_coordinates: {
        lat: additionalData.gps_lat,
        lng: additionalData.gps_lng,
      },
      field_data: fieldData,
      data_reconciliation: {
        matches: additionalData.data_matches,
        differences: identifyDifferences(),
      },
      verifier_notes: additionalData.verifier_notes,
      verified_at: new Date().toISOString(),
      verification_status: additionalData.data_matches ? 'verified' : 'needs_correction',
    });

    toast.success('Verifikasi berhasil disimpan!');
    onClose();
  };

  const identifyDifferences = () => {
    const differences: any[] = [];
    const databaseData = asset;

    Object.entries(fieldData).forEach(([key, value]) => {
      const dbValue = databaseData?.[key];
      if (dbValue && dbValue !== value) {
        differences.push({
          field: key,
          database: dbValue,
          field_observation: value,
        });
      }
    });

    return differences;
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="glass-card w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-rgba(28,33,40,0.9) backdrop-blur-md border-b border-glass-border p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Data Reconciliation Verification</h2>
            <p className="text-xs text-text-tertiary mt-1">Match data lapangan dengan database untuk memastikan akurasi aset</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-rgba(255,255,255,0.1) rounded">
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        {/* Asset Summary */}
        <div className="p-4 border-b border-glass-border bg-rgba(99,102,241,0.05)">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-text-tertiary uppercase tracking-wide">Asset ID</div>
              <div className="font-mono text-sm text-text-primary mt-1">{asset?.id}</div>
            </div>
            <div>
              <div className="text-xs text-text-tertiary uppercase tracking-wide">Tipe Aset</div>
              <div className="font-semibold text-sm text-text-primary mt-1 capitalize">{asset?.type}</div>
            </div>
            <div>
              <div className="text-xs text-text-tertiary uppercase tracking-wide">Penyulang</div>
              <div className="font-semibold text-sm text-text-primary mt-1">{asset?.penyulang}</div>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Data Reconciliation Section */}
          <div className="border border-glass-border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('reconciliation')}
              className="w-full px-4 py-3 bg-rgba(99,102,241,0.08) hover:bg-rgba(99,102,241,0.12) flex items-center justify-between font-semibold text-text-primary border-b border-glass-border transition-colors"
            >
              <span className="flex items-center gap-2">
                {expandedSections.reconciliation ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                1. Verifikasi Data
              </span>
            </button>
            {expandedSections.reconciliation && (
              <div className="p-4">
                <DataReconciliation
                  databaseData={asset}
                  fieldData={fieldData}
                  onUpdate={handleFieldUpdate}
                />
              </div>
            )}
          </div>

          {/* Line Connectivity Section */}
          <div className="border border-glass-border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('connectivity')}
              className="w-full px-4 py-3 bg-rgba(63,185,80,0.08) hover:bg-rgba(63,185,80,0.12) flex items-center justify-between font-semibold text-text-primary border-b border-glass-border transition-colors"
            >
              <span className="flex items-center gap-2">
                {expandedSections.connectivity ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                2. Konektivitas Jaringan
              </span>
            </button>
            {expandedSections.connectivity && (
              <div className="p-4">
                <LineConnectivity
                  asset={asset}
                  penyulang={fieldData.penyulang}
                  connectedTo={asset?.connected_to}
                />
              </div>
            )}
          </div>

          {/* Additional Data Section */}
          <div className="border border-glass-border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('additional')}
              className="w-full px-4 py-3 bg-rgba(210,153,34,0.08) hover:bg-rgba(210,153,34,0.12) flex items-center justify-between font-semibold text-text-primary border-b border-glass-border transition-colors"
            >
              <span className="flex items-center gap-2">
                {expandedSections.additional ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                3. Data Lapangan & Catatan
              </span>
            </button>
            {expandedSections.additional && (
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-text-tertiary uppercase tracking-wide block mb-2">Latitude</label>
                    <input
                      type="number"
                      step="0.00001"
                      value={additionalData.gps_lat}
                      onChange={(e) => setAdditionalData(prev => ({ ...prev, gps_lat: e.target.value }))}
                      className="w-full px-3 py-2 bg-rgba(13,17,23,0.8) border border-glass-border rounded text-text-primary text-sm focus:border-color-info focus:outline-none"
                      placeholder="-8.2247"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-tertiary uppercase tracking-wide block mb-2">Longitude</label>
                    <input
                      type="number"
                      step="0.00001"
                      value={additionalData.gps_lng}
                      onChange={(e) => setAdditionalData(prev => ({ ...prev, gps_lng: e.target.value }))}
                      className="w-full px-3 py-2 bg-rgba(13,17,23,0.8) border border-glass-border rounded text-text-primary text-sm focus:border-color-info focus:outline-none"
                      placeholder="124.1935"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-text-tertiary uppercase tracking-wide block mb-2">Catatan Verifikasi</label>
                  <textarea
                    value={additionalData.verifier_notes}
                    onChange={(e) => setAdditionalData(prev => ({ ...prev, verifier_notes: e.target.value }))}
                    placeholder="Catat perbedaan yang ditemukan, kondisi lapangan, atau informasi penting lainnya..."
                    className="w-full h-24 px-3 py-2 bg-rgba(13,17,23,0.8) border border-glass-border rounded text-text-primary text-sm focus:border-color-info focus:outline-none resize-none"
                  />
                </div>

                <div className="flex items-center gap-3 p-3 bg-rgba(99,102,241,0.05) border border-color-info/20 rounded">
                  <input
                    type="checkbox"
                    id="found_at_location"
                    checked={additionalData.found_at_location}
                    onChange={(e) => setAdditionalData(prev => ({ ...prev, found_at_location: e.target.checked }))}
                    className="w-4 h-4 accent-color-info"
                  />
                  <label htmlFor="found_at_location" className="text-sm text-text-primary cursor-pointer">
                    ✓ Aset ditemukan di lapangan sesuai koordinat database
                  </label>
                </div>

                <div className="flex items-center gap-3 p-3 bg-rgba(63,185,80,0.05) border border-color-success/20 rounded">
                  <input
                    type="checkbox"
                    id="data_matches"
                    checked={additionalData.data_matches}
                    onChange={(e) => setAdditionalData(prev => ({ ...prev, data_matches: e.target.checked }))}
                    className="w-4 h-4 accent-color-success"
                  />
                  <label htmlFor="data_matches" className="text-sm text-text-primary cursor-pointer">
                    ✓ Data lapangan cocok dengan database
                  </label>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 bg-rgba(28,33,40,0.9) backdrop-blur-md border-t border-glass-border p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-rgba(255,255,255,0.05) hover:bg-rgba(255,255,255,0.1) border border-glass-border rounded font-semibold text-text-primary transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-color-info hover:bg-color-info/80 text-white rounded font-semibold transition-colors"
          >
            Simpan Verifikasi
          </button>
        </div>
      </div>
    </div>
  );
}
            {/* Photo Capture */}
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
                <Camera size={16} className="text-color-info" />
                Foto Geotagged ({photos.length} uploaded)
              </label>
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoCapture}
                  className="hidden"
                  id="photo-input"
                />
                <label
                  htmlFor="photo-input"
                  className="flex items-center gap-2 px-4 py-2 bg-color-info/20 border border-color-info rounded cursor-pointer hover:bg-color-info/30 transition-colors text-color-info font-medium text-sm"
                >
                  <Camera size={16} />
                  Ambil/Pilih Foto
                </label>
              </div>
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {photos.map((photo, idx) => (
                    <div key={idx} className="relative group">
                      <img src={photo.preview} alt={`Photo ${idx}`} className="w-full h-24 object-cover rounded border border-glass-border" />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute top-1 right-1 bg-color-critical/80 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recommendation */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-2">Rekomendasi Tindakan</label>
                <select
                  value={formData.recommendation}
                  onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700/30 border border-glass-border rounded text-text-primary focus:border-color-info"
                >
                  <option value="no_action">Tidak Ada Tindakan</option>
                  <option value="maintenance">Perawatan</option>
                  <option value="replacement">Penggantian</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-2">Prioritas</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700/30 border border-glass-border rounded text-text-primary focus:border-color-info"
                >
                  <option value="low">Rendah</option>
                  <option value="medium">Sedang</option>
                  <option value="high">Tinggi</option>
                  <option value="critical">Kritis</option>
                </select>
              </div>
            </div>

            {/* Notes for Team */}
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">Catatan untuk Tim Teknis</label>
              <textarea
                placeholder="Catatan tambahan, instruksi, atau informasi penting untuk tim..."
                value={formData.notes_for_team}
                onChange={(e) => setFormData({ ...formData, notes_for_team: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700/30 border border-glass-border rounded text-text-primary focus:border-color-info transition-colors h-20 resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-glass-border">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-700/30 border border-glass-border rounded text-text-primary hover:bg-gray-700/50 transition-colors font-medium"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-color-info hover:bg-color-info/80 disabled:opacity-50 text-white rounded font-medium transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={16} />
                {loading ? 'Menyimpan...' : 'Simpan Verifikasi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
