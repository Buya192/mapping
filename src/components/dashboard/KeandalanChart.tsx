'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const data = months.map((bulan, i) => ({
  bulan,
  gangguan: Math.floor(5 + Math.random() * 10 + Math.sin(i / 2) * 3),
  padam: Math.floor(2 + Math.random() * 5),
}));

export function KeandalanChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,54,84,0.6)" />
        <XAxis dataKey="bulan" tick={{ fill: '#64748b', fontSize: 11 }} />
        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
        <Tooltip
          contentStyle={{ background: '#1a2236', border: '1px solid #2a3654', borderRadius: 8, color: '#f1f5f9' }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
        <Line type="monotone" dataKey="gangguan" stroke="#ef4444" strokeWidth={2} dot={false} name="Gangguan" />
        <Line type="monotone" dataKey="padam" stroke="#eab308" strokeWidth={2} dot={false} name="Padam" />
      </LineChart>
    </ResponsiveContainer>
  );
}
