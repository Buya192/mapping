import { NextResponse } from 'next/server';
import { readGeoJSON } from '@/lib/geojson-reader';

export async function GET() {
  try {
    const geojson = await readGeoJSON('jtm-lines.geojson');
    const features = geojson?.features || [];

    const data = features.map((f: any) => {
      const p = f.properties || {};
      const coords = f.geometry?.coordinates;
      let lat: number | null = null;
      let lng: number | null = null;
      
      // For Point geometry
      if (f.geometry?.type === 'Point' && coords) {
        lng = coords[0];
        lat = coords[1];
      }

      return {
        id: p.OBJECTID || p.Name || String(Math.random()),
        name: p.Name || p.DESCRIPTION || '',
        feeder: p.NAMAPENYULANG || p.Penyulang_KMZ || '',
        length_km: parseFloat(p.PANJANG_HANTARAN) || null,
        size_mm2: p.UKURAN_TIANG_TM || '',
        unit: p.UNITNAME || '',
        raw_length: p.PANJANG_HANTARAN || '',
        status: 'aktif',
        asset_type: p.CXCLASSIFICATIONDESC || '',
        conductor_code: p.KODE_KONSTRUKSI_1 || '',
        ownership: p.STATUS_KEPEMILIKAN || '',
        city: p.CITY || '',
        location: p.LOCATION || '',
        saddressCode: p.SADDRESSCODE || '',
        tujdNumber: p.TUJDNUMBER || '',
        typePondasi: p.TYPE_PONDASI || '',
        jenisTiang: p.JENIS_TIANG || '',
        latitudeY: p.LATITUDEY || '',
        longitudeX: p.LONGITUDEX || '',
        lat,
        lng,
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('JTM Segments API Error:', error);
    return NextResponse.json([], { status: 500 });
  }
}
