# PLN Jarkom - Sistem Analisa Jaringan Distribusi

Aplikasi dashboard untuk monitoring, analisa, dan perencanaan jaringan kelistrikan PLN ULP Kalabahi terintegrasi dengan data ArcGIS.

## Fitur Unggulan Modern (v2.0)

### 1. Unified Search & Data Management
- **Search Engine**: Pencarian fuzzy global untuk koordinat, ID tiang, dan nama gardu.
- **Data Tables**: Tampilan data terfragmentasi (Trafo, Tiang, Jaringan) untuk memudahkan audit aset dalam jumlah besar.

### 2. Network Health & Analytics
- **Integrity Audit**: Validasi otomatis konektivitas spasial ArGis untuk mendeteksi tiang "terisolasi" (tidak terhubung ke sistem).
- **Power Flow Simulation**: Integrasi Pandapower untuk simulasi aliran daya berbasis data geometri asli.

### 3. Survey & Planning (Rensis NTT)
- **Automatic BoM**: Estimasi kebutuhan material (Tiang, Isolator, Konduktor) secara otomatis berdasarkan hasil survey di peta.
- **Tabbed Sidebar**: Antarmuka peta yang bersih dengan pemisahan fungsi Layer, Survey, dan Analisa.

## Integrasi Data ArcGIS (GDB)

Aplikasi ini mendukung sinkronisasi data langsung dari file ArcGIS GDB.

### Cara Sinkronisasi:
1. Simpan file GDB di folder `_new_arg/arg.gdb`.
2. Jalankan skrip ekstraksi:
   ```bash
   python extract_gdb_final.py
   ```
3. GeoJSON akan diperbarui di `public/data/` dan dimuat otomatis oleh peta.

## Menjalankan Analisa Engine (Python)

Pastikan backend Python berjalan untuk fitur simulasi:
```bash
cd python-engine
pip install -r requirements.txt
python main.py
```
Akses di `http://localhost:8000`.

## Pengembangan Frontend

```bash
npm install
npm run dev
```
Akses di `http://localhost:3000`.
