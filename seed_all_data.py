"""
SEED v4 — Uses TRUNCATE CASCADE + fresh connection per table
Fixes lock issue with Neon remote PostgreSQL
"""
import json, psycopg2, sys
sys.stdout.reconfigure(encoding='utf-8')

DATA_DIR = r"d:\Projek Jar\pln-jarkom\public\data"
DB_URL = "postgresql://neondb_owner:npg_jAGKn3pVS2RN@ep-delicate-butterfly-ah2wvo4v-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

def get_conn():
    c = psycopg2.connect(DB_URL)
    c.autocommit = True
    return c

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

B = 100  # Very small batch for remote DB stability

def seed_table(name, table, features, sql_fn, val_fn):
    print(f"\n[{name}] {len(features)} records...")
    conn = get_conn()
    cur = conn.cursor()
    # Use TRUNCATE for speed (no row locks)
    cur.execute(f"TRUNCATE TABLE {table} CASCADE")
    if 'tiang_jtm' == table:
        cur.execute("ALTER SEQUENCE tiang_jtm_id_seq RESTART WITH 1")
    print(f"  Truncated {table}")
    
    total = 0
    for i in range(0, len(features), B):
        chunk = features[i:i+B]
        vals = [val_fn(feat) for feat in chunk]
        try:
            cur.executemany(sql_fn, vals)
            total += len(vals)
            print(f"  {total}/{len(features)}")
        except Exception as e:
            print(f"  ERROR at batch {i}: {e}")
            # Reconnect on error
            try: cur.close(); conn.close()
            except: pass
            conn = get_conn()
            cur = conn.cursor()
            # Retry
            try:
                cur.executemany(sql_fn, vals)
                total += len(vals)
                print(f"  {total}/{len(features)} (retry OK)")
            except Exception as e2:
                print(f"  SKIP batch: {e2}")
    
    cur.close()
    conn.close()
    print(f"  DONE: {total}")
    return total

# ============ 1. GARDU ============
features = load("gardu-arcgis.geojson")
def gardu_val(feat):
    p = gp(feat)
    coords = feat.get("geometry", {}).get("coordinates", [0,0])
    lat = sf(p.get("LATITUDEY", coords[1] if len(coords)>1 else 0))
    lng = sf(p.get("LONGITUDEX", coords[0] if len(coords)>0 else 0))
    return (ss(p.get("id",f"G_0")), ss(p.get("NAMAGD") or p.get("Name","?")),
        ss(p.get("NAMAGD")), ss(p.get("RUJUKAN_KONSTRUKSI")),
        si(p.get("KAPASITAS")) or 0, ss(p.get("MANUFACTURER")),
        ss(p.get("FASA_TRAFO")), ss(p.get("NAMAPENYULANG")), lat, lng,
        ss(p.get("DESCRIPTION")), ss(p.get("PERUNTUKAN")),
        ss(p.get("TH_BUAT")), ss(p.get("ULP")),
        ss(p.get("NO_TRAFO")), ss(p.get("JENIS_TRAFO")),
        ss(p.get("NAMA_SURVEYOR")), ss(p.get("TGLGAMBAR")),
        ss(p.get("USERGAMBAR")), ss(p.get("TABLENAME")),
        ss(p.get("LATITUDEY")), ss(p.get("LONGITUDEX")), "aktif")
seed_table("1/7 GARDU", "gardus", features,
    """INSERT INTO gardus (id,name,"namaGardu",construction,capacity_kva,brand,phases,feeder,lat,lng,
    description,peruntukan,"thBuat",ulp,"noTrafo","jenisTrafo","namaSurveyor","tglGambar","userGambar","tableName",
    "latitudeY","longitudeX",status,"createdAt","updatedAt") VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,NOW(),NOW())""",
    gardu_val)

