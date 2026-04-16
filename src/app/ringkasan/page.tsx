'use client';

import React, { useMemo } from 'react';
import { useAssetStore, TiangJTM } from '@/store/assetStore';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';

// Dark Engineering Palette
const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#f43f5e', '#64748b', '#059669', '#7c3aed'];
const PENYULANG_COLORS: Record<string, string> = {
  MALI: '#3b82f6', MORU: '#ef4444', BATUNIRWALA: '#10b981',
  BARANUSA: '#f59e0b', KABIR: '#8b5cf6', MARITAING: '#06b6d4', ILAWE: '#f43f5e',
};

function countBy(arr: any[], key: string): { name: string; value: number }[] {
  const map: Record<string, number> = {};
  arr.forEach(t => {
    const v = (t[key] || 'Tidak Diketahui').toString().trim();
    if (v) map[v] = (map[v] || 0) + 1;
  });
  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function StatCard({ title, value, subtitle, icon, color }: { title: string; value: string | number; subtitle?: string; icon: string; color: string }) {
  return (
    <div style={{
      background: '#1e293b', 
      border: '1px solid #334155',
      borderRadius: '6px', 
      padding: '20px 24px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: color, boxShadow: `0 0 10px ${color}` }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '8px' }}>
            {title}
          </div>
          <div style={{ fontSize: '32px', fontFamily: '"Space Mono", monospace, sans-serif', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.02em', lineHeight: 1 }}>
            {value}
          </div>
          {subtitle && <div style={{ fontSize: '11px', color: '#64748b', marginTop: '8px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subtitle}</div>}
        </div>
        <div style={{ fontSize: '24px', opacity: 0.8, color }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function BreakdownTable({ title, icon, data, colorKey }: { title: string; icon: string; data: { name: string; value: number }[]; colorKey?: Record<string, string> }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', background: '#0f172a', borderBottom: '1px solid #334155', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        <span>{icon}</span> {title}
      </div>
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead style={{ position: 'sticky', top: 0, background: '#1e293b', zIndex: 1 }}>
            <tr>
              <th style={{ textAlign: 'left', padding: '10px 16px', color: '#64748b', fontWeight: 600, borderBottom: '1px solid #334155' }}>PARAMETER</th>
              <th style={{ textAlign: 'right', padding: '10px 16px', color: '#64748b', fontWeight: 600, borderBottom: '1px solid #334155' }}>NILAI</th>
              <th style={{ textAlign: 'right', padding: '10px 16px', color: '#64748b', fontWeight: 600, borderBottom: '1px solid #334155', width: '120px' }}>RASIO</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => {
              const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0';
              const barColor = colorKey?.[d.name.toUpperCase()] || COLORS[i % COLORS.length];
              return (
                <tr key={d.name} style={{ borderBottom: '1px solid #334155', ':hover': { background: '#0f172a' } } as any}>
                  <td style={{ padding: '10px 16px', color: '#f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: barColor }} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }} title={d.name}>{d.name}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', padding: '10px 16px', color: '#f8fafc', fontFamily: '"Space Mono", monospace' }}>
                    {d.value.toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right', padding: '10px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                      <div style={{ width: '60px', height: '4px', background: '#334155', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: barColor }} />
                      </div>
                      <span style={{ color: '#94a3b8', fontSize: '11px', minWidth: '36px', fontFamily: '"Space Mono", monospace' }}>{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function RingkasanPage() {
  const tiangJTM = useAssetStore((s) => s.tiangJTM);
  const gardus = useAssetStore((s) => s.gardus);
  const jtmSegments = useAssetStore((s) => s.jtmSegments);

  // Formatted calculations identical to previous structure
  const bahanTiang = useMemo(() => countBy(tiangJTM, 'jenis_tiang'), [tiangJTM]);
  const tinggiTiang = useMemo(() => countBy(tiangJTM, 'tipe_tiang'), [tiangJTM]);
  
  const kekuatanTiang = useMemo(() => {
    const map: Record<string, number> = {};
    tiangJTM.forEach(t => {
      const k = t.kekuatan_tiang ? `${t.kekuatan_tiang} daN` : 'Tidak Diketahui';
      map[k] = (map[k] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [tiangJTM]);

  const pondasiTiang = useMemo(() => countBy(tiangJTM, 'pondasi_tiang'), [tiangJTM]);
  const penopangTiang = useMemo(() => countBy(tiangJTM, 'penopang'), [tiangJTM]);
  const konstruksiTiang = useMemo(() => countBy(tiangJTM, 'konstruksi_1'), [tiangJTM]);
  
  const konduktorTiang = useMemo(() => {
    const map: Record<string, number> = {};
    tiangJTM.forEach(t => {
      const jenis = t.jenis_hantaran_1 || '';
      const ukuran = t.ukuran_hantaran_1 || '';
      const key = jenis ? `${jenis} ${ukuran}mm²` : 'Tidak Diketahui';
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [tiangJTM]);

  const perPenyulang = useMemo(() => countBy(tiangJTM, 'penyulang'), [tiangJTM]);

  const trafoKonstruksi = useMemo(() => countBy(gardus, 'jenis_konstruksi'), [gardus]);
  
  const trafoKapasitas = useMemo(() => {
    const map: Record<string, number> = {};
    gardus.forEach(g => {
      const kva = g.kapasitas_kva || (g.kapasitas_mva ? g.kapasitas_mva * 1000 : 0);
      const k = kva ? `${kva} kVA` : 'Tidak Diketahui';
      map[k] = (map[k] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [gardus]);

  const trafoPenyulang = useMemo(() => countBy(gardus, 'penyulang'), [gardus]);

  const totalKVA = useMemo(() => gardus.reduce((s, g) => s + (g.kapasitas_kva || (g.kapasitas_mva ? g.kapasitas_mva * 1000 : 0) || 0), 0), [gardus]);

  return (
    <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', padding: '32px', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', borderBottom: '1px solid #334155', paddingBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#38bdf8' }}>⌘</span> DASHBOARD ASET JARINGAN
          </h1>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px', maxWidth: '600px', lineHeight: 1.5 }}>
            Sistem monitoring topologi jaringan tegangan menengah (JTM). Menganalisis proporsi, spesifikasi, dan kondisi aset secara visual.
          </p>
        </div>
        <div style={{ background: '#1e293b', border: '1px solid #334155', padding: '8px 16px', borderRadius: '4px', fontFamily: '"Space Mono", monospace', fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></div>
          SISTEM ONLINE
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <StatCard title="POPULASI TIANG" value={tiangJTM.length.toLocaleString()} subtitle="Titik survei yang terekam" icon="📍" color="#3b82f6" />
        <StatCard title="GARDU DISTRIBUSI" value={gardus.length.toLocaleString()} subtitle={`Muatan: ${totalKVA.toLocaleString()} kVA`} icon="⚡" color="#10b981" />
        <StatCard title="SEGMEN PENYULANG" value={jtmSegments.length.toLocaleString()} subtitle="Pemetaan poligon / garis aktif" icon="〽️" color="#f59e0b" />
        <StatCard title="JUMLAH PENYULANG" value={perPenyulang.length} subtitle="Sumber pasokan daya aktif" icon="🏭" color="#8b5cf6" />
      </div>

      {/* Section 1: Tiang Analytics */}
      <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '32px 0 16px 0', color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.05em', borderLeft: '4px solid #3b82f6', paddingLeft: '12px' }}>
        ANALISIS INFRASTRUKTUR TIANG
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Chart 1 */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', padding: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            BEBAN TIANG PER PENYULANG
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={perPenyulang} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11, fontFamily: '"Space Mono", monospace' }} axisLine={{ stroke: '#334155' }} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#cbd5e1', fontSize: 11 }} axisLine={{ stroke: '#334155' }} tickLine={false} width={90} />
              <Tooltip cursor={{ fill: '#0f172a' }} contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#f8fafc', fontSize: '12px', fontFamily: '"Space Mono", monospace' }} />
              <Bar dataKey="value" radius={[0, 2, 2, 0]}>
                {perPenyulang.map((entry, i) => (
                  <Cell key={entry.name} fill={PENYULANG_COLORS[entry.name.toUpperCase()] || COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 2 */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', padding: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            KOMPOSISI MATERIAL TIANG
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={bahanTiang} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} label={({ name, percent }) => `${name} (${(percent ? percent * 100 : 0).toFixed(0)}%)`} labelLine={{ stroke: '#64748b' }} stroke="none">
                {bahanTiang.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#f8fafc', fontSize: '12px', fontFamily: '"Space Mono", monospace' }} itemStyle={{ color: '#cbd5e1' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <BreakdownTable title="Bahan Struktur" icon="🏗️" data={bahanTiang} />
        <BreakdownTable title="Ketinggian" icon="📏" data={tinggiTiang} />
        <BreakdownTable title="Kapasitas Kekuatan" icon="💪" data={kekuatanTiang} />
        <BreakdownTable title="Tipe Pondasi" icon="🧱" data={pondasiTiang} />
        <BreakdownTable title="Ancorage / Penopang" icon="🪝" data={penopangTiang} />
        <BreakdownTable title="Cross-Arm Konstruksi" icon="⚙️" data={konstruksiTiang} />
        <BreakdownTable title="Spesifikasi Konduktor" icon="🔌" data={konduktorTiang} />
        <BreakdownTable title="Distribusi Penyulang" icon="🏢" data={perPenyulang} colorKey={PENYULANG_COLORS} />
      </div>

      {/* Section 2: Gardu Analytics */}
      <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '32px 0 16px 0', color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.05em', borderLeft: '4px solid #10b981', paddingLeft: '12px' }}>
        KAPASITAS GARDU DISTRIBUSI
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <BreakdownTable title="Model Konstruksi" icon="🏗️" data={trafoKonstruksi} />
        <BreakdownTable title="Rating Kapasitas" icon="⚡" data={trafoKapasitas} />
        <BreakdownTable title="Penyulang Gardu" icon="📊" data={trafoPenyulang} colorKey={PENYULANG_COLORS} />

        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', padding: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            SEBARAN KAPASITAS (kVA)
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={trafoKapasitas} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2} label={({ name }) => name} labelLine={{ stroke: '#475569' }} stroke="none">
                {trafoKapasitas.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#f8fafc', fontSize: '12px', fontFamily: '"Space Mono", monospace' }} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8', paddingTop: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
    </div>
  );
}
