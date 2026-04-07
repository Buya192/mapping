'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const BEBAN_DATA = [
  2120, 2050, 1980, 1940, 1900, 2010, 2380, 2900, 3400, 3800, 4100, 4320,
  4500, 4450, 4380, 4200, 4050, 4100, 4300, 4600, 4720, 4400, 3800, 3000,
];

const data = BEBAN_DATA.map((beban, i) => ({
  jam: `${String(i).padStart(2, '0')}:00`,
  beban,
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
