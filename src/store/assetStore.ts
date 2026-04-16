import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Gardu, Penyulang, demoPenyulang } from "@/lib/demo-data";
import { HardwareItem, hardwareItems } from "@/lib/hardware-data";

export interface ProteksiItem {
  id: string;
  nama: string;
  jenis: string;
  penyulang?: string;
  deskripsi?: string;
  pangkal_lat: number;
  pangkal_lng: number;
  ujung_lat: number;
  ujung_lng: number;
  status?: string;
  // Legacy fields for map compatibility
  latitude?: number;
  longitude?: number;
}

export interface TiangJTM {
  id?: number;
  objectId?: number;
  nama_tiang: string;
  urutan_tiang?: number;
  ulp?: string;
  sulp?: string;
  penyulang?: string;
  jenis_aset?: string;
  asset_p3?: string;
  jenis_tiang?: string;
  tipe_tiang?: string;
  pondasi_tiang?: string;
  kekuatan_tiang?: number;
  penopang?: string;
  konstruksi_1?: string;
  konstruksi_2?: string;
  jenis_hantaran_1?: string;
  jenis_hantaran_2?: string;
  ukuran_hantaran_1?: string;
  ukuran_hantaran_2?: string;
  under_built?: string;
  prioritas?: number;
  vendor?: string;
  install_date?: string;
  operating_date?: string;
  alamat?: string;
  kepemilikan?: string;
  latitude: number;
  longitude: number;
  lat: number;
  lng: number;
  status?: string;
  [key: string]: any;
}

// ===== USULAN JARINGAN BARU =====
export type StatusUsulan = "usulan" | "disetujui" | "progres" | "selesai";

export interface UsulanTiang {
  id: string;
  nama_tiang: string;
  penyulang?: string;
  tipe_konstruksi?: "Tumpu" | "Sudut" | "Penegang" | "Akhir";
  jenis_tiang?: string; // Besi / Beton
  tipe_tiang?: string; // 9 / 11 / 12 (meter)
  konstruksi?: string; // A1, A2, B, C
  jenis_hantaran?: string;
  ukuran_hantaran?: string;
  latitude: number;
  longitude: number;
  status: StatusUsulan;
  catatan?: string;
  createdAt: string;
}

export interface UsulanJalur {
  id: string;
  nama: string;
  penyulang?: string;
  jenis_konduktor?: string;
  ukuran_mm2?: string;
  coordinates: [number, number][]; // [lng, lat][]
  status: StatusUsulan;
  catatan?: string;
  createdAt: string;
}

export interface UsulanGardu {
  id: string;
  nama: string;
  penyulang?: string;
  kapasitas_kva?: number;
  jenis_konstruksi?: string; // portal / cantol / distribusi
  latitude: number;
  longitude: number;
  status: StatusUsulan;
  catatan?: string;
  createdAt: string;
}

export interface ProyekPekerjaan {
  id: string;
  judul: string;
  deskripsi?: string;
  penyulang?: string;
  jenis: "perluasan" | "pemeliharaan" | "peningkatan" | "rehabilitasi";
  status: StatusUsulan;
  tanggal_usulan: string;
  tanggal_target?: string;
  tanggal_selesai?: string;
  progress_pct: number; // 0-100
  volume_tiang?: number;
  volume_jalur_km?: number;
  volume_gardu?: number;
  biaya_estimasi?: number;
  pelaksana?: string;
  catatan?: string;
  usulanTiangIds?: string[];
  usulanJalurIds?: string[];
  usulanGarduIds?: string[];
  gambar_print_url?: string;
}

export interface DataGangguan {
  id: string;
  tanggal: string;
  penyulang_id: string;
  penyulang_nama: string;
  kategori: "unplanned" | "planned" | "force_majeure";
  penyebab: string;
  lokasi?: string;
  durasi_menit: number;
  pelanggan_terdampak: number;
  ens_kwh?: number;
  keterangan?: string;
  createdAt: string;
}

interface AssetStore {
  gardus: Gardu[];
  jtmSegments: Penyulang[];
  tiangJTM: TiangJTM[];
  proteksi: ProteksiItem[];
  isLoading: boolean;

