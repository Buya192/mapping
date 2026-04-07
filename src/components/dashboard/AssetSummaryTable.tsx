const assets = [
  { layer: 'Gardu Distribusi', jumlah: 142, status: 'Aktif', keterangan: 'GD Tiang & Portal' },
  { layer: 'Trafo 20kV/380V', jumlah: 89, status: 'Aktif', keterangan: 'Distribusi utama' },
  { layer: 'Jaringan SUTM', jumlah: 312, status: 'Aktif', keterangan: 'km jaringan menengah' },
  { layer: 'Jaringan SUTR', jumlah: 487, status: 'Aktif', keterangan: 'km jaringan rendah' },
  { layer: 'Tiang Beton/Besi', jumlah: 4321, status: 'Aktif', keterangan: 'Tiang distribusi' },
  { layer: 'Switchgear / PMT', jumlah: 28, status: 'Aktif', keterangan: 'Pemutus tenaga' },
];

export function AssetSummaryTable() {
  return (
    <table className="gangguan-table">
      <thead>
        <tr>
          <th>Layer / Aset</th>
          <th>Jumlah</th>
          <th>Status</th>
          <th>Keterangan</th>
        </tr>
      </thead>
      <tbody>
        {assets.map((row) => (
          <tr key={row.layer}>
            <td style={{ fontWeight: 600 }}>{row.layer}</td>
            <td>
              <span style={{ color: '#3b82f6', fontWeight: 700 }}>{row.jumlah.toLocaleString()}</span>
            </td>
            <td>
              <span className="status-badge selesai">{row.status}</span>
            </td>
            <td style={{ color: '#64748b', fontSize: 13 }}>{row.keterangan}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
