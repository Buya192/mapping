"""Seed PLTS, PLTD, FCO, Recloser/LBS data from hardware-data.ts"""
import psycopg2, sys
sys.stdout.reconfigure(encoding='utf-8')

DB = "postgresql://neondb_owner:npg_jAGKn3pVS2RN@ep-delicate-butterfly-ah2wvo4v-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Data from hardware-data.ts
items = [
    # PLTS (Solar PV)
    ('pembangkit_0', 'PLTS PURA', 'pembangkit', -8.298018140908948, 124.3214521112074, 250, 20, 'SMA Solar', None, 'Solar PV', 'Aktif'),
    ('pembangkit_1', 'PLTS TERNATE', 'pembangkit', -8.209715821676065, 124.3751469843765, 75, 20, 'SMA Solar', None, 'Solar PV', 'Aktif'),
    ('pembangkit_2', 'PLTS TREWENG', 'pembangkit', -8.471461351468641, 124.2798753587323, 100, 20, 'SMA Solar', None, 'Solar PV', 'Aktif'),
    ('pembangkit_3', 'PLTS NULE', 'pembangkit', -8.372512233214918, 124.240433487744, 150, 20, 'SMA Solar', None, 'Solar PV', 'Aktif'),
    ('pembangkit_4', 'PLTS MATARU BARAT', 'pembangkit', -8.370140049289377, 124.6238232601154, 100, 20, 'SMA Solar', None, 'Solar PV', 'Aktif'),
    ('pembangkit_5', 'PLTS KAMAIFUI', 'pembangkit', -8.341238052573921, 124.6658707425071, 75, 20, 'SMA Solar', None, 'Solar PV', 'Aktif'),
    ('pembangkit_6', 'PLTS TRIBUR', 'pembangkit', -8.40575488377355, 124.4953079696157, 100, 20, 'SMA Solar', None, 'Solar PV', 'Aktif'),
    ('pembangkit_7', 'PLTS LANGKURU', 'pembangkit', -8.38561705927393, 124.8320662715082, 50, 20, 'SMA Solar', None, 'Solar PV', 'Aktif'),
    ('pembangkit_8', 'PLTS KUNEMAN', 'pembangkit', -8.344639150229876, 124.7887296274876, 50, 20, 'SMA Solar', None, 'Solar PV', 'Aktif'),
    # PLTD (Diesel)
    ('pembangkit_9', 'PLTD FANATING (AGGREKO)', 'pembangkit', -8.243856157728413, 124.5322143610939, 4000, 20, 'Aggreko', None, 'Diesel', 'Aktif'),
    ('pembangkit_10', 'PLTD KADELANG', 'pembangkit', -8.218740444216644, 124.5372800462483, 12000, 20, 'Niigata / MAN', None, 'Diesel', 'Aktif'),
    ('pembangkit_11', 'PLTD PURA', 'pembangkit', -8.277391948846565, 124.3524332073454, 500, 20, 'Cummins', None, 'Diesel', 'Aktif'),
    ('pembangkit_12', 'PLTD MARITAING', 'pembangkit', -8.291060771160323, 125.1237843462173, 1000, 20, 'Cummins', None, 'Diesel', 'Aktif'),
    ('pembangkit_13', 'PLTD NULE', 'pembangkit', -8.37279035295086, 124.2407954783367, 1000, 20, 'Cummins', None, 'Diesel', 'Aktif'),
    # FCO (Fuse Cut Out) - 83 items
    ('fco_0', 'FCO PAILELANG', 'fco', -8.25149163755615, 124.530583490659, None, 20, 'Polymer/Standard', 100, None, 'Aktif'),
    ('fco_1', 'FCO RUMAH RAJA', 'fco', -8.25575042872353, 124.5103171196953, None, 20, 'Polymer/Standard', 200, None, 'Aktif'),
    ('fco_2', 'FCO WATAKIKA', 'fco', -8.291795228258595, 124.4167446963263, None, 20, 'Polymer/Standard', 50, None, 'Aktif'),
    ('fco_3', 'FCO TALWAI', 'fco', -8.254607051968611, 124.7202293564846, None, 20, 'Polymer/Standard', 200, None, 'Aktif'),
    ('fco_4', 'FCO MAIPUI', 'fco', -8.25455640681936, 124.721685996029, None, 20, 'Polymer/Standard', 50, None, 'Aktif'),
    ('fco_5', 'FCO KELAISI', 'fco', -8.279624507460907, 124.7175407380667, None, 20, 'Polymer/Standard', 50, None, 'Aktif'),
    ('fco_6', 'FCO MANMAS', 'fco', -8.28365148060881, 124.7130758365588, None, 20, 'Polymer/Standard', 50, None, 'Aktif'),
    ('fco_7', 'FCO KELAISI BARAT', 'fco', -8.277928075288857, 124.6992675011301, None, 20, 'Polymer/Standard', 100, None, 'Aktif'),
    ('fco_8', 'FCO MANETWATI', 'fco', -8.282642613238723, 124.6740287857517, None, 20, 'Polymer/Standard', 100, None, 'Aktif'),
    ('fco_9', 'FCO LELA', 'fco', -8.297679416499125, 124.7417910488564, None, 20, 'Polymer/Standard', 100, None, 'Aktif'),
    ('fco_10', 'FCO SILAPUI', 'fco', -8.294193004882763, 124.7670271267675, None, 20, 'Polymer/Standard', 200, None, 'Aktif'),
    ('fco_11', 'FCO KENARIMBALA', 'fco', -8.16838324099907, 124.8589039550886, None, 20, 'Polymer/Standard', 200, None, 'Aktif'),
    ('fco_12', 'FCO MAUKURU', 'fco', -8.167751894241604, 124.8603929169522, None, 20, 'Polymer/Standard', 100, None, 'Aktif'),
    ('fco_13', 'FCO LUBA', 'fco', -8.163190917772019, 124.6786264486345, None, 20, 'Polymer/Standard', 100, None, 'Aktif'),
    ('fco_14', 'FCO ALEMBA', 'fco', -8.154138435700686, 124.7371648387841, None, 20, 'Polymer/Standard', 200, None, 'Aktif'),
    ('fco_15', 'FCO NAILANG', 'fco', -8.167778555310212, 124.7577440596084, None, 20, 'Polymer/Standard', 100, None, 'Aktif'),
    ('fco_16', 'FCO KAFAKBEKA', 'fco', -8.166108062142023, 124.6642327285316, None, 20, 'Polymer/Standard', 50, None, 'Aktif'),
    ('fco_17', 'FCO MALI', 'fco', -8.137543365392201, 124.5901736608673, None, 20, 'Polymer/Standard', 200, None, 'Aktif'),
    ('fco_18', 'FCO BANDARA', 'fco', -8.137150865851138, 124.5905553078224, None, 20, 'Polymer/Standard', 100, None, 'Aktif'),
    ('fco_19', 'FCO PANTE DERE', 'fco', -8.13715996874234, 124.5896064373191, None, 20, 'Polymer/Standard', 100, None, 'Aktif'),
    ('fco_20', 'FCO ILAWE', 'fco', -8.125989025822914, 124.5650722631546, None, 20, 'Polymer/Standard', 100, None, 'Aktif'),
    ('fco_21', 'FCO BATUPUTIH', 'fco', -8.129537105218295, 124.540081469488, None, 20, 'Polymer/Standard', 100, None, 'Aktif'),
    ('fco_22', 'FCO MATARU TIMUR', 'fco', -8.338333788985533, 124.6512132318121, None, 20, 'Polymer/Standard', 200, None, 'Aktif'),
    ('fco_23', 'FCO MATARU UTARA', 'fco', -8.346385913035732, 124.6339321069565, None, 20, 'Polymer/Standard', 100, None, 'Aktif'),
    ('fco_24', 'FCO MATARU BARAT', 'fco', -8.346617067637402, 124.6343930449776, None, 20, 'Polymer/Standard', 50, None, 'Aktif'),
    ('fco_25', 'FCO KAMAIFUI', 'fco', -8.336227137353585, 124.6679635676572, None, 20, 'Polymer/Standard', 200, None, 'Aktif'),
    ('fco_26', 'FCO KALUNAN', 'fco', -8.386219766268546, 124.6717962522014, None, 20, 'Polymer/Standard', 200, None, 'Aktif'),
    ('fco_27', 'FCO PADANG ALANG', 'fco', -8.394058757124863, 124.6938623098239, None, 20, 'Polymer/Standard', 200, None, 'Aktif'),
    ('fco_28', 'FCO MOLA', 'fco', -8.216102092146201, 124.5672569802344, None, 20, 'Polymer/Standard', 50, None, 'Aktif'),
    ('fco_29', 'FCO KADELANG', 'fco', -8.219018638806046, 124.5382167653652, None, 20, 'Polymer/Standard', 100, None, 'Aktif'),
    ('fco_30', 'FCO WATAKIKA', 'fco', -8.291795228258595, 124.4167446963263, None, 20, 'Polymer/Standard', 100, None, 'Aktif'),
    ('fco_31', 'FCO RUMAH RAJA', 'fco', -8.25575042872353, 124.5103171196953, None, 20, 'Polymer/Standard', 100, None, 'Aktif'),
    ('fco_32', 'FCO SIBONE', 'fco', -8.174084000000001, 124.644268, None, 20, 'Polymer/Standard', 50, None, 'Aktif'),
    ('fco_33', 'FCO PASAR MAINANG', 'fco', -8.284808342048498, 124.6260638799915, None, 20, 'Polymer/Standard', 200, None, 'Aktif'),
    ('fco_34', 'FCO FUISAMA', 'fco', -8.277805919607729, 124.6173038842088, None, 20, 'Polymer/Standard', 100, None, 'Aktif'),
    ('fco_35', 'FCO MANATANG', 'fco', -8.444309000000001, 124.45083, None, 20, 'Polymer/Standard', 100, None, 'Aktif'),
    ('fco_36', 'FCO HOPTER', 'fco', -8.414203000000001, 124.416583, None, 20, 'Polymer/Standard', 100, None, 'Aktif'),
    ('fco_37', 'FCO MARGETA', 'fco', -8.4366, 124.422123, None, 20, 'Polymer/Standard', 200, None, 'Aktif'),
    ('fco_38', 'FCO PROBUR', 'fco', -8.375482999999999, 124.417385, None, 20, 'Polymer/Standard', 50, None, 'Aktif'),
    ('fco_39', 'FCO DPR', 'fco', -8.207499324169543, 124.575630823014, None, 20, 'Polymer/Standard', 50, None, 'Aktif'),
    ('fco_40', 'FCO HABOLAT', 'fco', -8.323225000000001, 124.426723, None, 20, 'Polymer/Standard', 50, None, 'Aktif'),
    ('fco_41', 'FCO WORMANEM', 'fco', -8.34652, 124.427355, None, 20, 'Polymer/Standard', 100, None, 'Aktif'),
    ('fco_42', 'FCO WELAI', 'fco', -8.24774, 124.544377, None, 20, 'Polymer/Standard', 50, None, 'Aktif'),
    ('fco_43', 'FCO FOANG', 'fco', -8.254728999999999, 124.475953, None, 20, 'Polymer/Standard', 100, None, 'Aktif'),
    ('fco_44', 'FCO KAIMAKALI', 'fco', -8.3101, 124.65046, None, 20, 'Polymer/Standard', 50, None, 'Aktif'),
    ('fco_45', 'FCO SELAMAT JALAN', 'fco', -8.209009399687705, 124.5855177455784, None, 20, 'Polymer/Standard', 100, None, 'Aktif'),
    ('fco_46', 'FCO HULNANI', 'fco', -8.268929575714372, 124.4190160048521, None, 20, 'Polymer/Standard', 50, None, 'Aktif'),
    ('fco_47', 'FCO HULNANI 2', 'fco', -8.265198140585387, 124.4147533140373, None, 20, 'Polymer/Standard', 200, None, 'Aktif'),
    ('fco_48', 'FCO MASJID', 'fco', -8.267760878875373, 124.4085749269767, None, 20, 'Polymer/Standard', 50, None, 'Aktif'),
    ('fco_49', 'FCO BAMPALOLA', 'fco', -8.243823947478482, 124.4291019258776, None, 20, 'Polymer/Standard', 50, None, 'Aktif'),
    ('fco_50', 'FCO HULA', 'fco', -8.213827959125444, 124.4053018678468, None, 20, 'Polymer/Standard', 200, None, 'Aktif'),
    ('fco_51', 'FCO KENARILANG', 'fco', -8.230189941777027, 124.4921126729964, None, 20, 'Polymer/Standard', 100, None, 'Aktif'),
    ('fco_52', 'FCO KEBUN KOPI', 'fco', -8.212161006311288, 124.543944156167, None, 20, 'Polymer/Standard', 50, None, 'Aktif'),
    ('fco_53', 'FCO BONDATA', 'fco', -8.170569058081584, 124.7887542189686, None, 20, 'Polymer/Standard', 100, None, 'Aktif'),
    ('fco_54', 'FCO KAMOT', 'fco', -8.169145078753784, 124.7708553818868, None, 20, 'Polymer/Standard', 200, None, 'Aktif'),
    ('fco_55', 'FCO KAMOT', 'fco', -8.169145078753784, 124.7708553818868, None, 20, 'Polymer/Standard', 50, None, 'Aktif'),
    ('fco_56', 'FCO BENLELANG', 'fco', -8.197354829695312, 124.6014805976753, None, 20, 'Polymer/Standard', 200, None, 'Aktif'),
    ('fco_57', 'FCO AIMOLI', 'fco', -8.194800726942587, 124.4224618698775, None, 20, 'Polymer/Standard', 50, None, 'Aktif'),
    ('fco_58', 'FCO BUONO', 'fco', -8.220338107276044, 124.5040247590676, None, 20, 'Polymer/Standard', 200, None, 'Aktif'),
    ('fco_59', 'FCO MTS', 'fco', -8.215564805180346, 124.5391612629403, None, 20, 'Polymer/Standard', 200, None, 'Aktif'),
    ('fco_60', 'FCO DAERAH', 'fco', -8.214763584117359, 124.5452032522599, None, 20, 'Polymer/Standard', 50, None, 'Aktif'),
    ('fco_61', 'FCO KARKAMENG', 'fco', -8.218768004544138, 124.5464452262998, None, 20, 'Polymer/Standard', 50, None, 'Aktif'),
    ('fco_62', 'FCO PADANG TEKUKUR', 'fco', -8.21503270848763, 124.5512079716996, None, 20, 'Polymer/Standard', 200, None, 'Aktif'),
    ('fco_63', 'FCO TOMBANG', 'fco', -8.21265413676154, 124.5391446314137, None, 20, 'Polymer/Standard', 100, None, 'Aktif'),
    ('fco_64', 'FCO AIR KENARI', 'fco', -8.208626567664755, 124.5311648799233, None, 20, 'Polymer/Standard', 100, None, 'Aktif'),
    ('fco_65', 'FCO MONBANG', 'fco', -8.196788990128894, 124.5576584686598, None, 20, 'Polymer/Standard', 200, None, 'Aktif'),
    ('fco_66', 'FCO LAWAHING', 'fco', -8.172902479623092, 124.5544847662176, None, 20, 'Polymer/Standard', 200, None, 'Aktif'),
    ('fco_67', 'FCO AFALAA', 'fco', -8.175949597355824, 124.5118229857706, None, 20, 'Polymer/Standard', 50, None, 'Aktif'),
    ('fco_68', 'FCO OTVAI', 'fco', -8.178681845779224, 124.507452791614, None, 20, 'Polymer/Standard', 50, None, 'Aktif'),
    ('fco_69', 'FCO ALILA SELATAN', 'fco', -8.164430399524397, 124.508197395785, None, 20, 'Polymer/Standard', 200, None, 'Aktif'),
    ('fco_70', 'FCO TULTA', 'fco', -8.149963658419002, 124.4929619908575, None, 20, 'Polymer/Standard', 50, None, 'Aktif'),
    ('fco_71', 'FCO FOMANG', 'fco', -8.257956815640464, 124.5145856855173, None, 20, 'Polymer/Standard', 200, None, 'Aktif'),
    ('fco_72', 'FCO MORBA', 'fco', -8.266127572133239, 124.5236650892152, None, 20, 'Polymer/Standard', 100, None, 'Aktif'),
    ('fco_73', 'FCO MAIWAL', 'fco', -8.290615804723776, 124.5272494364831, None, 20, 'Polymer/Standard', 200, None, 'Aktif'),
    ('fco_74', 'FCO KAFELULANG', 'fco', -8.316873888198886, 124.5193554252495, None, 20, 'Polymer/Standard', 50, None, 'Aktif'),
    ('fco_75', 'FCO CAMAR', 'fco', -8.257276712162701, 124.5194198411929, None, 20, 'Polymer/Standard', 200, None, 'Aktif'),
    ('fco_76', 'FCO LANGGUR', 'fco', -8.229916748693764, 124.2269806275774, None, 20, 'Polymer/Standard', 200, None, 'Aktif'),
    ('fco_77', 'FCO GEREJA', 'fco', -8.256827763040908, 124.216005463126, None, 20, 'Polymer/Standard', 50, None, 'Aktif'),
    ('fco_78', 'FCO RS', 'fco', -8.365762319098339, 124.0865322496395, None, 20, 'Polymer/Standard', 50, None, 'Aktif'),
    ('fco_79', 'FCO MALIANG', 'fco', -8.366794645763189, 124.0863636805201, None, 20, 'Polymer/Standard', 50, None, 'Aktif'),
    ('fco_80', 'FCO PBL', 'fco', -8.363408414673245, 124.0866632730209, None, 20, 'Polymer/Standard', 200, None, 'Aktif'),
    ('fco_81', 'FCO TUBE', 'fco', -8.393838935223332, 124.1142099112418, None, 20, 'Polymer/Standard', 100, None, 'Aktif'),
    ('fco_82', 'FCO BEANG', 'fco', -8.447342104663283, 124.1723150280679, None, 20, 'Polymer/Standard', 200, None, 'Aktif'),
    # Recloser / LBS
    ('recloser_0', 'RECLOSER PALIBOO', 'recloser', -8.167811642735655, 124.5923602619096, None, 20, 'Schneider Nulec', 400, '12.5 kA Breaking', 'Normally Closed'),
    ('recloser_1', 'LBS BOTA', 'recloser', -8.160400054268102, 124.4546418771118, None, 20, 'Schneider Nulec', 400, '12.5 kA Breaking', 'Normally Closed'),
    ('recloser_2', 'LBS DPR', 'recloser', -8.208333309114261, 124.5726973081259, None, 20, 'Schneider Nulec', 400, '12.5 kA Breaking', 'Normally Closed'),
    ('recloser_3', 'LBS GEREJA', 'recloser', -8.205507000000001, 124.58246, None, 20, 'Schneider Nulec', 400, '12.5 kA Breaking', 'Normally Closed'),
    ('recloser_4', 'LBS KODIM', 'recloser', -8.21593682014143, 124.5462878900231, None, 20, 'Schneider Nulec', 400, '12.5 kA Breaking', 'Normally Closed'),
    ('recloser_5', 'LBS SYMPONI', 'recloser', -8.216385067437702, 124.5247437364784, None, 20, 'Schneider Nulec', 400, '12.5 kA Breaking', 'Normally Closed'),
    ('recloser_6', 'LBS SAWAH LAMA', 'recloser', -8.2115056305749, 124.5271692368677, None, 20, 'Schneider Nulec', 400, '12.5 kA Breaking', 'Normally Closed'),
    ('recloser_7', 'LBS LAPANGAN MINI', 'recloser', -8.216806814985882, 124.5188078355941, None, 20, 'Schneider Nulec', 400, '12.5 kA Breaking', 'Normally Closed'),
]

print(f"Seeding {len(items)} hardware items (PLTS/PLTD/FCO/Recloser)...")
conn = psycopg2.connect(DB)
conn.autocommit = True
cur = conn.cursor()

cur.execute("TRUNCATE TABLE hardware_items CASCADE")
print("  Truncated hardware_items")

sql = """INSERT INTO hardware_items (id, name, type, lat, lng, kapasitas_kw, tegangan_kv, merk, rating_arus_ampere, konfigurasi, status, "createdAt", "updatedAt")
         VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,NOW(),NOW())"""

for item in items:
    try:
        cur.execute(sql, item)
    except Exception as e:
        print(f"  Error {item[0]}: {e}")

cur.execute("SELECT COUNT(*) FROM hardware_items")
count = cur.fetchone()[0]
cur.execute("SELECT type, COUNT(*) FROM hardware_items GROUP BY type ORDER BY type")
groups = cur.fetchall()

cur.close()
conn.close()

print(f"\nDONE! Total: {count}")
for g, c in groups:
    print(f"  {g}: {c}")
