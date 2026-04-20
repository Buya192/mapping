'use client';
import React, { useState, useCallback } from 'react';
import { Camera, MapPin, AlertCircle, CheckCircle2, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface VerificationFormProps {
  asset: any;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export function VerificationForm({ asset, onClose, onSubmit }: VerificationFormProps) {
  const [formData, setFormData] = useState({
    asset_id: asset?.id || '',
    asset_type: asset?.type || '',
    penyulang: asset?.penyulang || '',
    gps_lat: asset?.lat || '',
    gps_lng: asset?.lng || '',
    overall_condition: 'good',
    technical_verified: {},
    issues_found: '',
    recommendation: 'no_action',
    priority: 'medium',
    notes_for_team: '',
    photos: [],
  });

  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const handlePhotoCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach((file) => {
        const preview = URL.createObjectURL(file);
        setPhotos((prev) => [...prev, { file, preview }]);
      });
    }
  }, []);

  const removePhoto = useCallback((index: number) => {
    setPhotos((prev) => {
      const newPhotos = [...prev];
      URL.revokeObjectURL(newPhotos[index].preview);
      newPhotos.splice(index, 1);
      return newPhotos;
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const verificationRecord = {
        ...formData,
        photos: photos.map((p) => ({
          timestamp: new Date().toISOString(),
          lat: formData.gps_lat,
          lng: formData.gps_lng,
        })),
        verified_at: new Date().toISOString(),
        synced_to_server: false,
      };

      onSubmit(verificationRecord);
      toast.success('Verifikasi berhasil disimpan!');
      onClose();
    } catch (error) {
      toast.error('Gagal menyimpan verifikasi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6 sticky top-0 bg-inherit p-6 border-b border-glass-border">
            <h2 className="text-xl font-bold text-text-primary">Verifikasi Aset: {asset?.name}</h2>
            <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Asset Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-2">Asset ID</label>
                <input
                  type="text"
                  value={formData.asset_id}
                  disabled
                  className="w-full px-3 py-2 bg-gray-700/20 border border-glass-border rounded text-text-tertiary"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-2">Penyulang</label>
                <input
                  type="text"
                  value={formData.penyulang}
                  disabled
                  className="w-full px-3 py-2 bg-gray-700/20 border border-glass-border rounded text-text-tertiary"
                />
              </div>
            </div>

            {/* GPS Location */}
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2 flex items-center gap-2">
                <MapPin size={16} className="text-color-info" />
                Lokasi GPS (Auto-detected)
              </label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Latitude"
                  value={formData.gps_lat}
                  onChange={(e) => setFormData({ ...formData, gps_lat: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700/30 border border-glass-border rounded text-text-primary focus:border-color-info transition-colors"
                  step="0.00001"
                />
                <input
                  type="number"
                  placeholder="Longitude"
                  value={formData.gps_lng}
                  onChange={(e) => setFormData({ ...formData, gps_lng: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700/30 border border-glass-border rounded text-text-primary focus:border-color-info transition-colors"
                  step="0.00001"
                />
              </div>
            </div>

            {/* Condition Assessment */}
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-3">Kondisi Aset</label>
              <div className="grid grid-cols-4 gap-2">
                {['excellent', 'good', 'fair', 'poor'].map((condition) => (
                  <button
                    key={condition}
                    type="button"
                    onClick={() => setFormData({ ...formData, overall_condition: condition })}
                    className={`py-2 px-3 rounded font-medium transition-all text-sm ${
                      formData.overall_condition === condition
                        ? condition === 'excellent'
                          ? 'bg-color-healthy/30 text-color-healthy border border-color-healthy'
                          : condition === 'good'
                          ? 'bg-color-info/30 text-color-info border border-color-info'
                          : condition === 'fair'
                          ? 'bg-color-warning/30 text-color-warning border border-color-warning'
                          : 'bg-color-critical/30 text-color-critical border border-color-critical'
                        : 'bg-gray-700/20 text-text-secondary border border-glass-border'
                    }`}
                  >
                    {condition.charAt(0).toUpperCase() + condition.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Issues Found */}
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2 flex items-center gap-2">
                <AlertCircle size={16} className="text-color-warning" />
                Kerusakan/Masalah yang Ditemukan
              </label>
              <textarea
                placeholder="Deskripsikan masalah atau kerusakan yang terlihat pada aset..."
                value={formData.issues_found}
                onChange={(e) => setFormData({ ...formData, issues_found: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700/30 border border-glass-border rounded text-text-primary focus:border-color-warning transition-colors h-24 resize-none"
              />
            </div>

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
