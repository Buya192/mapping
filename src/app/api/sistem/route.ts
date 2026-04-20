import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { promises as fs } from 'fs';
import path from 'path';

// Haversine distance in KM
function haversineKm(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calcLineLength(coords: number[][]): number {
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    total += haversineKm(coords[i - 1][0], coords[i - 1][1], coords[i][0], coords[i][1]);
  }
  return total;
}

// Main feeder → sub-feeders (connected through GH/gardu hubung)
// Sumber: PLTD Fanating & PLTD Kadelang → GH → Penyulang
const PENYULANG_GROUPS: Record<string, string[]> = {
  'MALI':              ['MALI', 'BANDARA', 'KAMAIFUI', 'PLTS KUNEMAN', 'PLTS LANGKURU'],
  'ALOR KECIL':        ['ALOR KECIL', 'BATU NIRWALA'],
  'BATUNIRWALA':       ['BATUNIRWALA', 'BATUNIRWANA'],
  'BINONGKO':          ['BINONGKO', 'KALABAHI', 'EKSPRES KALABAHI'],
  'KABIR':             ['KABIR', 'NULLE', 'TREWENG'],
  'BARANUSA':          ['BARANUSA', 'NULLE/BARANUSA'],
  'MORU':              ['MORU'],
  'MARITAING':         ['MARITAING', 'MARATAING'],
  'PURA':              ['PURA'],
  'PROBUR':            ['PROBUR'],
};

// Reverse lookup
const SUB_TO_MAIN: Record<string, string> = {};
Object.entries(PENYULANG_GROUPS).forEach(([main, subs]) => {
  subs.forEach(sub => { SUB_TO_MAIN[sub] = main; });
});

// Aggregate a value map into main feeder groups
function aggregateToMain(rawMap: Record<string, number>, mode: 'sum' | 'count' = 'sum'): Record<string, number> {
  const result: Record<string, number> = {};
  Object.entries(rawMap).forEach(([sub, val]) => {
    const main = SUB_TO_MAIN[sub] || sub;
    result[main] = (result[main] || 0) + val;
  });
  return result;
}

