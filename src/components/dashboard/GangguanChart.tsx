'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { gangguanCauses } from '@/lib/demo-data';
import { CHART_COLORS } from '@/lib/map-config';
import { useState, useEffect } from 'react';

export function GangguanChart() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const customTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0];
    return (
      <div style={{
        background: '#1a2236',
        border: '1px solid #2a3654',
        borderRadius: 8,
        padding: '10px 14px',
        fontSize: 13,
      }}>
        <div style={{ fontWeight: 600 }}>{d.name}</div>
        <div style={{ color: '#94a3b8', marginTop: 2 }}>{d.value} kejadian</div>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={gangguanCauses}
          dataKey="jumlah"
          nameKey="penyebab"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={3}
          stroke="none"
        >
          {gangguanCauses.map((_, index) => (
            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={customTooltip} />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          formatter={(value: string) => <span style={{ color: '#94a3b8' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
