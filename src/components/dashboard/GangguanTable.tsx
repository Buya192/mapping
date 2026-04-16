'use client';

import { demoGangguan } from '@/lib/demo-data';

export function GangguanTable() {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="gangguan-table">
        <thead>
          <tr>
            <th>Penyulang</th>
            <th>Jenis</th>
            <th>Penyebab</th>
            <th>Waktu</th>
            <th>Durasi</th>
            <th>Pelanggan</th>
            <th>Status</th>
            <th>Petugas</th>
          </tr>
        </thead>
        <tbody>
          {demoGangguan.map((g) => {
            const waktu = new Date(g.waktu_mulai);
            const waktuStr = `${waktu.getDate()}/${waktu.getMonth() + 1} ${waktu.getHours().toString().padStart(2, '0')}:${waktu.getMinutes().toString().padStart(2, '0')}`;
            const durasi = g.durasi_menit > 0
              ? g.durasi_menit >= 60
                ? `${Math.floor(g.durasi_menit / 60)}j ${g.durasi_menit % 60}m`
                : `${g.durasi_menit}m`
              : 'Berlangsung';

            return (
              <tr key={g.id}>
                <td style={{ fontWeight: 600 }}>{g.penyulang_nama}</td>
                <td>
                  <span style={{
                    padding: '2px 10px',
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 600,
                    background: g.jenis === 'permanen' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                    color: g.jenis === 'permanen' ? '#ef4444' : '#f59e0b',
                  }}>
                    {g.jenis}
                  </span>
                </td>
                <td>{g.penyebab}</td>
                <td style={{ color: '#94a3b8', fontSize: 13 }}>{waktuStr}</td>
                <td style={{ fontWeight: 500 }}>{durasi}</td>
                <td>{g.pelanggan_terdampak.toLocaleString()}</td>
                <td>
                  <span className={`status-badge ${g.status}`}>
                    <span className={`status-dot ${g.status}`}></span>
                    {g.status}
                  </span>
                </td>
                <td style={{ color: '#94a3b8' }}>{g.petugas}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
