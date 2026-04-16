import { promises as fs } from 'fs';
import path from 'path';

/**
 * Server-side helper to read GeoJSON files from the public/data directory.
 * Used as fallback when the Neon PostgreSQL database is unreachable.
 */
export async function readGeoJSON(filename: string): Promise<any> {
  const filePath = path.join(process.cwd(), 'public', 'data', filename);
  const raw = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(raw);
}

/**
 * Extract flat properties from GeoJSON features (strips geometry for table views)
 */
export function flattenFeatures(geojson: any, includeCoords = true): any[] {
  if (!geojson?.features) return [];
  return geojson.features.map((f: any, i: number) => {
    const props = { ...f.properties };
    if (includeCoords && f.geometry?.coordinates) {
      const coords = f.geometry.coordinates;
      // Handle Point
      if (f.geometry.type === 'Point') {
        props.lng = coords[0];
        props.lat = coords[1];
      }
      // Handle LineString/MultiLineString — no lat/lng for lines
    }
    return props;
  });
}

/**
 * Count features in a GeoJSON file without loading all data into memory
 */
export async function countGeoJSONFeatures(filename: string): Promise<number> {
  try {
    const data = await readGeoJSON(filename);
    return data?.features?.length || 0;
  } catch {
    return 0;
  }
}
