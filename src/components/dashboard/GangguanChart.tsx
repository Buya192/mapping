'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const data = [
  { penyebab: 'Pohon', jumlah: 14 },
  { penyebab: 'Petir', jumlah: 9 },
  { penyebab: 'Hewan', jumlah: 6 },
  { penyebab: 'Overload', jumlah: 5 },
  { penyebab: 'Peralatan', jumlah: 4 },
  { penyebab: 'Lainnya', jumlah: 3 },
];

const colors = ['#3b82f6', '#06b6d4', '#22c55e', '#eab308', '#ef4444', '#8b5cf6'];

export function GangguanChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,54,84,0.6)" />
        <XAxis dataKey="penyebab" tick={{ fill: '#64748b', fontSize: 11 }} />
        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
        <Tooltip
          contentStyle={{ background: '#1a2236', border: '1px solid #2a3654', borderRadius: 8, color: '#f1f5f9' }}
        />
        <Bar dataKey="jumlah" radius={[4, 4, 0, 0]} name="Jumlah">
          {data.map((_, idx) => (
            <Cell key={idx} fill={colors[idx % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
