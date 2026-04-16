const fs = require('fs');
const path = require('path');
const readline = require('readline');

const jsonPath = path.join(__dirname, '../public/data/gardu-kalabahi.json');
const csvPath = path.join(__dirname, '../TRF kalabahi1.csv');

async function runMerge() {
  console.log('Memulai Injeksi Mahadata CSV (TRF kalabahi.csv) ke JSON Master Gardu...');

  let garduAwal = [];
  if (fs.existsSync(jsonPath)) {
    garduAwal = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  }

  const fileStream = fs.createReadStream(csvPath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let header = [];
  let isFirstLine = true;
  let countAdded = 0;

  for await (const line of rl) {
    if (isFirstLine) {
      header = line.split(';');
      isFirstLine = false;
      continue;
    }

    const cols = line.split(';');
    if (cols.length < 5) continue;

    const getVal = (colName) => {
      const idx = header.findIndex(h => h.trim() === colName);
      return idx >= 0 && cols[idx] ? cols[idx].trim() : '';
    };

    const nama = getVal('nama_gardu');
    if (!nama) continue;

    const kapasitasStr = getVal('kapasitas_trafo');
    const kapasitas = parseFloat(kapasitasStr) || 0;

    const baru = {
      id: `TRF_${nama}`,
      nama: nama,
      tipe: getVal('jenis_gardu') || 'Cantol',
      jenis_konstruksi: getVal('jenis_gardu') || 'Cantol',
      kapasitas_mva: kapasitas / 1000,
      kapasitas_kva: kapasitas,
      merk: getVal('merk_trafo'),
      tahun_buat: getVal('tahun_buat_trafo'),
      fasa: getVal('fasa_trafo'),
      penyulang: getVal('penyulang'),
      latitude: parseFloat(getVal('latitude').replace(',', '.')),
      longitude: parseFloat(getVal('longitude').replace(',', '.'))
    };
    
    // Karena master Gardu kita hanya punya 279 gardu (yg mungkin kurang atau ada yang lain di CSV)
    // CSV punya detil tiang/gardu yg lebih baik, kita tambahkan saja/perbarui
    const existingIdx = garduAwal.findIndex(g => g.nama === nama);
    if (existingIdx !== -1) {
      garduAwal[existingIdx] = { ...garduAwal[existingIdx], ...baru };
    } else {
      if (!isNaN(baru.latitude) && !isNaN(baru.longitude)) {
        garduAwal.push(baru);
        countAdded++;
      }
    }
  }

  fs.writeFileSync(jsonPath, JSON.stringify(garduAwal, null, 2));
  console.log(`Berhasil menambahkan/memperbarui data Gardu Trafo. Total baru: ${countAdded}. Grand total: ${garduAwal.length}`);
}

runMerge().catch(console.error);
