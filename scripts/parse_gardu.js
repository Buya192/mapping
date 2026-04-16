const fs = require('fs');
const path = require('path');
const readline = require('readline');

// File tujuan: ULP KALABAHI.kmz (150MB XML)
const kmlPath = path.join(__dirname, '../.ULP_KALABAHI_temp/doc.kml');
const outPath = path.join(__dirname, '../public/data/gardu-kalabahi.json');

async function processGarduLineByLine() {
  console.log('Memulai Pemurnian Gardu dari 150MB Big-Data (ULP KALABAHI.kmz)...');
  
  if (!fs.existsSync(kmlPath)) {
    console.error('File doc.kml tidak ditemukan di', kmlPath);
    return;
  }

  const fileStream = fs.createReadStream(kmlPath, { encoding: 'utf8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const gardus = [];
  let inPlacemark = false;
  let placemarkContent = '';

  for await (const line of rl) {
    if (line.includes('<Placemark')) {
      inPlacemark = true;
      placemarkContent = line;
      continue;
    }

    if (inPlacemark) {
      placemarkContent += '\n' + line;
      if (line.includes('</Placemark>')) {
        inPlacemark = false;
        
        // Cek apakah balok XML Placemarker ini bertipe TRAFO
        // Tanda Pengenal Tipe ada pada <tr> berlatar background:#9CBCE2 yg memuat <td>TRAFO</td>
        const isTrafo = /background:#9CBCE2.*?>\s*<td>TRAFO<\/td>/s.test(placemarkContent);
        if (isTrafo) {

          // Fungsi ekstraktor Nilai Kolom
          const extractField = (field) => {
            const regex = new RegExp(`<td>(?:<span.*?>)?${field}(?:<\/span>)?<\/td>\\s*<td>(?:<span.*?>)?(.*?)(?:<\/span>)?<\/td>`);
            const match = placemarkContent.match(regex);
            if (match) {
              let val = match[1].trim();
              if (val === '&lt;Null&gt;' || val === 'Null') return '';
              return val;
            }
            return '';
          };
          
          let lng = 0, lat = 0;
          const coordMatch = placemarkContent.match(/<coordinates>(.*?)<\/coordinates>/);
          if (coordMatch) {
            const parts = coordMatch[1].trim().split(',');
            if (parts.length >= 2) {
              lng = parseFloat(parts[0]);
              lat = parseFloat(parts[1]);
            }
          }

          if (lng !== 0 && lat !== 0) {
            const namaGd = extractField('NAMAGD') || extractField('DESCRIPTION');
            const penyulang = extractField('NAMAPENYULANG') || extractField('PENYULANG');
            const kapasitas = extractField('KAPASITAS');
            const konstruksi = extractField('RUJUKAN_KONSTRUKSI');
            const merk = extractField('MANUFACTURER') || extractField('MERK');
            const fasa = extractField('FASA_TRAFO') || extractField('FASA');

            gardus.push({
              id: namaGd || `GD_${gardus.length + 1}`,
              nama: namaGd,
              penyulang: penyulang,
              jenis_konstruksi: konstruksi,
              merk_trafo: merk,
              fasa: parseInt(fasa, 10) || 3,
              kapasitas_kva: parseInt(kapasitas, 10) || 0,
              latitude: lat,
              longitude: lng
            });
          }
        }
        placemarkContent = '';
      }
    }
  }

  console.log(`Berhasil membongkar dan menemukan ${gardus.length} Gardu!`);
  
  // Simpan JSON ringan
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(gardus, null, 2));
  console.log(`[SUCCESS] File Mahadata Gardu tercetak pada: ${outPath}`);
}

processGarduLineByLine().catch(console.error);
