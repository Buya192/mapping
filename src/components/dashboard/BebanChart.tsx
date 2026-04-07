'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = Array.from({ length: 24 }, (_, i) => ({
  jam: `${String(i).padStart(2, '0')}:00`,
  beban: Math.floor(2000 + Math.random() * 2800 + Math.sin(i / 3) * 600),
}));

export function BebanChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="bebanGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,54,84,0.6)" />
        <XAxis dataKey="jam" tick={{ fill: '#64748b', fontSize: 11 }} interval={3} />
        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
        <Tooltip
          contentStyle={{ background: '#1a2236', border: '1px solid #2a3654', borderRadius: 8, color: '#f1f5f9' }}
          labelStyle={{ color: '#94a3b8' }}
        />
        <Area type="monotone" dataKey="beban" stroke="#3b82f6" strokeWidth={2} fill="url(#bebanGradient)" name="Beban (kVA)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
