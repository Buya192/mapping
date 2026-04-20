'use client';

import React, { useState } from 'react';
import { X, MapPin, Phone, CheckCircle2, AlertCircle, Clock, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

interface VerificationPanelProps {
  asset: {
    id: string;
    name: string;
    type: 'tiang' | 'gardu' | 'proteksi';
    lat: number;
    lng: number;
    status: 'verified' | 'pending' | 'error';
    details?: Record<string, any>;
  };
  onClose: () => void;
  onVerify: (assetId: string, status: 'verified' | 'error', notes?: string) => void;
}

export function VerificationPanel({ asset, onClose, onVerify }: VerificationPanelProps) {
  const [verifyNotes, setVerifyNotes] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleVerify = async (status: 'verified' | 'error') => {
    setIsVerifying(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    onVerify(asset.id, status, verifyNotes);
    setIsVerifying(false);
    setVerifyNotes('');
    setPhotoPreview(null);
    
    toast.success(
      status === 'verified' 
        ? `${asset.name} berhasil diverifikasi` 
        : `${asset.name} ditandai ada masalah`
    );
  };

  const statusColor = asset.status === 'verified' 
    ? '#22c55e' 
    : asset.status === 'error' 
    ? '#ef4444' 
    : '#f59e0b';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-end">
      <div className="bg-[#0a0e1a] border border-[#1c1c1e] rounded-t-2xl md:rounded-2xl w-full md:w-96 md:mr-4 md:mb-4 shadow-xl max-h-[90vh] md:max-h-none overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#0a0e1a] border-b border-[#1c1c1e] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${statusColor}20`, borderColor: statusColor, borderWidth: 2 }}>
              {asset.status === 'verified' && <CheckCircle2 size={16} style={{ color: statusColor }} />}
              {asset.status === 'error' && <AlertCircle size={16} style={{ color: statusColor }} />}
              {asset.status === 'pending' && <Clock size={16} style={{ color: statusColor }} />}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-white truncate">{asset.name}</h3>
              <p className="text-[10px] text-[#52525b] uppercase tracking-wider">{asset.type} • {asset.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#52525b] hover:text-white p-1 flex-shrink-0">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Asset Info */}
          <div className="space-y-3 p-3 bg-[#0f0f11] rounded-lg border border-[#18181b]">
            <div className="text-xs font-bold text-[#71717a] uppercase tracking-widest mb-3">Informasi Aset</div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-[#52525b] flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-[#52525b]">Koordinat GPS</div>
                  <div className="text-xs font-mono text-white">{asset.lat.toFixed(5)}, {asset.lng.toFixed(5)}</div>
                </div>
              </div>

              {asset.details && Object.entries(asset.details).map(([key, value]) => (
                <div key={key} className="flex justify-between text-xs">
                  <span className="text-[#52525b] capitalize">{key}:</span>
                  <span className="text-white font-mono">{String(value)}</span>
                </div>
              ))}
            </div>

            <div className="text-[10px] text-[#3f3f46] mt-3 p-2 bg-[#18181b] rounded border border-[#27272a]">
              ✓ Terakhir diperbarui: {new Date().toLocaleString('id-ID')}
            </div>
          </div>

          {/* Photo Preview */}
          {photoPreview && (
            <div className="relative">
              <img 
                src={photoPreview} 
                alt="Verification photo" 
                className="w-full h-40 object-cover rounded-lg border border-[#1c1c1e]"
              />
              <button
                onClick={() => setPhotoPreview(null)}
                className="absolute top-2 right-2 p-1 bg-black/70 hover:bg-black rounded-full"
              >
                <X size={14} className="text-white" />
              </button>
            </div>
          )}

          {/* Photo Capture */}
          <label className="block">
            <div className="text-xs font-bold text-[#71717a] uppercase tracking-widest mb-2">Ambil Foto</div>
            <div className="border-2 border-dashed border-[#27272a] rounded-lg p-4 hover:border-[#3f3f46] transition-colors cursor-pointer text-center">
              <Camera size={20} className="mx-auto text-[#52525b] mb-2" />
              <span className="text-[10px] text-[#52525b]">Klik untuk ambil foto</span>
            </div>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoCapture}
              className="hidden"
            />
          </label>

          {/* Verification Notes */}
          <div>
            <div className="text-xs font-bold text-[#71717a] uppercase tracking-widest mb-2">Catatan Verifikasi</div>
            <textarea
              value={verifyNotes}
              onChange={(e) => setVerifyNotes(e.target.value)}
              placeholder="Tambahkan catatan jika ada koreksi atau masalah..."
              className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white placeholder-[#3f3f46] focus:outline-none focus:border-[#34d399] resize-none"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2 border-t border-[#18181b]">
            <button
              onClick={() => handleVerify('verified')}
              disabled={isVerifying}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#22c55e] hover:bg-[#16a34a] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-sm"
            >
              <CheckCircle2 size={16} />
              {isVerifying ? 'Memproses...' : 'Verifikasi Okeh'}
            </button>
            <button
              onClick={() => handleVerify('error')}
              disabled={isVerifying}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#ef4444] hover:bg-[#dc2626] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-sm"
            >
              <AlertCircle size={16} />
              {isVerifying ? 'Memproses...' : 'Ada Masalah'}
            </button>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-[#18181b] hover:bg-[#27272a] text-[#a1a1aa] font-semibold rounded-lg transition-colors text-sm border border-[#27272a]"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
