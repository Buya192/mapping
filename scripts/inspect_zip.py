import zipfile
import os
import json

zip_path = '/vercel/share/v0-project/arg-20260406T131920Z-3-001.zip'
extract_dir = '/vercel/share/v0-project/scripts/zip_extracted'

print("=== ZIP FILE CONTENTS ===")
with zipfile.ZipFile(zip_path, 'r') as zf:
    for info in zf.infolist():
        size_kb = info.file_size / 1024
        print(f"  {info.filename}  ({size_kb:.1f} KB)")

print("\n=== EXTRACTING ===")
os.makedirs(extract_dir, exist_ok=True)
with zipfile.ZipFile(zip_path, 'r') as zf:
    zf.extractall(extract_dir)
print("Extracted successfully")

print("\n=== EXTRACTED STRUCTURE ===")
for root, dirs, files in os.walk(extract_dir):
    level = root.replace(extract_dir, '').count(os.sep)
    indent = '  ' * level
    folder = os.path.basename(root)
    if level > 0:
        print(f"{indent}[DIR] {folder}/")
    for f in files:
        fp = os.path.join(root, f)
        size_mb = os.path.getsize(fp) / 1024 / 1024
        sub_indent = '  ' * (level + 1)
        print(f"{sub_indent}[FILE] {f}  ({size_mb:.2f} MB)")

print("\n=== SAMPLE FILE CONTENTS ===")
text_exts = {'.json', '.geojson', '.csv', '.txt', '.xml', '.kml', '.gml', '.gpx', '.topojson', '.tsv'}

for root, dirs, files in os.walk(extract_dir):
    for f in files:
        ext = os.path.splitext(f)[1].lower()
        if ext in text_exts:
            fp = os.path.join(root, f)
            print(f"\n--- {f} ---")
            try:
                with open(fp, 'r', encoding='utf-8', errors='replace') as fh:
                    content = fh.read(3000)
                    print(content)
                    print(f"[... total size: {os.path.getsize(fp)/1024:.1f} KB]")
            except Exception as e:
                print(f"Could not read: {e}")
