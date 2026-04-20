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
  const [expandedSections, setExpandedSections] = useState({
    reconciliation: true,
    connectivity: true,
    additional: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      asset_id: asset?.id,
      asset_type: asset?.type,
      verified_at: new Date().toISOString(),
      verification_status: 'verified',
    });
    toast.success('Verifikasi berhasil disimpan!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="glass-card w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-rgba(28,33,40,0.9) backdrop-blur-md border-b border-glass-border p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Data Reconciliation Verification</h2>
            <p className="text-xs text-text-tertiary mt-1">Verifikasi data lapangan dengan database</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-rgba(255,255,255,0.1) rounded">
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

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

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
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
                  fieldData={asset}
                  onUpdate={() => {}}
                />
              </div>
            )}
          </div>

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
                  penyulang={asset?.penyulang}
                  connectedTo={asset?.connected_to}
                />
              </div>
            )}
          </div>

          <div className="border border-glass-border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('additional')}
              className="w-full px-4 py-3 bg-rgba(210,153,34,0.08) hover:bg-rgba(210,153,34,0.12) flex items-center justify-between font-semibold text-text-primary border-b border-glass-border transition-colors"
            >
              <span className="flex items-center gap-2">
                {expandedSections.additional ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                3. Catatan Verifikasi
              </span>
            </button>
            {expandedSections.additional && (
              <div className="p-4 space-y-4">
                <textarea
                  placeholder="Catatan verifikasi lapangan..."
                  className="w-full h-24 px-3 py-2 bg-rgba(13,17,23,0.8) border border-glass-border rounded text-text-primary text-sm focus:border-color-info focus:outline-none resize-none"
                />
              </div>
            )}
          </div>
        </form>

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
