const fs = require('fs');
const path = require('path');
const readline = require('readline');

// The unzipped kml file from KALABAHI.kmz
const kmlPath = path.join(__dirname, '../.KALABAHI_temp/doc.kml');
const outPath = path.join(__dirname, '../public/data/tiang-kalabahi.json');

async function processLineByLine() {
  console.log('Memulai ekstraksi Big Data 41MB (KALABAHI.kmz)...');
  
  if (!fs.existsSync(kmlPath)) {
    console.error('File doc.kml tidak ditemukan di', kmlPath);
    return;
  }

  const fileStream = fs.createReadStream(kmlPath, { encoding: 'utf8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const folderStack = [];
  const items = [];
  
  let inPlacemark = false;
  let placemarkContent = '';

  for await (const line of rl) {
    if (line.includes('<Folder')) {
      folderStack.push('UNKNOWN');
    }
    if (line.includes('<name>') && folderStack.length > 0 && !inPlacemark) {
      const match = line.match(/<name>(.*?)<\/name>/);
      if (match) {
        // Prevent generic/root folders from overwriting specific penyulang names
        const fName = match[1].trim();
        // If it's just 'KALABAHI' or 'GroupLayer0', we might want to keep the specific layer name (e.g. MALI, MORU).
        folderStack[folderStack.length - 1] = fName;
      }
    }
    if (line.includes('</Folder>')) {
      folderStack.pop();
    }

    if (line.includes('<Placemark')) {
      inPlacemark = true;
      placemarkContent = line;
      continue;
    }

    if (inPlacemark) {
      placemarkContent += '\n' + line;
      if (line.includes('</Placemark>')) {
        inPlacemark = false;
        
        // Extract Classification to ensure it's an asset we care about
        let cxClass = '';
        const classMatch = placemarkContent.match(/<td>CXCLASSIFICATIONDESC<\/td>\s*<td>(.*?)<\/td>/);
        if (classMatch) cxClass = classMatch[1].trim();

        // Extract coordinates (Point)
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
          // Helper to extract specifically structured table data 
          const extractField = (field) => {
            const regex = new RegExp(`<td>${field}<\/td>\\s*<td>(.*?)<\/td>`);
            const match = placemarkContent.match(regex);
            return match ? match[1].trim() : '';
          };

          const desc = extractField('DESCRIPTION');
          const tujd = extractField('TUJDNUMBER');
          const jenisTiang = extractField('JENIS_TIANG');
          const ukuranTM = extractField('UKURAN_TIANG_TM');
          const ukuranTR = extractField('UKURAN_TIANG_TR');
          const pondasi = extractField('TYPE_PONDASI');
          const konstruksi1 = extractField('KODE_KONSTRUKSI_1');
          
          // Identify Penyulang
          // Folders are usually nested like: KALABAHI -> MALI 
          // We pick the innermost folder that isn't inherently empty or generic
          let pyd = folderStack.length > 0 ? folderStack[folderStack.length - 1] : 'UNKNOWN';
          if (pyd === 'KALABAHI' || pyd === 'FeatureLayer73') pyd = 'MALI'; // fallback mapping if names are obfuscated

          items.push({
            id: tujd || `PL_${items.length}`,
            nama_tiang: desc || cxClass,
            penyulang: pyd.toUpperCase(),
            jenis_aset: cxClass,
            jenis_tiang: jenisTiang,
            tipe_tiang: ukuranTM || ukuranTR,
            pondasi_tiang: pondasi,
            konstruksi_1: konstruksi1,
            longitude: lng,
            latitude: lat
          });
        }
        placemarkContent = '';
      }
    }
  }

  console.log(`Berhasil mengekstrak ${items.length} total koordinat.`);
  
  // Save to public/data 
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(items, null, 2));
  console.log(`[SUCCESS] File JSON ringan telah dicetak di: ${outPath}`);
}

processLineByLine().catch(console.error);
