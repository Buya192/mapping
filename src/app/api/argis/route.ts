import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { exec } from 'child_process';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';

const ZIP_PATH = path.join(process.cwd(), 'arg-20260406T131920Z-3-001.zip');
const EXTRACT_DIR = path.join(process.cwd(), '.argis-extracted');

// ─── helpers ──────────────────────────────────────────────────────────────────

async function ensureExtracted(): Promise<void> {
  if (!fs.existsSync(EXTRACT_DIR)) fs.mkdirSync(EXTRACT_DIR, { recursive: true });
  const files = fs.readdirSync(EXTRACT_DIR);
  if (files.length > 0) return;
  if (!fs.existsSync(ZIP_PATH)) throw new Error(`ZIP file not found: ${ZIP_PATH}`);
  await execAsync(`unzip -o "${ZIP_PATH}" -d "${EXTRACT_DIR}"`);
}

function walkDir(dir: string, list: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    e.isDirectory() ? walkDir(full, list) : list.push(full);
  }
  return list;
}

function parseGeoJSON(filePath: string): GeoJSONData | null {
  try {
    const json = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return json.type === 'FeatureCollection' || json.type === 'Feature' || json.features ? json : null;
  } catch { return null; }
}

function getBBox(features: GeoJSONFeature[]): [number, number, number, number] | null {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, found = false;
  const walk = (c: unknown) => {
    if (!c) return;
    if (typeof (c as number[])[0] === 'number' && (c as number[]).length >= 2) {
      const [x, y] = c as number[];
      minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
      found = true;
    } else if (Array.isArray(c)) (c as unknown[]).forEach(walk);
  };
  features.forEach(f => f.geometry?.coordinates && walk(f.geometry.coordinates));
  return found ? [minX, minY, maxX, maxY] : null;
}

// ─── types ────────────────────────────────────────────────────────────────────

export type GeoJSONData = {
  type: string;
  features?: GeoJSONFeature[];
  [key: string]: unknown;
};

export type GeoJSONFeature = {
  type: string;
  geometry: { type: string; coordinates: unknown };
  properties: Record<string, unknown>;
};

export type LayerInfo = {
  name: string;
  fileName: string;
  geometryType: string;
  featureCount: number;
  properties: string[];
  bbox: [number, number, number, number] | null;
  data?: GeoJSONData;
};

// ─── save to database ─────────────────────────────────────────────────────────

