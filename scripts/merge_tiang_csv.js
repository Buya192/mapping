const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Sumber Data
const jsonPath = path.join(__dirname, '../public/data/tiang-kalabahi.json');
const csvPath = path.join(__dirname, '../JTM lengkap.csv');

async function runMerge() {
  console.log('Memulai Injeksi Mahadata CSV (JTM lengkap.csv) ke dalam JSON Master...');

  // 1. Baca Master JSON Tiang KML
  let tiangAwal = [];
  if (fs.existsSync(jsonPath)) {
    tiangAwal = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  }
  console.log(`Tiang Master (KML) sebelum digabung: ${tiangAwal.length} Tiang`);

  // Kita buat kamus pencari cepat via nama_tiang
  const tiangMap = new Map();
  tiangAwal.forEach(t => {
    if (t.nama_tiang) {
      tiangMap.set(t.nama_tiang.trim().toUpperCase(), t);
    }
  });

  // 2. Baca CSV
  if (!fs.existsSync(csvPath)) {
    console.error('File JTM lengkap.csv tidak ditemukan!');
    return;
  }

  const fileStream = fs.createReadStream(csvPath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let header = [];
  let isFirstLine = true;
  let countUpdated = 0;
  let countNew = 0;

  for await (const line of rl) {
    if (isFirstLine) {
      header = line.split(';');
      isFirstLine = false;
      continue;
    }

    const cols = line.split(';');
    if (cols.length < 5) continue;

    // Mapping index index CSV kolom ke data yang ingin kita sasar
    // Contoh CSV header: OBJECTID;data_collected_time;urutan_tiang;nama_tiang;ulp;sulp;jenis_aset;asset_p3;jenis_tiang;tipe_tiang;pondasi_tiang;kekuatan_tiang;penopang;konstruksi_1;konstruksi_2;jenis_hantaran_1;jenis_hantaran_2;ukuran_hantaran_1;ukuran_hantaran_2;penyulang;under_built_jtm_1;...;latitude;longitude
    const getVal = (colName) => {
      const idx = header.findIndex(h => h.trim() === colName);
      return idx >= 0 && cols[idx] ? cols[idx].trim() : '';
    };

    const nama = getVal('nama_tiang');
    const penyulang = getVal('penyulang');
    const jenisKabel = getVal('jenis_hantaran_1');
    const ukuranKabel = getVal('ukuran_hantaran_1');
    const underbuilt = getVal('under_built_jtm_1'); // Jika ada isinya, berarti ada tiang JTR numpang di JTM
    const pondasi = getVal('pondasi_tiang');
    const penopang = getVal('penopang');
    const kekuatan = getVal('kekuatan_tiang');
    const urutan = getVal('urutan_tiang');
    
    // Perhatikan latitude & longitude di CSV pake koma ','
    const latRaw = getVal('latitude').replace(',', '.');
    const lngRaw = getVal('longitude').replace(',', '.');
    const latitude = parseFloat(latRaw);
    const longitude = parseFloat(lngRaw);

    if (!nama || !penyulang) continue;

    const dataInject = {
      jenis_hantaran_1: jenisKabel,
      ukuran_hantaran_1: ukuranKabel,
      under_built_jtm_1: underbuilt,
      pondasi_tiang: pondasi,
      kekuatan_tiang: kekuatan,
      urutan_tiang: parseInt(urutan) || 0,
      penopang: penopang,
    };

    // Ambil eksisting di Map jika ada
    const eksisting = tiangMap.get(nama.toUpperCase());

    if (eksisting) {
      // Perbarui
      Object.assign(eksisting, dataInject);
      countUpdated++;
    } else {
      // Tambah baru (Berarti KML tiang ini hilang/tidak masuk!)
      const baru = {
        id: `CSV_${getVal('OBJECTID')}`,
        nama_tiang: nama,
        penyulang: penyulang,
        urutan_tiang: parseInt(urutan) || 0,
        jenis_aset: 'Tiang TM',
        latitude: isNaN(latitude) ? 0 : latitude,
        longitude: isNaN(longitude) ? 0 : longitude,
        ...dataInject
      };
      
      if (baru.latitude !== 0 && baru.longitude !== 0) {
        tiangMap.set(nama.toUpperCase(), baru);
        tiangAwal.push(baru);
        countNew++;
      }
    }
  }

  // Rewrite The Master Map!
  fs.writeFileSync(jsonPath, JSON.stringify(tiangAwal, null, 2));

  console.log('--- RINGKASAN INTEGRASI CSV JTM ---');
  console.log(`Total Tiang Ter-Update Spesifikasinya : ${countUpdated}`);
  console.log(`Total Tiang Baru dari CSV yg diselamatkan  : ${countNew}`);
  console.log(`Grand Total JSON Master Tiang PLN  : ${tiangAwal.length}`);
}

runMerge().catch(console.error);
