/**
 * Seed all GeoJSON data into Supabase tables.
 * Run: node scripts/seed-supabase.mjs
 * Handles duplicate IDs by appending index suffix
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'public', 'data');

const SUPABASE_URL = 'https://cdwfopayamzdhdwonwnj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkd2ZvcGF5YW16ZGhkd29ud25qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzMDA1NTcsImV4cCI6MjA5MTg3NjU1N30.-EpRy8h1vvci3ShrNRDpHUS5xa2JZ0zQZFm5lCmQT9s';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function readGeoJSON(filename) {
  const raw = readFileSync(join(DATA_DIR, filename), 'utf-8');
  return JSON.parse(raw);
}

function chunk(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

/** Deduplicate rows by id - append _N suffix for duplicates */
function deduplicateById(rows) {
  const seen = new Map();
  return rows.map(row => {
    const baseId = row.id;
    if (seen.has(baseId)) {
      const count = seen.get(baseId) + 1;
      seen.set(baseId, count);
      return { ...row, id: `${baseId}_${count}` };
    }
    seen.set(baseId, 0);
    return row;
  });
}

async function insertBatch(table, rows, batchSize = 200) {
  const batches = chunk(rows, batchSize);
  let inserted = 0;
  for (const batch of batches) {
    const { error } = await supabase.from(table).insert(batch);
    if (error) {
      console.error(`\n  ❌ Error ${table} (batch at ${inserted}):`, error.message.slice(0, 100));
    } else {
      inserted += batch.length;
    }
    process.stdout.write(`\r  ✓ ${table}: ${inserted}/${rows.length}`);
  }
  console.log();
  return inserted;
}

// ============ GARDU ============
async function seedGardu() {
  console.log('\n📦 Seeding gardus...');
  const gj = readGeoJSON('gardu-arcgis.geojson');
  const rows = gj.features.map((f, i) => {
    const p = f.properties || {};
    const coords = f.geometry?.coordinates || [0, 0];
    return {
      id: String(p.OBJECTID || p.Name || `gardu_${i}`),
      name: p.Name || p.NAMAGD || 'Unnamed',
      namaGardu: p.NAMAGD || p.Name || '',
      construction: p.RUJUKAN_KONSTRUKSI || null,
      capacity_kva: parseInt(p.KAPASITAS) || null,
      brand: p.MANUFACTURER || null,
      phases: p.FASA_TRAFO || null,
      feeder: p.NAMAPENYULANG || null,
      lat: coords[1] || 0,
      lng: coords[0] || 0,
      description: p.DESCRIPTION || null,
      peruntukan: p.PERUNTUKAN || null,
      thBuat: p.TH_BUAT || null,
      ulp: p.ULP || null,
      noTrafo: p.NO_TRAFO || null,
      jenisTrafo: p.JENIS_TRAFO || null,
      namaSurveyor: p.NAMA_SURVEYOR || null,
      tglGambar: p.TGLGAMBAR || null,
      userGambar: p.USERGAMBAR || null,
      tableName: p.TABLENAME || null,
      latitudeY: p.LATITUDEY || null,
      longitudeX: p.LONGITUDEX || null,
      status: 'aktif',
    };
  });
  const deduped = deduplicateById(rows);
  return await insertBatch('gardus', deduped);
}

