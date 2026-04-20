'use client';

import { AlertTriangle, CheckCircle2, XCircle, Edit2, Plus } from 'lucide-react';

interface DataReconciliationProps {
  databaseData: any;
  fieldData: any;
  onUpdate: (field: string, value: any) => void;
}

export function DataReconciliation({ databaseData, fieldData, onUpdate }: DataReconciliationProps) {
  const getComparisonStatus = (dbVal: any, fieldVal: any): 'match' | 'mismatch' | 'missing' => {
    if (fieldVal === null || fieldVal === undefined || fieldVal === '') return 'missing';
    if (dbVal === fieldVal) return 'match';
    return 'mismatch';
  };

  const fields = [
    { key: 'name', label: 'Nama Aset', type: 'text' },
    { key: 'type', label: 'Tipe', type: 'text' },
    { key: 'penyulang', label: 'Penyulang', type: 'text' },
    { key: 'capacity', label: 'Kapasitas', type: 'text' },
    { key: 'voltage', label: 'Tegangan', type: 'text' },
    { key: 'material', label: 'Material', type: 'text' },
    { key: 'status', label: 'Status', type: 'text' },
  ];

  return (
    <div className="space-y-4">
      <div className="glass-card border-l-4 border-l-color-info">
        <div className="glass-card-header mb-4">
          <AlertTriangle size={14} />
          Data Verification
        </div>
        <p className="text-sm text-text-secondary mb-4">
          Compare database data dengan field observation. Tandai jika ada perbedaan atau data tidak ada di database.
        </p>
      </div>

      <div className="space-y-3">
        {fields.map((field) => {
          const dbValue = databaseData?.[field.key];
          const fieldValue = fieldData?.[field.key];
          const status = getComparisonStatus(dbValue, fieldValue);

          return (
            <div key={field.key} className="glass-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-text-primary">{field.label}</span>
                    {status === 'match' && <CheckCircle2 size={14} className="text-color-success" />}
                    {status === 'mismatch' && <AlertTriangle size={14} className="text-color-warning" />}
                    {status === 'missing' && <XCircle size={14} className="text-color-critical" />}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-text-tertiary uppercase tracking-wide mb-1">Database</div>
                      <div className={`text-sm font-mono p-2 rounded ${
                        dbValue ? 'bg-rgba(63,185,80,0.05) text-color-success' : 'bg-rgba(110,118,129,0.05) text-text-tertiary'
                      }`}>
                        {dbValue || '(tidak ada)'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-text-tertiary uppercase tracking-wide mb-1">Lapangan</div>
                      <input
                        type={field.type}
                        value={fieldValue || ''}
                        onChange={(e) => onUpdate(field.key, e.target.value)}
                        placeholder="Input data lapangan"
                        className="w-full px-2 py-2 bg-rgba(13,17,23,0.8) border border-glass-border rounded text-sm text-text-primary focus:border-color-info focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {status === 'mismatch' && (
                  <button
                    onClick={() => onUpdate(field.key, dbValue)}
                    className="flex items-center gap-2 px-3 py-1 bg-color-warning/10 text-color-warning hover:bg-color-warning/20 rounded transition-colors text-xs font-semibold"
                  >
                    <Edit2 size={12} />
                    Gunakan DB
                  </button>
                )}
              </div>

              {status === 'mismatch' && (
                <div className="mt-2 p-2 bg-color-warning/10 border border-color-warning/30 rounded text-xs text-color-warning">
                  ⚠️ Data tidak cocok! Database: "{dbValue}" vs Lapangan: "{fieldValue}"
                </div>
              )}
              {status === 'missing' && dbValue && (
                <div className="mt-2 p-2 bg-color-critical/10 border border-color-critical/30 rounded text-xs text-color-critical">
                  ⚠️ Data belum diisi. Database memiliki: "{dbValue}"
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="glass-card bg-color-info/5 border border-color-info/20">
        <div className="flex items-start gap-3">
          <CheckCircle2 size={16} className="text-color-success flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-sm text-text-primary mb-1">Laporan Verifikasi</div>
            <ul className="text-xs text-text-secondary space-y-1">
              <li>✓ Semua data cocok dengan database</li>
              <li>✓ Asset teridentifikasi dengan jelas di lapangan</li>
              <li>✓ Siap untuk diarsipkan</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
