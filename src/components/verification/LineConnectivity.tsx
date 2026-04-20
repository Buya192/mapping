'use client';

import { ArrowRight, MapPin, Zap, Shield } from 'lucide-react';

interface LineConnectivityProps {
  asset: any;
  penyulang?: string;
  connectedTo?: string;
}

export function LineConnectivity({ asset, penyulang, connectedTo }: LineConnectivityProps) {
  const networkHierarchy = {
    'Pembangkit': {
      icon: '⚡',
      color: '#f59e0b',
      next: 'Substation',
    },
    'Substation': {
      icon: '🏢',
      color: '#3b82f6',
      next: 'Penyulang',
    },
    'Penyulang': {
      icon: '📡',
      color: '#ef4444',
      next: 'JTM Lines',
    },
    'JTM Lines': {
      icon: '⚡',
      color: '#ef4444',
      next: 'Tiang / Gardu',
    },
    'Tiang': {
      icon: '📍',
      color: '#94a3b8',
      next: 'Gardu Distribusi',
    },
    'Gardu Distribusi': {
      icon: '🏭',
      color: '#3b82f6',
      next: 'JTR Lines',
    },
    'JTR Lines': {
      icon: '🔌',
      color: '#64748b',
      next: 'Pelanggan',
    },
  };

  const determineAssetPosition = (assetType: string) => {
    const typeMap: Record<string, string> = {
      'tiang': 'Tiang',
      'trafo': 'Gardu Distribusi',
      'proteksi': 'Gardu Distribusi',
      'jtr': 'JTR Lines',
      'jtm': 'JTM Lines',
      'pembangkit': 'Pembangkit',
      'gardu': 'Gardu Distribusi',
    };
    return typeMap[assetType?.toLowerCase()] || assetType;
  };

  const assetPosition = determineAssetPosition(asset?.type);
  const positions = Object.keys(networkHierarchy);
  const currentIndex = positions.findIndex(p => p === assetPosition);

  return (
    <div className="glass-card space-y-4">
      <div className="glass-card-header">
        <Zap size={14} />
        Network Connectivity
      </div>

      {/* Network Hierarchy Path */}
      <div className="space-y-2">
        <div className="text-xs text-text-tertiary uppercase tracking-wide mb-3">Jalur Jaringan</div>
        <div className="space-y-1">
          {positions.map((pos, idx) => {
            const isActive = pos === assetPosition;
            const hierarchy = networkHierarchy[pos as keyof typeof networkHierarchy];
            const isPassed = idx < currentIndex;
            const isUpcoming = idx > currentIndex;

            return (
              <div key={pos}>
                <button
                  className={`w-full p-2 rounded text-left transition-colors flex items-center gap-2 ${
                    isActive
                      ? 'bg-color-info/15 border border-color-info text-color-info font-semibold'
                      : isPassed
                      ? 'bg-color-success/10 text-color-success'
                      : 'bg-rgba(110,118,129,0.05) text-text-secondary hover:bg-rgba(110,118,129,0.1)'
                  }`}
                >
                  <span className="text-base">{hierarchy.icon}</span>
                  <span className="text-xs font-mono flex-1">{pos}</span>
                  {isActive && <Shield size={12} />}
                </button>

                {idx < positions.length - 1 && (
                  <div className="flex justify-center py-1">
                    <ArrowRight size={12} className={`rotate-90 ${isPassed ? 'text-color-success' : isActive ? 'text-color-info' : 'text-text-tertiary opacity-30'}`} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Asset Location Info */}
      <div className="p-3 bg-rgba(99,102,241,0.05) border border-color-info/20 rounded">
        <div className="text-xs text-text-tertiary mb-2">Posisi Aset</div>
        <div className="font-mono text-sm text-text-primary mb-2">{asset?.name || 'Aset'}</div>
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <MapPin size={12} className="text-color-info flex-shrink-0" />
            <span className="text-text-secondary">Berada di: <strong>{assetPosition}</strong></span>
          </div>
          {penyulang && (
            <div className="flex items-center gap-2">
              <Zap size={12} className="text-color-warning flex-shrink-0" />
              <span className="text-text-secondary">Penyulang: <strong>{penyulang}</strong></span>
            </div>
          )}
          {connectedTo && (
            <div className="flex items-center gap-2">
              <ArrowRight size={12} className="text-text-tertiary flex-shrink-0" />
              <span className="text-text-secondary">Terhubung ke: <strong>{connectedTo}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Network Status */}
      <div className="space-y-2 pt-2 border-t border-glass-border">
        <div className="text-xs text-text-tertiary uppercase tracking-wide">Status Konektivitas</div>
        {!connectedTo ? (
          <div className="p-2 bg-color-critical/10 border border-color-critical/30 rounded text-xs text-color-critical flex items-start gap-2">
            <span>⚠️</span>
            <span>Data konektivitas belum ada. Silakan isi data penyulang dan aset yang terhubung.</span>
          </div>
        ) : (
          <div className="p-2 bg-color-success/10 border border-color-success/30 rounded text-xs text-color-success flex items-start gap-2">
            <span>✓</span>
            <span>Aset terdaftar dalam network hierarchy dengan jelas.</span>
          </div>
        )}
      </div>
    </div>
  );
}