export async function GET() {
  try {
    // === 1. JTM length from GeoJSON ===
    const jtmKmsRaw: Record<string, number> = {};
    try {
      const jtmPath = path.join(process.cwd(), 'public', 'data', 'jtm-lines-fixed.geojson');
      const jtmRaw = await fs.readFile(jtmPath, 'utf-8');
      const jtmGj = JSON.parse(jtmRaw);
      (jtmGj.features || []).forEach((f: any) => {
        const penyulang = (f.properties?.NAMAPENYULANG || f.properties?.Penyulang_KMZ || '').toUpperCase();
        if (!penyulang || !f.geometry?.coordinates) return;
        const rings = f.geometry.type === 'MultiLineString' ? f.geometry.coordinates : [f.geometry.coordinates];
        let totalKm = 0;
        rings.forEach((ring: number[][]) => { totalKm += calcLineLength(ring); });
        jtmKmsRaw[penyulang] = (jtmKmsRaw[penyulang] || 0) + totalKm;
      });
    } catch (e) {
      console.warn('Failed to read JTM GeoJSON:', e);
    }

    // === 2. JTR length from GeoJSON ===
    const jtrKmsRaw: Record<string, number> = {};
    try {
      const jtrPath = path.join(process.cwd(), 'public', 'data', 'jtr-lines.geojson');
      const jtrRaw = await fs.readFile(jtrPath, 'utf-8');
      const jtrGj = JSON.parse(jtrRaw);
      (jtrGj.features || []).forEach((f: any) => {
        const penyulang = (f.properties?.NAMAPENYULANG || '').toUpperCase();
        if (!penyulang || !f.geometry?.coordinates) return;
        const rings = f.geometry.type === 'MultiLineString' ? f.geometry.coordinates : [f.geometry.coordinates];
        let totalKm = 0;
        rings.forEach((ring: number[][]) => { totalKm += calcLineLength(ring); });
        jtrKmsRaw[penyulang] = (jtrKmsRaw[penyulang] || 0) + totalKm;
      });
    } catch (e) {
      console.warn('Failed to read JTR GeoJSON:', e);
    }

    // === 3. Tiang count from Supabase (paginated) ===
    const tiangRaw: Record<string, number> = {};
    let tiangOffset = 0;
    const PAGE = 1000;
    while (true) {
      const { data, error } = await supabase.from('tiang_jtm').select('penyulang').range(tiangOffset, tiangOffset + PAGE - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      data.forEach((r: any) => { const p = (r.penyulang || '').toUpperCase(); if (p) tiangRaw[p] = (tiangRaw[p] || 0) + 1; });
      if (data.length < PAGE) break;
      tiangOffset += PAGE;
    }

    // === 4. Gardu count from Supabase (paginated) ===
    const garduRaw: Record<string, number> = {};
    let garduOffset = 0;
    while (true) {
      const { data, error } = await supabase.from('gardus').select('feeder').range(garduOffset, garduOffset + PAGE - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      data.forEach((r: any) => { const p = (r.feeder || '').toUpperCase(); if (p) garduRaw[p] = (garduRaw[p] || 0) + 1; });
      if (data.length < PAGE) break;
      garduOffset += PAGE;
    }

    // === 5. Pelanggan count from Supabase (paginated) ===
    const pelangganRaw: Record<string, number> = {};
    let pelOffset = 0;
    while (true) {
      const { data, error } = await supabase.from('pelanggan').select('penyulang').range(pelOffset, pelOffset + PAGE - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      data.forEach((r: any) => { const p = (r.penyulang || '').toUpperCase(); if (p) pelangganRaw[p] = (pelangganRaw[p] || 0) + 1; });
      if (data.length < PAGE) break;
      pelOffset += PAGE;
    }

    // === 6. Hardware (FCO & Recloser) ===
    const fcoRaw: Record<string, number> = {};
    const recRaw: Record<string, number> = {};
    const { data: hwData, error: hwErr } = await supabase.from('hardware_items').select('name, type');
    if (hwErr) throw hwErr;
    const allNames = new Set([...Object.keys(tiangRaw), ...Object.keys(garduRaw), ...Object.keys(jtmKmsRaw), ...Object.keys(jtrKmsRaw), ...Object.keys(pelangganRaw)]);
    (hwData || []).forEach((r: any) => {
      const nameUpper = (r.name || '').toUpperCase();
      for (const p of allNames) {
        if (nameUpper.includes(p)) {
          if (r.type === 'fco') fcoRaw[p] = (fcoRaw[p] || 0) + 1;
          if (r.type === 'recloser') recRaw[p] = (recRaw[p] || 0) + 1;
          break;
        }
      }
    });

    // === Aggregate all maps using PENYULANG_GROUPS ===
    const tiangAgg = aggregateToMain(tiangRaw);
    const garduAgg = aggregateToMain(garduRaw);
    const jtmAgg = aggregateToMain(jtmKmsRaw);
    const jtrAgg = aggregateToMain(jtrKmsRaw);
    const pelAgg = aggregateToMain(pelangganRaw);
    const fcoAgg = aggregateToMain(fcoRaw);
    const recAgg = aggregateToMain(recRaw);

    // === Collect main penyulang names ===
    const mainSet = new Set<string>(Object.keys(PENYULANG_GROUPS));
    // Also add any orphan that isn't mapped
    [tiangAgg, garduAgg, jtmAgg, jtrAgg, pelAgg].forEach(m => {
      Object.keys(m).forEach(p => mainSet.add(p));
    });

    // === Build result per main penyulang ===
    const result = Array.from(mainSet).sort().map(penyulang => ({
      penyulang,
      tiang: tiangAgg[penyulang] || 0,
      jtm_kms: Math.round((jtmAgg[penyulang] || 0) * 100) / 100,
      jtr_kms: Math.round((jtrAgg[penyulang] || 0) * 100) / 100,
      gardu: garduAgg[penyulang] || 0,
      fco: fcoAgg[penyulang] || 0,
      rec: recAgg[penyulang] || 0,
      pelanggan: pelAgg[penyulang] || 0,
      // Include sub-feeder names for reference
      sub_feeders: PENYULANG_GROUPS[penyulang]?.filter(s => s !== penyulang) || [],
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Sistem API Error:', error);
    return NextResponse.json([], { status: 500 });
  }
}
