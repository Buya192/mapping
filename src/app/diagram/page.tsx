'use client';

import React, { useState, useRef, useMemo } from 'react';
import { useAssetStore } from '@/store/assetStore';

// ===== SLD SYMBOL CONSTANTS =====
const SLD = {
  nodeW: 60, nodeH: 40, gap: 100, startX: 80, startY: 60,
  colors: {
    source: '#dc2626', busbar: '#1e40af', breaker: '#f59e0b',
    trafo: '#16a34a', line: '#334155', text: '#0f172a', bg: '#ffffff',
  },
};

function SLDSvg({ penyulangName, gardus, tiangJTM }: { penyulangName: string; gardus: any[]; tiangJTM: any[] }) {
  const filteredGardu = gardus.filter(g => (g.penyulang || '').toUpperCase() === penyulangName.toUpperCase());
  const filteredTiang = tiangJTM.filter(t => (t.penyulang || '').toUpperCase() === penyulangName.toUpperCase());

  // Build SLD elements
  const elements: { type: string; label: string; sublabel?: string; x: number; y: number }[] = [];
  let x = SLD.startX;
  const y = SLD.startY;
  const rowH = SLD.gap;

  // Source (GI / Sumber)
  elements.push({ type: 'source', label: 'GI', sublabel: 'Sumber Daya', x, y });

  // Busbar
  x += SLD.gap + 30;
  elements.push({ type: 'busbar', label: 'Busbar 20kV', x, y });

  // Penyulang breaker
  x += SLD.gap + 30;
  elements.push({ type: 'breaker', label: `PMS ${penyulangName}`, sublabel: 'Pemutus', x, y });

  // Recloser
  x += SLD.gap + 20;
  elements.push({ type: 'recloser', label: 'Recloser', x, y });

  // Main line
  x += SLD.gap + 20;
  elements.push({ type: 'line_segment', label: `JTM ${penyulangName}`, sublabel: `${filteredTiang.length} tiang`, x, y });

  // Trafo branches
  const trafoY = y + rowH;
  const trafoStartX = SLD.startX + SLD.gap * 2 + 40;
  filteredGardu.forEach((g, i) => {
    const tx = trafoStartX + i * (SLD.gap + 30);
    const kva = g.kapasitas_kva || (g.kapasitas_mva ? g.kapasitas_mva * 1000 : '?');
    elements.push({ type: 'trafo', label: g.nama || 'Trafo', sublabel: `${kva} kVA`, x: tx, y: trafoY });
  });

  // If no gardu, show placeholder
  if (filteredGardu.length === 0) {
    elements.push({ type: 'trafo', label: 'Trafo (kosong)', sublabel: 'Belum ada data', x: trafoStartX, y: trafoY });
  }

  const svgW = Math.max(800, x + SLD.gap + 100);
  const svgH = trafoY + SLD.gap + 60;

  return (
    <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
      {/* Title */}
      <text x={svgW / 2} y={24} textAnchor="middle" fontSize={16} fontWeight={700} fill={SLD.colors.text}>
        Single Line Diagram — Penyulang {penyulangName}
      </text>

      {/* Connection lines between sequential elements on main row */}
      {elements.filter(e => e.y === y).map((el, i, arr) => {
        if (i === 0) return null;
        const prev = arr[i - 1];
        return <line key={`line-${i}`} x1={prev.x + 30} y1={prev.y + 20} x2={el.x - 30} y2={el.y + 20} stroke={SLD.colors.line} strokeWidth={2.5} />;
      })}

      {/* Trafo branch lines */}
      {elements.filter(e => e.type === 'trafo').map((el, i) => (
        <g key={`branch-${i}`}>
          <line x1={el.x} y1={y + 40} x2={el.x} y2={el.y - 10} stroke={SLD.colors.line} strokeWidth={2} strokeDasharray="6 3" />
          {/* FCO symbol (fuse) */}
          <rect x={el.x - 5} y={el.y - 20} width={10} height={14} fill="none" stroke="#f59e0b" strokeWidth={1.5} rx={2} />
          <line x1={el.x - 4} y1={el.y - 18} x2={el.x + 4} y2={el.y - 9} stroke="#f59e0b" strokeWidth={1.5} />
        </g>
      ))}

      {/* Draw elements */}
      {elements.map((el, i) => {
        switch (el.type) {
          case 'source':
            return (
              <g key={i}>
                <circle cx={el.x} cy={el.y + 20} r={22} fill="none" stroke={SLD.colors.source} strokeWidth={2.5} />
                <text x={el.x} y={el.y + 16} textAnchor="middle" fontSize={10} fontWeight={700} fill={SLD.colors.source}>~</text>
                <text x={el.x} y={el.y + 27} textAnchor="middle" fontSize={8} fill={SLD.colors.source}>GI</text>
                <text x={el.x} y={el.y + 52} textAnchor="middle" fontSize={9} fill="#64748b">{el.sublabel}</text>
              </g>
            );
          case 'busbar':
            return (
              <g key={i}>
                <rect x={el.x - 40} y={el.y + 14} width={80} height={12} fill={SLD.colors.busbar} rx={2} />
                <text x={el.x} y={el.y + 8} textAnchor="middle" fontSize={9} fontWeight={600} fill={SLD.colors.busbar}>{el.label}</text>
              </g>
            );
          case 'breaker':
            return (
              <g key={i}>
                <rect x={el.x - 14} y={el.y + 8} width={28} height={24} fill="none" stroke={SLD.colors.breaker} strokeWidth={2.5} rx={3} />
                <line x1={el.x - 8} y1={el.y + 20} x2={el.x + 8} y2={el.y + 20} stroke={SLD.colors.breaker} strokeWidth={2.5} />
                <text x={el.x} y={el.y + 2} textAnchor="middle" fontSize={8} fontWeight={600} fill={SLD.colors.breaker}>{el.label}</text>
                <text x={el.x} y={el.y + 44} textAnchor="middle" fontSize={8} fill="#64748b">{el.sublabel}</text>
              </g>
            );
          case 'recloser':
            return (
              <g key={i}>
                <circle cx={el.x} cy={el.y + 20} r={12} fill="none" stroke="#f97316" strokeWidth={2} />
                <text x={el.x} y={el.y + 24} textAnchor="middle" fontSize={9} fontWeight={700} fill="#f97316">R</text>
                <text x={el.x} y={el.y + 42} textAnchor="middle" fontSize={8} fill="#64748b">{el.label}</text>
              </g>
            );
          case 'line_segment':
            return (
              <g key={i}>
                <line x1={el.x - 30} y1={el.y + 20} x2={el.x + 30} y2={el.y + 20} stroke={SLD.colors.busbar} strokeWidth={3} />
                <circle cx={el.x - 30} cy={el.y + 20} r={4} fill={SLD.colors.busbar} />
                <circle cx={el.x + 30} cy={el.y + 20} r={4} fill={SLD.colors.busbar} />
                <text x={el.x} y={el.y + 6} textAnchor="middle" fontSize={9} fontWeight={600} fill={SLD.colors.busbar}>{el.label}</text>
                <text x={el.x} y={el.y + 42} textAnchor="middle" fontSize={8} fill="#64748b">{el.sublabel}</text>
              </g>
            );
          case 'trafo':
            return (
              <g key={i}>
                <circle cx={el.x} cy={el.y + 6} r={14} fill="none" stroke={SLD.colors.trafo} strokeWidth={2} />
                <circle cx={el.x} cy={el.y + 26} r={14} fill="none" stroke={SLD.colors.trafo} strokeWidth={2} />
                <text x={el.x} y={el.y + 50} textAnchor="middle" fontSize={8} fontWeight={600} fill={SLD.colors.text}>{el.label}</text>
                <text x={el.x} y={el.y + 62} textAnchor="middle" fontSize={8} fill="#64748b">{el.sublabel}</text>
                {/* Load symbol */}
                <line x1={el.x} y1={el.y + 40} x2={el.x} y2={el.y + 68} stroke={SLD.colors.line} strokeWidth={1.5} />
                <polygon points={`${el.x - 8},${el.y + 68} ${el.x + 8},${el.y + 68} ${el.x},${el.y + 80}`} fill="none" stroke="#64748b" strokeWidth={1.5} />
              </g>
            );
          default:
            return null;
        }
      })}

      {/* Legend */}
      <g transform={`translate(${svgW - 180}, ${svgH - 90})`}>
        <rect x={0} y={0} width={160} height={80} fill="#f8fafc" stroke="#e2e8f0" rx={6} />
        <text x={10} y={16} fontSize={9} fontWeight={700} fill="#334155">Legenda:</text>
        <circle cx={18} cy={30} r={5} fill="none" stroke={SLD.colors.source} strokeWidth={1.5} /><text x={28} y={33} fontSize={8} fill="#64748b">Sumber / GI</text>
        <rect x={12} y={42} width={12} height={6} fill={SLD.colors.busbar} rx={1} /><text x={28} y={49} fontSize={8} fill="#64748b">Busbar / Jalur</text>
        <circle cx={18} cy={62} r={5} fill="none" stroke={SLD.colors.trafo} strokeWidth={1.5} /><text x={28} y={65} fontSize={8} fill="#64748b">Transformator</text>
      </g>
    </svg>
  );
}