# ============ 2. TIANG ============
features = load("tiang-arcgis.geojson")
def tiang_val(feat):
    p = gp(feat)
    coords = feat.get("geometry", {}).get("coordinates", [0,0])
    lat = sf(p.get("LATITUDEY", coords[1] if len(coords)>1 else 0))
    lng = sf(p.get("LONGITUDEX", coords[0] if len(coords)>0 else 0))
    return (ss(p.get("NOTIANGTR") or p.get("Name","TIANG")), 0,
        ss(p.get("OWNER_PEMELIHARAAN")), "", ss(p.get("NAMAPENYULANG")), ss(p.get("CLASSIFICATION")),
        "", ss(p.get("JENIS_TIANG")),
        ss(p.get("UKURAN_TIANG")).split('/')[0] if p.get("UKURAN_TIANG") else "",
        "", si(p.get("KEKUATAN_TIANG")) or 0, "",
        ss(p.get("KODE_KONSTRUKSI_1")), ss(p.get("KODE_KONSTRUKSI_4")),
        ss(p.get("JENIS_PENGHANTAR")), "", ss(p.get("UKURAN_PENGHANTAR")), "",
        ss(p.get("PERUNTUKAN")), "", "", "", "", "",
        lat, lng, "aktif",
        ss(p.get("KONDISI_TIANG")), ss(p.get("NAMAGD")),
        ss(p.get("NAMA_SURVEYOR")), ss(p.get("TGLGAMBAR")),
        ss(p.get("USERGAMBAR")), ss(p.get("MANUFACTURER")),
        ss(p.get("TABLENAME")), ss(p.get("DESCRIPTION")),
        ss(p.get("UKURAN_TIANG")), sf(p.get("PANJANG LVTC"), None),
        si(p.get("SA")), si(p.get("FDE")), si(p.get("LA")),
        si(p.get("TIANG_BESI")), si(p.get("TIANG_BETON")),
        si(p.get("TIANG_7")), si(p.get("TIANG_9")),
        si(p.get("TIANG_11")), si(p.get("TIANG_12")),
        si(p.get("TRECK_SCHOOR")), si(p.get("DRUCK_SCHOOR")),
        si(p.get("KONTRAMAST")), si(p.get("EXTERNALREFID")),
        ss(p.get("LATITUDEY")), ss(p.get("LONGITUDEX")))
seed_table("2/7 TIANG", "tiang_jtm", features,
    """INSERT INTO tiang_jtm (nama_tiang,urutan_tiang,ulp,sulp,penyulang,jenis_aset,
    asset_p3,jenis_tiang,tipe_tiang,pondasi_tiang,kekuatan_tiang,penopang,
    konstruksi_1,konstruksi_2,jenis_hantaran_1,jenis_hantaran_2,
    ukuran_hantaran_1,ukuran_hantaran_2,under_built,vendor,
    install_date,operating_date,alamat,kepemilikan,
    latitude,longitude,status,
    "kondisiTiang","namaGardu","namaSurveyor","tglGambar","userGambar",
    manufacturer,"tableName",description,"ukuranTiang","panjangLvtc",
    sa,fde,la,"tiangBesi","tiangBeton",tiang7,tiang9,tiang11,tiang12,
    "treckSchoor","druckSchoor",kontramast,"externalRefId",
    "latitudeY","longitudeX","createdAt","updatedAt")
    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,
            %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,NOW(),NOW())""",
    tiang_val)

# ============ 3. TIANG JTM ============
features = load("jtm-lines.geojson")
def jtm_val(feat):
    p = gp(feat)
    coords = feat.get("geometry", {}).get("coordinates", [0,0])
    lat_v = sf(p.get("LATITUDEY", coords[1] if len(coords)>1 else 0))
    lng_v = sf(p.get("LONGITUDEX", coords[0] if len(coords)>0 else 0))
    return (ss(p.get("id",f"JTM_0")),
        ss(p.get("DESCRIPTION") or p.get("Name","Tiang JTM")),
        ss(p.get("Penyulang_KMZ") or p.get("NAMAPENYULANG")),
        sf(p.get("PANJANG_HANTARAN",0))/1000, "", "", "",
        ss(p.get("UKURAN_TIANG_TM")), "",
        ss(p.get("UNITNAME") or p.get("CITY")),
        str(sf(p.get("PANJANG_HANTARAN",0))), None, "aktif",
        ss(p.get("CXCLASSIFICATIONDESC")), "", "",
        ss(p.get("KODE_KONSTRUKSI_1")), "", "", "", "", "",
        ss(p.get("STATUS_KEPEMILIKAN")), "",
        ss(p.get("CITY")), ss(p.get("LOCATION")),
        ss(p.get("SADDRESSCODE")), ss(p.get("TUJDNUMBER")),
        ss(p.get("TYPE_PONDASI")), ss(p.get("JENIS_TIANG")),
        ss(p.get("LATITUDEY")), ss(p.get("LONGITUDEX")),
        lat_v, lng_v)
