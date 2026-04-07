import os
import subprocess

print("=== SEARCHING FOR ZIP FILE ===")

# Search from common root paths
for root_path in ["/", "/vercel", "/vercel/share", "/vercel/share/v0-project", "/home", "/tmp", "/workspace"]:
    if os.path.exists(root_path):
        print(f"\nListing: {root_path}")
        try:
            entries = os.listdir(root_path)
            for e in entries:
                print(f"  {e}")
        except Exception as ex:
            print(f"  Error: {ex}")

print("\n=== FIND ZIP RECURSIVELY ===")
try:
    result = subprocess.run(
        ["find", "/", "-name", "*.zip", "-maxdepth", "6"],
        capture_output=True, text=True, timeout=15
    )
    print(result.stdout or "(none found)")
    if result.stderr:
        print("stderr:", result.stderr[:500])
except Exception as e:
    print(f"find error: {e}")

print("\n=== CWD ===")
print(os.getcwd())
print("\n=== CWD CONTENTS ===")
for f in os.listdir(os.getcwd()):
    print(f"  {f}")
