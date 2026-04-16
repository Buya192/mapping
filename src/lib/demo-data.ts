// ============================================
// PLN Grid Management System - Asset Analysis & Uprating Focus
// ============================================

export interface BaseAsset {
  id: string;
  nama: string;
  penyulang: string;
  latitude: number;
  longitude: number;
  lat?: number;
  lng?: number;
  status?: string;
  type?: string;
}

export interface Gardu extends BaseAsset {
  jenis_konstruksi: string;
  merk_trafo: string;
  fasa: number | string;
  kapasitas_kva: number;
  tipe?: string;
  [key: string]: any;
}

export interface TiangJTM extends BaseAsset {
  nama_tiang: string;
  urutan_tiang: number;
  jenis_aset: string;
  jenis_tiang: string;
  tipe_tiang: string;
}

export interface Proteksi extends BaseAsset {
  jenis: 'CO' | 'LBS' | 'RECLOSER' | 'FCO' | string;
}

export interface Penyulang {
  id: string;
  nama: string;
  beban_mw?: number;
  kapasitas_mw?: number;
  status: 'Normal' | 'Siaga' | 'Waspada' | 'Padam' | string;
  coordinates?: any[];
  [key: string]: any;
}

export const demoPenyulang: Penyulang[] = [
  { id: 'P01', nama: 'BINONGKO', beban_mw: 4.2, kapasitas_mw: 6.0, status: 'Normal' },
  { id: 'P02', nama: 'ILAWE', beban_mw: 3.8, kapasitas_mw: 4.5, status: 'Waspada' },
  { id: 'P03', nama: 'MALI', beban_mw: 2.1, kapasitas_mw: 5.0, status: 'Normal' },
  { id: 'P04', nama: 'MORU', beban_mw: 5.4, kapasitas_mw: 6.0, status: 'Siaga' },
  { id: 'P05', nama: 'KABIR', beban_mw: 1.2, kapasitas_mw: 2.5, status: 'Normal' },
];

export const demoGangguan = [
  { id: 'G01', penyulang: 'ILAWE', penyulang_nama: 'ILAWE', lokasi: 'AT107', status: 'Dikerjakan', estimasi: '45 min', jenis: 'temporer', penyebab: 'Pohon Tumbang', waktu_mulai: '2026-04-06T08:15:00', durasi_menit: 45, pelanggan_terdampak: 320, petugas: 'Regu Alor 1' },
  { id: 'G02', penyulang: 'MORU', penyulang_nama: 'MORU', lokasi: 'AD025', status: 'Pending', estimasi: '120 min', jenis: 'permanen', penyebab: 'Kabel Putus', waktu_mulai: '2026-04-06T06:30:00', durasi_menit: 120, pelanggan_terdampak: 185, petugas: 'Regu Alor 2' },
  { id: 'G03', penyulang: 'MALI', penyulang_nama: 'MALI', lokasi: 'AM012', status: 'Selesai', estimasi: '30 min', jenis: 'temporer', penyebab: 'Overload Trafo', waktu_mulai: '2026-04-05T14:00:00', durasi_menit: 30, pelanggan_terdampak: 95, petugas: 'Regu Alor 1' },
  { id: 'G04', penyulang: 'KABIR', penyulang_nama: 'KABIR', lokasi: 'AK008', status: 'Dikerjakan', estimasi: '60 min', jenis: 'temporer', penyebab: 'Petir / Cuaca', waktu_mulai: '2026-04-06T10:45:00', durasi_menit: 0, pelanggan_terdampak: 150, petugas: 'Regu Alor 3' },
];

export const gangguanCauses = [
  { penyebab: 'Pohon Tumbang', jumlah: 12 },
  { penyebab: 'Kabel Putus', jumlah: 8 },
  { penyebab: 'Overload Trafo', jumlah: 6 },
  { penyebab: 'Petir / Cuaca', jumlah: 5 },
  { penyebab: 'Gangguan Isolator', jumlah: 4 },
  { penyebab: 'Lainnya', jumlah: 3 },
];

// Map center coordinates (Alor, NTT)
export const CENTER_LAT = -8.2345;
export const CENTER_LNG = 124.7320;

export interface Proteksi {
  id: string;
  nama: string;
  penyulang: string;
  jenis: string;
  latitude: number;
  longitude: number;
}

