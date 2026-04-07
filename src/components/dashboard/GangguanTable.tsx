const gangguan = [
  { id: 'GNG-001', penyulang: 'KLB-01', lokasi: 'Kalabahi Barat', penyebab: 'Pohon tumbang', status: 'proses', waktu: '07:23' },
  { id: 'GNG-002', penyulang: 'KLB-02', lokasi: 'Kalabahi Timur', penyebab: 'Petir', status: 'lapor', waktu: '08:41' },
  { id: 'GNG-003', penyulang: 'KLB-03', lokasi: 'Alor Kecil', penyebab: 'Overload trafo', status: 'selesai', waktu: '06:05' },
  { id: 'GNG-004', penyulang: 'KLB-04', lokasi: 'Moru', penyebab: 'Hewan (biawak)', status: 'lapor', waktu: '09:15' },
  { id: 'GNG-005', penyulang: 'KLB-01', lokasi: 'Alor Besar', penyebab: 'Peralatan rusak', status: 'proses', waktu: '10:02' },
];

export function GangguanTable() {
  return (
    <div className="overflow-x-auto">
      <table className="gangguan-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Penyulang</th>
            <th>Lokasi</th>
            <th>Penyebab</th>
            <th>Waktu</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {gangguan.map((row) => (
            <tr key={row.id}>
              <td><span style={{ fontFamily: 'monospace', color: '#94a3b8' }}>{row.id}</span></td>
              <td>{row.penyulang}</td>
              <td>{row.lokasi}</td>
              <td>{row.penyebab}</td>
              <td>{row.waktu}</td>
              <td>
                <span className={`status-badge ${row.status}`}>
                  <span className={`status-dot ${row.status}`}></span>
                  {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
