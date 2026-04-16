import { NextResponse } from 'next/server';
import { readGeoJSON, flattenFeatures } from '@/lib/geojson-reader';

export async function GET() {
  try {
    // ArcGIS points were originally from arg.gdb, but we can derive from gardu-arcgis 
    // or use a known set of extracted points. Use gardu-arcgis as source.
    const geojson = await readGeoJSON('gardu-arcgis.geojson');
    const features = geojson?.features || [];
    
    // Map to the expected ArcgisPoint shape
    const data = features.slice(0, 50).map((f: any, i: number) => ({
      id: `arcgis_${i}`,
      name: f.properties?.Name || f.properties?.NAMAGD || `Point ${i+1}`,
      folderPath: f.properties?.TABLENAME || f.properties?.ULP || 'KALABAHI',
      symbolID: f.properties?.OBJECTID || i,
      lat: f.geometry?.coordinates?.[1] || 0,
      lng: f.geometry?.coordinates?.[0] || 0,
      alt: f.geometry?.coordinates?.[2] || 0,
      status: 'aktif',
      popupInfo: f.properties?.DESCRIPTION || '',
    }));

    return NextResponse.json({ success: true, count: data.length, data });
  } catch (error: any) {
    console.error('Error fetching arcgis points:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch points' },
      { status: 500 }
    );
  }
}
