import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const zipPath = '/vercel/share/v0-project/arg-20260406T131920Z-3-001.zip';
const extractDir = '/vercel/share/v0-project/scripts/zip-extracted';

// List zip contents first
console.log('=== ZIP FILE CONTENTS ===');
try {
  const listOutput = execSync(`unzip -l "${zipPath}" 2>&1`, { encoding: 'utf8' });
  console.log(listOutput);
} catch (e) {
  console.log('unzip list error:', e.message);
}

// Extract
console.log('\n=== EXTRACTING ===');
try {
  fs.mkdirSync(extractDir, { recursive: true });
  execSync(`unzip -o "${zipPath}" -d "${extractDir}" 2>&1`, { encoding: 'utf8' });
  console.log('Extracted successfully');
} catch (e) {
  console.log('Extract error:', e.message);
}

// Walk and list all files
function walkDir(dir, depth = 0) {
  try {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      const indent = '  '.repeat(depth);
      if (stat.isDirectory()) {
        console.log(`${indent}[DIR] ${item}/`);
        walkDir(fullPath, depth + 1);
      } else {
        const sizeMB = (stat.size / 1024 / 1024).toFixed(2);
        console.log(`${indent}[FILE] ${item} (${sizeMB} MB)`);
      }
    }
  } catch (e) {
    console.log(`Error reading dir ${dir}:`, e.message);
  }
}

console.log('\n=== EXTRACTED STRUCTURE ===');
walkDir(extractDir);

// Try to read sample files (JSON, GeoJSON, CSV)
function tryReadSample(dir) {
  try {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        tryReadSample(fullPath);
      } else {
        const ext = path.extname(item).toLowerCase();
        if (['.json', '.geojson', '.csv', '.txt', '.xml', '.kml', '.kmz'].includes(ext)) {
          console.log(`\n=== SAMPLE: ${item} ===`);
          const content = fs.readFileSync(fullPath, 'utf8');
          console.log(content.substring(0, 2000));
          console.log(`... [total ${content.length} chars]`);
        }
      }
    }
  } catch (e) {
    console.log('Error reading sample:', e.message);
  }
}

console.log('\n=== SAMPLE FILE CONTENTS ===');
tryReadSample(extractDir);
