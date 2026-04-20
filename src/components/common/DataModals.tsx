// CRUD Modal Components
'use client';

import React, { useState } from 'react';
import { X, Plus, Trash2, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface DataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  record?: any;
  fields: Array<{ name: string; label: string; type: string }>;
}

export function DataAddModal({ isOpen, onClose, onSubmit, fields }: DataModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({});
    onClose();
    toast.success('Data berhasil ditambahkan!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="glass-card w-full max-w-2xl">
        <div className="flex justify-between items-center p-6 border-b border-glass-border">
          <h2 className="text-xl font-bold text-text-primary">Tambah Data Baru</h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {fields.map(field => (
            <div key={field.name}>
              <label className="text-sm font-semibold text-text-secondary block mb-2">{field.label}</label>
              <input
                type={field.type}
                placeholder={field.label}
                value={formData[field.name] || ''}
                onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                className="w-full px-3 py-2 bg-rgba(13,17,23,0.8) border border-glass-border rounded text-text-primary focus:border-color-info transition-colors"
              />
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-rgba(255,255,255,0.05) border border-glass-border rounded text-text-primary hover:bg-rgba(255,255,255,0.1)">
              Batal
            </button>
            <button type="submit" className="px-4 py-2 bg-color-info text-white rounded hover:bg-color-info/80">
              Tambah
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function DataEditModal({ isOpen, onClose, onSubmit, record, fields }: DataModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>(record || {});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
    toast.success('Data berhasil diupdate!');
  };

  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="glass-card w-full max-w-2xl">
        <div className="flex justify-between items-center p-6 border-b border-glass-border">
          <h2 className="text-xl font-bold text-text-primary">Edit Data</h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {fields.map(field => (
            <div key={field.name}>
              <label className="text-sm font-semibold text-text-secondary block mb-2">{field.label}</label>
              <input
                type={field.type}
                value={formData[field.name] || ''}
                onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                className="w-full px-3 py-2 bg-rgba(13,17,23,0.8) border border-glass-border rounded text-text-primary focus:border-color-info transition-colors"
              />
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-rgba(255,255,255,0.05) border border-glass-border rounded text-text-primary hover:bg-rgba(255,255,255,0.1)">
              Batal
            </button>
            <button type="submit" className="px-4 py-2 bg-color-info text-white rounded hover:bg-color-info/80">
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ConfirmDeleteModal({ isOpen, onClose, onConfirm, itemName }: { isOpen: boolean; onClose: () => void; onConfirm: () => void; itemName: string }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="glass-card w-full max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-bold text-text-primary mb-2">Hapus Data?</h2>
          <p className="text-text-secondary mb-6">Anda yakin ingin menghapus <span className="font-semibold">{itemName}</span>? Tindakan ini tidak dapat dibatalkan.</p>
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 bg-rgba(255,255,255,0.05) border border-glass-border rounded text-text-primary hover:bg-rgba(255,255,255,0.1)">
              Batal
            </button>
            <button onClick={() => { onConfirm(); onClose(); toast.success('Data berhasil dihapus!'); }} className="px-4 py-2 bg-color-critical text-white rounded hover:bg-color-critical/80">
              Hapus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
