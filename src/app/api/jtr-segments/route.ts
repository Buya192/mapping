import { NextResponse } from 'next/server';
import { readGeoJSON } from '@/lib/geojson-reader';

export async function GET() {
  try {
    const geojson = await readGeoJSON('jtr-lines.geojson');
    const features = geojson?.features || [];
    
    const clean = features.map((f: any) => {
      const p = f.properties || {};
      return {
        id: p.OBJECTID || p.Name || String(Math.random()),
        name: p.Name || '',
        description: p.DESCRIPTION || '',
        namaGardu: p.NAMAGD || '',
        penyulang: p.NAMAPENYULANG || '',
        feature: p.FEATURE || '',
        fasaJaringan: p.FASA_JARINGAN || '',
        jenisKabel: p.JENIS_KABEL || '',
        ukuranKawat: p.UKURAN_KAWAT || '',
        jurusan: p.JURUSAN || '',
        kodeHantaran: p.KODEHANTARAN || '',
        hantaranNetral: p.HANTARAN_NETRAL || '',
        panjangHantaran: parseFloat(p.PANJANG_HANTARAN) || null,
        shapeLength: parseFloat(p.SHAPE_Length) || null,
        status: 'aktif',
      };
    });

    return NextResponse.json(clean);
  } catch (error) {
    console.error('JTR Segments API Error:', error);
    return NextResponse.json([], { status: 500 });
  }
}