// ============ TIANG JTM (auto-increment, no id needed) ============
async function seedTiangJTM() {
  console.log('\n📦 Seeding tiang_jtm...');
  const gj = readGeoJSON('tiang-arcgis.geojson');
  const rows = gj.features
    .filter(f => f.geometry?.coordinates)
    .map((f, i) => {
      const p = f.properties || {};
      const [lng, lat] = f.geometry.coordinates;
      return {
        // id is auto-increment, don't provide it
        objectId: parseInt(p.OBJECTID) || null,
        nama_tiang: p.NOTIANGTR || p.NOTIANG || p.Name || `Tiang_${i}`,
        ulp: p.ULP || null,
        penyulang: p.NAMAPENYULANG || null,
        jenis_aset: p.CLASSIFICATION || p.CXCLASSIFICATIONDESC || null,
        jenis_tiang: p.JENIS_TIANG || null,
        tipe_tiang: p.UKURAN_TIANG || null,
        pondasi_tiang: p.TYPE_PONDASI || null,
        kekuatan_tiang: parseInt(p.KEKUATAN_TIANG) || null,
        penopang: p.PENOPANG || null,
        konstruksi_1: p.KODE_KONSTRUKSI_1 || null,
        konstruksi_2: p.KODE_KONSTRUKSI_4 || null,
        jenis_hantaran_1: p.JENIS_PENGHANTAR || null,
        ukuran_hantaran_1: p.UKURAN_PENGHANTAR || null,
        under_built: p.PERUNTUKAN || null,
        kepemilikan: p.STATUS_KEPEMILIKAN || null,
        latitude: lat,
        longitude: lng,
        status: 'aktif',
        kondisiTiang: p.KONDISI_TIANG || null,
        namaGardu: p.NAMAGD || null,
        namaSurveyor: p.NAMA_SURVEYOR || null,
        manufacturer: p.MANUFACTURER || null,
        description: p.DESCRIPTION || null,
        ukuranTiang: p.UKURAN_TIANG || null,
        latitudeY: p.LATITUDEY || null,
        longitudeX: p.LONGITUDEX || null,
      };
    });
  return await insertBatch('tiang_jtm', rows, 200);
}

// ============ JTM SEGMENTS ============
async function seedJTMSegments() {
  console.log('\n📦 Seeding jtm_segments...');
  const gj = readGeoJSON('jtm-lines.geojson');
  const rows = gj.features.map((f, i) => {
    const p = f.properties || {};
    let lat = null, lng = null;
    if (f.geometry?.type === 'Point' && f.geometry?.coordinates) {
      lng = f.geometry.coordinates[0];
      lat = f.geometry.coordinates[1];
    }
    return {
      id: `jtm_${i}`,  // Use unique index-based ID to avoid duplicates
      name: p.Name || p.DESCRIPTION || `JTM_${i}`,
      feeder: p.NAMAPENYULANG || p.Penyulang_KMZ || null,
      length_km: parseFloat(p.PANJANG_HANTARAN) || null,
      size_mm2: p.UKURAN_TIANG_TM || null,
      unit: p.UNITNAME || null,
      raw_length: p.PANJANG_HANTARAN || null,
      status: 'aktif',
      asset_type: p.CXCLASSIFICATIONDESC || null,
      conductor_code: p.KODE_KONSTRUKSI_1 || null,
      ownership: p.STATUS_KEPEMILIKAN || null,
      city: p.CITY || null,
      location: p.LOCATION || null,
      saddressCode: p.SADDRESSCODE || null,
      tujdNumber: p.TUJDNUMBER || null,
      typePondasi: p.TYPE_PONDASI || null,
      jenisTiang: p.JENIS_TIANG || null,
      latitudeY: p.LATITUDEY || null,
      longitudeX: p.LONGITUDEX || null,
      lat,
      lng,
    };
  });
  return await insertBatch('jtm_segments', rows, 200);
}

// ============ JTR SEGMENTS ============
async function seedJTRSegments() {
  console.log('\n📦 Seeding jtr_segments...');
  const gj = readGeoJSON('jtr-lines.geojson');
  const rows = gj.features.map((f, i) => {
    const p = f.properties || {};
    return {
      id: `jtr_${i}`,
      name: p.Name || null,
      description: p.DESCRIPTION || null,
      namaGardu: p.NAMAGD || null,
      penyulang: p.NAMAPENYULANG || null,
      feature: p.FEATURE || null,
      fasaJaringan: p.FASA_JARINGAN || null,
      jenisKabel: p.JENIS_KABEL || null,
      ukuranKawat: p.UKURAN_KAWAT || null,
      jurusan: p.JURUSAN || null,
      kodeHantaran: p.KODEHANTARAN || null,
      hantaranNetral: p.HANTARAN_NETRAL || null,
      panjangHantaran: parseFloat(p.PANJANG_HANTARAN) || null,
      shapeLength: parseFloat(p.SHAPE_Length) || null,
      ownerPemeliharaan: p.OWNER_PEMELIHARAAN || null,
      userGambar: p.USERGAMBAR || null,
      tglGambar: p.TGLGAMBAR || null,
      tableName: p.TABLENAME || null,
      posisiFasa: p.POSISI_FASA || null,
      classification: p.CLASSIFICATION || null,
      status: 'aktif',
    };
  });
  return await insertBatch('jtr_segments', rows);
}