async function saveToDatabase(zipFilename: string, fileSize: number): Promise<void> {
  // Check if already imported
  const existing = await sql`
    SELECT id FROM zip_imports WHERE filename = ${zipFilename} AND status = 'done'
  `;
  if (existing.length > 0) return;

  // Create import record
  const [importRow] = await sql`
    INSERT INTO zip_imports (filename, file_size, status)
    VALUES (${zipFilename}, ${fileSize}, 'processing')
    RETURNING id
  `;
  const importId = importRow.id as number;

  try {
    await ensureExtracted();
    const allFiles = walkDir(EXTRACT_DIR);
    const geojsonFiles = allFiles.filter(f =>
      f.toLowerCase().endsWith('.geojson') || f.toLowerCase().endsWith('.json')
    );

    for (const filePath of geojsonFiles) {
      const data = parseGeoJSON(filePath);
      if (!data) continue;

      const features = data.features ?? (data.type === 'Feature' ? [data as unknown as GeoJSONFeature] : []);
      const relName = path.relative(EXTRACT_DIR, filePath).replace(/\\/g, '/');
      const layerName = path.basename(filePath, path.extname(filePath));
      const geomTypes = [...new Set(features.map(f => f.geometry?.type).filter(Boolean))];
      const propKeys = features.length > 0 ? Object.keys(features[0].properties ?? {}) : [];
      const bbox = getBBox(features);

      // Insert layer
      const [layerRow] = await sql`
        INSERT INTO geojson_layers (
          import_id, layer_name, filename, geometry_type,
          feature_count, bbox_minx, bbox_miny, bbox_maxx, bbox_maxy, property_keys
        ) VALUES (
          ${importId}, ${layerName}, ${relName},
          ${geomTypes.join(', ') || 'Unknown'},
          ${features.length},
          ${bbox?.[0] ?? null}, ${bbox?.[1] ?? null},
          ${bbox?.[2] ?? null}, ${bbox?.[3] ?? null},
          ${JSON.stringify(propKeys)}
        )
        RETURNING id
      `;
      const layerId = layerRow.id as number;

      // Insert features in batches of 50
      const BATCH = 50;
      for (let i = 0; i < features.length; i += BATCH) {
        const batch = features.slice(i, i + BATCH);
        for (let j = 0; j < batch.length; j++) {
          const feat = batch[j];
          const geomJson = JSON.stringify(feat.geometry);
          const propsJson = JSON.stringify(feat.properties ?? {});
          await sql`
            INSERT INTO geojson_features (
              layer_id, import_id, feature_index,
              geometry_type, geometry, properties
            ) VALUES (
              ${layerId}, ${importId}, ${i + j},
              ${feat.geometry?.type ?? null},
              ST_GeomFromGeoJSON(${geomJson}),
              ${propsJson}
            )
          `;
        }
      }
    }

    // Mark done
    await sql`UPDATE zip_imports SET status = 'done' WHERE id = ${importId}`;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await sql`UPDATE zip_imports SET status = 'error', error_message = ${msg} WHERE id = ${importId}`;
    throw err;
  }
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') ?? 'list';
  const layerName = searchParams.get('layer');
  const source = searchParams.get('source') ?? 'db'; // 'db' | 'file'

  try {
    // ── DB-backed endpoints ──
    if (source === 'db') {
      if (action === 'imports') {
        const rows = await sql`SELECT * FROM zip_imports ORDER BY imported_at DESC`;
        return NextResponse.json({ imports: rows });
      }

      if (action === 'layers') {
        const rows = await sql`SELECT * FROM layer_summary ORDER BY layer_name`;
        return NextResponse.json({ layers: rows });
      }

      if (action === 'features' && layerName) {
        const page = parseInt(searchParams.get('page') ?? '1');
        const limit = parseInt(searchParams.get('limit') ?? '100');
        const offset = (page - 1) * limit;
        const search = searchParams.get('search') ?? '';

        let rows;
        if (search) {
          rows = await sql`
            SELECT feature_id, feature_index, geometry_type, properties,
                   ST_AsGeoJSON(geometry_geojson::geometry)::jsonb AS geometry_geojson,
                   layer_name
            FROM feature_detail
            WHERE layer_name = ${layerName}
              AND properties::text ILIKE ${'%' + search + '%'}
            ORDER BY feature_id
            LIMIT ${limit} OFFSET ${offset}
          `;
        } else {
          rows = await sql`
            SELECT feature_id, feature_index, geometry_type, properties,
                   layer_name
            FROM feature_detail
            WHERE layer_name = ${layerName}
            ORDER BY feature_id
            LIMIT ${limit} OFFSET ${offset}
          `;
        }

        const [countRow] = await sql`
          SELECT COUNT(*) as total FROM feature_detail WHERE layer_name = ${layerName}
        `;

        return NextResponse.json({
          features: rows,
          total: Number(countRow.total),
          page,
          limit,
        });
      }

      if (action === 'geojson' && layerName) {
        // Return full GeoJSON for map rendering (limit coords for perf)
        const rows = await sql`
          SELECT properties,
                 ST_AsGeoJSON(geometry)::jsonb AS geometry
          FROM geojson_features f
          JOIN geojson_layers l ON l.id = f.layer_id
          WHERE l.layer_name = ${layerName}
          ORDER BY f.id
          LIMIT 5000
        `;
        const geojson = {
          type: 'FeatureCollection',
          features: rows.map(r => ({
            type: 'Feature',
            geometry: r.geometry,
            properties: r.properties,
          })),
        };
        return NextResponse.json(geojson);
      }

      if (action === 'stats' && layerName) {
        // Property statistics for a layer
        const [layer] = await sql`
          SELECT property_keys, feature_count FROM geojson_layers WHERE layer_name = ${layerName}
          LIMIT 1
        `;
        if (!layer) return NextResponse.json({ error: 'Layer not found' }, { status: 404 });

        const keys: string[] = layer.property_keys as string[];
        const stats: Record<string, unknown> = {};

        for (const key of keys.slice(0, 20)) { // limit to 20 keys for perf
          const rows = await sql`
            SELECT properties->>${key} AS val, COUNT(*) AS cnt
            FROM geojson_features f
            JOIN geojson_layers l ON l.id = f.layer_id
            WHERE l.layer_name = ${layerName}
              AND properties->>${key} IS NOT NULL
            GROUP BY val
            ORDER BY cnt DESC
            LIMIT 30
          `;
          stats[key] = rows.map(r => ({ value: r.val, count: Number(r.cnt) }));
        }

        return NextResponse.json({
          layerName,
          featureCount: layer.feature_count,
          propertyKeys: keys,
          stats,
        });
      }
    }

    // ── File-backed fallback (list ZIP structure) ──
    await ensureExtracted();
    const allFiles = walkDir(EXTRACT_DIR);
    const geojsonFiles = allFiles.filter(f =>
      f.toLowerCase().endsWith('.geojson') || f.toLowerCase().endsWith('.json')
    );

    if (action === 'list') {
      const layers: Omit<LayerInfo, 'data'>[] = [];
      for (const fp of geojsonFiles) {
        const data = parseGeoJSON(fp);
        if (!data) continue;
        const features = data.features ?? [];
        const geomTypes = [...new Set(features.map(f => f.geometry?.type).filter(Boolean))];
        layers.push({
          name: path.basename(fp, path.extname(fp)),
          fileName: path.relative(EXTRACT_DIR, fp).replace(/\\/g, '/'),
          geometryType: geomTypes.join(', ') || 'Unknown',
          featureCount: features.length,
          properties: features.length > 0 ? Object.keys(features[0].properties ?? {}) : [],
          bbox: getBBox(features),
        });
      }
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
      const fp = geojsonFiles.find(f =>
        path.basename(f, path.extname(f)) === layerName ||
        path.relative(EXTRACT_DIR, f).replace(/\\/g, '/') === layerName
      );
      if (!fp) return NextResponse.json({ error: `Layer "${layerName}" not found` }, { status: 404 });
      const data = parseGeoJSON(fp);
      if (!data) return NextResponse.json({ error: 'Cannot parse GeoJSON' }, { status: 500 });
      const features = data.features ?? [];
      return NextResponse.json({
        name: path.basename(fp, path.extname(fp)),
        fileName: path.relative(EXTRACT_DIR, fp).replace(/\\/g, '/'),
        geometryType: [...new Set(features.map(f => f.geometry?.type).filter(Boolean))].join(', ') || 'Unknown',
        featureCount: features.length,
        properties: features.length > 0 ? Object.keys(features[0].properties ?? {}) : [],
        bbox: getBBox(features),
        data,
      } satisfies LayerInfo);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

// ─── POST (upload ZIP) ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    fs.writeFileSync(ZIP_PATH, buffer);

    // Clear extraction cache
    if (fs.existsSync(EXTRACT_DIR)) fs.rmSync(EXTRACT_DIR, { recursive: true, force: true });
    fs.mkdirSync(EXTRACT_DIR, { recursive: true });

    // Extract and save to database
    await saveToDatabase(file.name, buffer.byteLength);

    return NextResponse.json({ success: true, fileName: file.name });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

// ─── trigger import of existing ZIP on first load ────────────────────────────
export async function PUT(_req: NextRequest) {
  try {
    if (!fs.existsSync(ZIP_PATH)) {
      return NextResponse.json({ error: 'ZIP file not found on server' }, { status: 404 });
    }
    const stat = fs.statSync(ZIP_PATH);
    await saveToDatabase(path.basename(ZIP_PATH), stat.size);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
