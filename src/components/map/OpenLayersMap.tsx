'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import GeoJSON from 'ol/format/GeoJSON';
import { Feature } from 'ol';
import { Point, LineString, MultiLineString, Polygon as OlPolygon } from 'ol/geom';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Style, Circle as CircleStyle, Fill, Stroke, Text, Icon, RegularShape } from 'ol/style';
import Overlay from 'ol/Overlay';
import { defaults as defaultControls, ScaleLine, FullScreen, ZoomSlider } from 'ol/control';
import toast from 'react-hot-toast';

import {
  demoProteksi,
  CENTER_LAT, CENTER_LNG
} from '@/lib/demo-data';
import { useAssetStore, UsulanTiang, UsulanGardu, UsulanJalur, StatusUsulan } from '@/store/assetStore';
import { batasDesaGeoJSON } from '@/lib/batas-desa';
import { buildNetworkGraph, simulateFault, findNearestNode, type FaultResult, type NetworkNode } from '@/lib/topology-engine';
import FaultAnalysisPanel from './FaultAnalysisPanel';
import type GraphType from 'graphology';

// ===== PENYULANG COLOR PALETTE =====
const PENYULANG_COLORS: Record<string, string> = {
  MALI: '#3b82f6', MORU: '#ef4444', BATUNIRWALA: '#22c55e',
  BARANUSA: '#f59e0b', KABIR: '#a855f7', MARITAING: '#06b6d4', ILAWE: '#f43f5e',
  'ALOR KECIL': '#14b8a6', PURA: '#e879f9', BINONGKO: '#fb923c',
  'EKSPRES KALABAHI': '#38bdf8', PROBUR: '#a3e635',
};
function getPenyulangColor(p: string): string {
  return PENYULANG_COLORS[(p || '').toUpperCase()] || '#94a3b8';
}

const STATUS_COLORS: Record<StatusUsulan, string> = {
  usulan: '#eab308', disetujui: '#3b82f6', progres: '#f97316', selesai: '#22c55e',
};

interface LayerState {
  gardu: boolean; jtmLine: boolean; jtrLine: boolean; tiang: boolean;
  proteksi: boolean; batasDesa: boolean; usulan: boolean;
  pembangkit: boolean; fco: boolean; recloser: boolean; planning: boolean;
}

type PlanningTool = 'none' | 'add-tiang' | 'add-gardu';

// ===== SVG ICON SYSTEM =====
function svg(c: string, s: number = 40): string {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">${c}</svg>`
  );
}

function garduIcon(konstruksi?: string): string {
  const k = (konstruksi || '').toLowerCase();
  let glyph = '';
  if (k.includes('portal')) {
    // A stylized 'H' pole structure
    glyph = `<line x1="12" y1="8" x2="12" y2="32" stroke="#1e3a8a" stroke-width="4"/><line x1="28" y1="8" x2="28" y2="32" stroke="#1e3a8a" stroke-width="4"/><line x1="12" y1="16" x2="28" y2="16" stroke="#1e3a8a" stroke-width="4"/><rect x="16" y="10" width="8" height="12" fill="#3b82f6"/>`;
  } else if (k.includes('cantol')) {
    // A single pole with a box sticking out
    glyph = `<line x1="16" y1="6" x2="16" y2="34" stroke="#1e3a8a" stroke-width="4"/><rect x="18" y="12" width="12" height="16" fill="#3b82f6"/>`;
  } else {
    // Default transformer (two circles touching)
    glyph = `<circle cx="20" cy="14" r="8" fill="none" stroke="#1e3a8a" stroke-width="4"/><circle cx="20" cy="26" r="8" fill="none" stroke="#1e3a8a" stroke-width="4"/>`;
  }
  return svg(
    `<circle cx="20" cy="20" r="18" fill="#ffffff" stroke="#94a3b8" stroke-width="2"/>${glyph}`, 40
  );
}

function tiangIcon(color: string): string {
  return svg(
    `<circle cx="20" cy="20" r="12" fill="#fff" stroke="${color}" stroke-width="4"/><circle cx="20" cy="20" r="5" fill="${color}"/>`, 40
  );
}

function generatorIcon(): string {
  return svg(
    `<circle cx="20" cy="20" r="16" fill="#fbbf24" stroke="#92400e" stroke-width="3"/>` +
    `<circle cx="20" cy="20" r="10" fill="#f59e0b" stroke="#92400e" stroke-width="1.5"/>` +
    `<text x="20" y="25" font-size="16" font-family="Arial" font-weight="bold" fill="#78350f" text-anchor="middle">G</text>`, 40
  );
}
function solarIcon(): string {
  return svg(
    `<rect x="4" y="10" width="32" height="20" rx="3" fill="#fde68a" stroke="#d97706" stroke-width="2.5"/>` +
    `<line x1="16" y1="10" x2="16" y2="30" stroke="#d97706" stroke-width="1.5"/>` +
    `<line x1="28" y1="10" x2="28" y2="30" stroke="#d97706" stroke-width="1.5"/>` +
    `<line x1="4" y1="20" x2="36" y2="20" stroke="#d97706" stroke-width="1.5"/>`, 40
  );
}

function recloserIcon(): string {
  return svg(
    `<rect x="6" y="6" width="28" height="28" rx="4" fill="#fecdd3" stroke="#e11d48" stroke-width="3" transform="rotate(45 20 20)"/>` +
    `<text x="20" y="25" font-size="15" font-family="Arial" font-weight="bold" fill="#be123c" text-anchor="middle">R</text>`, 40
  );
}

function fcoIcon(): string {
  return svg(
    `<line x1="20" y1="2" x2="20" y2="38" stroke="#0ea5e9" stroke-width="3"/>` +
    `<rect x="12" y="10" width="16" height="20" rx="3" fill="#e0f2fe" stroke="#0284c7" stroke-width="2.5"/>` +
    `<line x1="16" y1="18" x2="24" y2="18" stroke="#0284c7" stroke-width="1.5"/>` +
    `<line x1="16" y1="23" x2="24" y2="23" stroke="#0284c7" stroke-width="1.5"/>`, 40
  );
}

function proteksiIcon(jenis: string): string {
  const t = (jenis || '').toUpperCase();
  let label = 'CO'; let color = '#e11d48'; let bg = '#ffe4e6'; // Default (CO / FCO)
  if (t.includes('LBS')) { label = 'LBS'; color = '#d97706'; bg = '#fef3c7'; }
  else if (t.includes('RECLOSER') || t.includes('REC')) { label = 'REC'; color = '#059669'; bg = '#d1fae5'; } // Greenish for Recloser
  else if (t.includes('FCO') || t.includes('CO')) { label = 'FCO'; color = '#2563eb'; bg = '#dbeafe'; } // Blueish for FCO
  
  return svg(
    `<path d="M20 2 L34 10 L34 24 L20 38 L6 24 L6 10 Z" fill="${bg}" stroke="${color}" stroke-width="2.5"/>` +
    `<text x="20" y="24" font-size="${label.length > 2 ? 10 : 12}" font-family="Arial" font-weight="bold" fill="${color}" text-anchor="middle">${label}</text>`, 40
  );
}

function proposedTiangIcon(): string {
  return svg(
    `<path d="M20 2 C12 2 6 8 6 15 C6 24 20 38 20 38 C20 38 34 24 34 15 C34 8 28 2 20 2Z" fill="#22c55e" stroke="#fff" stroke-width="2" stroke-dasharray="4 2"/>` +
    `<circle cx="20" cy="15" r="4" fill="#fff"/><text x="20" y="18" font-size="8" font-family="Arial" font-weight="bold" fill="#16a34a" text-anchor="middle">+</text>`, 40
  );
}
function proposedGarduIcon(): string {
  return svg(
    `<rect x="4" y="4" width="32" height="32" rx="6" fill="#22c55e" stroke="#fff" stroke-width="2" stroke-dasharray="4 2"/>` +
    `<text x="20" y="26" font-size="16" font-family="Arial" font-weight="bold" fill="#fff" text-anchor="middle">+</text>`, 40
  );
}