export const demoTiang: TiangJTM[] = [];
export const demoProteksi: Proteksi[] = [
  {
      "id": "prt-488d19a9",
      "nama": "Interkoneksi Alila",
      "penyulang": "Alor",
      "jenis": "Lainya",
      "latitude": -8.164249,
      "longitude": 124.508353
  },
  {
      "id": "prt-acb1b10c",
      "nama": "LBS Bota - CO Tulta",
      "penyulang": "Alor",
      "jenis": "CO",
      "latitude": -8.16035,
      "longitude": 124.454783
  },
  {
      "id": "prt-40c47dea",
      "nama": "CO Batuputih - Ujung TM",
      "penyulang": "Alor",
      "jenis": "CO",
      "latitude": -8.127753,
      "longitude": 124.541172
  },
  {
      "id": "prt-c9adedef",
      "nama": "CO Kafelulang - Ujung TM",
      "penyulang": "Alor",
      "jenis": "CO",
      "latitude": -8.317311,
      "longitude": 124.519553
  },
  {
      "id": "prt-3e443fd0",
      "nama": "CO Silapui - Ujung TM",
      "penyulang": "Alor",
      "jenis": "CO",
      "latitude": -8.294194,
      "longitude": 124.767333
  },
  {
      "id": "prt-eccc8968",
      "nama": "CO Kafakbeka - Ujung TM",
      "penyulang": "Alor",
      "jenis": "CO",
      "latitude": -8.166178,
      "longitude": 124.664319
  },
  {
      "id": "prt-c2d31532",
      "nama": "CO Talwai - Ujung TM",
      "penyulang": "Alor",
      "jenis": "CO",
      "latitude": -8.245681,
      "longitude": 124.717672
  },
  {
      "id": "prt-1860684a",
      "nama": "CO Kenarimbala - Ujung TM",
      "penyulang": "Alor",
      "jenis": "CO",
      "latitude": -8.236044,
      "longitude": 124.830525
  },
  {
      "id": "prt-70a56e52",
      "nama": "CO Luba - Ujung TM Atengmelang",
      "penyulang": "Alor",
      "jenis": "CO",
      "latitude": -8.163606,
      "longitude": 124.678856
  },
  {
      "id": "prt-ec723f44",
      "nama": "Ujung TM Lakwati",
      "penyulang": "Alor",
      "jenis": "Lainya",
      "latitude": -8.221094,
      "longitude": 124.665542
  },
  {
      "id": "prt-18241891",
      "nama": "CO Kelaisi - CO Manetwati",
      "penyulang": "Alor",
      "jenis": "CO",
      "latitude": -8.27979,
      "longitude": 124.717582
  },
  {
      "id": "prt-7e8773c5",
      "nama": "CO Manetwati - Ujung TM",
      "penyulang": "Alor",
      "jenis": "CO",
      "latitude": -8.28201,
      "longitude": 124.674653
  },
  {
      "id": "prt-22f02a97",
      "nama": "CO Belemana - Ujung TM",
      "penyulang": "Alor",
      "jenis": "CO",
      "latitude": -8.255636,
      "longitude": 124.929764
  },
  {
      "id": "prt-73fba12d",
      "nama": "CO Probur - Ujung Us'akan",
      "penyulang": "Alor",
      "jenis": "CO",
      "latitude": -8.375681,
      "longitude": 124.417442
  },
  {
      "id": "prt-e7e66e12",
      "nama": "CO Hopter - Ujung TM Tribur",
      "penyulang": "Alor",
      "jenis": "CO",
      "latitude": -8.414861,
      "longitude": 124.416544
  },
  {
      "id": "prt-3bb600dd",
      "nama": "CO Marica - Ujung TM",
      "penyulang": "Alor",
      "jenis": "CO",
      "latitude": -8.363506,
      "longitude": 124.086383
  },
  {
      "id": "prt-aacc9366",
      "nama": "CO Tamak - Rec. Airmama",
      "penyulang": "Alor",
      "jenis": "CO",
      "latitude": -8.415289,
      "longitude": 124.208878
  },
  {
      "id": "prt-9058317b",
      "nama": "CO Tonte - Ujung TM",
      "penyulang": "Alor",
      "jenis": "CO",
      "latitude": -8.401989,
      "longitude": 124.189264
  },
  {
      "id": "prt-52d11ed3",
      "nama": "CO Labuan - Ujung TM Helangdohi",
      "penyulang": "Alor",
      "jenis": "CO",
      "latitude": -8.176579,
      "longitude": 124.286303
  },
  {
      "id": "prt-3fcc4cbc",
      "nama": "Interkoneksi Alila",
      "penyulang": "Alor",
      "jenis": "Lainya",
      "latitude": -8.148895,
      "longitude": 124.491658
  },
  {
      "id": "prt-abbb70ff",
      "nama": "LBS Bota - CO Tulta",
      "penyulang": "Alor",
      "jenis": "CO",
      "latitude": -8.145575,
      "longitude": 124.493617
  },
  {
      "id": "prt-55e43e16",
      "nama": "CO Batuputih - Ujung TM",
      "penyulang": "Alor",
      "jenis": "CO",
      "latitude": -8.132647,
      "longitude": 124.506556
  },
  {
      "id": "prt-9997a101",
      "nama": "CO Kafelulang - Ujung TM",
      "penyulang": "Alor",
      "jenis": "CO",
      "latitude": -8.323344,
      "longitude": 124.550225
  },
  {
      "id": "prt-0683df97",
      "nama": "CO Silapui - Ujung TM",
      "penyulang": "Alor",
      "jenis": "CO",
      "latitude": -8.314811,
      "longitude": 124.762569
  },
  {
      "id": "prt-5af4d943",
      "nama": "CO Kafakbeka - Ujung TM",
      "penyulang": "Alor",
      "jenis": "CO",
      "latitude": -8.204683,
      "longitude": 124.652764
  },
  {
      "id": "prt-7f0df9bd",
      "nama": "CO Talwai - Ujung TM",
      "penyulang": "Alor",
      "jenis": "CO",
      "latitude": -8.244389,
      "longitude": 124.704253
  },
  {
      "id": "prt-80b56265",
      "nama": "CO Kenarimbala - Ujung TM",
      "penyulang": "Alor",
      "jenis": "CO",
      "latitude": -8.168339,
      "longitude": 124.858817
  },
  {
      "id": "prt-c46badcc",
      "nama": "CO Luba - Ujung TM Atengmelang",
      "penyulang": "Alor",
      "jenis": "CO",
      "latitude": -8.224883,
      "longitude": 124.668097
  },
  {
      "id": "prt-80dee235",
      "nama": "Ujung TM Lakwati",
      "penyulang": "Alor",
      "jenis": "Lainya",
      "latitude": -8.228989,
      "longitude": 124.661486
  },
  {
      "id": "prt-8257209c",
      "nama": "CO Kelaisi - CO Manetwati",
      "penyulang": "Alor",
      "jenis": "CO",
      "latitude": -8.282433,
      "longitude": 124.674292
  },
  {
      "id": "prt-d871a9ee",
      "nama": "CO Manetwati - Ujung TM",
      "penyulang": "Alor",
      "jenis": "CO",
      "latitude": -8.247087,
      "longitude": 124.683
  },
  {
      "id": "prt-9e966e3c",
      "nama": "CO Belemana - Ujung TM",
      "penyulang": "Alor",
      "jenis": "CO",
      "latitude": -8.256111,
      "longitude": 124.917881
  },
  {
      "id": "prt-793180bc",
      "nama": "CO Probur - Ujung Us'akan",
      "penyulang": "Alor",
      "jenis": "CO",
      "latitude": -8.425517,
      "longitude": 124.393869
  },
  {
      "id": "prt-f8c29963",
      "nama": "CO Hopter - Ujung TM Tribur",
      "penyulang": "Alor",
      "jenis": "CO",
      "latitude": -8.422744,
      "longitude": 124.488333
  },
  {
      "id": "prt-e70c91c8",
      "nama": "CO Marica - Ujung TM",
      "penyulang": "Alor",
      "jenis": "CO",
      "latitude": -8.408911,
      "longitude": 124.007408
  },
  {
      "id": "prt-2aef4c90",
      "nama": "CO Tamak - Rec. Airmama",
      "penyulang": "Alor",
      "jenis": "CO",
      "latitude": -8.447625,
      "longitude": 124.169256
  },
  {
      "id": "prt-18976303",
      "nama": "CO Tonte - Ujung TM",
      "penyulang": "Alor",
      "jenis": "CO",
      "latitude": -8.371917,
      "longitude": 124.187044
  },
  {
      "id": "prt-e040f0a0",
      "nama": "CO Labuan - Ujung TM Helangdohi",
      "penyulang": "Alor",
      "jenis": "CO",
      "latitude": -8.183471,
      "longitude": 124.287
  }
];

