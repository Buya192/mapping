'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { gangguanMonthly } from '@/lib/demo-data';
import { useState, useEffect } from 'react';

export function KeandalanChart() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const customTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    return (
      <div style={{
        background: '#1a2236',
        border: '1px solid #2a3654',
        borderRadius: 8,
        padding: '10px 14px',
        fontSize: 13,
      }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>{label}</div>
        {payload.map((p: any, i: number) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0' }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color }} />
            <span style={{ color: '#94a3b8' }}>{p.name}:</span>
            <span style={{ fontWeight: 600 }}>{p.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={gangguanMonthly} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a3654" />
        <XAxis dataKey="bulan" stroke="#64748b" fontSize={12} />
        <YAxis stroke="#64748b" fontSize={12} />
        <Tooltip content={customTooltip} />
        <Legend wrapperStyle={{ fontSize: 13 }} />
        <Bar dataKey="permanen" name="Permanen" fill="#ef4444" radius={[4, 4, 0, 0]} />
        <Bar dataKey="temporer" name="Temporer" fill="#f59e0b" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
