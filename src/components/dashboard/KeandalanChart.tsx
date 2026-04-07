'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const data = [
  { bulan: 'Jan', gangguan: 12, padam: 4 },
  { bulan: 'Feb', gangguan: 8,  padam: 3 },
  { bulan: 'Mar', gangguan: 15, padam: 6 },
  { bulan: 'Apr', gangguan: 10, padam: 4 },
  { bulan: 'Mei', gangguan: 7,  padam: 2 },
  { bulan: 'Jun', gangguan: 9,  padam: 3 },
  { bulan: 'Jul', gangguan: 13, padam: 5 },
  { bulan: 'Agu', gangguan: 11, padam: 4 },
  { bulan: 'Sep', gangguan: 14, padam: 5 },
  { bulan: 'Okt', gangguan: 9,  padam: 3 },
  { bulan: 'Nov', gangguan: 6,  padam: 2 },
  { bulan: 'Des', gangguan: 8,  padam: 3 },
];

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