export default function DiagramPage() {
  const { gardus, tiangJTM, jtmSegments } = useAssetStore();
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [selectedPenyulang, setSelectedPenyulang] = useState<string>('');

  // Get unique penyulang list
  const penyulangList = useMemo(() => {
    const set = new Set<string>();
    tiangJTM.forEach(t => { if (t.penyulang) set.add(t.penyulang.toUpperCase()); });
    gardus.forEach(g => { if (g.penyulang) set.add(g.penyulang.toUpperCase()); });
    jtmSegments.forEach(j => { if (j.penyulang) set.add(j.penyulang.toUpperCase()); });
    return Array.from(set).sort();
  }, [tiangJTM, gardus, jtmSegments]);

  // Auto-select first
  const activePenyulang = selectedPenyulang || penyulangList[0] || '';

  // Export SVG to PNG
  const handleExportPNG = () => {
    const svgEl = svgContainerRef.current?.querySelector('svg');
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx!.fillStyle = '#ffffff';
      ctx!.fillRect(0, 0, canvas.width, canvas.height);
      ctx!.drawImage(img, 0, 0, canvas.width, canvas.height);
      const link = document.createElement('a');
      link.download = `SLD_${activePenyulang}_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const handlePrint = () => {
    const svgEl = svgContainerRef.current?.querySelector('svg');
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>SLD ${activePenyulang}</title><style>body{margin:20px;font-family:sans-serif}@media print{body{margin:0}}</style></head><body>${svgData}</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9', marginBottom: 4 }}>⚡ Single-Line Diagram Generator</h1>
          <p style={{ color: '#94a3b8', fontSize: 14 }}>Gambar otomatis diagram satu garis berdasarkan data aset jaringan</p>
        </div>
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex', gap: 12, marginBottom: 24, padding: 16,
        background: 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.9))',
        border: '1px solid rgba(100,116,139,0.2)', borderRadius: 12, flexWrap: 'wrap', alignItems: 'center',
      }}>
        <div>
          <label style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Pilih Penyulang</label>
          <select
            value={activePenyulang}
            onChange={e => setSelectedPenyulang(e.target.value)}
            style={{ padding: '8px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9', fontSize: 14, minWidth: 200 }}
          >
            {penyulangList.length === 0 && <option value="">Tidak ada data penyulang</option>}
            {penyulangList.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          <button onClick={handleExportPNG} style={{ padding: '8px 18px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>📥 Export PNG</button>
          <button onClick={handlePrint} style={{ padding: '8px 18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>🖨️ Print</button>
        </div>
      </div>

      {/* Info */}
      {activePenyulang && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { l: 'Tiang JTM', v: tiangJTM.filter(t => (t.penyulang || '').toUpperCase() === activePenyulang).length, c: '#3b82f6' },
            { l: 'Trafo/Gardu', v: gardus.filter(g => (g.penyulang || '').toUpperCase() === activePenyulang).length, c: '#16a34a' },
            { l: 'Segmen JTM', v: jtmSegments.filter(j => (j.penyulang || '').toUpperCase() === activePenyulang).length, c: '#f59e0b' },
          ].map(s => (
            <div key={s.l} style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(100,116,139,0.2)', borderLeft: `3px solid ${s.c}`, borderRadius: 10, padding: '12px 18px' }}>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>{s.l}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9' }}>{s.v}</div>
            </div>
          ))}
        </div>
      )}

      {/* SVG Diagram */}
      <div ref={svgContainerRef} style={{
        background: '#fff', borderRadius: 16, padding: 20,
        border: '1px solid #e2e8f0', overflowX: 'auto',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      }}>
        {activePenyulang ? (
          <SLDSvg penyulangName={activePenyulang} gardus={gardus} tiangJTM={tiangJTM} />
        ) : (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚡</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>Pilih penyulang untuk generate diagram</div>
            <div style={{ fontSize: 13 }}>Upload data aset terlebih dahulu di halaman Data Aset</div>
          </div>
        )}
      </div>
    </div>
  );
}
