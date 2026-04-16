import { NextRequest, NextResponse } from 'next/server';
import { readGeoJSON, flattenFeatures } from '@/lib/geojson-reader';

export async function GET(request: NextRequest) {
  try {
    const type = request.nextUrl.searchParams.get('type');

    if (type === 'gardu') {
      const geojson = await readGeoJSON('gardu-arcgis.geojson');
      const gardus = flattenFeatures(geojson).map((p: any) => ({
        id: p.OBJECTID || p.Name || String(Math.random()),
        name: p.Name || p.NAMAGD || 'Unnamed',
        namaGardu: p.NAMAGD || p.Name || '',
        construction: p.RUJUKAN_KONSTRUKSI || '',
        capacity_kva: parseInt(p.KAPASITAS) || 0,
        brand: p.MANUFACTURER || '',
        phases: p.FASA_TRAFO || '',
        feeder: p.NAMAPENYULANG || '',
        lat: p.lat || 0,
        lng: p.lng || 0,
        status: 'aktif',
      }));
      return NextResponse.json(gardus);
    }

    if (type === 'tiang') {
      const geojson = await readGeoJSON('tiang-arcgis.geojson');
      const tiang = flattenFeatures(geojson).slice(0, 500).map((p: any) => ({
        id: p.OBJECTID || String(Math.random()),
        nama_tiang: p.NOTIANG || p.NOTIANGTR || p.Name || '-',
        penyulang: p.NAMAPENYULANG || '-',
        jenis_tiang: p.JENIS_TIANG || '-',
        tipe_tiang: p.UKURAN_TIANG || '-',
        kekuatan_tiang: parseInt(p.KEKUATAN_TIANG) || 0,
        konstruksi_1: p.KODE_KONSTRUKSI_1 || '-',
        jenis_hantaran_1: p.JENIS_PENGHANTAR || '-',
        ukuran_hantaran_1: p.UKURAN_PENGHANTAR || '-',
        penopang: p.PENOPANG || '',
        latitude: p.lat || 0,
        longitude: p.lng || 0,
        namaGardu: p.NAMAGD || '-',
        kondisiTiang: p.KONDISI_TIANG || '-',
      }));
      return NextResponse.json(tiang);
    }

    // Default: return both (for dashboard/store)
    const garduGeo = await readGeoJSON('gardu-arcgis.geojson');
    const gardus = flattenFeatures(garduGeo).map((p: any) => ({
      id: p.OBJECTID || p.Name || String(Math.random()),
      nama: p.NAMAGD || p.Name || 'Unnamed',
      name: p.Name || '',
      penyulang: p.NAMAPENYULANG || '',
      kapasitas_kva: parseInt(p.KAPASITAS) || 0,
      kapasitas_mva: 0,
      jenis_konstruksi: p.RUJUKAN_KONSTRUKSI || 'Portal',
      lat: p.lat || 0,
      lng: p.lng || 0,
    }));

    const tiangGeo = await readGeoJSON('tiang-arcgis.geojson');
    const tiangJTM = flattenFeatures(tiangGeo).slice(0, 100).map((p: any) => ({
      nama_tiang: p.NOTIANG || p.NOTIANGTR || p.Name || '-',
      penyulang: p.NAMAPENYULANG || '-',
      tipe_tiang: p.UKURAN_TIANG || '-',
      kekuatan_tiang: parseInt(p.KEKUATAN_TIANG) || 0,
      jenis_hantaran_1: p.JENIS_PENGHANTAR || '-',
      ukuran_hantaran_1: p.UKURAN_PENGHANTAR || '-',
      penopang: p.PENOPANG || '',
    }));

    return NextResponse.json({ gardus, tiangJTM });
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
