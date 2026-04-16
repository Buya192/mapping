'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { generateBebanData } from '@/lib/demo-data';
import { useState, useEffect } from 'react';

export function BebanChart() {
  const [mounted, setMounted] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const raw = generateBebanData();
    const grouped: Record<string, Record<string, number>> = {};
    
    raw.forEach(d => {
      const hour = d.timestamp.split('T')[1].substring(0, 5);
      if (!grouped[hour]) grouped[hour] = {};
      
      const names: Record<string, string> = {
        'pnl-01': 'Anggrek',
        'pnl-02': 'Melati',
        'pnl-03': 'Dahlia',
        'pnl-04': 'Mawar'
      };
      grouped[hour][names[d.penyulang_id] || d.penyulang_id] = d.beban_mw;
    });

    setChartData(Object.entries(grouped).map(([jam, values]) => ({
      jam,
      ...values
    })));
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const customTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    return (
      <div style={{
        background: '#1a2236',
        border: '1px solid #2a3654',
        borderRadius: 8,
        padding: '12px 16px',
        fontSize: 13,
      }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Jam {label}</div>
        {payload.map((p: any, i: number) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
            <span style={{ color: '#94a3b8' }}>{p.name}:</span>
            <span style={{ fontWeight: 600 }}>{p.value?.toFixed(2)} MW</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a3654" />
        <XAxis dataKey="jam" stroke="#64748b" fontSize={12} />
        <YAxis stroke="#64748b" fontSize={12} unit=" MW" />
        <Tooltip content={customTooltip} />
        <Legend wrapperStyle={{ fontSize: 13 }} />
        <Line type="monotone" dataKey="Anggrek" stroke="#3b82f6" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="Melati" stroke="#22c55e" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="Dahlia" stroke="#ef4444" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="Mawar" stroke="#f59e0b" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