  // Usulan jaringan
  usulanTiang: UsulanTiang[];
  usulanJalur: UsulanJalur[];
  usulanGardu: UsulanGardu[];
  proyekPekerjaan: ProyekPekerjaan[];
  dataGangguan: DataGangguan[];
  hardwareAssets: HardwareItem[];

  // AI Simulation State (Persisted during session)
  simulationMetrics: any | null;
  aiTopologyFeatures: any[];
  setSimulationData: (metrics: any | null, features: any[]) => void;

  // Helper for AI Generator
  addMultipleUsulanAndProyek: (
    tiangs: UsulanTiang[],
    gardus: UsulanGardu[],
    jalurs: UsulanJalur[],
    proyek: ProyekPekerjaan,
  ) => void;
  resetAllDrafts: () => void;

  fetchAssets: () => Promise<void>;
  setGardus: (gardus: Gardu[]) => void;
  addGardus: (newGardus: Gardu[], skipSync?: boolean) => Promise<void>;
  clearGardus: () => Promise<void>;

  setJTMSegments: (segments: Penyulang[]) => void;
  addJTMSegments: (
    newSegments: Penyulang[],
    skipSync?: boolean,
  ) => Promise<void>;
  clearJTMSegments: () => Promise<void>;

  setTiangJTM: (tiang: TiangJTM[]) => void;
  addTiangJTM: (newTiang: TiangJTM[], skipSync?: boolean) => Promise<void>;
  clearTiangJTM: () => Promise<void>;

  // Proteksi actions
  setProteksi: (proteksi: ProteksiItem[]) => void;
  addProteksiItems: (items: ProteksiItem[]) => void;
  deleteProteksiItem: (id: string) => void;
  clearProteksi: () => Promise<void>;

  // Usulan actions
  addUsulanTiang: (t: UsulanTiang) => void;
  addUsulanJalur: (j: UsulanJalur) => void;
  addUsulanGardu: (g: UsulanGardu) => void;
  updateUsulanTiangStatus: (id: string, status: StatusUsulan) => void;
  updateUsulanJalurStatus: (id: string, status: StatusUsulan) => void;
  updateUsulanGarduStatus: (id: string, status: StatusUsulan) => void;
  deleteUsulanTiang: (id: string) => void;
  deleteUsulanJalur: (id: string) => void;
  deleteUsulanGardu: (id: string) => void;
  clearUsulan: () => void;

  // Proyek actions
  addProyek: (p: ProyekPekerjaan) => void;
  updateProyek: (id: string, updates: Partial<ProyekPekerjaan>) => void;
  deleteProyek: (id: string) => void;

  // Gangguan actions
  addGangguan: (g: DataGangguan) => void;
  deleteGangguan: (id: string) => void;

  // Hardware Assets actions
  addHardwareAsset: (asset: HardwareItem) => void;
  updateHardwareAsset: (id: string, updates: Partial<HardwareItem>) => void;
  deleteHardwareAsset: (id: string) => void;
  // Search & Filters
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchResults: any[];
  performSearch: () => void;

  // Connectivity & Health
  checkConnectivity: (feeder: string) => {
    connected: boolean;
    issues: string[];
  };
  getAssetById: (id: string | number, type: "tiang" | "gardu" | "jtm") => any;
  getAllAssets: () => Array<Gardu | TiangJTM | Penyulang>;
}