seed_table("3/7 TIANG JTM", "jtm_segments", features,
    """INSERT INTO jtm_segments (id,name,feeder,length_km,voltage,material,conductor_type,
    size_mm2,phases,unit,raw_length,geometry,status,
    asset_type,start_measure,end_measure,conductor_code,priority,
    phase_position,neutral,mainline,circuit,ownership,cable_type,
    city,location,"saddressCode","tujdNumber","typePondasi","jenisTiang",
    "latitudeY","longitudeX",lat,lng,"createdAt","updatedAt")
    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,NOW(),NOW())""",
    jtm_val)

# ============ 4. JTR ============
features = load("jtr-lines.geojson")
def jtr_val(feat):
    p = gp(feat)
    geom = feat.get("geometry")
    return (ss(p.get("id","JTR_0")), ss(p.get("Name")),
        ss(p.get("DESCRIPTION")), ss(p.get("NAMAGD")),
        ss(p.get("NAMAPENYULANG")), ss(p.get("FEATURE")),
        ss(p.get("FASA_JARINGAN")), ss(p.get("JENIS_KABEL")),
        ss(p.get("UKURAN_KAWAT")), ss(p.get("JURUSAN")),
        ss(p.get("KODEHANTARAN")), ss(p.get("HANTARAN_NETRAL")),
        sf(p.get("PANJANG_HANTARAN",0)), sf(p.get("SHAPE_Length",0)),
        json.dumps(geom) if geom else None,
        ss(p.get("OWNER_PEMELIHARAAN")), ss(p.get("USERGAMBAR")),
        ss(p.get("TGLGAMBAR")), ss(p.get("TABLENAME")),
        ss(p.get("POSISI_FASA")), ss(p.get("CLASSIFICATION")), "aktif")
seed_table("4/7 JTR", "jtr_segments", features,
    """INSERT INTO jtr_segments (id,name,description,"namaGardu",penyulang,feature,
    "fasaJaringan","jenisKabel","ukuranKawat",jurusan,"kodeHantaran","hantaranNetral",
    "panjangHantaran","shapeLength",geometry,
    "ownerPemeliharaan","userGambar","tglGambar","tableName","posisiFasa",classification,
    status,"createdAt","updatedAt")
    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,NOW(),NOW())""",
    jtr_val)

# ============ 5. SR ============
features = load("sr-lines.geojson")
def sr_val(feat):
    p = gp(feat)
    geom = feat.get("geometry")
    return (ss(p.get("id","SR_0")),
        ss(p.get("NAMAGD")), sf(p.get("SHAPE_Length",0)),
        json.dumps(geom) if geom else None,
        ss(p.get("USERGAMBAR")), ss(p.get("TABLENAME")), "aktif")
seed_table("5/7 SR", "sr_lines", features,
    """INSERT INTO sr_lines (id,"namaGardu","shapeLength",geometry,
    "userGambar","tableName",status,"createdAt","updatedAt")
    VALUES (%s,%s,%s,%s,%s,%s,%s,NOW(),NOW())""",
    sr_val)

# ============ 6. PELANGGAN ============
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
seed_table("6/7 PELANGGAN", "pelanggan", features,
    """INSERT INTO pelanggan (id,"namaGardu",penyulang,ulp,fasa,"jenisKwh","noKwhMeter",
    "kodeTiangTR","kondisiSR",konektor,"panjangHantaran","segelApp","tarikanKe",
    latitude,longitude,
    "jenisHantaran","ukuranKawat","namaSurveyor",description,rt,
    "sambunganKe","sambungLangsung","tapKonektor","dakStandat",asesoris,
    "tglGambar","userGambar","tableName",status,"createdAt","updatedAt")
    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,NOW(),NOW())""",
    plg_val)

# ============ 7. ArcGIS ============
print("\n[7/7] ArcGIS Points...")
conn = get_conn()
cur = conn.cursor()
cur.execute("SELECT COUNT(*) FROM arcgis_points")
print(f"  Already: {cur.fetchone()[0]} points")

# ============ VERIFY ============
print("\n" + "="*50)
tables = [("gardus","Gardu"),("tiang_jtm","Tiang"),("jtm_segments","Tiang JTM"),
          ("jtr_segments","JTR"),("sr_lines","SR"),("pelanggan","Pelanggan"),("arcgis_points","ArcGIS")]
gt = 0
for t, l in tables:
    cur.execute(f"SELECT COUNT(*) FROM {t}")
    c = cur.fetchone()[0]
    gt += c
    print(f"  {l:20s}: {c:>6,}")
print(f"  {'TOTAL':20s}: {gt:>6,}")
cur.close(); conn.close()
print("DONE!")
