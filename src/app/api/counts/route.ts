import { NextResponse } from 'next/server';
import { countGeoJSONFeatures } from '@/lib/geojson-reader';
import { hardwareItems } from '@/lib/hardware-data';

export async function GET() {
  try {
    const [gardu, tiang, jtm, jtr, sr, pelanggan] = await Promise.all([
      countGeoJSONFeatures('gardu-arcgis.geojson'),
      countGeoJSONFeatures('tiang-arcgis.geojson'),
      countGeoJSONFeatures('jtm-lines.geojson'),
      countGeoJSONFeatures('jtr-lines.geojson'),
      countGeoJSONFeatures('sr-lines.geojson'),
      countGeoJSONFeatures('pelanggan.geojson'),
    ]);

    const pembangkit = hardwareItems.filter(h => h.type === 'pembangkit').length;
    const fco = hardwareItems.filter(h => h.type === 'fco').length;
    const recloser = hardwareItems.filter(h => h.type === 'recloser').length;
    const arcgis = 38; // Known count from arg.gdb

    const total = gardu + tiang + jtm + jtr + sr + pelanggan + arcgis + pembangkit + fco + recloser;

    return NextResponse.json({
      gardu, tiang, jtm, jtr, sr, pelanggan, arcgis,
      pembangkit, fco, recloser, total,
    });
  } catch (error) {
    console.error('Counts API Error:', error);
    return NextResponse.json({ gardu: 0, tiang: 0, jtm: 0, jtr: 0, sr: 0, pelanggan: 0, arcgis: 0, pembangkit: 0, fco: 0, recloser: 0, total: 0 }, { status: 500 });
  }
}
