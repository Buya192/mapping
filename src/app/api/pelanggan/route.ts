import { NextResponse } from 'next/server';
import { readGeoJSON } from '@/lib/geojson-reader';

export async function GET() {
  try {
    const geojson = await readGeoJSON('pelanggan.geojson');
    const features = geojson?.features || [];

    const data = features.map((f: any) => {
      const p = f.properties || {};
      const coords = f.geometry?.coordinates;
      return {
        id: p.OBJECTID || String(Math.random()),
        namaGardu: p.NAMAGD || '',
        penyulang: p.NAMAPENYULANG || '',
        ulp: p.ULP || '',
        fasa: p.FASA || '',
        jenisKwh: p.JENIS_KWH || '',
        noKwhMeter: p.NOKWHMETER || '',
        kodeTiangTR: p.KODE_TIANG_TR || '',
        kondisiSR: p.KONDISI_SR || '',
        konektor: p.KONEKTOR || '',
        panjangHantaran: parseFloat(p.PANJANG_HANTARAN) || null,
        segelApp: p.SEGEL_APP || '',
        tarikanKe: p.TARIKAN_KE || '',
        latitude: coords?.[1] || null,
        longitude: coords?.[0] || null,
        status: 'aktif',
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Pelanggan API Error:', error);
    return NextResponse.json([], { status: 500 });
  }
}