// ===== BASEMAP =====
function getBasemapLayer(type: string): TileLayer {
  const opts: Record<string, () => TileLayer> = {
    satellite: () => new TileLayer({ source: new XYZ({ url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', maxZoom: 19 }), properties: { name: 'basemap' } }),
    hybrid: () => new TileLayer({ source: new XYZ({ url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', maxZoom: 20 }), properties: { name: 'basemap' } }),
    terrain: () => new TileLayer({ source: new XYZ({ url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', maxZoom: 19 }), properties: { name: 'basemap' } }),
    osm: () => new TileLayer({ source: new OSM(), properties: { name: 'basemap' } }),
    voyager: () => new TileLayer({ source: new XYZ({ url: 'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png', maxZoom: 20 }), properties: { name: 'basemap' } }),
  };
  return (opts[type] || opts.satellite)();
}

// === PENYULANG GROUPS: Main feeder → sub-feeders (connected through GH/gardu hubung) ===
// Sumber: PLTD Fanating & PLTD Kadelang → GH → Penyulang
const PENYULANG_GROUPS: Record<string, string[]> = {
  'MALI':              ['MALI', 'BANDARA', 'KAMAIFUI', 'PLTS KUNEMAN', 'PLTS LANGKURU'],
  'ALOR KECIL':        ['ALOR KECIL', 'BATU NIRWALA'],
  'BATUNIRWALA':       ['BATUNIRWALA', 'BATUNIRWANA'],
  'BINONGKO':          ['BINONGKO', 'KALABAHI', 'EKSPRES KALABAHI'],
  'KABIR':             ['KABIR', 'NULLE', 'TREWENG'],
  'BARANUSA':          ['BARANUSA', 'NULLE/BARANUSA'],
  'MORU':              ['MORU'],
  'MARITAING':         ['MARITAING', 'MARATAING'],
  'PURA':              ['PURA'],
  'PROBUR':            ['PROBUR'],
};

// Reverse lookup: sub-feeder → main feeder
const SUB_TO_MAIN: Record<string, string> = {};
Object.entries(PENYULANG_GROUPS).forEach(([main, subs]) => {
  subs.forEach(sub => { SUB_TO_MAIN[sub] = main; });
});

// Check if an asset's penyulang matches the filter (including sub-feeders)
function matchesPenyulangFilter(assetPenyulang: string, filterValue: string): boolean {
  if (!filterValue) return true; // no filter = show all
  const ap = assetPenyulang.toUpperCase();
  const fv = filterValue.toUpperCase();
  if (ap === fv) return true;
  const filterGroup = PENYULANG_GROUPS[fv];
  if (filterGroup && filterGroup.includes(ap)) return true;
  const assetMain = SUB_TO_MAIN[ap];
  const filterMain = SUB_TO_MAIN[fv];
  if (assetMain && filterMain && assetMain === filterMain) return true;
  return false;
}

// ===== COMPONENT =====
export default function OpenLayersMap({ initialFilterPenyulang = '' }: { initialFilterPenyulang?: string }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const popupOverlayRef = useRef<Overlay | null>(null);

  // Layer refs
  const garduLayerRef = useRef<VectorLayer | null>(null);
  const tiangLayerRef = useRef<VectorLayer | null>(null);
  const jtmLineLayerRef = useRef<VectorLayer | null>(null);
  const jtrLineLayerRef = useRef<VectorLayer | null>(null);
  const proteksiLayerRef = useRef<VectorLayer | null>(null);
  const pembangkitLayerRef = useRef<VectorLayer | null>(null);
  const fcoLayerRef = useRef<VectorLayer | null>(null);
  const recloserLayerRef = useRef<VectorLayer | null>(null);
  const usulanLayerRef = useRef<VectorLayer | null>(null);
  const batasDesaLayerRef = useRef<VectorLayer | null>(null);
  const faultLayerRef = useRef<VectorLayer | null>(null);
  const faultEdgeLayerRef = useRef<VectorLayer | null>(null);
  const faultPolygonLayerRef = useRef<VectorLayer | null>(null);
  const surveyLayerRef = useRef<VectorLayer | null>(null);
  const planningLayerRef = useRef<VectorLayer | null>(null);
  const planningLineLayerRef = useRef<VectorLayer | null>(null);

  const [layers, setLayers] = useState<LayerState>({
    gardu: true, jtmLine: true, jtrLine: true, tiang: true,
    proteksi: true, batasDesa: false, usulan: true,
    pembangkit: true, fco: true, recloser: true, planning: true,
  });
  const [isReady, setIsReady] = useState(false);
  const [basemap, setBasemap] = useState<string>('satellite');
  const [showSidebar, setShowSidebar] = useState(false);
  const [popupContent, setPopupContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'layers' | 'planning' | 'analysis'>('layers');

  // Penyulang filter
  const [filterPenyulang, setFilterPenyulang] = useState<string>(initialFilterPenyulang ? initialFilterPenyulang.toUpperCase() : '');

  // Survey
  const [surveyMode, setSurveyMode] = useState<false | 'JTM' | 'JTR'>(false);
  const [surveyDistance, setSurveyDistance] = useState(0);
  const [surveyPoints, setSurveyPoints] = useState<[number, number][]>([]);
  const [showBomModal, setShowBomModal] = useState(false);
  const [bomData, setBomData] = useState({ tiang: 0, kabelKms: 0, isolatorType: '', isolatorQty: 0, jtmOrjtr: '', totalSpan: 0 });

  // Planning
  const [planningTool, setPlanningTool] = useState<PlanningTool>('none');
  const [planPenyulang, setPlanPenyulang] = useState('MALI');
  const [placedPoles, setPlacedPoles] = useState<{ lat: number; lng: number; connectedTo?: string }[]>([]);

  // Fault
  const [faultMode, setFaultMode] = useState(false);
  const [faultResult, setFaultResult] = useState<FaultResult | null>(null);
  const networkGraphRef = useRef<{ graph: GraphType; nodeMap: globalThis.Map<string, NetworkNode> } | null>(null);

  const [healthStatus, setHealthStatus] = useState<{ connected: boolean; issues: string[] } | null>(null);
  const [showLegend, setShowLegend] = useState(true);
  const [legendPos, setLegendPos] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingLegend, setIsDraggingLegend] = useState(false);
  const legendRef = useRef<HTMLDivElement>(null);
  const legendDragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // JTM/JTR line data loaded from GeoJSON
  const [jtmLineData, setJtmLineData] = useState<any[]>([]);
  const [jtrLineData, setJtrLineData] = useState<any[]>([]);

  // Store
  const gardus = useAssetStore(s => s.gardus);
  const tiangJTM = useAssetStore(s => s.tiangJTM);
  const fetchAssets = useAssetStore(s => s.fetchAssets);
  const setTiangJTM = useAssetStore(s => s.setTiangJTM);
  const setGardus = useAssetStore(s => s.setGardus);
  const usulanTiang = useAssetStore(s => s.usulanTiang);
  const usulanGardu = useAssetStore(s => s.usulanGardu);
  const addUsulanTiang = useAssetStore(s => s.addUsulanTiang);
  const addUsulanGardu = useAssetStore(s => s.addUsulanGardu);
  const addUsulanJalur = useAssetStore(s => s.addUsulanJalur);
  const hardwareAssets = useAssetStore(s => s.hardwareAssets);

  const penyulangList = useMemo(() => {
    // Show main feeder groups + any orphan penyulang names
    const mainSet = new Set<string>(Object.keys(PENYULANG_GROUPS));
    // Also add any penyulang from data not in groups
    tiangJTM.forEach(t => {
      const p = (t.penyulang || '').toUpperCase();
      if (p && !SUB_TO_MAIN[p]) mainSet.add(p);
    });
    return Array.from(mainSet).sort();
  }, [tiangJTM]);

  const haversine = (a: [number, number], b: [number, number]) => {
    const R = 6371000;
    const dLat = (b[1] - a[1]) * Math.PI / 180;
    const dLng = (b[0] - a[0]) * Math.PI / 180;
    const sinLat = Math.sin(dLat / 2);
    const sinLng = Math.sin(dLng / 2);
    const h = sinLat * sinLat + Math.cos(a[1] * Math.PI / 180) * Math.cos(b[1] * Math.PI / 180) * sinLng * sinLng;
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  };

  const findNearestAsset = useCallback((lat: number, lng: number): { lat: number; lng: number; name: string; dist: number } | null => {
    let nearest: { lat: number; lng: number; name: string; dist: number } | null = null;
    tiangJTM.forEach(t => {
      const tlat = t.lat || t.latitude; const tlng = t.lng || t.longitude;
      if (!tlat || !tlng) return;
      const d = haversine([lng, lat], [tlng, tlat]);
      if (!nearest || d < nearest.dist) nearest = { lat: tlat, lng: tlng, name: t.nama_tiang || 'Tiang', dist: d };
    });
    gardus.forEach(g => {
      const glat = g.lat || g.latitude; const glng = g.lng || g.longitude;
      if (!glat || !glng) return;
      const d = haversine([lng, lat], [glng, glat]);
      if (!nearest || d < nearest.dist) nearest = { lat: glat, lng: glng, name: g.nama || g.namaGardu || 'Gardu', dist: d };
    });
    placedPoles.forEach((p, i) => {
      const d = haversine([lng, lat], [p.lng, p.lat]);
      if (!nearest || d < nearest.dist) nearest = { lat: p.lat, lng: p.lng, name: `Rencana-${i + 1}`, dist: d };
    });
    return nearest;
  }, [tiangJTM, gardus, placedPoles]);



  // ===== LOAD JTM LINES FROM GEOJSON (using python-fixed MultiLineString topology) =====
  useEffect(() => {
    fetch('/data/jtm-lines-fixed.geojson')
      .then(r => r.json())
      .then(gj => {
        const lines: any[] = [];
        gj.features.forEach((f: any, i: number) => {
          if (!f.geometry?.coordinates) return;
          const coords = f.geometry.type === 'MultiLineString' ? f.geometry.coordinates : [f.geometry.coordinates];
          coords.forEach((ring: any, ri: number) => {
            if (ring.length >= 2) {
              lines.push({
                id: `jtm-${i}-${ri}`,
                penyulang: f.properties?.NAMAPENYULANG || f.properties?.Penyulang_KMZ || '',
                coordinates: ring.map((c: number[]) => [c[0], c[1]]),
                konduktor: 'AAAC', // default
              });
            }
          });
        });
        setJtmLineData(lines);
      })
      .catch(e => console.warn('JTM GeoJSON load failed:', e));
  }, []);

  // ===== LOAD JTR LINES FROM GEOJSON (actual MultiLineString geometries) =====
  useEffect(() => {
    fetch('/data/jtr-lines.geojson')
      .then(r => r.json())
      .then(gj => {
        const lines: any[] = [];
        gj.features.forEach((f: any, i: number) => {
          if (!f.geometry?.coordinates) return;
          const coords = f.geometry.type === 'MultiLineString' ? f.geometry.coordinates : [f.geometry.coordinates];
          coords.forEach((ring: any, ri: number) => {
            if (ring.length >= 2) {
              lines.push({
                id: `jtr-${i}-${ri}`,
                gardu: f.properties?.NAMAGD || '',
                penyulang: f.properties?.NAMAPENYULANG || '',
                coordinates: ring.map((c: number[]) => [c[0], c[1]]),
              });
            }
          });
        });
        setJtrLineData(lines);
      })
      .catch(e => console.warn('JTR GeoJSON load failed:', e));
  }, []);

  // ===== INIT MAP =====
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new Map({
      target: mapContainer.current,
      layers: [getBasemapLayer('satellite')],
      view: new View({
        center: fromLonLat([CENTER_LNG, CENTER_LAT]),
        zoom: 12, maxZoom: 20, minZoom: 5,
      }),
      controls: defaultControls({ attribution: false }).extend([
        new ScaleLine({ units: 'metric' }),
        new ZoomSlider(),
      ]),
    });

    const popupOverlay = new Overlay({
      element: popupRef.current!,
      autoPan: { animation: { duration: 250 } } as any,
      positioning: 'bottom-center' as any,
      offset: [0, -20],
    });
    map.addOverlay(popupOverlay);
    popupOverlayRef.current = popupOverlay;

    // ===== JTM Lines Layer =====
    const jtmLineSource = new VectorSource();
    const jtmLineLayer = new VectorLayer({
      source: jtmLineSource,
      style: (feature, resolution) => {
        const penyulang = (feature.get('penyulang') || '').toUpperCase();
        const color = getPenyulangColor(penyulang);
        // Scale line width drastically based on zoom to prevent clutter
        const isZoomedOut = resolution > 15;
        const casingWidth = isZoomedOut ? 0 : 3.5;
        const coreWidth = isZoomedOut ? 1 : 2;
        const styles = [];
        if (casingWidth > 0) {
           styles.push(new Style({ stroke: new Stroke({ color: 'rgba(255, 255, 255, 0.6)', width: casingWidth }) }));
        }
        styles.push(new Style({ stroke: new Stroke({ color, width: coreWidth }) }));
        return styles;
      },
      properties: { name: 'jtmLine' }, zIndex: 5,
    });
    map.addLayer(jtmLineLayer);
    jtmLineLayerRef.current = jtmLineLayer;

    // ===== JTR Lines Layer =====
    const jtrLineSource = new VectorSource();
    const jtrLineLayer = new VectorLayer({
      source: jtrLineSource,
      style: (feature, resolution) => {
         const w = resolution > 15 ? 0.5 : 1.5;
         return new Style({ stroke: new Stroke({ color: '#0ea5e9', width: w, lineDash: resolution > 15 ? undefined : [4, 4] }) });
      },
      properties: { name: 'jtrLine' }, zIndex: 4,
    });
    map.addLayer(jtrLineLayer);
    jtrLineLayerRef.current = jtrLineLayer;

    // Gardu
    const garduLayer = new VectorLayer({
      source: new VectorSource(),
      style: (feature, resolution) => {
        const isFar = resolution > 10;
        return new Style({
          image: new Icon({ 
            src: garduIcon(feature.get('konstruksi')), 
            scale: isFar ? 0.4 : 0.6, 
            anchor: [0.5, 0.5] 
          }),
          text: isFar ? undefined : new Text({
            text: `${feature.get('name') || ''}\n${feature.get('kapasitas') || ''} kVA`,
            font: 'bold 10px "Inter", sans-serif',
            fill: new Fill({ color: '#1e3a8a' }),
            stroke: new Stroke({ color: '#ffffff', width: 4 }),
            offsetY: 20, textAlign: 'center',
          }),
        });
      },
      properties: { name: 'gardu' }, zIndex: 10,
    });
    map.addLayer(garduLayer);
    garduLayerRef.current = garduLayer;

    // Tiang
    const tiangLayer = new VectorLayer({
      source: new VectorSource(),
      style: (feature, resolution) => {
        const color = getPenyulangColor(feature.get('penyulang'));
        const konstruksi = (feature.get('kode_konstruksi') || '').toUpperCase();
        const isUjung = konstruksi.includes('FDE') || konstruksi.includes('ADE');
        const isFar = resolution > 10;
        
        if (isUjung) {
          // Terminal/Dead-end poles rendered as distinct squares
          return new Style({
            image: new RegularShape({
              points: 4,
              angle: Math.PI / 4, // diamond shape
              radius: isFar ? 3 : 5.5,
              fill: new Fill({ color: '#fcd34d' }), // Golden yellow indicating terminal
              stroke: new Stroke({ color: '#ea580c', width: 1.5 })
            }),
            zIndex: 15
          });
        }

        return new Style({
          image: new CircleStyle({
            radius: isFar ? 1.5 : 3.5,
            fill: new Fill({ color }),
            stroke: new Stroke({ color: '#ffffff', width: isFar ? 0.5 : 1.2 })
          }),
        });
      },
      properties: { name: 'tiang' }, zIndex: 8,
    });
    map.addLayer(tiangLayer);
    tiangLayerRef.current = tiangLayer;

    // Proteksi
    const proteksiLayer = new VectorLayer({
      source: new VectorSource(),
      style: (feature) => new Style({
        image: new Icon({ src: proteksiIcon(feature.get('jenis') || ''), scale: 0.65, anchor: [0.5, 0.5] }),
      }),
      properties: { name: 'proteksi' }, zIndex: 12,
    });
    map.addLayer(proteksiLayer);
    proteksiLayerRef.current = proteksiLayer;

    // Pembangkit
    const pembangkitLayer = new VectorLayer({
      source: new VectorSource(),
      style: (feature) => {
        const tipe = (feature.get('tipe') || '').toUpperCase();
        return new Style({
          image: new Icon({ src: tipe.includes('PLTS') || tipe.includes('SOLAR') ? solarIcon() : generatorIcon(), scale: 0.9, anchor: [0.5, 0.5] }),
          text: new Text({
            text: feature.get('name') || '',
            font: 'bold 10px "Inter", sans-serif',
            fill: new Fill({ color: '#fff' }),
            stroke: new Stroke({ color: '#92400e', width: 3 }),
            offsetY: 26,
          }),
        });
      },
      properties: { name: 'pembangkit' }, zIndex: 15,
    });
    map.addLayer(pembangkitLayer);
    pembangkitLayerRef.current = pembangkitLayer;

    // FCO
    const fcoLayer = new VectorLayer({
      source: new VectorSource(),
      style: (feature) => new Style({
        image: new Icon({ src: fcoIcon(), scale: 0.65, anchor: [0.5, 0.5] }),
        text: new Text({ text: feature.get('name') || 'FCO', font: 'bold 9px "Inter"', fill: new Fill({ color: '#fff' }), stroke: new Stroke({ color: '#0284c7', width: 3 }), offsetY: 22 }),
      }),
      properties: { name: 'fco' }, zIndex: 11,
    });
    map.addLayer(fcoLayer);
    fcoLayerRef.current = fcoLayer;

    // Recloser
    const recloserLayer = new VectorLayer({
      source: new VectorSource(),
      style: (feature) => new Style({
        image: new Icon({ src: recloserIcon(), scale: 0.65, anchor: [0.5, 0.5] }),
        text: new Text({ text: feature.get('name') || 'REC', font: 'bold 9px "Inter"', fill: new Fill({ color: '#fff' }), stroke: new Stroke({ color: '#be123c', width: 3 }), offsetY: 22 }),
      }),
      properties: { name: 'recloser' }, zIndex: 11,
    });
    map.addLayer(recloserLayer);
    recloserLayerRef.current = recloserLayer;

    // Batas Desa
    const batasDesaLayer = new VectorLayer({
      source: new VectorSource(),
      style: new Style({ stroke: new Stroke({ color: '#cbd5e1', width: 1.5, lineDash: [6, 4] }), fill: new Fill({ color: 'rgba(148, 163, 184, 0.06)' }) }),
      properties: { name: 'batasDesa' }, visible: false, zIndex: 1,
    });
    map.addLayer(batasDesaLayer);
    batasDesaLayerRef.current = batasDesaLayer;

    // Fault layers
    const faultLayer = new VectorLayer({
      source: new VectorSource(),
      style: (feature) => new Style({
        image: new CircleStyle({ radius: feature.get('isFault') ? 16 : 10, fill: new Fill({ color: feature.get('isFault') ? 'rgba(220,38,38,0.85)' : 'rgba(220,38,38,0.45)' }), stroke: new Stroke({ color: '#fca5a5', width: feature.get('isFault') ? 4 : 2 }) }),
      }),
      properties: { name: 'faultNodes' }, zIndex: 20,
    });
    map.addLayer(faultLayer);
    faultLayerRef.current = faultLayer;

    const faultEdgeLayer = new VectorLayer({
      source: new VectorSource(),
      style: [new Style({ stroke: new Stroke({ color: 'rgba(239,68,68,0.3)', width: 10 }) }), new Style({ stroke: new Stroke({ color: '#ef4444', width: 4, lineDash: [8, 6] }) })],
      properties: { name: 'faultEdges' }, zIndex: 19,
    });
    map.addLayer(faultEdgeLayer);
    faultEdgeLayerRef.current = faultEdgeLayer;

    const faultPolyLayer = new VectorLayer({
      source: new VectorSource(),
      style: new Style({ fill: new Fill({ color: 'rgba(220,38,38,0.15)' }), stroke: new Stroke({ color: '#dc2626', width: 2, lineDash: [8, 4] }) }),
      properties: { name: 'faultPolygon' }, zIndex: 18,
    });
    map.addLayer(faultPolyLayer);
    faultPolygonLayerRef.current = faultPolyLayer;

    // Survey
    const surveyLayer = new VectorLayer({
      source: new VectorSource(),
      style: (feature) => {
        const color = feature.get('color') || '#3b82f6';
        return feature.getGeometry()?.getType() === 'Point'
          ? new Style({ image: new CircleStyle({ radius: 7, fill: new Fill({ color }), stroke: new Stroke({ color: '#fff', width: 2.5 }) }) })
          : [new Style({ stroke: new Stroke({ color: color + '40', width: 10 }) }), new Style({ stroke: new Stroke({ color, width: 4, lineDash: [10, 8] }) })];
      },
      properties: { name: 'survey' }, zIndex: 22,
    });
    map.addLayer(surveyLayer);
    surveyLayerRef.current = surveyLayer;

    // Planning
    const planningLayer = new VectorLayer({
      source: new VectorSource(),
      style: (feature) => {
        const ft = feature.get('ftype');
        if (ft === 'proposed-tiang') return new Style({ image: new Icon({ src: proposedTiangIcon(), scale: 0.6, anchor: [0.5, 1] }), text: new Text({ text: feature.get('label') || '', font: 'bold 10px "Inter"', fill: new Fill({ color: '#fff' }), stroke: new Stroke({ color: '#15803d', width: 3 }), offsetY: -30 }) });
        if (ft === 'proposed-gardu') return new Style({ image: new Icon({ src: proposedGarduIcon(), scale: 0.75, anchor: [0.5, 0.5] }) });
        return new Style();
      },
      properties: { name: 'planning' }, zIndex: 16,
    });
    map.addLayer(planningLayer);
    planningLayerRef.current = planningLayer;

    const planningLineLayer = new VectorLayer({
      source: new VectorSource(),
      style: [new Style({ stroke: new Stroke({ color: 'rgba(34,197,94,0.3)', width: 10 }) }), new Style({ stroke: new Stroke({ color: '#22c55e', width: 3, lineDash: [12, 8] }) })],
      properties: { name: 'planningLines' }, zIndex: 15,
    });
    map.addLayer(planningLineLayer);
    planningLineLayerRef.current = planningLineLayer;

    // Usulan
    const usulanLayer = new VectorLayer({
      source: new VectorSource(),
      style: (feature) => {
        const color = STATUS_COLORS[(feature.get('status') || 'usulan') as StatusUsulan] || '#eab308';
        return new Style({ image: new CircleStyle({ radius: 8, fill: new Fill({ color }), stroke: new Stroke({ color: '#fff', width: 2 }) }), stroke: new Stroke({ color, width: 3, lineDash: [4, 3] }) });
      },
      properties: { name: 'usulan' }, zIndex: 14,
    });
    map.addLayer(usulanLayer);
    usulanLayerRef.current = usulanLayer;

    // ===== CLICK =====
    map.on('singleclick', (evt) => {
      let found = false;
      map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
        if (found) return;
        found = true;
        const props = feature.getProperties();
        const ln = layer?.get('name') || '';
        let html = '';
        if (ln === 'gardu') html = `<div style="border-left:4px solid #3b82f6;padding-left:10px"><b style="font-size:14px;color:#93c5fd">${props.name || 'Gardu'}</b><br/><span style="color:#94a3b8">Tipe:</span> ${props.tipe || '-'}<br/><span style="color:#94a3b8">Konstruksi:</span> ${props.konstruksi || '-'}<br/><span style="color:#94a3b8">Kapasitas:</span> <b>${props.kapasitas || '-'} kVA</b><br/><span style="color:#94a3b8">Penyulang:</span> ${props.penyulang || '-'}</div>`;
        else if (ln === 'tiang') html = `<div style="border-left:4px solid ${getPenyulangColor(props.penyulang)};padding-left:10px"><b style="font-size:14px">${props.name || 'Tiang'}</b><br/><span style="color:#94a3b8">Penyulang:</span> ${props.penyulang || '-'}<br/><span style="color:#94a3b8">Tipe:</span> ${props.tipeKonstruksi || '-'}<br/><span style="color:#94a3b8">Jenis:</span> ${props.jenisTiang || '-'}</div>`;
        else if (ln === 'proteksi') html = `<div style="border-left:4px solid #e11d48;padding-left:10px"><b>${props.name || 'Proteksi'}</b><br/><span style="color:#94a3b8">Jenis:</span> <b>${props.jenis || '-'}</b><br/><span style="color:#94a3b8">Penyulang:</span> ${props.penyulang || '-'}</div>`;
        else if (ln === 'pembangkit') html = `<div style="border-left:4px solid #d97706;padding-left:10px"><b style="color:#fbbf24">${props.name || 'Pembangkit'}</b><br/><span style="color:#94a3b8">Tipe:</span> <b>${props.tipe || '-'}</b><br/><span style="color:#94a3b8">Kapasitas:</span> ${props.kapasitas || '-'}</div>`;
        else if (ln === 'fco') html = `<div style="border-left:4px solid #0284c7;padding-left:10px"><b>FCO: ${props.name || '-'}</b></div>`;
        else if (ln === 'recloser') html = `<div style="border-left:4px solid #e11d48;padding-left:10px"><b>Recloser: ${props.name || '-'}</b></div>`;
        else if (ln === 'jtmLine') html = `<div style="border-left:4px solid ${getPenyulangColor(props.penyulang)};padding-left:10px"><b>JTM Line</b><br/>Penyulang: <b>${props.penyulang || '-'}</b></div>`;
        else if (ln === 'jtrLine') html = `<div style="border-left:4px solid #64748b;padding-left:10px"><b>JTR Line</b><br/>Gardu: <b>${props.gardu || '-'}</b><br/>Penyulang: ${props.penyulang || '-'}</div>`;
        else html = `<b>${props.name || ln}</b>`;
        setPopupContent(html);
        popupOverlayRef.current?.setPosition(evt.coordinate);
      }, { hitTolerance: 10 });
      if (!found) popupOverlayRef.current?.setPosition(undefined);
    });

    map.on('pointermove', (evt) => {
      if (evt.dragging) return;
      const hit = map.hasFeatureAtPixel(evt.pixel, { hitTolerance: 8 });
      map.getTargetElement().style.cursor = hit ? 'pointer' : '';
    });

    mapRef.current = map;
    setIsReady(true);
    return () => { map.setTarget(undefined); mapRef.current = null; };
  }, []);

  // ===== BASEMAP SWITCH =====
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const existing = map.getLayers().getArray().find(l => l.get('name') === 'basemap');
    if (existing) map.getLayers().remove(existing);
    map.getLayers().insertAt(0, getBasemapLayer(basemap));
  }, [basemap]);

  // ===== RENDER JTM LINES (with penyulang group filter) =====
  useEffect(() => {
    if (!isReady || !jtmLineLayerRef.current || jtmLineData.length === 0) return;
    const source = jtmLineLayerRef.current.getSource()!;
    source.clear();
    let count = 0;
    jtmLineData.forEach(seg => {
      if (!seg.coordinates || seg.coordinates.length < 2) return;
      if (!matchesPenyulangFilter(seg.penyulang || '', filterPenyulang)) return;
      const coords = seg.coordinates.map((c: number[]) => fromLonLat(c));
      const f = new Feature({ geometry: new LineString(coords) });
      f.setProperties({ penyulang: seg.penyulang, konduktor: seg.konduktor });
      source.addFeature(f);
      count++;
    });
    console.log(`[Map] JTM lines rendered: ${count}/${jtmLineData.length} (filter: ${filterPenyulang || 'all'})`);
  }, [jtmLineData, isReady, filterPenyulang]);

  // ===== RENDER JTR LINES (with penyulang group filter) =====
  useEffect(() => {
    if (!isReady || !jtrLineLayerRef.current || jtrLineData.length === 0) return;
    const source = jtrLineLayerRef.current.getSource()!;
    source.clear();
    let count = 0;
    jtrLineData.forEach(seg => {
      if (!seg.coordinates || seg.coordinates.length < 2) return;
      if (!matchesPenyulangFilter(seg.penyulang || '', filterPenyulang)) return;
      const coords = seg.coordinates.map((c: number[]) => fromLonLat(c));
      const f = new Feature({ geometry: new LineString(coords) });
      f.setProperties({ gardu: seg.gardu, penyulang: seg.penyulang });
      source.addFeature(f);
      count++;
    });
    console.log(`[Map] JTR lines rendered: ${count}/${jtrLineData.length} (filter: ${filterPenyulang || 'all'})`);
  }, [jtrLineData, isReady, filterPenyulang]);

  // ===== POPULATE ASSET LAYERS (with penyulang group filter) =====
  useEffect(() => {
    if (!isReady || !garduLayerRef.current) return;
    const src = garduLayerRef.current.getSource()!; src.clear();
    gardus.forEach(g => {
      const lat = g.lat || g.latitude; const lng = g.lng || g.longitude;
      if (!lat || !lng) return;
      const gPenyulang = (g.penyulang || g.namaPenyulang || g.feeder || '').toUpperCase();
      if (!matchesPenyulangFilter(gPenyulang, filterPenyulang)) return;
      const f = new Feature({ geometry: new Point(fromLonLat([lng, lat])) });
      f.setProperties({ name: g.nama || g.namaGardu, konstruksi: g.jenis_konstruksi || g.konstruksi, kapasitas: g.kapasitas_kva || g.kapasitas, penyulang: gPenyulang, tipe: g.tipe || 'Distribusi' });
      src.addFeature(f);
    });
  }, [gardus, isReady, filterPenyulang]);

  useEffect(() => {
    if (!isReady || !tiangLayerRef.current) return;
    const src = tiangLayerRef.current.getSource()!; src.clear();
    tiangJTM.forEach(t => {
      const lat = t.lat || t.latitude; const lng = t.lng || t.longitude;
      if (!lat || !lng) return;
      const tPenyulang = (t.penyulang || '').toUpperCase();
      if (!matchesPenyulangFilter(tPenyulang, filterPenyulang)) return;
      const f = new Feature({ geometry: new Point(fromLonLat([lng, lat])) });
      f.setProperties({ name: t.nama_tiang || (t as any).name, penyulang: tPenyulang, tipeKonstruksi: t.tipe_tiang, jenisTiang: t.jenis_tiang });
      src.addFeature(f);
    });
  }, [tiangJTM, isReady, filterPenyulang]);

  useEffect(() => {
    if (!isReady || !proteksiLayerRef.current) return;
    const src = proteksiLayerRef.current.getSource()!; src.clear();
    demoProteksi.forEach(p => {
      if (!p.latitude || !p.longitude) return;
      const pPenyulang = (p.penyulang || '').toUpperCase();
      if (!matchesPenyulangFilter(pPenyulang, filterPenyulang)) return;
      const f = new Feature({ geometry: new Point(fromLonLat([p.longitude, p.latitude])) });
      f.setProperties({ name: p.nama, jenis: p.jenis, penyulang: pPenyulang });
      src.addFeature(f);
    });
  }, [isReady, filterPenyulang]);

  useEffect(() => {
    if (!isReady || !pembangkitLayerRef.current) return;
    const src = pembangkitLayerRef.current.getSource()!; src.clear();
    hardwareAssets.filter(h => h.type === 'pembangkit').forEach(p => {
      if (!p.lat || !p.lng) return;
      const f = new Feature({ geometry: new Point(fromLonLat([p.lng, p.lat])) });
      f.setProperties({ name: p.name, tipe: (p as any).subtype || (p.name.includes('PLTS') ? 'PLTS' : 'PLTD'), kapasitas: (p as any).kapasitas_kw ? `${(p as any).kapasitas_kw} kW` : '-' });
      src.addFeature(f);
    });
  }, [hardwareAssets, isReady]);

  useEffect(() => {
    if (!isReady) return;
    if (fcoLayerRef.current) {
      const src = fcoLayerRef.current.getSource()!; src.clear();
      hardwareAssets.filter(h => h.type === 'fco').forEach(p => {
        if (!p.lat || !p.lng) return;
        const f = new Feature({ geometry: new Point(fromLonLat([p.lng, p.lat])) });
        f.setProperties({ name: p.name }); src.addFeature(f);
      });
    }
    if (recloserLayerRef.current) {
      const src = recloserLayerRef.current.getSource()!; src.clear();
      hardwareAssets.filter(h => h.type === 'recloser').forEach(p => {
        if (!p.lat || !p.lng) return;
        const f = new Feature({ geometry: new Point(fromLonLat([p.lng, p.lat])) });
        f.setProperties({ name: p.name }); src.addFeature(f);
      });
    }
  }, [hardwareAssets, isReady]);

  useEffect(() => {
    if (!isReady || !batasDesaLayerRef.current) return;
    try {
      const features = new GeoJSON().readFeatures(batasDesaGeoJSON, { featureProjection: 'EPSG:3857' });
      batasDesaLayerRef.current.getSource()!.clear();
      batasDesaLayerRef.current.getSource()!.addFeatures(features);
    } catch {}
  }, [isReady]);

  // ===== LAYER VISIBILITY =====
  useEffect(() => {
    if (!isReady) return;
    garduLayerRef.current?.setVisible(layers.gardu);
    tiangLayerRef.current?.setVisible(layers.tiang);
    jtmLineLayerRef.current?.setVisible(layers.jtmLine);
    jtrLineLayerRef.current?.setVisible(layers.jtrLine);
    proteksiLayerRef.current?.setVisible(layers.proteksi);
    pembangkitLayerRef.current?.setVisible(layers.pembangkit);
    fcoLayerRef.current?.setVisible(layers.fco);
    recloserLayerRef.current?.setVisible(layers.recloser);
    batasDesaLayerRef.current?.setVisible(layers.batasDesa);
    usulanLayerRef.current?.setVisible(layers.usulan);
    planningLayerRef.current?.setVisible(layers.planning);
    planningLineLayerRef.current?.setVisible(layers.planning);
  }, [layers, isReady]);

  const toggleLayer = (key: keyof LayerState) => setLayers(p => ({ ...p, [key]: !p[key] }));

  // ===== PLANNING MODE =====
  useEffect(() => {
    if (!mapRef.current || !isReady) return;
    const map = mapRef.current;
    const onPlanClick = (evt: any) => {
      if (planningTool === 'none') return;
      let hitFeature = false;
      map.forEachFeatureAtPixel(evt.pixel, () => { hitFeature = true; }, { hitTolerance: 8 });
      if (hitFeature) return;

      const [lng, lat] = toLonLat(evt.coordinate);
      if (planningTool === 'add-tiang') {
        const nearest = findNearestAsset(lat, lng);
        const n = placedPoles.length + 1;
        if (planningLayerRef.current) {
          const f = new Feature({ geometry: new Point(fromLonLat([lng, lat])) });
          f.setProperties({ ftype: 'proposed-tiang', label: `P-${n}` });
          planningLayerRef.current.getSource()!.addFeature(f);
        }
        if (nearest && nearest.dist < 5000 && planningLineLayerRef.current) {
          planningLineLayerRef.current.getSource()!.addFeature(new Feature({ geometry: new LineString([fromLonLat([nearest.lng, nearest.lat]), fromLonLat([lng, lat])]) }));
          toast(`📍 P-${n} → ${nearest.name} (${Math.round(nearest.dist)}m)`, { icon: '🔗', duration: 3000, style: { background: '#0f172a', color: '#86efac', border: '1px solid #166534', fontWeight: 600, fontSize: 12 } });
        }
        setPlacedPoles(prev => [...prev, { lat, lng, connectedTo: nearest?.name }]);
        addUsulanTiang({ id: `plan-${Date.now()}-${n}`, nama_tiang: `Rencana P-${n}`, penyulang: planPenyulang, tipe_konstruksi: 'Tumpu', jenis_tiang: 'Beton', tipe_tiang: '11', latitude: lat, longitude: lng, status: 'usulan', catatan: nearest ? `→ ${nearest.name} (${Math.round(nearest.dist)}m)` : 'Manual', createdAt: new Date().toISOString() });
      }
      if (planningTool === 'add-gardu') {
        if (planningLayerRef.current) {
          const f = new Feature({ geometry: new Point(fromLonLat([lng, lat])) });
          f.setProperties({ ftype: 'proposed-gardu' });
          planningLayerRef.current.getSource()!.addFeature(f);
        }
        addUsulanGardu({ id: `plan-gardu-${Date.now()}`, nama: `Rencana Gardu`, penyulang: planPenyulang, kapasitas_kva: 50, jenis_konstruksi: 'cantol', latitude: lat, longitude: lng, status: 'usulan', catatan: '', createdAt: new Date().toISOString() });
        toast.success('📍 Gardu baru ditambahkan');
      }
    };
    if (planningTool !== 'none') { map.on('singleclick', onPlanClick); map.getTargetElement().style.cursor = 'crosshair'; }
    return () => { map.un('singleclick', onPlanClick); if (planningTool === 'none' && !faultMode && !surveyMode && map.getTargetElement()) map.getTargetElement().style.cursor = ''; };
  }, [planningTool, isReady, placedPoles, planPenyulang, findNearestAsset, faultMode, surveyMode]);

  const clearPlanning = useCallback(() => { planningLayerRef.current?.getSource()?.clear(); planningLineLayerRef.current?.getSource()?.clear(); setPlacedPoles([]); }, []);

  // ===== FAULT ANALYSIS =====
  useEffect(() => {
    if (tiangJTM.length === 0 && gardus.length === 0) return;
    try {
      const result = buildNetworkGraph(tiangJTM, gardus, hardwareAssets.filter(h => h.type === 'pembangkit'), 120);
      networkGraphRef.current = result;
    } catch {}
  }, [tiangJTM, gardus, hardwareAssets]);

  useEffect(() => {
    if (!mapRef.current || !isReady) return;
    const map = mapRef.current;
    const onFaultClick = (evt: any) => {
      if (!faultMode || !networkGraphRef.current) return;
      const coord = toLonLat(evt.coordinate);
      const { graph, nodeMap } = networkGraphRef.current;
      const nearest = findNearestNode(coord[1], coord[0], nodeMap, 500);
      if (!nearest) { toast.error('Tidak ada aset dalam 500m'); return; }
      const result = simulateFault(nearest.id, graph, nodeMap);
      setFaultResult(result);
      // Render fault
      if (faultLayerRef.current) {
        const src = faultLayerRef.current.getSource()!; src.clear();
        result.affectedNodes.forEach(n => {
          const f = new Feature({ geometry: new Point(fromLonLat([n.lng, n.lat])) });
          f.setProperties({ isFault: n.id === result.faultNodeId }); src.addFeature(f);
        });
      }
      if (faultEdgeLayerRef.current && networkGraphRef.current) {
        const src = faultEdgeLayerRef.current.getSource()!; src.clear();
        const { graph: g, nodeMap: nm } = networkGraphRef.current;
        result.affectedEdgeKeys.forEach(ek => {
          try { const [s, t] = g.extremities(ek); const sN = nm.get(s), tN = nm.get(t); if (sN && tN) src.addFeature(new Feature({ geometry: new LineString([fromLonLat([sN.lng, sN.lat]), fromLonLat([tN.lng, tN.lat])]) })); } catch {}
        });
      }
      if (faultPolygonLayerRef.current && (result.blackoutPolygon?.length ?? 0) >= 4) {
        const src = faultPolygonLayerRef.current.getSource()!; src.clear();
        src.addFeature(new Feature({ geometry: new OlPolygon([result.blackoutPolygon!.map(c => fromLonLat(c))]) }));
      }
      toast(`⚡ ${result.faultNodeName}: ${result.totalAffectedTiang} tiang + ${result.totalAffectedGardu} gardu padam`, { icon: '🔴', duration: 5000, style: { background: '#1c1917', color: '#fca5a5', border: '1px solid #dc2626' } });
    };
    if (faultMode) { map.on('singleclick', onFaultClick); map.getTargetElement().style.cursor = 'crosshair'; }
    return () => { map.un('singleclick', onFaultClick); if (!faultMode && !surveyMode && planningTool === 'none' && map.getTargetElement()) map.getTargetElement().style.cursor = ''; };
  }, [faultMode, isReady]);

  const clearFault = useCallback(() => {
    setFaultResult(null);
    faultLayerRef.current?.getSource()?.clear();
    faultEdgeLayerRef.current?.getSource()?.clear();
    faultPolygonLayerRef.current?.getSource()?.clear();
  }, []);
  const toggleFaultMode = useCallback(() => { setFaultMode(p => { if (p) { clearFault(); if (mapRef.current) mapRef.current.getTargetElement().style.cursor = ''; } return !p; }); }, [clearFault]);

  // ===== SEARCH =====
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value; setSearchTerm(term);
    if (term.length < 2) { setSearchResults([]); return; }
    const lc = term.toLowerCase();
    const res: any[] = [];
    gardus.forEach(g => { if ((g.nama || '').toLowerCase().includes(lc) || (g.namaGardu || '').toLowerCase().includes(lc)) res.push({ ...g, type: 'Gardu', lat: g.lat || g.latitude, lng: g.lng || g.longitude }); });
    tiangJTM.forEach(t => { if ((t.nama_tiang || '').toLowerCase().includes(lc)) res.push({ ...t, nama: t.nama_tiang, type: 'Tiang', lat: t.lat || t.latitude, lng: t.lng || t.longitude }); });
    setSearchResults(res.slice(0, 10));
  }, [gardus, tiangJTM]);

  const zoomTo = useCallback((a: any) => { if (!mapRef.current || !a.lat || !a.lng) return; mapRef.current.getView().animate({ center: fromLonLat([a.lng, a.lat]), zoom: 17, duration: 800 }); setSearchResults([]); setSearchTerm(''); }, []);

  // ===== SURVEY =====
  useEffect(() => {
    if (!mapRef.current || !isReady) return;
    const map = mapRef.current;
    const onSurveyClick = (evt: any) => {
      if (!surveyMode) return;
      const coord = toLonLat(evt.coordinate);
      const pt: [number, number] = [coord[0], coord[1]];
      setSurveyPoints(prev => {
        const next = [...prev, pt];
        let total = 0;
        for (let i = 1; i < next.length; i++) total += haversine(next[i - 1], next[i]);
        setSurveyDistance(total);
        if (surveyLayerRef.current) {
          const src = surveyLayerRef.current.getSource()!; src.clear();
          const cl = surveyMode === 'JTM' ? '#3b82f6' : '#ef4444';
          if (next.length > 1) { const f = new Feature({ geometry: new LineString(next.map(c => fromLonLat(c))) }); f.set('color', cl); src.addFeature(f); }
          next.forEach(c => { const pf = new Feature({ geometry: new Point(fromLonLat(c)) }); pf.set('color', cl); src.addFeature(pf); });
        }
        return next;
      });
    };
    if (surveyMode) { map.on('singleclick', onSurveyClick); map.getTargetElement().style.cursor = 'crosshair'; }
    return () => { map.un('singleclick', onSurveyClick); if (!surveyMode && !faultMode && planningTool === 'none' && map.getTargetElement()) map.getTargetElement().style.cursor = ''; };
  }, [surveyMode, isReady]);

  const clearSurvey = useCallback(() => { surveyLayerRef.current?.getSource()?.clear(); setSurveyPoints([]); setSurveyDistance(0); }, []);
  const toggleSurvey = (mode: 'JTM' | 'JTR') => { if (surveyMode === mode) { setSurveyMode(false); clearSurvey(); } else { setSurveyMode(mode); clearSurvey(); } };
  const calculateBoM = useCallback(() => {
    if (surveyPoints.length < 2) return;
    let d = 0; for (let i = 1; i < surveyPoints.length; i++) d += haversine(surveyPoints[i - 1], surveyPoints[i]);
    const ts = Math.ceil(d / 50);
    setBomData({ tiang: ts, kabelKms: d / 1000, isolatorType: surveyMode === 'JTM' ? 'Pin Post 20kV' : 'Shackle', isolatorQty: ts * 3, jtmOrjtr: surveyMode || 'JTM', totalSpan: ts });
    setShowBomModal(true);
  }, [surveyPoints, surveyMode]);

  const saveSurvey = useCallback(() => {
    if (surveyPoints.length < 2) return;
    addUsulanJalur({ id: `survey-${Date.now()}`, nama: `Survey ${surveyMode || 'JTM'} - ${new Date().toLocaleDateString('id-ID')}`, penyulang: 'BARU', coordinates: surveyPoints.map(c => [c[0], c[1]]) as any, status: 'usulan', catatan: `${(bomData.kabelKms).toFixed(2)} kms`, createdAt: new Date().toISOString() });
    toast.success('✅ Survey disimpan'); setShowBomModal(false);
  }, [surveyPoints, surveyMode, bomData, addUsulanJalur]);

  // Health
  const runHealth = useCallback(() => {
    const issues: string[] = [];
    const noG = gardus.filter(g => !(g.lat || g.latitude) || !(g.lng || g.longitude));
    if (noG.length > 0) issues.push(`${noG.length} gardu tanpa koordinat`);
    const noT = tiangJTM.filter(t => !(t.lat || t.latitude) || !(t.lng || t.longitude));
    if (noT.length > 0) issues.push(`${noT.length} tiang tanpa koordinat`);
    if (jtmLineData.length === 0) issues.push('Tidak ada data JTM lines');
    if (jtrLineData.length === 0) issues.push('Tidak ada data JTR lines');
    setHealthStatus({ connected: issues.length === 0, issues });
  }, [gardus, tiangJTM, jtmLineData, jtrLineData]);

  // ===== LEGEND DRAG HANDLERS =====
  const onLegendDragStart = useCallback((e: React.MouseEvent) => {
    // Don't start drag if clicking the close button
    if ((e.target as HTMLElement).closest('[data-legend-close]')) return;
    e.preventDefault();
    setIsDraggingLegend(true);
    const rect = legendRef.current?.getBoundingClientRect();
    const parentRect = legendRef.current?.parentElement?.getBoundingClientRect();
    if (!rect || !parentRect) return;
    legendDragOffset.current = {
      x: e.clientX - rect.left + parentRect.left,
      y: e.clientY - rect.top + parentRect.top,
    };
    const onMove = (ev: MouseEvent) => {
      const px = ev.clientX - legendDragOffset.current.x + parentRect.left;
      const py = ev.clientY - legendDragOffset.current.y + parentRect.top;
      // Clamp within parent bounds
      const maxX = parentRect.width - (rect.width || 200);
      const maxY = parentRect.height - (rect.height || 200);
      setLegendPos({
        x: Math.max(0, Math.min(px, maxX)),
        y: Math.max(0, Math.min(py, maxY)),
      });
    };
    const onUp = () => {
      setIsDraggingLegend(false);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, []);

  const onLegendTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    setIsDraggingLegend(true);
    const rect = legendRef.current?.getBoundingClientRect();
    const parentRect = legendRef.current?.parentElement?.getBoundingClientRect();
    if (!rect || !parentRect) return;
    legendDragOffset.current = {
      x: touch.clientX - rect.left + parentRect.left,
      y: touch.clientY - rect.top + parentRect.top,
    };
    const onMove = (ev: TouchEvent) => {
      const t = ev.touches[0];
      if (!t) return;
      ev.preventDefault();
      const px = t.clientX - legendDragOffset.current.x + parentRect.left;
      const py = t.clientY - legendDragOffset.current.y + parentRect.top;
      const maxX = parentRect.width - (rect.width || 200);
      const maxY = parentRect.height - (rect.height || 200);
      setLegendPos({
        x: Math.max(0, Math.min(px, maxX)),
        y: Math.max(0, Math.min(py, maxY)),
      });
    };
    const onEnd = () => {
      setIsDraggingLegend(false);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  }, []);

  // ===== STYLES =====
  const pnl: React.CSSProperties = { border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 12, background: 'rgba(15,23,42,0.4)' };
  const pnlTitle: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 };
  const btn: React.CSSProperties = { padding: '7px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all 0.15s' };
  const btnP: React.CSSProperties = { ...btn, color: '#fff', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' };
  const sel: React.CSSProperties = { width: '100%', padding: '7px', fontSize: 11, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, background: 'rgba(15,23,42,0.6)', color: '#e2e8f0' };

  // Counts for header
  const garduCount = gardus.length;
  const tiangCount = tiangJTM.length;
  const jtmLineCount = jtmLineData.length;
  const jtrLineCount = jtrLineData.length;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', position: 'relative', fontFamily: '"Inter", sans-serif', background: '#0a0e1a' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {/* Popup */}
      <div ref={popupRef} style={{ display: popupContent ? 'block' : 'none' }}>
        <div style={{ background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(12px)', borderRadius: 10, padding: 14, minWidth: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', border: '1px solid rgba(99,102,241,0.3)', fontSize: 12, lineHeight: 1.7, color: '#e2e8f0', position: 'relative' }}>
          <button onClick={() => { setPopupContent(''); popupOverlayRef.current?.setPosition(undefined); }} style={{ position: 'absolute', top: 4, right: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#64748b' }}>✕</button>
          <div dangerouslySetInnerHTML={{ __html: popupContent }} />
        </div>
      </div>

      <FaultAnalysisPanel result={faultResult} isActive={faultMode} onClear={clearFault} onToggle={toggleFaultMode} />

      {/* ===== TOP BAR ===== */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(10,14,26,0.75)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Home button */}
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#a5b4fc', fontSize: 13, fontWeight: 700, padding: '5px 10px', borderRadius: 8, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', flexShrink: 0 }}>
          ⚡ PLN
        </a>

        {/* Search */}
        <div style={{ flex: 1, maxWidth: 400, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '0 10px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ color: '#64748b', fontSize: 13 }}>🔍</span>
          <input type="text" placeholder="Cari tiang, gardu..." value={searchTerm} onChange={handleSearch}
            style={{ flex: 1, padding: '7px 0', fontSize: 12, border: 'none', background: 'none', outline: 'none', color: '#e2e8f0' }} />
        </div>

        {/* Penyulang Filter */}
        <select
          value={filterPenyulang}
          onChange={(e) => setFilterPenyulang(e.target.value)}
          style={{
            padding: '6px 10px', fontSize: 11, fontWeight: 700, borderRadius: 8,
            background: filterPenyulang ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)',
            border: filterPenyulang ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.08)',
            color: filterPenyulang ? '#a5b4fc' : '#94a3b8',
            cursor: 'pointer', outline: 'none', flexShrink: 0, minWidth: 120,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <option value="" style={{ background: '#0f172a' }}>🔌 Semua Penyulang</option>
          {penyulangList.map(p => (
            <option key={p} value={p} style={{ background: '#0f172a' }}>{p}</option>
          ))}
        </select>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#64748b', fontWeight: 600, flexShrink: 0 }}>
          <span>🏭 {garduCount}</span>
          <span>📍 {tiangCount}</span>
          <span style={{ color: '#3b82f6' }}>— JTM {jtmLineCount}</span>
          <span style={{ color: '#64748b' }}>— JTR {jtrLineCount}</span>
        </div>

        {/* Fault toggle */}
        <button onClick={toggleFaultMode} style={{ ...btn, background: faultMode ? 'rgba(220,38,38,0.3)' : 'rgba(255,255,255,0.05)', color: faultMode ? '#fca5a5' : '#94a3b8', border: `1px solid ${faultMode ? 'rgba(220,38,38,0.5)' : 'rgba(255,255,255,0.08)'}`, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
          ⚡ Gangguan
        </button>

        {/* Sidebar toggle */}
        <button onClick={() => setShowSidebar(!showSidebar)} style={{ ...btn, background: showSidebar ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)', color: showSidebar ? '#a5b4fc' : '#94a3b8', border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
          {showSidebar ? '✕' : '☰'}
        </button>
      </div>

      {/* Active Penyulang filter banner */}
      {filterPenyulang && (
        <div style={{ position: 'absolute', top: 50, left: '50%', transform: 'translateX(-50%)', zIndex: 15, background: `rgba(99,102,241,0.9)`, color: '#fff', padding: '6px 16px', borderRadius: 16, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}>
          🔌 Filter: {filterPenyulang}
          <button onClick={() => setFilterPenyulang('')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '2px 8px', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 10 }}>RESET</button>
        </div>
      )}

      {/* Search results dropdown */}
      {searchResults.length > 0 && (
        <div style={{ position: 'absolute', top: 48, left: 60, zIndex: 20, width: 340, background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(16px)', borderRadius: 10, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', border: '1px solid rgba(99,102,241,0.2)', maxHeight: 280, overflowY: 'auto' }}>
          {searchResults.map((r, i) => (
            <div key={i} onClick={() => zoomTo(r)} style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              onMouseOver={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.1)')} onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
              <div><div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>{r.nama || r.nama_tiang}</div><div style={{ fontSize: 10, color: '#64748b' }}>{r.type} • {r.penyulang}</div></div>
              <span style={{ fontSize: 10, color: '#6366f1' }}>→</span>
            </div>
          ))}
        </div>
      )}

      {/* Active mode banner */}
      {planningTool !== 'none' && (
        <div style={{ position: 'absolute', top: 50, left: '50%', transform: 'translateX(-50%)', zIndex: 15, background: 'rgba(22,101,52,0.9)', color: '#bbf7d0', padding: '6px 16px', borderRadius: 16, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 16px rgba(22,163,74,0.3)', animation: 'pulse 2s infinite' }}>
          📍 {planningTool === 'add-tiang' ? 'KLIK → TAMBAH TIANG' : 'KLIK → TAMBAH GARDU'}
          <button onClick={() => setPlanningTool('none')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '2px 8px', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 10 }}>STOP</button>
        </div>
      )}

      {/* ===== SIDEBAR ===== */}
            <div style={{ position: 'absolute', top: 64, right: showSidebar ? 0 : -340, width: 330, bottom: 0, zIndex: 5, background: 'rgba(10,14,26,0.92)', backdropFilter: 'blur(20px)', borderLeft: '1px solid rgba(255,255,255,0.06)', transition: 'right 0.3s cubic-bezier(0.4,0,0.2,1)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          {([
            { id: 'layers', icon: '🗺️', label: 'Layers' },
            { id: 'planning', icon: '📐', label: 'Planning' },
            { id: 'analysis', icon: '📊', label: 'Analysis' },
          ] as const).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, padding: '10px 0', border: 'none', background: activeTab === tab.id ? 'rgba(99,102,241,0.15)' : 'transparent', color: activeTab === tab.id ? '#a5b4fc' : '#475569', fontSize: 10, fontWeight: 700, cursor: 'pointer', borderBottom: activeTab === tab.id ? '2px solid #6366f1' : '2px solid transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, letterSpacing: 0.5 }}>
              <span style={{ fontSize: 14 }}>{tab.icon}</span>{tab.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 'calc(100vh - 280px)' }}>

          {activeTab === 'layers' && (<>
            <div style={pnl}>
              <div style={pnlTitle}>📂 Asset Layers</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {([
                  ['gardu', '🏭', 'Gardu Distribusi', '#3b82f6'],
                  ['jtmLine', '⚡', 'JTM Lines (20kV)', '#ef4444'],
                  ['jtrLine', '🔌', 'JTR Lines (380V)', '#64748b'],
                  ['tiang', '📍', 'Tiang JTM', '#94a3b8'],
                  ['proteksi', '🛡️', 'CO / LBS', '#e11d48'],
                  ['pembangkit', '⚡', 'Pembangkit', '#f59e0b'],
                  ['fco', '🔵', 'FCO', '#0284c7'],
                  ['recloser', '🔴', 'Recloser', '#e11d48'],
                  ['planning', '📐', 'Rencana', '#22c55e'],
                  ['batasDesa', '🏘️', 'Batas Desa', '#cbd5e1'],
                ] as [string, string, string, string][]).map(([k, icon, label, color]) => (
                  <label key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, cursor: 'pointer', padding: '4px 2px', borderRadius: 4 }}>
                    <span style={{ color: '#cbd5e1', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: 2, background: color, flexShrink: 0 }} />
                      {icon} {label}
                    </span>
                    <input type="checkbox" checked={layers[k as keyof LayerState]} onChange={() => toggleLayer(k as keyof LayerState)} style={{ width: 14, height: 14, accentColor: '#6366f1' }} />
                  </label>
                ))}
              </div>
            </div>

            <div style={pnl}>
              <div style={pnlTitle}>🗺️ Base Map</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
                {[
                  ['satellite', '🛰️', 'Satelit'],
                  ['hybrid', '🗺️', 'Hybrid'],
                  ['terrain', '⛰️', 'Terrain'],
                  ['osm', '🏘️', 'Street'],
                  ['voyager', '✨', 'Clean'],
                ].map(([v, i, l]) => (
                  <button key={v} onClick={() => setBasemap(v)} style={{ ...btn, padding: '6px 4px', background: basemap === v ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.03)', color: basemap === v ? '#a5b4fc' : '#64748b', border: basemap === v ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, fontSize: 9 }}>
                    <span style={{ fontSize: 14 }}>{i}</span>{l}
                  </button>
                ))}
              </div>
            </div>
          </>)}

          {activeTab === 'planning' && (<>
            <div style={pnl}>
              <div style={pnlTitle}>🏗️ Input Titik Baru</div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>Penyulang:</div>
                <select value={planPenyulang} onChange={e => setPlanPenyulang(e.target.value)} style={sel}>
                  {penyulangList.map(p => (<option key={p} value={p}>{p}</option>))}
                  <option value="BARU">➕ Baru</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                <button onClick={() => setPlanningTool(planningTool === 'add-tiang' ? 'none' : 'add-tiang')} style={{ ...btn, flex: 1, background: planningTool === 'add-tiang' ? '#22c55e' : 'rgba(255,255,255,0.05)', color: planningTool === 'add-tiang' ? '#fff' : '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}>📍 Tiang</button>
                <button onClick={() => setPlanningTool(planningTool === 'add-gardu' ? 'none' : 'add-gardu')} style={{ ...btn, flex: 1, background: planningTool === 'add-gardu' ? '#3b82f6' : 'rgba(255,255,255,0.05)', color: planningTool === 'add-gardu' ? '#fff' : '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}>🏭 Gardu</button>
              </div>
              {placedPoles.length > 0 && (
                <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 6, padding: 8, marginBottom: 6, fontSize: 10, color: '#86efac' }}>
                  <b>{placedPoles.length} tiang ditambahkan</b>
                  {placedPoles.slice(-3).map((p, i) => (<div key={i} style={{ color: '#4ade80', marginTop: 2 }}>• ({p.lat.toFixed(5)}, {p.lng.toFixed(5)}) → {p.connectedTo || '-'}</div>))}
                </div>
              )}
              <button onClick={clearPlanning} style={{ ...btn, width: '100%', background: 'rgba(220,38,38,0.1)', color: '#fca5a5', border: '1px solid rgba(220,38,38,0.2)', fontSize: 10 }}>🗑️ Hapus Rencana</button>
            </div>

            <div style={pnl}>
              <div style={pnlTitle}>📏 Survey Jaringan</div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                <button onClick={() => toggleSurvey('JTM')} style={{ ...btn, flex: 1, background: surveyMode === 'JTM' ? '#3b82f6' : 'rgba(255,255,255,0.05)', color: surveyMode === 'JTM' ? '#fff' : '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}>JTM 20kV</button>
                <button onClick={() => toggleSurvey('JTR')} style={{ ...btn, flex: 1, background: surveyMode === 'JTR' ? '#ef4444' : 'rgba(255,255,255,0.05)', color: surveyMode === 'JTR' ? '#fff' : '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}>JTR 380V</button>
              </div>
              {surveyMode && (
                <div style={{ padding: 8, background: 'rgba(59,130,246,0.08)', borderRadius: 6, border: '1px solid rgba(59,130,246,0.2)', marginBottom: 6, textAlign: 'center' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#93c5fd', letterSpacing: 1 }}>ACTIVE: {surveyMode}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#60a5fa' }}>{(surveyDistance / 1000).toFixed(3)} <span style={{ fontSize: 10 }}>km</span></div>
                </div>
              )}
              <button onClick={calculateBoM} disabled={surveyPoints.length < 2} style={{ ...btnP, width: '100%', opacity: surveyPoints.length < 2 ? 0.5 : 1 }}>📊 Hitung BoM</button>
            </div>
          </>)}

          {activeTab === 'analysis' && (<>
            <div style={pnl}>
              <div style={pnlTitle}>🔍 Network Health</div>
              <button onClick={runHealth} style={{ ...btnP, width: '100%', marginBottom: 6 }}>Run Audit</button>
              {healthStatus && (
                <div style={{ padding: 8, background: healthStatus.connected ? 'rgba(34,197,94,0.08)' : 'rgba(220,38,38,0.08)', border: `1px solid ${healthStatus.connected ? 'rgba(34,197,94,0.2)' : 'rgba(220,38,38,0.2)'}`, borderRadius: 6, fontSize: 10 }}>
                  <div style={{ fontWeight: 700, color: healthStatus.connected ? '#4ade80' : '#fca5a5', marginBottom: 4 }}>{healthStatus.connected ? '✅ All OK' : '⚠️ Issues'}</div>
                  {healthStatus.issues.map((iss, i) => <div key={i} style={{ color: '#94a3b8', marginTop: 2 }}>• {iss}</div>)}
                </div>
              )}
            </div>

            <div style={pnl}>
              <div style={pnlTitle}>📊 Data Summary</div>
              <div style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.8 }}>
                <div>Gardu: <b style={{ color: '#e2e8f0' }}>{garduCount}</b></div>
                <div>Tiang JTM: <b style={{ color: '#e2e8f0' }}>{tiangCount}</b></div>
                <div>JTM Lines: <b style={{ color: '#3b82f6' }}>{jtmLineCount} penyulang</b></div>
                <div>JTR Lines: <b style={{ color: '#64748b' }}>{jtrLineCount} segments</b></div>
                <div>FCO: <b style={{ color: '#e2e8f0' }}>{hardwareAssets.filter(h => h.type === 'fco').length}</b></div>
                <div>Recloser: <b style={{ color: '#e2e8f0' }}>{hardwareAssets.filter(h => h.type === 'recloser').length}</b></div>
                <div>Pembangkit: <b style={{ color: '#e2e8f0' }}>{hardwareAssets.filter(h => h.type === 'pembangkit').length}</b></div>
              </div>
            </div>
          </>)}
        </div>

        <div style={{ padding: 8, borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: 8, color: '#334155', textAlign: 'center', letterSpacing: 1.5 }}>
          PLN ULP KALABAHI • OL ENGINE v5
        </div>
      </div>

      {/* ===== LEGEND (draggable, compact, collapsible) ===== */}
      {showLegend && (
        <div
          ref={legendRef}
          onMouseDown={onLegendDragStart}
          onTouchStart={onLegendTouchStart}
          style={{
            position: 'absolute',
            ...(legendPos
              ? { top: legendPos.y, left: legendPos.x }
              : { bottom: 8, left: 8 }),
            zIndex: 5,
            background: 'rgba(10,14,26,0.88)',
            backdropFilter: 'blur(12px)',
            borderRadius: 8,
            boxShadow: isDraggingLegend
              ? '0 8px 32px rgba(99,102,241,0.25), 0 0 0 2px rgba(99,102,241,0.4)'
              : '0 2px 12px rgba(0,0,0,0.3)',
            border: isDraggingLegend
              ? '1px solid rgba(99,102,241,0.5)'
              : '1px solid rgba(255,255,255,0.08)',
            fontSize: 9,
            color: '#94a3b8',
            maxWidth: 200,
            overflow: 'hidden',
            cursor: isDraggingLegend ? 'grabbing' : 'grab',
            userSelect: 'none',
            transition: isDraggingLegend ? 'none' : 'box-shadow 0.2s, border 0.2s',
          }}
        >
          {/* Drag handle + collapse */}
          <div
            style={{
              padding: '5px 10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#475569', fontSize: 10, letterSpacing: 2, lineHeight: 1 }}>⠿</span>
              <span style={{ fontWeight: 700, fontSize: 10, color: '#a5b4fc', letterSpacing: 1 }}>LEGENDA</span>
            </span>
            <span
              onClick={(e) => { e.stopPropagation(); setShowLegend(false); setLegendPos(null); }}
              style={{ color: '#475569', fontSize: 12, cursor: 'pointer', padding: '0 2px' }}
            >−</span>
          </div>
          <div style={{ padding: '6px 10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px' }}>
            <div style={{ gridColumn: '1 / -1', fontWeight: 700, color: '#475569', fontSize: 8, letterSpacing: 1, marginTop: 2 }}>PENYULANG</div>
            {Object.entries(PENYULANG_COLORS).slice(0, 8).map(([n, c]) => (
              <div key={n} style={{ display: 'flex', gap: 4, alignItems: 'center' }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />{n}</div>
            ))}
            <div style={{ gridColumn: '1 / -1', fontWeight: 700, color: '#475569', fontSize: 8, letterSpacing: 1, marginTop: 4 }}>JARINGAN</div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}><div style={{ width: 14, height: 3, background: '#3b82f6', borderRadius: 1 }} />JTM</div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}><div style={{ width: 14, height: 2, background: '#64748b', borderRadius: 1 }} />JTR</div>
            <div style={{ gridColumn: '1 / -1', fontWeight: 700, color: '#475569', fontSize: 8, letterSpacing: 1, marginTop: 4 }}>PERALATAN</div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}><div style={{ width: 8, height: 8, borderRadius: 2, background: '#1e40af' }} />Gardu</div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}><span style={{ color: '#0284c7', fontSize: 8 }}>▬</span>FCO</div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}><span style={{ color: '#e11d48', fontSize: 8 }}>◆</span>Recloser</div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}><span style={{ color: '#f59e0b', fontSize: 8 }}>⬤</span>Pembangkit</div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', border: '1px dashed #fff' }} />Rencana</div>
          </div>
        </div>
      )}
      {!showLegend && (
        <button onClick={() => setShowLegend(true)} style={{ position: 'absolute', bottom: 8, left: 8, zIndex: 5, background: 'rgba(10,14,26,0.8)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 9, fontWeight: 700 }}>LEGENDA ▸</button>
      )}

      {/* ===== BOM MODAL ===== */}
      {showBomModal && (<>
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(20px)', padding: 20, borderRadius: 12, zIndex: 9999, boxShadow: '0 10px 50px rgba(0,0,0,0.6)', width: 380, border: '1px solid rgba(99,102,241,0.3)', color: '#e2e8f0' }}>
          <div style={{ textAlign: 'center', marginBottom: 12, position: 'relative' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#a5b4fc' }}>REKAPITULASI MATERIAL</div>
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>JARINGAN {bomData.jtmOrjtr === 'JTM' ? 'TEGANGAN MENENGAH' : 'TEGANGAN RENDAH'}</div>
            <button onClick={() => setShowBomModal(false)} style={{ position: 'absolute', top: -4, right: -4, background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#64748b' }}>×</button>
          </div>
          {[
            { label: `Tiang ${bomData.jtmOrjtr === 'JTM' ? 'TM' : 'TR'}`, unit: 'Btg', val: bomData.tiang },
            { label: 'Isolator Tumpu', unit: 'Bh', val: bomData.isolatorQty },
            { label: 'Isolator Tarik', unit: 'Set', val: Math.floor(bomData.tiang * 0.15) },
            { label: `Panjang ${bomData.jtmOrjtr}`, unit: 'kms', val: (bomData.kabelKms).toFixed(2) },
          ].map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr auto', gap: 4, padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 12 }}>
              <span>{r.label}</span><span style={{ color: '#64748b' }}>{r.unit}</span><span style={{ fontWeight: 700, color: '#a5b4fc', textAlign: 'right' }}>{r.val}</span>
            </div>
          ))}
          <div style={{ marginTop: 14, display: 'flex', gap: 6 }}>
            <button onClick={saveSurvey} style={{ ...btnP, flex: 1 }}>📥 Simpan</button>
            <button onClick={() => setShowBomModal(false)} style={{ ...btn, flex: 1, background: 'rgba(255,255,255,0.08)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}>Tutup</button>
          </div>
        </div>
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9998 }} onClick={() => setShowBomModal(false)} />
      </>)}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.7} }
        .ol-zoom { top: auto !important; bottom: 10px !important; left: auto !important; right: 8px !important; }
        .ol-zoom button { background: rgba(10,14,26,0.8) !important; color: #94a3b8 !important; border: 1px solid rgba(255,255,255,0.1) !important; font-size: 16px !important; width: 32px !important; height: 32px !important; }
        .ol-zoomslider { display: none !important; }
        .ol-scale-line { bottom: 8px !important; left: auto !important; right: 50px !important; }
        .ol-scale-line-inner { background: rgba(10,14,26,0.7) !important; color: #64748b !important; border: 1px solid rgba(255,255,255,0.1) !important; font-size: 9px !important; }
      `}</style>
    </div>
  );
}
