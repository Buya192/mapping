'use client';
import React from 'react';
import { AlertTriangle, X, Zap, Users, Cable, MapPin } from 'lucide-react';
import type { FaultResult } from '@/lib/topology-engine';

interface FaultAnalysisPanelProps {
  result: FaultResult | null;
  isActive: boolean;
  onClear: () => void;
  onToggle: () => void;
}

export default function FaultAnalysisPanel({ result, isActive, onClear, onToggle }: FaultAnalysisPanelProps) {
  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        title="Mode Analisis Gangguan — Klik tiang/gardu untuk simulasi padamnya"
        style={{
          position: 'absolute', top: 12, right: 52, zIndex: 10,
          padding: '8px 14px',
          background: isActive ? '#dc2626' : 'rgba(15,23,42,0.85)',
          color: '#fff',
          border: isActive ? '2px solid #fca5a5' : '1px solid rgba(255,255,255,0.15)',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', gap: 6,
          cursor: 'pointer', fontSize: 12, fontWeight: 700,
          backdropFilter: 'blur(8px)',
          transition: 'all 0.2s',
          boxShadow: isActive ? '0 0 20px rgba(220,38,38,0.4)' : '0 2px 8px rgba(0,0,0,0.3)',
          fontFamily: 'monospace',
        }}
      >
        <AlertTriangle size={14} />
        {isActive ? '⚡ FAULT MODE AKTIF' : '⚡ Analisis Gangguan'}
      </button>

      {/* Result Panel */}
      {result && (
        <div style={{
          position: 'absolute', top: 56, right: 12, zIndex: 10,
          width: 320, background: 'rgba(15,10,10,0.95)',
          border: '1px solid #dc2626',
          borderRadius: 12, overflow: 'hidden',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 32px rgba(220,38,38,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
          fontFamily: 'monospace',
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #7f1d1d, #991b1b)',
            padding: '12px 16px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={18} color="#fca5a5" />
              <span style={{ color: '#fecaca', fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>
                SIMULASI GANGGUAN
              </span>
            </div>
            <button onClick={onClear} style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6,
              padding: 4, cursor: 'pointer', display: 'flex',
            }}>
              <X size={14} color="#fca5a5" />
            </button>
          </div>

          {/* Fault Location */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(220,38,38,0.2)' }}>
            <div style={{ color: '#71717a', fontSize: 9, letterSpacing: 2, marginBottom: 4 }}>LOKASI GANGGUAN</div>
            <div style={{ color: '#fca5a5', fontSize: 15, fontWeight: 700 }}>
              ⚡ {result.faultNodeName}
            </div>
            {result.faultPenyulang && (
              <div style={{
                marginTop: 6, display: 'inline-block',
                background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                padding: '2px 8px', borderRadius: 4,
                color: '#fca5a5', fontSize: 10, fontWeight: 600, letterSpacing: 1,
              }}>
                PENYULANG: {result.faultPenyulang}
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: 1, padding: '1px', background: 'rgba(220,38,38,0.1)',
          }}>
            <StatBox 
              icon={<MapPin size={16} color="#f87171" />}
              value={result.totalAffectedTiang}
              label="TIANG PADAM"
            />
            <StatBox
              icon={<Zap size={16} color="#fb923c" />}
              value={result.totalAffectedGardu}
              label="GARDU PADAM"
            />
            <StatBox
              icon={<Users size={16} color="#fbbf24" />}
              value={result.estimatedCustomersAffected}
              label="EST. PELANGGAN"
            />
            <StatBox
              icon={<Cable size={16} color="#a78bfa" />}
              value={`${result.totalAffectedCableKm.toFixed(1)} km`}
              label="KABEL TERDAMPAK"
            />
          </div>

          {/* Pulse animation */}
          <div style={{
            padding: '10px 16px', 
            background: 'rgba(220,38,38,0.05)',
            borderTop: '1px solid rgba(220,38,38,0.15)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              color: '#ef4444', fontSize: 10, fontWeight: 600,
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#ef4444',
                animation: 'faultPulse 1.5s infinite',
                boxShadow: '0 0 8px #ef4444',
              }} />
              AREA PADAM DITANDAI DI PETA
            </div>
            <div style={{ color: '#52525b', fontSize: 9, marginTop: 4 }}>
              Total node terdampak: {result.affectedNodeIds.size} | Klik Clear untuk reset
            </div>
          </div>

          <style>{`
            @keyframes faultPulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.4; transform: scale(1.3); }
            }
          `}</style>
        </div>
      )}
    </>
  );
}

function StatBox({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div style={{
      background: 'rgba(15,10,10,0.8)',
      padding: '12px 14px',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon}
        <span style={{ color: '#fafafa', fontSize: 20, fontWeight: 800 }}>{value}</span>
      </div>
      <span style={{ color: '#71717a', fontSize: 8, letterSpacing: 1.5, fontWeight: 600 }}>{label}</span>
    </div>
  );
}
