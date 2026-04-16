import pyogrio
import json
import re
import os

path = r"d:\Projek Jar\pln-jarkom\_arg_gdb.gdb"

df = pyogrio.read_dataframe(path, layer="Points")

# Parse all points
all_points = []
for i in range(len(df)):
    row = df.iloc[i]
    name = row.get('Name', '')
    geom = row.get('geometry', None)
    coords = list(geom.coords) if geom else None
    lat = round(coords[0][1], 6) if coords else None
    lng = round(coords[0][0], 6) if coords else None
    
    popup = str(row.get('PopupInfo', ''))
    desc = ''
    if '<td' in popup:
        rows_html = re.findall(r"<td[^>]*>(.*?)</td>", popup)
        pairs = list(zip(rows_html[::2], rows_html[1::2]))
        for k, v in pairs:
            k_clean = re.sub(r'<[^>]+>', '', k).strip()
            v_clean = re.sub(r'<[^>]+>', '', v).strip()
            if k_clean.lower() in ('decription', 'description') and v_clean and v_clean != '&nbsp;':
                desc = v_clean
    
    all_points.append({
        'name': name,
        'lat': lat,
        'lng': lng,
        'desc': desc  # 'pangkal' or 'ujung'
    })

# Group by name - pair pangkal and ujung
from collections import defaultdict
grouped = defaultdict(dict)
for pt in all_points:
    grouped[pt['name']][pt['desc']] = pt

# Classify jenis (type) from name
def classify_jenis(name):
    name_upper = name.upper()
    if 'LBS' in name_upper:
        return 'LBS'
    if 'INTERKONEKSI' in name_upper:
        return 'INTERKONEKSI'
    if 'CO ' in name_upper or name_upper.startswith('CO '):
        return 'CO'
    if 'RECLOSER' in name_upper or 'REC.' in name_upper:
        return 'RECLOSER'
    if 'UJUNG TM' in name_upper:
        return 'UJUNG_TM'
    return 'LAINNYA'

# Build proteksi records
proteksi_records = []
for name, pts in grouped.items():
    pangkal = pts.get('pangkal', {})
    ujung = pts.get('ujung', {})
    
    record = {
        'nama': name,
        'jenis': classify_jenis(name),
        'penyulang': 'Kalabahi',
        'deskripsi': f"Pangkal -> Ujung",
        'pangkal_lat': pangkal.get('lat', 0),
        'pangkal_lng': pangkal.get('lng', 0),
        'ujung_lat': ujung.get('lat', 0),
        'ujung_lng': ujung.get('lng', 0),
    }
    proteksi_records.append(record)

print(f"Total proteksi records: {len(proteksi_records)}")

# ===== 1. Generate GeoJSON =====
features_points = []
features_lines = []

for rec in proteksi_records:
    # Point feature at pangkal location
    features_points.append({
        "type": "Feature",
        "properties": {
            "nama": rec['nama'],
            "jenis": rec['jenis'],
            "penyulang": rec['penyulang'],
            "posisi": "pangkal"
        },
        "geometry": {
            "type": "Point",
            "coordinates": [rec['pangkal_lng'], rec['pangkal_lat']]
        }
    })
    # Point feature at ujung location
    features_points.append({
        "type": "Feature",
        "properties": {
            "nama": rec['nama'],
            "jenis": rec['jenis'],
            "penyulang": rec['penyulang'],
            "posisi": "ujung"
        },
        "geometry": {
            "type": "Point",
            "coordinates": [rec['ujung_lng'], rec['ujung_lat']]
        }
    })
    # Line connecting pangkal to ujung
    if rec['pangkal_lat'] and rec['ujung_lat']:
        features_lines.append({
            "type": "Feature",
            "properties": {
                "nama": rec['nama'],
                "jenis": rec['jenis'],
                "penyulang": rec['penyulang'],
            },
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [rec['pangkal_lng'], rec['pangkal_lat']],
                    [rec['ujung_lng'], rec['ujung_lat']]
                ]
            }
        })

geojson = {
    "type": "FeatureCollection",
    "features": features_points + features_lines
}

# Write GeoJSON to public/data/layers
os.makedirs(r"d:\Projek Jar\pln-jarkom\public\data\layers", exist_ok=True)
with open(r"d:\Projek Jar\pln-jarkom\public\data\layers\proteksi.geojson", "w", encoding="utf-8") as f:
    json.dump(geojson, f, ensure_ascii=False, indent=2)

print(f"GeoJSON written: {len(features_points)} points + {len(features_lines)} lines")

# ===== 2. Insert into PostgreSQL =====
import psycopg2

# Parse DATABASE_URL from .env
with open(r"d:\Projek Jar\pln-jarkom\.env") as f:
    for line in f:
        if line.startswith('DATABASE_URL='):
            db_url = line.split('=', 1)[1].strip().strip('"')
            break

# Parse connection parameters from URL, handle channel_binding parameter
# psycopg2 doesn't support channel_binding, so strip it
base_url = db_url.split('?')[0]
print(f"Connecting to: {base_url[:50]}...")

conn = psycopg2.connect(base_url + "?sslmode=require")
cur = conn.cursor()

# Clear existing proteksi data
cur.execute("DELETE FROM proteksi")
print("Cleared existing proteksi data")

# Insert all records
import uuid

for rec in proteksi_records:
    cuid = f"clp{uuid.uuid4().hex[:22]}"
    cur.execute("""
        INSERT INTO proteksi (id, nama, jenis, penyulang, deskripsi, pangkal_lat, pangkal_lng, ujung_lat, ujung_lng, status, "createdAt", "updatedAt")
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
    """, (
        cuid,
        rec['nama'],
        rec['jenis'],
        rec['penyulang'],
        rec['deskripsi'],
        rec['pangkal_lat'],
        rec['pangkal_lng'],
        rec['ujung_lat'],
        rec['ujung_lng'],
        'aktif'
    ))

conn.commit()
print(f"Inserted {len(proteksi_records)} proteksi records into database")

# Verify
cur.execute("SELECT COUNT(*), array_agg(DISTINCT jenis) FROM proteksi")
count, types = cur.fetchone()
print(f"Verification: {count} records, types: {types}")

cur.close()
conn.close()
print("Done!")
