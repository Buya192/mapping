import { NextResponse } from 'next/server';
import { readGeoJSON } from '@/lib/geojson-reader';

export async function GET() {
  try {
    const geojson = await readGeoJSON('sr-lines.geojson');
    const features = geojson?.features || [];

    const data = features.map((f: any) => {
      const p = f.properties || {};
      return {
        id: p.OBJECTID || String(Math.random()),
        namaGardu: p.NAMAGD || '',
        shapeLength: parseFloat(p.SHAPE_Length) || null,
        userGambar: p.USERGAMBAR || '',
        tableName: p.TABLENAME || '',
        status: 'aktif',
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('SR Lines API Error:', error);
    return NextResponse.json([], { status: 500 });
  }
}
