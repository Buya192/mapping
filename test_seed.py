import psycopg2, sys, json
sys.stdout.reconfigure(encoding='utf-8')

with open(r'd:\Projek Jar\pln-jarkom\.env') as f:
    for line in f:
        if line.startswith('DATABASE_URL='):
            db_url = line.split('=', 1)[1].strip().strip('"')
            break

base_url = db_url.split('?')[0] + "?sslmode=require"
print("Connecting...")
conn = psycopg2.connect(base_url)
conn.autocommit = False
cur = conn.cursor()
print("Connected OK!")

# Test: quick count
for table in ['gardus', 'tiang_jtm', 'jtm_segments', 'jtr_segments', 'sr_lines', 'pelanggan', 'arcgis_points']:
    cur.execute(f"SELECT COUNT(*) FROM {table}")
    count = cur.fetchone()[0]
    print(f"  {table}: {count}")

# If gardus is empty, run the full seed
cur.execute("SELECT COUNT(*) FROM gardus")
gcount = cur.fetchone()[0]

if gcount < 280:
    print("\nNeed to seed! Running...")
    # Execute the actual seed
    exec(open(r'd:\Projek Jar\pln-jarkom\seed_all_data.py', encoding='utf-8').read())
else:
    print("\nData already seeded!")

cur.close()
conn.close()
