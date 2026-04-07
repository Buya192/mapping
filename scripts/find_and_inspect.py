import os
import zipfile
import json

# Search everywhere
print("=== SEARCHING FOR ZIP FILES ===")
search_roots = ['/', '/home', '/tmp', '/vercel', '/var', '/root']
found = []

for sr in search_roots:
    if not os.path.exists(sr):
        continue
    try:
        for root, dirs, files in os.walk(sr):
            # skip heavy directories
            dirs[:] = [d for d in dirs if d not in ('proc', 'sys', 'dev', 'run', 'node_modules', '.next', '.git')]
            for f in files:
                if f.endswith('.zip'):
                    fp = os.path.join(root, f)
                    size = os.path.getsize(fp)
                    print(f"  FOUND: {fp}  ({size/1024:.1f} KB)")
                    found.append(fp)
    except PermissionError:
        pass

print(f"\nTotal ZIP files found: {len(found)}")

if found:
    for zp in found:
        if 'arg-' in zp or 'v0-project' in zp:
            print(f"\n=== CONTENTS OF {zp} ===")
            try:
                with zipfile.ZipFile(zp, 'r') as zf:
                    for info in zf.infolist():
                        print(f"  {info.filename}  ({info.file_size/1024:.1f} KB)")
                    
                    # Read first text file
                    for info in zf.infolist():
                        ext = os.path.splitext(info.filename)[1].lower()
                        if ext in ('.json', '.geojson', '.csv', '.txt', '.xml', '.kml'):
                            print(f"\n--- SAMPLE: {info.filename} ---")
                            content = zf.read(info.filename).decode('utf-8', errors='replace')
                            print(content[:4000])
                            print(f"[Total: {len(content)} chars]")
                            break
            except Exception as e:
                print(f"  Error reading: {e}")

print("\n=== PROJECT DIRECTORY LISTING ===")
for root, dirs, files in os.walk('/vercel/share/v0-project'):
    dirs[:] = [d for d in dirs if d not in ('node_modules', '.next', '.git')]
    level = root.replace('/vercel/share/v0-project', '').count(os.sep)
    indent = '  ' * level
    print(f"{indent}{os.path.basename(root)}/")
    for f in files:
        fp = os.path.join(root, f)
        size = os.path.getsize(fp)
        sub = '  ' * (level + 1)
        print(f"{sub}{f}  ({size/1024:.1f} KB)")