// ============ SR LINES ============
async function seedSRLines() {
  console.log('\n📦 Seeding sr_lines...');
  const gj = readGeoJSON('sr-lines.geojson');
  const rows = gj.features.map((f, i) => {
    const p = f.properties || {};
    return {
      id: `sr_${i}`,
      namaGardu: p.NAMAGD || null,
      shapeLength: parseFloat(p.SHAPE_Length) || null,
      userGambar: p.USERGAMBAR || null,
      tableName: p.TABLENAME || null,
      status: 'aktif',
    };
  });
  return await insertBatch('sr_lines', rows, 200);
}

// ============ PELANGGAN ============
async function seedPelanggan() {
  console.log('\n📦 Seeding pelanggan...');
  const gj = readGeoJSON('pelanggan.geojson');
  const rows = gj.features.map((f, i) => {
    const p = f.properties || {};
    const coords = f.geometry?.coordinates;
    return {
      id: `pel_${i}`,
      namaGardu: p.NAMAGD || null,
      penyulang: p.NAMAPENYULANG || null,
      ulp: p.ULP || null,
      fasa: p.FASA || null,
      jenisKwh: p.JENIS_KWH || null,
      noKwhMeter: p.NOKWHMETER || null,
      kodeTiangTR: p.KODE_TIANG_TR || null,
      kondisiSR: p.KONDISI_SR || null,
      konektor: p.KONEKTOR || null,
      panjangHantaran: parseFloat(p.PANJANG_HANTARAN) || null,
      segelApp: p.SEGEL_APP || null,
      tarikanKe: p.TARIKAN_KE || null,
      latitude: coords?.[1] || null,
      longitude: coords?.[0] || null,
      jenisHantaran: p.JENIS_HANTARAN || null,
      ukuranKawat: p.UKURAN_KAWAT || null,
      namaSurveyor: p.NAMA_SURVEYOR || null,
      description: p.DESCRIPTION || null,
      rt: p.RT || null,
      sambunganKe: p.SAMBUNGAN_KE || null,
      sambungLangsung: parseInt(p.SAMBUNG_LANGSUNG) || null,
      tapKonektor: parseInt(p.TAP_KONEKTOR) || null,
      dakStandat: parseInt(p.DAK_STANDAT) || null,
      asesoris: p.ASESORIS || null,
      tglGambar: p.TGLGAMBAR || null,
      userGambar: p.USERGAMBAR || null,
      tableName: p.TABLENAME || null,
      status: 'aktif',
    };
  });
  return await insertBatch('pelanggan', rows, 200);
}

// ============ MAIN ============
async function main() {
  console.log('🚀 PLN Jarkom → Supabase Migration');
  console.log('===================================');
  
  const results = {};
  
  try {
    results.gardu = await seedGardu();
    results.tiang = await seedTiangJTM();
    results.jtm = await seedJTMSegments();
    results.jtr = await seedJTRSegments();
    results.sr = await seedSRLines();
    results.pelanggan = await seedPelanggan();
    
    console.log('\n📊 Summary:');
    for (const [key, count] of Object.entries(results)) {
      console.log(`  ${key}: ${count} records`);
    }
    console.log('\n✅ Migration complete!');
  } catch (err) {
    console.error('\n❌ Migration failed:', err);
  }
}

main();