export const gangguanMonthly = [
  { bulan: 'Jan', permanen: 2, temporer: 5 },
  { bulan: 'Feb', permanen: 1, temporer: 3 },
  { bulan: 'Mar', permanen: 3, temporer: 4 },
  { bulan: 'Apr', permanen: 0, temporer: 6 },
  { bulan: 'Mei', permanen: 2, temporer: 2 },
  { bulan: 'Jun', permanen: 1, temporer: 4 },
  { bulan: 'Jul', permanen: 3, temporer: 3 },
  { bulan: 'Agu', permanen: 2, temporer: 5 },
  { bulan: 'Sep', permanen: 1, temporer: 2 },
  { bulan: 'Okt', permanen: 4, temporer: 6 },
  { bulan: 'Nov', permanen: 2, temporer: 3 },
  { bulan: 'Des', permanen: 1, temporer: 4 },
];

export const generateBebanData = () => {
  const hours = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:59'];
  const penyulangs = ['pnl-01', 'pnl-02', 'pnl-03', 'pnl-04'];
  const data: any[] = [];
  
  hours.forEach((h, i) => {
    penyulangs.forEach((pnl, j) => {
      data.push({
        timestamp: `2026-04-06T${h}:00`,
        penyulang_id: pnl,
        beban_mw: 5 + (i * 1.5) + (j * 0.8) + (Math.random() * 2)
      });
    });
  });
  
  return data;
};
