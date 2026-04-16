"""Resume seed v3 — bulletproof reconnect for Neon free tier disconnects"""
import json, psycopg2, sys, time
sys.stdout.reconfigure(encoding='utf-8')

DATA_DIR = r"d:\Projek Jar\pln-jarkom\public\data"
DB = "postgresql://neondb_owner:npg_jAGKn3pVS2RN@ep-delicate-butterfly-ah2wvo4v-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

def get_conn(retries=5):
    for attempt in range(retries):
        try:
            c = psycopg2.connect(DB, connect_timeout=30)
            c.autocommit = True
            return c
        except Exception as e:
            print(f"    Connect fail #{attempt+1}: {e}")
            time.sleep(5 * (attempt + 1))  # exponential backoff
    raise Exception("Cannot connect after retries")

def sf(v, d=0.0):
    if v is None: return d
    try: return float(str(v).replace(',','.'))
    except: return d

def ss(v):
    if v is None: return ''
    return str(v).strip()

def si(v):
    if v is None: return None
    try: return int(float(str(v).replace(',','.')))
    except: return None

def load(fname):
    with open(f"{DATA_DIR}/{fname}", "r", encoding="utf-8") as f:
        data = json.load(f)
    if isinstance(data, list): return data
    return data.get("features", [])

def gp(feat):
    props = {}
    for k, v in feat.get("properties", {}).items():
        if isinstance(v, str) and '<' in v and len(v) > 200: continue
        props[k] = v
    return props

B = 25  # Very small batch to prevent Neon timeout

def robust_seed(table, features, sql, val_fn, skip_ids=None):
    """Seed with robust reconnection on every error"""
    skip = skip_ids or set()
    remaining = [f for f in features if val_fn(f)[0] not in skip]
    print(f"  Total: {len(features)}, Skip: {len(skip)}, Remaining: {len(remaining)}")
    
    conn = get_conn()
    cur = conn.cursor()
    done = len(skip)
    
    for i in range(0, len(remaining), B):
        chunk = remaining[i:i+B]
        vals = [val_fn(f) for f in chunk]
        
        for attempt in range(3):
            try:
                cur.executemany(sql, vals)
                done += len(vals)
                break
            except Exception as e:
                print(f"    Batch error (attempt {attempt+1}): {str(e)[:80]}")
                try: cur.close(); conn.close()
                except: pass
                time.sleep(3 * (attempt + 1))
                conn = get_conn()
                cur = conn.cursor()
                if attempt == 2:
                    # Last resort: insert one by one
                    for v in vals:
                        try:
                            cur.execute(sql.replace("executemany",""), v)
                            done += 1
                        except: pass
        
        if done % 200 < B:
            print(f"  {done}/{len(features)}")
    
    cur.close(); conn.close()
    return done

# ============ 1. SR (resume) ============
print("[1/2] SR Lines...")
conn = get_conn()
cur = conn.cursor()
cur.execute("SELECT id FROM sr_lines")
existing_sr = set(r[0] for r in cur.fetchall())
cur.close(); conn.close()
print(f"  Already: {len(existing_sr)}")

features = load("sr-lines.geojson")
def sr_val(feat):
    p = gp(feat)
    geom = feat.get("geometry")
    return (ss(p.get("id","SR_0")),
        ss(p.get("NAMAGD")), sf(p.get("SHAPE_Length",0)),
        json.dumps(geom) if geom else None,
        ss(p.get("USERGAMBAR")), ss(p.get("TABLENAME")), "aktif")

sr_done = robust_seed("sr_lines", features,
    """INSERT INTO sr_lines (id,"namaGardu","shapeLength",geometry,
    "userGambar","tableName",status,"createdAt","updatedAt")
    VALUES (%s,%s,%s,%s,%s,%s,%s,NOW(),NOW())""",
    sr_val, existing_sr)
print(f"  SR DONE: {sr_done}")

# ============ 2. PELANGGAN ============
print("\n[2/2] Pelanggan...")
conn = get_conn()
cur = conn.cursor()
cur.execute("SELECT id FROM pelanggan")
existing_plg = set(r[0] for r in cur.fetchall())
cur.close(); conn.close()
print(f"  Already: {len(existing_plg)}")

features = load("pelanggan.geojson")
def plg_val(feat):
    p = gp(feat)
    coords = feat.get("geometry", {}).get("coordinates", [0,0])
    lat = sf(p.get("LATITUDEY", coords[1] if len(coords)>1 else 0))
    lng = sf(p.get("LONGITUDEX", coords[0] if len(coords)>0 else 0))
    return (ss(p.get("id","PLG_0")),
        ss(p.get("NAMAGD")), ss(p.get("NAMAPENYULANG")),
        ss(p.get("ULP")), ss(p.get("FASA")),
        ss(p.get("JENIS_KWH")), ss(p.get("NOKWHMETER")),
        ss(p.get("KODE_TIANG_TR")), ss(p.get("KONDISI_SR")),
        ss(p.get("KONEKTOR")), sf(p.get("PANJANG_HANTARAN",0)),
        ss(p.get("SEGEL_APP")), ss(p.get("TARIKAN_KE")),
        lat, lng,
        ss(p.get("JENIS_HANTARAN")), ss(p.get("UKURAN_KAWAT")),
        ss(p.get("NAMA_SURVEYOR")), ss(p.get("DESCRIPTION")),
        ss(p.get("RT")), ss(p.get("SAMBUNGAN_KE")),
        si(p.get("SAMBUNG_LANGSUNG")), si(p.get("TAP_KONEKTOR")),
        si(p.get("DAK_STANDAT")), ss(p.get("ASESORIS")),
        ss(p.get("TGLGAMBAR")), ss(p.get("USERGAMBAR")),
        ss(p.get("TABLENAME")), "aktif")

plg_done = robust_seed("pelanggan", features,
    """INSERT INTO pelanggan (id,"namaGardu",penyulang,ulp,fasa,"jenisKwh","noKwhMeter",
    "kodeTiangTR","kondisiSR",konektor,"panjangHantaran","segelApp","tarikanKe",
    latitude,longitude,
    "jenisHantaran","ukuranKawat","namaSurveyor",description,rt,
    "sambunganKe","sambungLangsung","tapKonektor","dakStandat",asesoris,
    "tglGambar","userGambar","tableName",status,"createdAt","updatedAt")
    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,NOW(),NOW())""",
    plg_val, existing_plg)
print(f"  PLG DONE: {plg_done}")

# ============ VERIFY ============
print("\n" + "="*50)
conn = get_conn()
cur = conn.cursor()
tables = [("gardus","Gardu",281),("tiang_jtm","Tiang",14424),("jtm_segments","Tiang JTM",9649),
          ("jtr_segments","JTR",1333),("sr_lines","SR",8805),("pelanggan","Pelanggan",9929),("arcgis_points","ArcGIS",38)]
gt = 0
for t, l, target in tables:
    cur.execute(f"SELECT COUNT(*) FROM {t}")
    c = cur.fetchone()[0]
    gt += c
    ok = "✓" if c >= target - 20 else "✗"
    print(f"  {ok} {l:15s}: {c:>6,} / {target:>6,}")
print(f"    {'TOTAL':15s}: {gt:>6,} / 44,459")
cur.close(); conn.close()
print("\nDONE!")
