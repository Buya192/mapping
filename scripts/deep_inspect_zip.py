import zipfile
import json
import os
import sys

# Search all possible locations
search_paths = [
    "/vercel/share/v0-project",
    "/vercel/share",
    "/home",
    "/tmp",
    "/app",
]

zip_path = None
for base in search_paths:
    if not os.path.exists(base):
        continue
    for root, dirs, files in os.walk(base):
        # Skip node_modules and .next
        dirs[:] = [d for d in dirs if d not in ['node_modules', '.next', '.git', '__pycache__']]
        for f in files:
            if f.endswith('.zip') and 'arg-' in f.lower():
                zip_path = os.path.join(root, f)
                break
        if zip_path:
            break
    if zip_path:
        break

if not zip_path:
    print("ZIP NOT FOUND. Searching all .zip files:")
    for base in search_paths:
        if os.path.exists(base):
            for root, dirs, files in os.walk(base):
                dirs[:] = [d for d in dirs if d not in ['node_modules', '.next', '.git']]
                for f in files:
                    if f.endswith('.zip'):
                        print(f"  Found: {os.path.join(root, f)}")
    sys.exit(1)

print(f"Found ZIP: {zip_path}")
print(f"Size: {os.path.getsize(zip_path):,} bytes\n")

with zipfile.ZipFile(zip_path, 'r') as zf:
    names = zf.namelist()
    print(f"Total entries: {len(names)}\n")
    print("=== FILE LISTING ===")
    for name in sorted(names):
        info = zf.getinfo(name)
        print(f"  {name}  ({info.file_size:,} bytes)")
    
    print("\n=== GeoJSON/JSON FILE INSPECTION ===")
    geojson_files = [n for n in names if n.lower().endswith(('.geojson', '.json')) and not n.startswith('__')]
    gpkg_files = [n for n in names if n.lower().endswith('.gpkg')]
    
    print(f"GeoJSON/JSON files: {len(geojson_files)}")
    print(f"GeoPackage files:   {len(gpkg_files)}")
    
    for fname in geojson_files[:20]:  # inspect up to 20 files
        print(f"\n--- {fname} ---")
        try:
            with zf.open(fname) as f:
                content = f.read().decode('utf-8', errors='replace')
                data = json.loads(content)
                
                ftype = data.get('type', 'unknown')
                print(f"  type: {ftype}")
                
                if ftype == 'FeatureCollection':
                    features = data.get('features', [])
                    print(f"  features count: {len(features)}")
                    if features:
                        # Get geometry type
                        geom_types = set()
                        for feat in features[:10]:
                            g = feat.get('geometry')
                            if g:
                                geom_types.add(g.get('type', 'null'))
                        print(f"  geometry types: {geom_types}")
                        
                        # Get all property keys across features
                        all_keys = {}
                        for feat in features:
                            props = feat.get('properties', {}) or {}
                            for k, v in props.items():
                                if k not in all_keys:
                                    all_keys[k] = type(v).__name__ if v is not None else 'null'
                        
                        print(f"  properties ({len(all_keys)} fields):")
                        for k, vtype in list(all_keys.items())[:40]:
                            print(f"    - {k}: {vtype}")
                        
                        # Show sample feature
                        if features:
                            sample = features[0]
                            props = sample.get('properties', {}) or {}
                            print(f"  sample values (first feature):")
                            for k, v in list(props.items())[:15]:
                                print(f"    {k} = {repr(v)[:80]}")
                            
                            geom = sample.get('geometry', {})
                            if geom:
                                coords = geom.get('coordinates', [])
                                if coords:
                                    print(f"  sample coordinate: {str(coords)[:120]}")
        except Exception as e:
            print(f"  ERROR reading: {e}")
    
    if gpkg_files:
        print(f"\n=== GeoPackage files detected (binary, need geopandas) ===")
        for gf in gpkg_files:
            info = zf.getinfo(gf)
            print(f"  {gf}: {info.file_size:,} bytes")
