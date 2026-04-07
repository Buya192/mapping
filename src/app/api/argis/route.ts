import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';

const ZIP_PATH = path.join(process.cwd(), 'arg-20260406T131920Z-3-001.zip');
const EXTRACT_DIR = path.join(process.cwd(), '.argis-extracted');

async function ensureExtracted(): Promise<void> {
  if (!fs.existsSync(EXTRACT_DIR)) {
    fs.mkdirSync(EXTRACT_DIR, { recursive: true });
  }
  // Check if already extracted
  const files = fs.readdirSync(EXTRACT_DIR);
  if (files.length > 0) return;

  if (!fs.existsSync(ZIP_PATH)) {
    throw new Error(`ZIP file not found at: ${ZIP_PATH}`);
  }
  await execAsync(`unzip -o "${ZIP_PATH}" -d "${EXTRACT_DIR}"`);
}

function walkDir(dir: string, fileList: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function parseGeoJSONFile(filePath: string): GeoJSONData | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const json = JSON.parse(content);
    if (json.type === 'FeatureCollection' || json.type === 'Feature' || json.features) {
      return json;
    }
    return null;
  } catch {
    return null;
  }
}

export type GeoJSONData = {
  type: string;
  features?: GeoJSONFeature[];
  [key: string]: unknown;
};

export type GeoJSONFeature = {
  type: string;
  geometry: {
    type: string;
    coordinates: unknown;
  };
  properties: Record<string, unknown>;
};

export type LayerInfo = {
  name: string;
  fileName: string;
  geometryType: string;
  featureCount: number;
  properties: string[];
  bbox: [number, number, number, number] | null;
  data: GeoJSONData;
};

function getBBox(features: GeoJSONFeature[]): [number, number, number, number] | null {
  let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity;
  let hasCoords = false;

  function processCoord(coord: number[]) {
    if (coord.length >= 2) {
      minLon = Math.min(minLon, coord[0]);
      minLat = Math.min(minLat, coord[1]);
      maxLon = Math.max(maxLon, coord[0]);
      maxLat = Math.max(maxLat, coord[1]);
      hasCoords = true;
    }
  }

  function processCoords(coords: unknown) {
    if (!coords) return;
    if (typeof (coords as number[])[0] === 'number') {
      processCoord(coords as number[]);
    } else if (Array.isArray(coords)) {
      (coords as unknown[]).forEach(c => processCoords(c));
    }
  }

  for (const feature of features) {
    if (feature.geometry?.coordinates) {
      processCoords(feature.geometry.coordinates);
    }
  }

  if (!hasCoords) return null;
  return [minLon, minLat, maxLon, maxLat];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') ?? 'list';
  const layerName = searchParams.get('layer');

  try {
    await ensureExtracted();
    const allFiles = walkDir(EXTRACT_DIR);
    const geojsonFiles = allFiles.filter(f =>
      f.toLowerCase().endsWith('.geojson') || f.toLowerCase().endsWith('.json')
    );

    if (action === 'list') {
      const layers: Omit<LayerInfo, 'data'>[] = [];

      for (const filePath of geojsonFiles) {
        const data = parseGeoJSONFile(filePath);
        if (!data) continue;

        const features = data.features ?? (data.type === 'Feature' ? [data as unknown as GeoJSONFeature] : []);
        const relName = path.relative(EXTRACT_DIR, filePath).replace(/\\/g, '/');
        const geomTypes = [...new Set(features.map(f => f.geometry?.type).filter(Boolean))];
        const propKeys = features.length > 0
          ? Object.keys(features[0].properties ?? {})
          : [];

        layers.push({
          name: path.basename(filePath, path.extname(filePath)),
          fileName: relName,
          geometryType: geomTypes.join(', ') || 'Unknown',
          featureCount: features.length,
          properties: propKeys,
          bbox: getBBox(features),
        });
      }

      // Also list all files for structure view
      const structure = allFiles.map(f => ({
        path: path.relative(EXTRACT_DIR, f).replace(/\\/g, '/'),
        size: fs.statSync(f).size,
        ext: path.extname(f).toLowerCase(),
      }));

      return NextResponse.json({
        zipFile: path.basename(ZIP_PATH),
        totalFiles: allFiles.length,
        geojsonLayers: layers,
        structure,
      });
    }

    if (action === 'layer' && layerName) {
      // Find the file matching the layer name
      const filePath = geojsonFiles.find(f =>
        path.basename(f, path.extname(f)) === layerName ||
        path.relative(EXTRACT_DIR, f).replace(/\\/g, '/') === layerName
      );

      if (!filePath) {
        return NextResponse.json({ error: `Layer "${layerName}" not found` }, { status: 404 });
      }

      const data = parseGeoJSONFile(filePath);
      if (!data) {
        return NextResponse.json({ error: 'Could not parse GeoJSON file' }, { status: 500 });
      }

      const features = data.features ?? [];
      return NextResponse.json({
        name: path.basename(filePath, path.extname(filePath)),
        fileName: path.relative(EXTRACT_DIR, filePath).replace(/\\/g, '/'),
        geometryType: [...new Set(features.map(f => f.geometry?.type).filter(Boolean))].join(', ') || 'Unknown',
        featureCount: features.length,
        properties: features.length > 0 ? Object.keys(features[0].properties ?? {}) : [],
        bbox: getBBox(features),
        data,
      } satisfies LayerInfo);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Upload a new ZIP file
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save the uploaded ZIP
    fs.writeFileSync(ZIP_PATH, buffer);

    // Clear extraction cache so it re-extracts
    if (fs.existsSync(EXTRACT_DIR)) {
      fs.rmSync(EXTRACT_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(EXTRACT_DIR, { recursive: true });

    await ensureExtracted();

    return NextResponse.json({ success: true, fileName: file.name });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