export const useAssetStore = create<AssetStore>()(
  persist(
    (set, get) => ({
      gardus: [],
      jtmSegments: [],
      tiangJTM: [],
      proteksi: [],
      isLoading: false,
      usulanTiang: [],
      usulanJalur: [],
      usulanGardu: [],
      proyekPekerjaan: [],
      dataGangguan: [],
      hardwareAssets: hardwareItems,

      searchTerm: "",
      searchResults: [],
      setSearchTerm: (term) => set({ searchTerm: term }),
      performSearch: () => {
        const { searchTerm, gardus, tiangJTM, jtmSegments } = get();
        if (!searchTerm) {
          set({ searchResults: [] });
          return;
        }

        const term = searchTerm.toUpperCase();
        const res = [
          ...gardus
            .filter((g) => (g.nama || "").toUpperCase().includes(term))
            .map((g) => ({ ...g, type: "Gardu" })),
          ...tiangJTM
            .filter((t) => (t.nama_tiang || "").toUpperCase().includes(term))
            .map((t) => ({ ...t, type: "Tiang" })),
          ...jtmSegments
            .filter((j) => (j.nama || "").toUpperCase().includes(term))
            .map((j) => ({ ...j, type: "JTM" })),
        ];
        set({ searchResults: res.slice(0, 10) });
      },

      checkConnectivity: (feeder) => {
        const { tiangJTM, jtmSegments } = get();
        const fTiang = tiangJTM.filter(
          (t) => (t.penyulang || "").toUpperCase() === feeder.toUpperCase(),
        );
        const issues: string[] = [];

        if (fTiang.length === 0)
          issues.push(`Penyulang ${feeder} tidak memiliki data tiang.`);

        // Basic heuristic check for isolated poles
        const isolated = fTiang.filter((t) => !t.latitude || !t.longitude);
        if (isolated.length > 0)
          issues.push(`${isolated.length} tiang tidak memiliki koordinat.`);

        return {
          connected: issues.length === 0,
          issues,
        };
      },

      getAssetById: (id: string | number, type: "tiang" | "gardu" | "jtm") => {
        const { gardus, tiangJTM, jtmSegments } = get();
        if (type === "gardu") return gardus.find((g: any) => g.id === id);
        if (type === "tiang") return tiangJTM.find((t: any) => t.id === id);
        if (type === "jtm") return jtmSegments.find((j: any) => j.id === id);
        return undefined;
      },

      getAllAssets: () => {
        const { gardus, tiangJTM, jtmSegments } = get();
        return [...gardus, ...tiangJTM, ...jtmSegments];
      },

      simulationMetrics: null,
      aiTopologyFeatures: [],
      setSimulationData: (metrics, features) =>
        set({ simulationMetrics: metrics, aiTopologyFeatures: features }),

      fetchAssets: async () => {
        set({ isLoading: true });
        try {
          // Load from DB API (primary source)
          let dbData: any = null;
          try {
            const dbRes = await fetch("/api/assets");
            if (dbRes.ok) {
              dbData = await dbRes.json();
            }
          } catch {
            /* fallback to GeoJSON */
          }

          let finalGardu: Gardu[] = [];
          let finalTiang: TiangJTM[] = [];

          if (dbData?.gardus?.length > 0) {
            // Map DB fields to UI fields
            finalGardu = dbData.gardus.map((g: any) => ({
              ...g,
              nama: g.namaGardu || g.name || "Unnamed",
              penyulang: g.feeder || "-",
              jenis_konstruksi: g.construction || "Portal",
              kapasitas_kva: g.capacity_kva || 0,
              merk_trafo: g.brand || "N/A",
              latitude: g.lat,
              longitude: g.lng,
            }));
          } else {
            // Fallback to GeoJSON
            try {
              const res = await fetch("/data/gardu-arcgis.geojson");
              if (res.ok) {
                const gj = await res.json();
                finalGardu = gj.features.map((f: any) => ({
                  id: f.properties?.id || `G_${Math.random()}`,
                  nama: f.properties?.NAMAGD || f.properties?.Name || "Unnamed",
                  penyulang: f.properties?.NAMAPENYULANG || "-",
                  jenis_konstruksi:
                    f.properties?.RUJUKAN_KONSTRUKSI || "Portal",
                  kapasitas_kva: parseFloat(f.properties?.KAPASITAS || "0"),
                  merk_trafo: f.properties?.MANUFACTURER || "N/A",
                  lat: f.geometry?.coordinates[1] || 0,
                  lng: f.geometry?.coordinates[0] || 0,
                  latitude: f.geometry?.coordinates[1] || 0,
                  longitude: f.geometry?.coordinates[0] || 0,
                }));
              }
            } catch {}
          }

          // Prioritize GeoJSON since DB query has a limit of 100 items (for dashboard performance)
          try {
            const res = await fetch("/data/tiang-arcgis.geojson");
            if (res.ok) {
              const gj = await res.json();
              finalTiang = gj.features
                .filter((f: any) => f.geometry?.coordinates)
                .map((f: any) => {
                  const [lng, lat] = f.geometry.coordinates;
                  const p = f.properties || {};
                  return {
                    id: p.id || `T_${Math.random()}`,
                    nama_tiang:
                      p.NOTIANGTR || p.NOTIANG || p.Name || "Tanpa Nama",
                    penyulang: p.NAMAPENYULANG || "-",
                    jenis_tiang: p.JENIS_TIANG || "",
                    tipe_tiang: p.UKURAN_TIANG || "",
                    kekuatan_tiang: p.KEKUATAN_TIANG || 0,
                    kondisi: p.KONDISI_TIANG || "",
                    kode_konstruksi: p.KODE_KONSTRUKSI_1 || "",
                    lat,
                    lng,
                    latitude: lat,
                    longitude: lng,
                  };
                });
              console.log(
                `[Store] Loaded ${finalTiang.length} tiang from GeoJSON`,
              );
            }
          } catch (e) {
            console.warn("Store failed to load Tiang GeoJSON", e);
          }

          // Fallback to DB if GeoJSON fails
          if (finalTiang.length === 0 && dbData?.tiangJTM?.length > 0) {
            finalTiang = dbData.tiangJTM.map((t: any) => ({
              ...t,
              lat: t.latitude,
              lng: t.longitude,
            }));
          }

          set({
            gardus: finalGardu,
            jtmSegments: demoPenyulang,
            tiangJTM: finalTiang,
            proteksi: [],
          });
        } catch (err) {
          console.error("Fetch Assets Error:", err);
        } finally {
          set({ isLoading: false });
        }
      },

      setGardus: (gardus) => set({ gardus }),

      addGardus: async (newGardus, skipSync = false) => {
        set((state) => ({ gardus: [...state.gardus, ...newGardus] }));
        if (!skipSync) {
          try {
            await fetch("/api/assets", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ gardus: newGardus }),
            });
          } catch (e) {
            console.error("Sync Gardu Error:", e);
          }
        }
      },

      clearGardus: async () => {
        set({ gardus: [] });
        await fetch("/api/assets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clear: true }),
        });
      },

      setJTMSegments: (segments) => set({ jtmSegments: segments }),

      addJTMSegments: async (newSegments, skipSync = false) => {
        set((state) => ({
          jtmSegments: [...state.jtmSegments, ...newSegments],
        }));
        if (!skipSync) {
          try {
            await fetch("/api/assets", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ jtmSegments: newSegments }),
            });
          } catch (e) {
            console.error("Sync JTM Error:", e);
          }
        }
      },

      clearJTMSegments: async () => {
        set({ jtmSegments: [] });
        await fetch("/api/assets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clear: true }),
        });
      },

      setTiangJTM: (tiang) => set({ tiangJTM: tiang }),

      addTiangJTM: async (newTiang, skipSync = false) => {
        set((state) => ({ tiangJTM: [...state.tiangJTM, ...newTiang] }));
        if (!skipSync) {
          try {
            await fetch("/api/assets", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ tiangJTM: newTiang }),
            });
          } catch (e) {
            console.error("Sync TiangJTM Error:", e);
          }
        }
      },

      clearTiangJTM: async () => {
        set({ tiangJTM: [] });
      },

      // ===== PROTEKSI ACTIONS =====
      setProteksi: (proteksi) => set({ proteksi }),
      addProteksiItems: (items) =>
        set((s) => ({ proteksi: [...s.proteksi, ...items] })),
      deleteProteksiItem: (id) =>
        set((s) => ({ proteksi: s.proteksi.filter((p) => p.id !== id) })),
      clearProteksi: async () => {
        set({ proteksi: [] });
        try {
          await fetch("/api/assets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ proteksi: [] }),
          });
        } catch (e) {
          console.error("Clear Proteksi Error:", e);
        }
      },

      // ===== USULAN ACTIONS =====
      addUsulanTiang: (t) =>
        set((s) => ({ usulanTiang: [...s.usulanTiang, t] })),
      addUsulanJalur: (j) =>
        set((s) => ({ usulanJalur: [...s.usulanJalur, j] })),
      addUsulanGardu: (g) =>
        set((s) => ({ usulanGardu: [...s.usulanGardu, g] })),
      updateUsulanTiangStatus: (id, status) =>
        set((s) => ({
          usulanTiang: s.usulanTiang.map((t) =>
            t.id === id ? { ...t, status } : t,
          ),
        })),
      updateUsulanJalurStatus: (id, status) =>
        set((s) => ({
          usulanJalur: s.usulanJalur.map((j) =>
            j.id === id ? { ...j, status } : j,
          ),
        })),
      updateUsulanGarduStatus: (id, status) =>
        set((s) => ({
          usulanGardu: s.usulanGardu.map((g) =>
            g.id === id ? { ...g, status } : g,
          ),
        })),
      deleteUsulanTiang: (id) =>
        set((s) => ({ usulanTiang: s.usulanTiang.filter((t) => t.id !== id) })),
      deleteUsulanJalur: (id) =>
        set((s) => ({ usulanJalur: s.usulanJalur.filter((j) => j.id !== id) })),
      deleteUsulanGardu: (id) =>
        set((s) => ({ usulanGardu: s.usulanGardu.filter((g) => g.id !== id) })),
      clearUsulan: () =>
        set({ usulanTiang: [], usulanJalur: [], usulanGardu: [] }),

      // ===== PROYEK ACTIONS =====
      addProyek: (p) =>
        set((s) => ({ proyekPekerjaan: [...s.proyekPekerjaan, p] })),
      updateProyek: (id, updates) =>
        set((s) => ({
          proyekPekerjaan: s.proyekPekerjaan.map((p) =>
            p.id === id ? { ...p, ...updates } : p,
          ),
        })),
      deleteProyek: (id) =>
        set((s) => {
          const proyek = s.proyekPekerjaan.find((p) => p.id === id);
          if (!proyek) return s;
          const tIds = proyek.usulanTiangIds || [];
          const jIds = proyek.usulanJalurIds || [];
          const gIds = proyek.usulanGarduIds || [];
          return {
            proyekPekerjaan: s.proyekPekerjaan.filter((p) => p.id !== id),
            usulanTiang: s.usulanTiang.filter((t) => !tIds.includes(t.id)),
            usulanJalur: s.usulanJalur.filter((j) => !jIds.includes(j.id)),
            usulanGardu: s.usulanGardu.filter((g) => !gIds.includes(g.id)),
          };
        }),

      // ===== GANGGUAN ACTIONS =====
      addGangguan: (g) =>
        set((s) => ({ dataGangguan: [...s.dataGangguan, g] })),
      deleteGangguan: (id) =>
        set((s) => ({
          dataGangguan: s.dataGangguan.filter((g) => g.id !== id),
        })),

      // ===== AI BATCH HELPER =====
      addMultipleUsulanAndProyek: (tiangs, gardus, jalurs, proyek) =>
        set((s) => ({
          usulanTiang: [...s.usulanTiang, ...tiangs],
          usulanGardu: [...s.usulanGardu, ...gardus],
          usulanJalur: [...s.usulanJalur, ...jalurs],
          proyekPekerjaan: [...s.proyekPekerjaan, proyek],
        })),

      resetAllDrafts: () =>
        set({
          usulanTiang: [],
          usulanGardu: [],
          usulanJalur: [],
          proyekPekerjaan: [],
        }),

      // ===== HARDWARE CRUD =====
      addHardwareAsset: (asset) =>
        set((s) => ({ hardwareAssets: [...s.hardwareAssets, asset] })),
      updateHardwareAsset: (id, updates) =>
        set((s) => ({
          hardwareAssets: s.hardwareAssets.map((a) =>
            a.id === id ? { ...a, ...updates } : a,
          ),
        })),
      deleteHardwareAsset: (id) =>
        set((s) => ({
          hardwareAssets: s.hardwareAssets.filter((a) => a.id !== id),
        })),
    }),
    {
      name: "pln-jarkom-store",
      partialize: (state) => ({
        usulanTiang: state.usulanTiang,
        usulanJalur: state.usulanJalur,
        usulanGardu: state.usulanGardu,
        proyekPekerjaan: state.proyekPekerjaan,
        dataGangguan: state.dataGangguan,
        hardwareAssets: state.hardwareAssets,
      }),
    },
  ),
);
