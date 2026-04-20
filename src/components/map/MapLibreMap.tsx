'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { gpx } from '@tmcw/togeojson';
import {
  demoPenyulang, demoTiang, demoProteksi, demoGangguan,
  Proteksi, CENTER_LAT, CENTER_LNG
} from '@/lib/demo-data';

import { getGarduSVG, getProteksiSVG, getTiangSVG, getTiangSchoorSVG, getTiangKontramastSVG, getProposedPoleSVG, getProposedTrafoSVG, getGeneratorSVG, getSolarSVG, getRecloserSVG, getFcoSVG } from '@/lib/map-utils';
import { useAssetStore, UsulanTiang, UsulanGardu, UsulanJalur, StatusUsulan } from '@/store/assetStore';
import { batasDesaGeoJSON } from '@/lib/batas-desa';
import { draw20kVTopology, runLoadFlowSimulation } from '@/lib/api-python';
import toast from 'react-hot-toast';
import { buildNetworkGraph, simulateFault, findNearestNode, type FaultResult, type NetworkNode } from '@/lib/topology-engine';
import FaultAnalysisPanel from './FaultAnalysisPanel';
import MapSearchFilter from './MapSearchFilter';
import type Graph from 'graphology';

// OpenInfraMap colors
type LineConfig = { color: string; weight: number; dashArray?: number[] };
const OIM_COLORS: Record<string | number, LineConfig> = {
  150: { color: '#B45B1C', weight: 4 }, // >= 132kV
  20: { color: '#6B9ECA', weight: 3 },  // >= 10kV
  0.4: { color: '#7A7A85', weight: 2 }, // < 10kV
  tanah: { color: '#888888', weight: 2, dashArray: [4, 4] }
};

// Penyulang color palette for tiang markers
const PENYULANG_COLORS: Record<string, string> = {
  MALI: '#2563eb',       // blue
  MORU: '#dc2626',       // red
  BATUNIRWALA: '#16a34a', // green
  BARANUSA: '#d97706',   // amber
  KABIR: '#9333ea',      // purple
  MARITAING: '#0891b2',  // cyan
  ILAWE: '#e11d48',      // rose
};

function getPenyulangColor(penyulang: string): string {
  const key = (penyulang || '').toUpperCase();
  return PENYULANG_COLORS[key] || '#475569';
}

type PlanningTool = 'none' | 'add-tiang' | 'add-gardu' | 'draw-jalur';

const STATUS_COLORS: Record<StatusUsulan, string> = {
  usulan: '#eab308', disetujui: '#3b82f6', progres: '#f97316', selesai: '#22c55e',
};

interface LayerState {
  gardu: boolean; penyulang: boolean; tiang: boolean;
  proteksi: boolean; gangguan: boolean; josm: boolean;
  usulan: boolean; batasDesa: boolean;
  pembangkit: boolean; fco: boolean; recloser: boolean;
}

export default function MapLibreMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Record<string, maplibregl.Marker[]>>({
    gardu: [], tiang: [], proteksi: [], gangguan: [],
    pembangkit: [], fco: [], recloser: []
  });

  const [layers, setLayers] = useState<LayerState>({
    gardu: true, penyulang: true, tiang: true,
    proteksi: true, gangguan: true, josm: true, usulan: true, batasDesa: false,
    pembangkit: true, fco: true, recloser: true
  });
  const [isReady, setIsReady] = useState(false);
  const [filterPenyulang, setFilterPenyulang] = useState<string>('all');
  const [filterSpesifikasi, setFilterSpesifikasi] = useState<string>('all');
  const [isSimulating, setIsSimulating] = useState(false);
  const [useAITopology, setUseAITopology] = useState(false);
  const [aiTopologyFeatures, setAiTopologyFeatures] = useState<any[]>([]);
  const [simulationMetrics, setSimulationMetrics] = useState<any>(null);
  const [basemap, setBasemap] = useState<'voyager' | 'satellite' | 'osm'>('voyager');
  const [measureMode, setMeasureMode] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<[number, number][]>([]);
  const [measureDist, setMeasureDist] = useState(0);
  const measureMarkersRef = useRef<maplibregl.Marker[]>([]);

  // Survey Rencana Jaringan Otomatis (Rensis-like)
  const [showSurveyPanel, setShowSurveyPanel] = useState<boolean>(false);
  const [surveyMode, setSurveyMode] = useState<false | 'JTM' | 'JTR'>(false);
  const [surveyInterval, setSurveyInterval] = useState<number>(50);
  const [surveyPoints, setSurveyPoints] = useState<[number, number][]>([]);
  const [surveyDistance, setSurveyDistance] = useState<number>(0);
  const surveyMarkersRef = useRef<maplibregl.Marker[]>([]);
  const [showBomModal, setShowBomModal] = useState<boolean>(false);
  const [bomData, setBomData] = useState<{ tiang: number, kabelKms: number, isolatorType: string, isolatorQty: number, jtmOrjtr: string, totalSpan: number }>({ tiang: 0, kabelKms: 0, isolatorType: '', isolatorQty: 0, jtmOrjtr: '', totalSpan: 0 });

  // Planning mode state
  const [planningTool, setPlanningTool] = useState<PlanningTool>('none');
  const [drawingJalur, setDrawingJalur] = useState<[number, number][]>([]);
  const [planPenyulang, setPlanPenyulang] = useState('');
  const drawMarkersRef = useRef<maplibregl.Marker[]>([]);
  const usulanMarkersRef = useRef<maplibregl.Marker[]>([]);

  // ===== FAULT ANALYSIS STATE (OpenLayers-inspired) =====
  const [faultMode, setFaultMode] = useState(false);
  const [faultResult, setFaultResult] = useState<FaultResult | null>(null);
  const networkGraphRef = useRef<{ graph: Graph; nodeMap: Map<string, NetworkNode> } | null>(null);
  const faultMarkersRef = useRef<maplibregl.Marker[]>([]);

  const gardus = useAssetStore((state) => state.gardus);
  const jtmSegments = useAssetStore((state) => state.jtmSegments);
  const tiangJTM = useAssetStore((state) => state.tiangJTM);
  const usulanTiang = useAssetStore((state) => state.usulanTiang);
  const usulanJalur = useAssetStore((state) => state.usulanJalur);
  const usulanGardu = useAssetStore((state) => state.usulanGardu);
  const addUsulanTiang = useAssetStore((state) => state.addUsulanTiang);
  const addUsulanGardu = useAssetStore((state) => state.addUsulanGardu);
  const addUsulanJalur = useAssetStore((state) => state.addUsulanJalur);
  const setSimulationData = useAssetStore((state) => state.setSimulationData);
  const hardwareAssets = useAssetStore((state) => state.hardwareAssets);

  // Get unique penyulang list
  const penyulangList = useMemo(() => {
    const set = new Set<string>();
    tiangJTM.forEach(t => { if (t.penyulang) set.add(t.penyulang.toUpperCase()); });
    return Array.from(set).sort();
  }, [tiangJTM]);

  // Haversine distance
  const haversine = (a: [number, number], b: [number, number]) => {
    const R = 6371000;
    const dLat = (b[1] - a[1]) * Math.PI / 180;
    const dLng = (b[0] - a[0]) * Math.PI / 180;
    const sinLat = Math.sin(dLat / 2);
    const sinLng = Math.sin(dLng / 2);
    const h = sinLat * sinLat + Math.cos(a[1] * Math.PI / 180) * Math.cos(b[1] * Math.PI / 180) * sinLng * sinLng;
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  };

  // Measurement click handler
  useEffect(() => {
    if (!mapInstance.current || !isReady) return;
    const map = mapInstance.current;

    const onMeasureClick = (e: maplibregl.MapMouseEvent) => {
      if (!measureMode) return;
      const pt: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      
      setMeasurePoints(prev => {
        const next = [...prev, pt];
        // Calculate total distance
        let total = 0;
        for (let i = 1; i < next.length; i++) total += haversine(next[i - 1], next[i]);
        setMeasureDist(total);

        // Add marker
        const el = document.createElement('div');
        el.style.cssText = 'width:12px;height:12px;background:#f97316;border:2px solid #fff;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,0.3);cursor:pointer';
        const marker = new maplibregl.Marker({ element: el }).setLngLat(pt).addTo(map);
        measureMarkersRef.current.push(marker);

        // Update line source
        if (map.getSource('measure-source')) {
          (map.getSource('measure-source') as maplibregl.GeoJSONSource).setData({
            type: 'FeatureCollection',
            features: next.length > 1 ? [{
              type: 'Feature', properties: {},
              geometry: { type: 'LineString', coordinates: next }
            }] : []
          });
        }
        return next;
      });
    };

    if (measureMode) {
      map.on('click', onMeasureClick);
      map.getCanvas().style.cursor = 'crosshair';
    }
    return () => {
      map.off('click', onMeasureClick);
      if (!measureMode) map.getCanvas().style.cursor = '';
    };
  }, [measureMode, isReady]);

  // Add measure source/layer on map load
  useEffect(() => {
    if (!mapInstance.current || !isReady) return;
    const map = mapInstance.current;
    if (!map.getSource('measure-source')) {
      map.addSource('measure-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: 'measure-layer', type: 'line', source: 'measure-source',
        paint: { 'line-color': '#f97316', 'line-width': 3, 'line-dasharray': [4, 3] }
      });
    }

    if (!map.getSource('survey-source')) {
      map.addSource('survey-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: 'survey-layer', type: 'line', source: 'survey-source',
        paint: { 'line-color': ['get', 'color'], 'line-width': 4, 'line-dasharray': [5, 5] }
      });
    }
  }, [isReady]);

  // --- Auto Survey Handlers ---
  const clearSurvey = useCallback(() => {
    surveyMarkersRef.current.forEach(m => m.remove());
    surveyMarkersRef.current = [];
    setSurveyPoints([]);
    setSurveyDistance(0);
    if (mapInstance.current?.getSource('survey-source')) {
      (mapInstance.current.getSource('survey-source') as maplibregl.GeoJSONSource).setData({ type: 'FeatureCollection', features: [] });
    }
  }, []);

  const toggleSurveyMode = (mode: 'JTM' | 'JTR') => {
    if (surveyMode === mode) {
      setSurveyMode(false);
      if (mapInstance.current) mapInstance.current.getCanvas().style.cursor = '';
      clearSurvey();
    } else {
      setSurveyMode(mode);
      if (mapInstance.current) mapInstance.current.getCanvas().style.cursor = 'crosshair';
      clearSurvey();
    }
  };

  useEffect(() => {
    if (!mapInstance.current || !isReady) return;
    const map = mapInstance.current;

    const onSurveyClick = (e: maplibregl.MapMouseEvent) => {
      if (!surveyMode) return;
      const pt: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      
      setSurveyPoints(prev => {
        const next = [...prev, pt];
        let total = 0;
        for (let i = 1; i < next.length; i++) total += haversine(next[i - 1], next[i]);
        setSurveyDistance(total);

        const el = document.createElement('div');
        const color = surveyMode === 'JTM' ? '#3b82f6' : '#ef4444';
        el.style.cssText = `width:12px;height:12px;background:${color};border:2px solid #fff;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,0.3);`;
        const marker = new maplibregl.Marker({ element: el }).setLngLat(pt).addTo(map);
        surveyMarkersRef.current.push(marker);

        if (map.getSource('survey-source')) {
          (map.getSource('survey-source') as maplibregl.GeoJSONSource).setData({
            type: 'FeatureCollection',
            features: next.length > 1 ? [{
              type: 'Feature', properties: { color },
              geometry: { type: 'LineString', coordinates: next }
            }] : []
          });
        }
        return next;
      });
    };

    if (surveyMode) {
      map.on('click', onSurveyClick);
    }
    return () => {
      map.off('click', onSurveyClick);
    };
  }, [surveyMode, isReady]);

  const calculateBoM = () => {
    if (surveyPoints.length < 2) {
      toast.error('Gambarkan minimal 2 titik untuk membuat rute survey!');
      return;
    }
    
    // Perhitungan MDU
    let numPoles = Math.floor(surveyDistance / surveyInterval) + 1;
    let isolType = surveyMode === 'JTM' ? 'Isolator Tumpu 20kV / Pin Post' : 'Isolator Tumpu TR / Spool';
    let isolQty = surveyMode === 'JTM' ? numPoles * 3 : numPoles * 4;
    
    setBomData({
      tiang: numPoles,
      kabelKms: surveyDistance / 1000,
      totalSpan: surveyDistance,
      jtmOrjtr: surveyMode || 'JTM',
      isolatorType: isolType,
      isolatorQty: isolQty
    });
    
    setShowBomModal(true);
  };
  
  const saveSurveyToGlobal = () => {
    if (surveyPoints.length < 2) return;
    
    // 1. Simpan Jalur Usulan
    const modeName = surveyMode === 'JTM' ? 'Jaringan Tegangan Menengah' : 'Jaringan Tegangan Rendah';
    const uuidJalur = 'JL_' + Math.random().toString(36).substring(7);
    addUsulanJalur({
      id: uuidJalur,
      nama: 'Usulan ' + modeName + ' Baru',
      coordinates: surveyPoints,
      status: 'usulan',
      createdAt: new Date().toISOString().split('T')[0],
      catatan: `Panjang: ${surveyDistance.toFixed(0)}m`
    });
    
    // 2. Interpolasi Titik Tiang mengikuti jarak kelengkungan
    let totalDistSoFar = 0;
    let nextPoleDist = 0; // The first pole is at 0
    let placedPoles = 0;
    
    for (let i = 0; i < surveyPoints.length - 1; i++) {
        const p1 = surveyPoints[i];
        const p2 = surveyPoints[i+1];
        const segmentDist = haversine(p1, p2);
        
        // Letakkan tiang pertama pada p1 jika ini adalah iterasi pertama
        if (i === 0 && placedPoles === 0) {
           addUsulanTiang({
              id: 'TG_' + Math.random().toString(36).substring(7),
              nama_tiang: `Tiang ${modeName} 1`,
              latitude: p1[1], longitude: p1[0],
              status: 'usulan',
              createdAt: new Date().toISOString().split('T')[0],
              catatan: `Beton 9M, ${surveyMode === 'JTM' ? 'Pin Post(3)' : 'Spool(4)'}`
           });
           placedPoles++;
           nextPoleDist += surveyInterval;
        }

        // Cek apakah ada tiang yang jatuh pada segmen (p1 -> p2)
        while (nextPoleDist <= totalDistSoFar + segmentDist) {
            const distFromP1 = nextPoleDist - totalDistSoFar;
            const fraction = distFromP1 / segmentDist;
            
            // Linear Interpolation for Lng Lat
            const lng = p1[0] + (p2[0] - p1[0]) * fraction;
            const lat = p1[1] + (p2[1] - p1[1]) * fraction;

            addUsulanTiang({
              id: 'TG_' + Math.random().toString(36).substring(7),
              nama_tiang: `Tiang ${modeName} ${placedPoles + 1}`,
              latitude: lat, longitude: lng,
              status: 'usulan',
              createdAt: new Date().toISOString().split('T')[0],
              catatan: `Beton 9M, ${surveyMode === 'JTM' ? 'Pin Post(3)' : 'Spool(4)'}`
           });
           placedPoles++;
           nextPoleDist += surveyInterval;
        }
        
        totalDistSoFar += segmentDist;
    }

    toast.success(`Berhasil menyimpan Jalur & ${placedPoles} Tiang Otomatis ke daftar Usulan!`);
    clearSurvey();
    setShowBomModal(false);
  };

  const clearMeasurement = () => {
    measureMarkersRef.current.forEach(m => m.remove());
    measureMarkersRef.current = [];
    setMeasurePoints([]);
    setMeasureDist(0);
    if (mapInstance.current?.getSource('measure-source')) {
      (mapInstance.current.getSource('measure-source') as maplibregl.GeoJSONSource).setData({ type: 'FeatureCollection', features: [] });
    }
    setMeasureMode(false);
    if (mapInstance.current) mapInstance.current.getCanvas().style.cursor = '';
  };

  const toggleMeasure = () => {
    if (measureMode) {
      clearMeasurement();
    } else {
      clearMeasurement();
      setMeasureMode(true);
    }
  };

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      center: [CENTER_LNG, CENTER_LAT],
      zoom: 14,
      attributionControl: false
    });
    
    map.addControl(new maplibregl.NavigationControl(), 'bottom-right');
    mapInstance.current = map;

    map.on('load', () => {
      // Register Icons
      const registerIcon = (name: string, svg: string, size: number = 32) => {
        const img = new Image(size, size);
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        img.onload = () => {
          if (!map.hasImage(name)) map.addImage(name, img);
          URL.revokeObjectURL(url);
        };
        img.src = url;
      };

      // Gardu icons
      registerIcon('gardu-normal', getGarduSVG('Trafo', '#0f172a'));
      registerIcon('gardu-portal', getGarduSVG('Trafo', '#0f172a', 'portal'));
      registerIcon('gardu-cantol', getGarduSVG('Trafo', '#0f172a', 'cantol'));
      
      // Tiang icons â€” each penyulang gets its own color
      const penyulangKeys = ['MALI', 'MORU', 'BATUNIRWALA', 'BARANUSA', 'KABIR', 'MARITAING', 'ILAWE'];
      penyulangKeys.forEach(p => {
        const c = getPenyulangColor(p);
        registerIcon(`tiang-${p.toLowerCase()}`, getTiangSVG('normal', c));
        registerIcon(`tiang-${p.toLowerCase()}-schoor`, getTiangSchoorSVG(c));
        registerIcon(`tiang-${p.toLowerCase()}-kontramast`, getTiangKontramastSVG(c));
      });
      // Fallback default tiang
      registerIcon('tiang-default', getTiangSVG('normal', '#475569'));
      registerIcon('tiang-default-schoor', getTiangSchoorSVG('#475569'));
      registerIcon('tiang-default-kontramast', getTiangKontramastSVG('#475569'));
      registerIcon('tiang-sudut', getTiangSVG('sudut', '#854d0e'));
      
      // Hardware International Icons
      registerIcon('icon-generator', getGeneratorSVG(), 40);
      registerIcon('icon-solar', getSolarSVG(), 40);
      registerIcon('icon-recloser', getRecloserSVG(), 32);
      registerIcon('icon-fco', getFcoSVG(), 32);
      registerIcon('icon-proteksi', getProteksiSVG('lbs', '#ef4444'), 28);

      // Sources
      map.addSource('penyulang-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addSource('gardu-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addSource('tiang-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addSource('proteksi-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addSource('batas-desa-source', { type: 'geojson', data: batasDesaGeoJSON as any });
      
      // ArcGIS Local GeoJSON URLs (Fast loading for massive data)
      map.addSource('jtm-arcgis-source', { type: 'geojson', data: '/data/layers/jtm.geojson' });
      map.addSource('jtr-arcgis-source', { type: 'geojson', data: '/data/layers/jtr.geojson' });
      map.addSource('sr-arcgis-source', { type: 'geojson', data: '/data/layers/sr.geojson' });
      map.addSource('pelanggan-arcgis-source', { type: 'geojson', data: '/data/pelanggan.geojson' });
      map.addSource('tiang-arcgis-source', { type: 'geojson', data: '/data/tiang.geojson' });
      
      // Hardware Sources
      map.addSource('pembangkit-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addSource('fco-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addSource('recloser-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });

      // Add Base raster layers (Satellite and OSM detail)
      map.addSource('satellite-source', { 
        type: 'raster', 
        tiles: ['https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'], 
        tileSize: 256,
        maxzoom: 22 
      });
      map.addLayer({ id: 'satellite-layer', type: 'raster', source: 'satellite-source', layout: { visibility: 'none' } });

      map.addSource('osm-source', { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, attribution: 'Â© OpenStreetMap contributors' });
      map.addLayer({ id: 'osm-layer', type: 'raster', source: 'osm-source', layout: { visibility: 'none' } });

      // Batas Desa Area Layer
      map.addLayer({
        id: 'batas-desa-fill',
        type: 'fill',
        source: 'batas-desa-source',
        paint: {
          'fill-color': '#0284c7',
          'fill-opacity': 0.15
        }
      });
      map.addLayer({
        id: 'batas-desa-border',
        type: 'line',
        source: 'batas-desa-source',
        paint: {
          'line-color': '#0284c7',
          'line-width': 2,
          'line-dasharray': [2, 2]
        }
      });
      // Label for batas desa
      map.addLayer({
        id: 'batas-desa-label',
        type: 'symbol',
        source: 'batas-desa-source',
        layout: {
          'text-field': ['get', 'nama'],
          'text-size': 12,
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-anchor': 'center'
        },
        paint: {
          'text-color': '#0f172a',
          'text-halo-color': '#ffffff',
          'text-halo-width': 2
        }
      });

      // JTM Penyulang Lines (bottom)
      map.addLayer({
        id: 'penyulang-layer',
        type: 'line',
        source: 'penyulang-source',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': ['get', 'width'],
          'line-dasharray': ['case', ['has', 'dasharray'], ['literal', [4, 4]], ['literal', [1]]]
        }
      });

      // ArcGIS JTM Lines (Actual Path)
      map.addLayer({
        id: 'jtm-arcgis-layer',
        type: 'line',
        source: 'jtm-arcgis-source',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': [
             'match',
             ['upcase', ['coalesce', ['get', 'penyulang'], ['get', 'feeder'], 'UNKNOWN']],
             'MALI', '#2563eb',
             'MORU', '#dc2626',
             'BATUNIRWALA', '#16a34a',
             'BARANUSA', '#d97706',
             'KABIR', '#9333ea',
             'MARITAING', '#0891b2',
             '#3b82f6' 
          ],
          'line-width': 3.5,
          'line-opacity': 0.9
        }
      });

      // ArcGIS JTR Lines
      map.addLayer({
        id: 'jtr-arcgis-layer',
        type: 'line',
        source: 'jtr-arcgis-source',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#64748b',
          'line-width': 2,
          'line-dasharray': [3, 2]
        }
      });

      // ArcGIS Pelanggan (Points)
      map.addLayer({
        id: 'pelanggan-arcgis-layer',
        type: 'circle',
        source: 'pelanggan-arcgis-source',
        minzoom: 14.5,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 15, 2, 18, 5],
          'circle-color': '#10b981',
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff'
        }
      });

      // ArcGIS Sambungan Rumah (Lines)
      map.addLayer({
        id: 'sr-arcgis-layer',
        type: 'line',
        source: 'sr-arcgis-source',
        minzoom: 16.0,
        paint: {
          'line-color': '#0ea5e9',
          'line-width': 1,
          'line-opacity': 0.6
        }
      });

      // ArcGIS Gardu (Points from GDB)
      map.addLayer({
        id: 'gardu-arcgis-layer',
        type: 'symbol',
        source: 'gardu-source',
        layout: {
          'icon-image': 'gardu-normal',
          'icon-size': 0.8,
          'text-field': ['get', 'nama'],
          'text-font': ['Open Sans Bold'],
          'text-size': 10,
          'text-offset': [0, 1.5],
          'text-anchor': 'top'
        },
        paint: {
          'text-color': '#1e293b',
          'text-halo-color': '#fff',
          'text-halo-width': 2
        }
      });


      // ArcGIS Tiang (Points)
      map.addLayer({
        id: 'tiang-arcgis-layer',
        type: 'circle',
        source: 'tiang-arcgis-source',
        minzoom: 14.0, // Prevent overlapping mess
        paint: {
          'circle-radius': 4.5,
          'circle-color': '#8b5cf6',
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#ffffff'
        }
      });

      // JTR Underbuilt Lines (offset slightly below JTM constraint)
      map.addLayer({
        id: 'underbuilt-layer',
        type: 'line',
        source: 'penyulang-source',
        filter: ['all', ['has', 'underbuilt'], ['!=', ['get', 'underbuilt'], '']],
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#334155', // Warna abu-abu gelap untuk rute JTR sekunder di bawah TM
          'line-width': 1.5,
          'line-offset': 4 // Line-Offset 4px sejajar dengan garis utama merah/biru JTM
        }
      });

      // Tiang JTM Symbols (middle)
      map.addLayer({
        id: 'tiang-layer',
        type: 'symbol',
        source: 'tiang-source',
        layout: {
          'icon-image': ['get', 'icon'],
          'icon-size': 0.9,
          'icon-allow-overlap': false,
          'icon-ignore-placement': false,
          'text-field': ['get', 'label'],
          'text-size': 9,
          'text-offset': [0, 1.2],
          'text-anchor': 'top',
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
        },
        paint: { 
          'text-color': ['get', 'textColor'],
          'text-halo-color': '#fff', 
          'text-halo-width': 1 
        }
      });

      // Gardu/Trafo Symbols (TOP â€” always visible above tiang)
      map.addLayer({
        id: 'gardu-layer',
        type: 'symbol',
        source: 'gardu-source',
        layout: {
          'icon-image': ['match', ['get', 'konstruksi'], 'portal', 'gardu-portal', 'cantol', 'gardu-cantol', 'gardu-normal'],
          'icon-size': 1,
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'text-field': ['get', 'label'],
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-offset': [0, 1.8],
          'text-anchor': 'top',
          'text-size': 11,
          'text-allow-overlap': false,
        },
        paint: { 
          'text-color': '#1e3a5f',
          'text-halo-color': '#fff', 
          'text-halo-width': 2 
        }
      });
      

      map.addLayer({
        id: 'proteksi-layer',
        type: 'symbol',
        source: 'proteksi-source',
        layout: {
          'icon-image': 'icon-proteksi',
          'icon-size': 1,
          'icon-allow-overlap': true,
        }
      });

      // HARDWARE LAYERS (Pembangkit, FCO, Recloser)
      map.addLayer({
        id: 'pembangkit-layer',
        type: 'symbol',
        source: 'pembangkit-source',
        layout: {
          'icon-image': ['get', 'icon'],
          'icon-size': 0.8,
          'icon-allow-overlap': true,
        }
      });
      map.addLayer({
        id: 'recloser-layer',
        type: 'symbol',
        source: 'recloser-source',
        layout: {
          'icon-image': ['get', 'icon'],
          'icon-size': 0.8,
          'icon-allow-overlap': true,
        }
      });
      map.addLayer({
        id: 'fco-layer',
        type: 'symbol',
        source: 'fco-source',
        layout: {
          'icon-image': ['get', 'icon'],
          'icon-size': 0.8,
          'icon-allow-overlap': false,
        }
      });

      // ===== CLICK HANDLERS =====
      map.on('click', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['gardu-layer', 'tiang-layer', 'penyulang-layer', 'underbuilt-layer', 'usulan-jalur-layer', 'pembangkit-layer', 'fco-layer', 'recloser-layer', 'proteksi-layer'] });
        if (!features.length) return;

        const f = features[0];
        const p = f.properties;
        
        let content = '';
        if (f.layer.id === 'pembangkit-layer') {
          content = `<div style="color:#0f172a; font-size:13px; min-width: 180px;">
            <b style="font-size:15px; color:#d97706">${p.konfigurasi === 'Solar PV' ? 'â˜€ï¸' : 'ðŸ­'} ${p.name || 'Pembangkit'}</b><br/>
            <hr style="margin:4px 0; border-color:#e2e8f0"/>
            <b>Kapasitas:</b> <span style="font-weight:700; color:#16a34a">${p.kapasitas_kw > 1000 ? (p.kapasitas_kw / 1000) + ' MW' : p.kapasitas_kw + ' kW'}</span><br/>
            <b>Tegangan:</b> ${p.tegangan_kv} kV<br/>
            <b>Merk / Tipe:</b> ${p.merk} (${p.konfigurasi})<br/>
            <b>Status:</b> <span style="background:#dcfce7; color:#166534; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:700">${p.status}</span>
          </div>`;
        } else if (f.layer.id === 'proteksi-layer') {
          content = `<div style="color:#0f172a; font-size:13px; min-width: 160px;">
            <b style="font-size:14px; color:#8b5cf6">â˜£ï¸  ${p.nama || 'Proteksi'}</b><br/>
            <hr style="margin:4px 0; border-color:#e2e8f0"/>
            <b>Jenis:</b> ${p.jenis}<br/>
            <b>Penyulang:</b> ${p.penyulang}
          </div>`;
        } else if (f.layer.id === 'fco-layer') {
           content = `<div style="color:#0f172a; font-size:13px; min-width: 150px;">
            <b style="font-size:14px; color:#0284c7">ðŸ›¡ï¸ ${p.name || 'FCO'}</b><br/>
            <hr style="margin:4px 0; border-color:#e2e8f0"/>
            <b>Rating:</b> ${p.rating_arus_ampere} Ampere<br/>
            <b>Tegangan:</b> ${p.tegangan_kv} kV<br/>
            <b>Tipe/Merk:</b> ${p.merk}<br/>
            <b>Status:</b> <span style="font-weight:700; color:#16a34a">${p.status}</span>
          </div>`;
        } else if (f.layer.id === 'recloser-layer') {
          content = `<div style="color:#0f172a; font-size:13px; min-width: 160px;">
            <b style="font-size:14px; color:#e11d48">ðŸ”´ ${p.name || 'Recloser LBS'}</b><br/>
            <hr style="margin:4px 0; border-color:#e2e8f0"/>
            <b>Rating Mekanik:</b> ${p.rating_arus_ampere}A (${p.konfigurasi})<br/>
            <b>Merk:</b> ${p.merk}<br/>
            <b>State:</b> <span style="background:${p.status === 'Normally Open' ? '#fee2e2' : '#dcfce7'}; color:${p.status === 'Normally Open' ? '#991b1b' : '#166534'}; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:700">${p.status}</span>
          </div>`;
        } else if (f.layer.id === 'gardu-layer') {
          content = `<div style="color:#0f172a; font-size:13px; min-width: 180px;">
            <b style="font-size:14px">${p.nama}</b><br/>
            Tipe: ${p.tipe}<br/>
            Konstruksi: ${p.konstruksi}<br/>
            Kapasitas: ${p.kapasitas_kva} kVA
          </div>`;
        } else if (f.layer.id === 'tiang-layer') {
          content = `<div style="color:#0f172a; font-size:12px; min-width: 200px; line-height:1.6">
            <b style="font-size:14px; color:#1e40af">${p.nama_tiang}</b><br/>
            <span style="background:#dbeafe; padding:2px 6px; border-radius:3px; font-size:11px">${p.penyulang}</span>
            <hr style="margin:4px 0; border-color:#e2e8f0"/>
            <b>Bahan:</b> ${p.jenis_tiang || '-'} &nbsp; <b>Tinggi:</b> ${p.tipe_tiang || '-'}m<br/>
            <b>Pondasi:</b> ${p.pondasi_tiang || '-'}<br/>
            <b>Kekuatan:</b> ${p.kekuatan_tiang || '-'} daN<br/>
            <b>Penopang:</b> ${(p.penopang || '-').replace(/_/g, ' ')}<br/>
            <b>Konstruksi:</b> ${p.konstruksi_1 || '-'}${p.konstruksi_2 ? ' / ' + p.konstruksi_2 : ''}<br/>
            <b>Hantaran:</b> ${p.jenis_hantaran_1 || '-'} ${p.ukuran_hantaran_1 || ''} mmÂ²<br/>
            <b>Vendor:</b> ${p.vendor || '-'}<br/>
            <b>Kepemilikan:</b> ${p.kepemilikan || '-'}
          </div>`;
        } else if (f.layer.id === 'penyulang-layer' || f.layer.id === 'underbuilt-layer') {
          const isTiangLine = p.source === 'tiang';
          if (isTiangLine) {
            content = `<div style="color:#0f172a; font-size:12px; min-width: 200px; line-height:1.6">
              <b style="font-size:14px">Jalur: ${p.nama || '-'}</b><br/>
              <span style="background:#fef3c7; padding:2px 6px; border-radius:3px; font-size:11px; font-weight:600">${p.penyulang || '-'}</span>
              ${p.underbuilt ? `<br/><span style="background:#475569; color:#fff; padding:2px 6px; border-radius:3px; font-size:11px; font-weight:600">Terpasang Underbuilt JTR</span>` : ''}
              <hr style="margin:4px 0; border-color:#e2e8f0"/>
              <b>Konduktor:</b> ${p.jenis_hantaran || '-'}<br/>
              <b>Ukuran:</b> ${p.ukuran_hantaran || '-'} mmÂ²<br/>
              <b>Konstruksi:</b> ${p.konstruksi || '-'}
            </div>`;
          } else {
            content = `<div style="color:#0f172a; font-size:12px; min-width: 180px; line-height:1.6">
              <b style="font-size:14px">${p.nama || p.nama_jtm || 'Segmen JTM'}</b><br/>
              <span style="background:#fef3c7; padding:2px 6px; border-radius:3px; font-size:11px">${p.penyulang || '-'}</span>
              <hr style="margin:4px 0; border-color:#e2e8f0"/>
              <b>Tegangan:</b> ${p.tegangan_jtm || p.tegangan_kv || '-'}<br/>
              <b>Panjang:</b> ${p.panjang_hantaran || p.panjang_km || '-'} km<br/>
              <b>Konduktor:</b> ${p.jenis_konduktor || p.jenis_konduktor_1 || '-'}<br/>
              <b>Ukuran:</b> ${p.ukuran_penampang || p.ukuran_hantaran_1 || '-'} mmÂ²
            </div>`;
          }
        } else if (f.layer.id === 'usulan-jalur-layer') {
          content = `<div style="color:#0f172a; font-size:12px; min-width: 160px; line-height:1.6">
            <b style="font-size:14px">${p.nama}</b><br/>
            Status: <span style="color:${p.color};font-weight:700">${p.status.toUpperCase()}</span><br/>
            <button onclick="window.deleteJalurFromMap('${p.nama}')" style="margin-top:8px; width:100%; padding:4px 8px; background:#ef4444; color:#fff; border:none; border-radius:4px; cursor:pointer; font-weight:bold; font-size:11px">Hapus Jalur Usulan</button>
          </div>`;
        }

        new maplibregl.Popup({ offset: 15 }).setLngLat(e.lngLat).setHTML(content).addTo(map);
      });

      // Cursor
      ['gardu-layer', 'tiang-layer', 'penyulang-layer', 'usulan-jalur-layer', 'batas-desa-fill', 'pembangkit-layer', 'fco-layer', 'recloser-layer', 'proteksi-layer'].forEach(l => {
        map.on('mouseenter', l, () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', l, () => { map.getCanvas().style.cursor = ''; });
      });

      setIsReady(true);
    });
  }, []);


  // Sync Proteksi
  useEffect(() => {
    if (!mapInstance.current || !isReady) return;
    const map = mapInstance.current;
    
    if (layers.proteksi) {
      const gjsonPrt = { type: 'FeatureCollection', features: demoProteksi.map(p => ({ 
        type: 'Feature', properties: p, geometry: { type: 'Point', coordinates: [p.longitude, p.latitude] } 
      })) };
      (map.getSource('proteksi-source') as maplibregl.GeoJSONSource).setData(gjsonPrt as any);
    } else {
      (map.getSource('proteksi-source') as maplibregl.GeoJSONSource).setData({ type: 'FeatureCollection', features: [] });
    }
  }, [layers.proteksi, isReady, demoProteksi]);

  // Sync Hardware Layers
  useEffect(() => {
    if (!mapInstance.current || !isReady) return;
    const map = mapInstance.current;
    
    // PEMBANGKIT
    if (layers.pembangkit) {
      const gjsonP = { type: 'FeatureCollection', features: hardwareAssets.filter(h => h.type === 'pembangkit').map(h => ({ 
        type: 'Feature', properties: { ...h, icon: h.name.includes('PLTS') || h.name.includes('SURYA') ? 'icon-solar' : 'icon-generator' }, geometry: { type: 'Point', coordinates: [h.lng, h.lat] } 
      })) };
      (map.getSource('pembangkit-source') as maplibregl.GeoJSONSource).setData(gjsonP as any);
    } else {
      (map.getSource('pembangkit-source') as maplibregl.GeoJSONSource).setData({ type: 'FeatureCollection', features: [] });
    }
    
    // FCO
    if (layers.fco) {
      const gjsonF = { type: 'FeatureCollection', features: hardwareAssets.filter(h => h.type === 'fco').map(h => ({ 
        type: 'Feature', properties: { ...h, icon: 'icon-fco' }, geometry: { type: 'Point', coordinates: [h.lng, h.lat] } 
      })) };
      (map.getSource('fco-source') as maplibregl.GeoJSONSource).setData(gjsonF as any);
    } else {
      (map.getSource('fco-source') as maplibregl.GeoJSONSource).setData({ type: 'FeatureCollection', features: [] });
    }
    
    // RECLOSER
    if (layers.recloser) {
      const gjsonR = { type: 'FeatureCollection', features: hardwareAssets.filter(h => h.type === 'recloser').map(h => ({ 
        type: 'Feature', properties: { ...h, icon: 'icon-recloser' }, geometry: { type: 'Point', coordinates: [h.lng, h.lat] } 
      })) };
      (map.getSource('recloser-source') as maplibregl.GeoJSONSource).setData(gjsonR as any);
    } else {
      (map.getSource('recloser-source') as maplibregl.GeoJSONSource).setData({ type: 'FeatureCollection', features: [] });
    }
  }, [layers, isReady, hardwareAssets]);

  // Sync Basemap Style dynamically
  useEffect(() => {
    if (!mapInstance.current || !isReady) return;
    const map = mapInstance.current;
    
    // Toggle Raster overlays
    if (map.getLayer('satellite-layer') && map.getLayer('osm-layer')) {
      map.setLayoutProperty('satellite-layer', 'visibility', basemap === 'satellite' ? 'visible' : 'none');
      map.setLayoutProperty('osm-layer', 'visibility', basemap === 'osm' ? 'visible' : 'none');
    }
  }, [basemap, isReady]);

  // ===== FAULT ANALYSIS ENGINE (OpenLayers-inspired) =====
  // Build network graph when tiang/gardu data changes
  useEffect(() => {
    if (tiangJTM.length === 0 && gardus.length === 0) return;
    try {
      const result = buildNetworkGraph(tiangJTM, gardus, hardwareAssets.filter(h => h.type === 'pembangkit'), 250);
      networkGraphRef.current = result;
    } catch (err) {
      console.warn('[FaultAnalysis] Graph build failed:', err);
    }
  }, [tiangJTM, gardus, hardwareAssets]);

  // Fault mode click handler
  useEffect(() => {
    if (!mapInstance.current || !isReady) return;
    const map = mapInstance.current;

    const onFaultClick = (e: maplibregl.MapMouseEvent) => {
      if (!faultMode || !networkGraphRef.current) return;
      
      const { graph, nodeMap } = networkGraphRef.current;
      
      // Find nearest node to click point
      const nearest = findNearestNode(e.lngLat.lat, e.lngLat.lng, nodeMap, 500);
      if (!nearest) {
        toast.error('Tidak ada tiang/gardu dalam radius 500m dari titik klik');
        return;
      }
      
      // Run fault simulation
      const result = simulateFault(nearest.id, graph, nodeMap);
      setFaultResult(result);
      
      // Render highlight on map
      renderFaultHighlight(result);
      toast(`⚡ Gangguan di ${result.faultNodeName}: ${result.totalAffectedTiang} tiang + ${result.totalAffectedGardu} gardu padam`, {
        icon: '🔴', duration: 5000,
        style: { background: '#1c1917', color: '#fca5a5', border: '1px solid #dc2626' }
      });
    };

    if (faultMode) {
      map.on('click', onFaultClick);
      map.getCanvas().style.cursor = 'crosshair';
    }
    return () => {
      map.off('click', onFaultClick);
      if (!faultMode && !measureMode && !surveyMode) map.getCanvas().style.cursor = '';
    };
  }, [faultMode, isReady]);

  // Render fault highlight layers
  const renderFaultHighlight = useCallback((result: FaultResult) => {
    const map = mapInstance.current;
    if (!map) return;

    // Clear previous markers
    faultMarkersRef.current.forEach(m => m.remove());
    faultMarkersRef.current = [];

    // 1. Add fault highlight source if missing
    if (!map.getSource('fault-nodes-source')) {
      map.addSource('fault-nodes-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      // Pulsing red circles for affected tiang
      map.addLayer({
        id: 'fault-nodes-glow', type: 'circle', source: 'fault-nodes-source',
        paint: {
          'circle-radius': 12, 'circle-color': 'rgba(220,38,38,0.25)',
          'circle-blur': 0.8,
        }
      });
      map.addLayer({
        id: 'fault-nodes-layer', type: 'circle', source: 'fault-nodes-source',
        paint: {
          'circle-radius': 5, 'circle-color': '#ef4444',
          'circle-stroke-width': 2, 'circle-stroke-color': '#fca5a5',
        }
      });
    }

    if (!map.getSource('fault-polygon-source')) {
      map.addSource('fault-polygon-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: 'fault-polygon-fill', type: 'fill', source: 'fault-polygon-source',
        paint: { 'fill-color': 'rgba(220,38,38,0.12)', 'fill-outline-color': '#dc2626' }
      });
      map.addLayer({
        id: 'fault-polygon-border', type: 'line', source: 'fault-polygon-source',
        paint: { 'line-color': '#dc2626', 'line-width': 2, 'line-dasharray': [6, 4] }
      });
    }

    if (!map.getSource('fault-edges-source')) {
      map.addSource('fault-edges-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: 'fault-edges-layer', type: 'line', source: 'fault-edges-source',
        paint: { 'line-color': '#ef4444', 'line-width': 4, 'line-dasharray': [3, 2], 'line-opacity': 0.7 }
      });
    }

    // 2. Set affected nodes data
    const nodeFeatures = result.affectedNodes.map(n => ({
      type: 'Feature' as const,
      properties: { name: n.name, type: n.type, isFault: n.id === result.faultNodeId },
      geometry: { type: 'Point' as const, coordinates: [n.lng, n.lat] }
    }));
    (map.getSource('fault-nodes-source') as maplibregl.GeoJSONSource).setData({
      type: 'FeatureCollection', features: nodeFeatures as any
    });

    // 3. Set blackout polygon
    if (result.blackoutPolygon && result.blackoutPolygon.length >= 4) {
      (map.getSource('fault-polygon-source') as maplibregl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: [{
          type: 'Feature', properties: {},
          geometry: { type: 'Polygon', coordinates: [result.blackoutPolygon] }
        }]
      });
    }

    // 4. Set affected edges
    const { graph, nodeMap } = networkGraphRef.current!;
    const edgeFeatures: any[] = [];
    result.affectedEdgeKeys.forEach(ek => {
      try {
        const [source, target] = graph.extremities(ek);
        const sNode = nodeMap.get(source);
        const tNode = nodeMap.get(target);
        if (sNode && tNode) {
          edgeFeatures.push({
            type: 'Feature', properties: {},
            geometry: { type: 'LineString', coordinates: [[sNode.lng, sNode.lat], [tNode.lng, tNode.lat]] }
          });
        }
      } catch { /* skip invalid edges */ }
    });
    (map.getSource('fault-edges-source') as maplibregl.GeoJSONSource).setData({
      type: 'FeatureCollection', features: edgeFeatures
    });

    // 5. Add fault epicenter marker (bigger, animated)
    const faultNode = result.affectedNodes.find(n => n.id === result.faultNodeId);
    if (faultNode) {
      const el = document.createElement('div');
      el.innerHTML = `<div style="width:28px;height:28px;background:rgba(220,38,38,0.8);border:3px solid #fca5a5;border-radius:50%;display:flex;align-items:center;justify-content:center;animation:faultPulse 1.5s infinite;box-shadow:0 0 20px rgba(220,38,38,0.6);"><span style='font-size:14px'>⚡</span></div>`;
      el.style.cursor = 'pointer';
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([faultNode.lng, faultNode.lat])
        .addTo(map);
      faultMarkersRef.current.push(marker);
    }
  }, []);

  // Clear fault analysis
  const clearFault = useCallback(() => {
    setFaultResult(null);
    faultMarkersRef.current.forEach(m => m.remove());
    faultMarkersRef.current = [];
    const map = mapInstance.current;
    if (!map) return;
    
    const emptyGJ = { type: 'FeatureCollection' as const, features: [] };
    if (map.getSource('fault-nodes-source')) (map.getSource('fault-nodes-source') as maplibregl.GeoJSONSource).setData(emptyGJ);
    if (map.getSource('fault-polygon-source')) (map.getSource('fault-polygon-source') as maplibregl.GeoJSONSource).setData(emptyGJ);
    if (map.getSource('fault-edges-source')) (map.getSource('fault-edges-source') as maplibregl.GeoJSONSource).setData(emptyGJ);
  }, []);

  const toggleFaultMode = useCallback(() => {
    setFaultMode(prev => {
      if (prev) {
        clearFault();
        if (mapInstance.current) mapInstance.current.getCanvas().style.cursor = '';
      }
      return !prev;
    });
  }, [clearFault]);

  // Sync JTM Lines and ArcGIS Layers Visibility
  useEffect(() => {
    if (!mapInstance.current || !isReady) return;
    const map = mapInstance.current;
    
    // Toggle ArcGIS massive native layers based on UI switches
    if (map.getLayer('jtm-arcgis-layer')) {
      map.setLayoutProperty('jtm-arcgis-layer', 'visibility', layers.penyulang ? 'visible' : 'none');
    }
    if (map.getLayer('jtr-arcgis-layer')) {
      // Show JTR lines when JTM lines are shown, or if there's a dedicated switch in the future
      map.setLayoutProperty('jtr-arcgis-layer', 'visibility', layers.penyulang ? 'visible' : 'none');
    }
    if (map.getLayer('pelanggan-arcgis-layer')) {
      // Pelanggan can be toggled via tiang switch or always visible depending on zoom level
      // We will leave it visible but minzoom is 15.5 so it doesn't lag
      map.setLayoutProperty('pelanggan-arcgis-layer', 'visibility', layers.tiang ? 'visible' : 'none');
    }
    if (map.getLayer('sr-arcgis-layer')) {
      map.setLayoutProperty('sr-arcgis-layer', 'visibility', layers.tiang ? 'visible' : 'none');
    }
    if (map.getLayer('tiang-arcgis-layer')) {
      // Toggle ArcGIS pole visibility logic
      map.setLayoutProperty('tiang-arcgis-layer', 'visibility', layers.tiang ? 'visible' : 'none');
    }

    if (!layers.penyulang) {
      (map.getSource('penyulang-source') as maplibregl.GeoJSONSource).setData({ type: 'FeatureCollection', features: [] });
      return;
    }

    const allFeatures: any[] = [];

    // 1. Existing uploaded JTM segments (from CSV penyulang)
    jtmSegments.filter(p => (p.coordinates?.length ?? 0) > 0).forEach(p => {
      const isTanah = p.jenis_konduktor === 'XLPE';
      const conf = isTanah ? OIM_COLORS['tanah'] : (OIM_COLORS[p.tegangan_kv as keyof typeof OIM_COLORS] || OIM_COLORS['20']);
      allFeatures.push({
        type: 'Feature',
        properties: { ...p, color: conf.color, width: conf.weight, dasharray: conf.dashArray, source: 'segment' },
        geometry: { type: 'LineString', coordinates: p.coordinates!.map(c => [c[1], c[0]]) }
      });
    });

    // 2. Auto-generate lines from tiang data using NEAREST NEIGHBOR chain OR AI MST TOPOLOGY
    if (useAITopology && aiTopologyFeatures.length > 0) {
      aiTopologyFeatures.forEach(feat => {
        allFeatures.push({
          type: 'Feature',
          properties: { color: '#f59e0b', width: 3, source: 'ai-topology', ...feat.properties },
          geometry: feat.geometry
        });
      });
    } else {
      let filteredTiang = filterPenyulang === 'all' ? tiangJTM : tiangJTM.filter(t => (t.penyulang || '').toUpperCase() === filterPenyulang);
    if (filterSpesifikasi !== 'all') {
      filteredTiang = filteredTiang.filter(t => {
        const hantaran = (t.jenis_hantaran_1 || '').toUpperCase();
        const tipe = (t.tipe_tiang || '').toUpperCase();
        if (filterSpesifikasi === 'tiang-9') return tipe.includes('9');
        if (filterSpesifikasi === 'cond-aaac') return hantaran === 'AAAC' || (hantaran.includes('AAAC') && !hantaran.includes('S'));
        if (filterSpesifikasi === 'cond-aaacs') return hantaran.includes('AAACS') || hantaran.includes('AAAC-S');
        return true;
      });
    }

    if (filteredTiang.length > 0) {
      // Haversine distance in meters
      const dist = (a: {latitude: number; longitude: number}, b: {latitude: number; longitude: number}) => {
        const R = 6371000;
        const dLat = (b.latitude - a.latitude) * Math.PI / 180;
        const dLng = (b.longitude - a.longitude) * Math.PI / 180;
        const sinLat = Math.sin(dLat / 2);
        const sinLng = Math.sin(dLng / 2);
        const h = sinLat * sinLat + Math.cos(a.latitude * Math.PI / 180) * Math.cos(b.latitude * Math.PI / 180) * sinLng * sinLng;
        return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
      };

      const MAX_DIST = 500; // meters â€” max span between poles

      // Group tiang by penyulang
      const groups: Record<string, typeof tiangJTM> = {};
      filteredTiang.forEach(t => {
        const key = (t.penyulang || 'Unknown').toUpperCase();
        if (!groups[key]) groups[key] = [];
        groups[key].push(t);
      });

      Object.entries(groups).forEach(([penyulangName, poles]) => {
        if (poles.length < 2) return;
        const color = getPenyulangColor(penyulangName);

        // Nearest-neighbor chain: start from westernmost pole, always go to nearest unvisited
        const visited = new Set<number>();
        
        // Start from westernmost (smallest longitude)
        let currentIdx = 0;
        let minLng = Infinity;
        poles.forEach((p, i) => { if (p.longitude < minLng) { minLng = p.longitude; currentIdx = i; } });

        visited.add(currentIdx);

        while (visited.size < poles.length) {
          const current = poles[currentIdx];
          let bestIdx = -1;
          let bestDist = Infinity;

          // Find nearest unvisited pole
          for (let i = 0; i < poles.length; i++) {
            if (visited.has(i)) continue;
            const d = dist(current, poles[i]);
            if (d < bestDist) { bestDist = d; bestIdx = i; }
          }

          if (bestIdx === -1 || bestDist > MAX_DIST) {
            // No nearby pole found â€” try to start a new chain from nearest unvisited
            let newStart = -1;
            let newBest = Infinity;
            for (let i = 0; i < poles.length; i++) {
              if (visited.has(i)) continue;
              // Find unvisited pole closest to ANY visited pole
              for (const vIdx of visited) {
                const d = dist(poles[vIdx], poles[i]);
                if (d < newBest) { newBest = d; newStart = i; }
              }
            }
            if (newStart === -1) break;
            visited.add(newStart);
            currentIdx = newStart;
            continue;
          }

          // Connect current â†’ nearest
          const from = current;
          const to = poles[bestIdx];

          // Define Line Color based on Conductor (jenis_hantaran_1)
          let lineColor = '#94a3b8'; // Default grey
          const hantaran = (from.jenis_hantaran_1 || '').toUpperCase();
          if (hantaran.includes('AAACS') || hantaran.includes('AAAC-S')) {
            lineColor = '#3b82f6'; // Blue
          } else if (hantaran.includes('AAAC')) {
            lineColor = '#ef4444'; // Red
          } else if (hantaran.includes('MVTIC') || hantaran.includes('XLPE')) {
            lineColor = '#8b5cf6'; // Purple
          } else if (hantaran.includes('SKUTR')) {
            lineColor = '#10b981'; // Green
          }

          allFeatures.push({
            type: 'Feature',
            properties: {
              nama: `${from.nama_tiang} â†’ ${to.nama_tiang}`,
              penyulang: penyulangName,
              jenis_hantaran: from.jenis_hantaran_1 || '-',
              ukuran_hantaran: from.ukuran_hantaran_1 || '-',
              underbuilt: from.under_built_jtm_1 || to.under_built_jtm_1 || '',
              konstruksi: from.konstruksi_1 || '-',
              jarak: Math.round(bestDist) + 'm',
              color: lineColor,
              width: hantaran.includes('MVTIC') ? 3.5 : 2.5,
              source: 'tiang',
            },
            geometry: {
              type: 'LineString',
              coordinates: [
                [from.longitude, from.latitude],
                [to.longitude, to.latitude]
              ]
            }
          });

          visited.add(bestIdx);
          currentIdx = bestIdx;
        }
      });
    }
  }

    (mapInstance.current.getSource('penyulang-source') as maplibregl.GeoJSONSource).setData({ type: 'FeatureCollection', features: allFeatures });
  }, [jtmSegments, tiangJTM, layers.penyulang, isReady, filterPenyulang, filterSpesifikasi, useAITopology, aiTopologyFeatures]);

  // Sync Gardu
  useEffect(() => {
    if (!mapInstance.current || !isReady) return;
    const features = layers.gardu ? gardus.map(g => ({
      type: 'Feature',
      properties: { 
        id: g.id, nama: g.nama, tipe: g.tipe, 
        konstruksi: (g.jenis_konstruksi || '').toLowerCase(), 
        kapasitas_kva: g.kapasitas_kva || (g.kapasitas_mva * 1000),
        label: `${g.nama}\n(${g.kapasitas_kva || (g.kapasitas_mva * 1000)} kVA)`
      },
      geometry: { type: 'Point', coordinates: [g.lng, g.lat] }
    })) : [];
    (mapInstance.current.getSource('gardu-source') as maplibregl.GeoJSONSource).setData({ type: 'FeatureCollection', features: features as any });
  }, [gardus, layers.gardu, isReady]);

  // Sync Tiang JTM â€” from real uploaded data (with penyulang filter)
  useEffect(() => {
    if (!mapInstance.current || !isReady) return;
    
    let filtered = filterPenyulang === 'all' ? tiangJTM : tiangJTM.filter(t => (t.penyulang || '').toUpperCase() === filterPenyulang);
    if (filterSpesifikasi !== 'all') {
      filtered = filtered.filter(t => {
        const hantaran = (t.jenis_hantaran_1 || '').toUpperCase();
        const tipe = (t.tipe_tiang || '').toUpperCase();
        if (filterSpesifikasi === 'tiang-9') return tipe.includes('9');
        if (filterSpesifikasi === 'cond-aaac') return hantaran === 'AAAC' || (hantaran.includes('AAAC') && !hantaran.includes('S'));
        if (filterSpesifikasi === 'cond-aaacs') return hantaran.includes('AAACS') || hantaran.includes('AAAC-S');
        return true;
      });
    }

    const features = layers.tiang ? filtered.map((t) => {
      // Determine icon based on penyulang and penopang
      const pKey = (t.penyulang || '').toLowerCase();
      const penopang = (t.penopang || '').toLowerCase();
      const knownPenyulang = ['mali', 'moru', 'batunirwala', 'baranusa', 'kabir', 'maritaing', 'ilawe'];
      const base = knownPenyulang.includes(pKey) ? `tiang-${pKey}` : 'tiang-default';
      
      let icon = base;
      if (penopang.includes('kontramast')) {
        icon = `${base}-kontramast`;
      } else if (penopang.includes('schoor') || penopang.includes('treck') || penopang.includes('druck')) {
        icon = `${base}-schoor`;
      }

      return {
        type: 'Feature',
        properties: {
          nama_tiang: t.nama_tiang,
          penyulang: t.penyulang || '',
          urutan_tiang: t.urutan_tiang || '',
          jenis_tiang: t.jenis_tiang || '',
          tipe_tiang: t.tipe_tiang || '',
          pondasi_tiang: t.pondasi_tiang || '',
          kekuatan_tiang: t.kekuatan_tiang || '',
          penopang: t.penopang || '',
          konstruksi_1: t.konstruksi_1 || '',
          konstruksi_2: t.konstruksi_2 || '',
          jenis_hantaran_1: t.jenis_hantaran_1 || '',
          ukuran_hantaran_1: t.ukuran_hantaran_1 || '',
          vendor: t.vendor || '',
          kepemilikan: t.kepemilikan || '',
          icon: icon,
          label: t.nama_tiang,
          textColor: getPenyulangColor(t.penyulang || ''),
        },
        geometry: { type: 'Point', coordinates: [t.longitude, t.latitude] }
      };
    }) : [];
    
    (mapInstance.current.getSource('tiang-source') as maplibregl.GeoJSONSource).setData({ type: 'FeatureCollection', features: features as any });
  }, [tiangJTM, layers.tiang, isReady, filterPenyulang, filterSpesifikasi]);

  // Layer visibility effect
  useEffect(() => {
    if (!isReady || !mapInstance.current) return;
    const map = mapInstance.current;
    
    ['gardu', 'penyulang', 'tiang'].forEach(l => {
      const layerId = l === 'penyulang' ? 'penyulang-layer' : `${l}-layer`;
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', layers[l as keyof LayerState] ? 'visible' : 'none');
      }
    });

    ['batas-desa-fill', 'batas-desa-border', 'batas-desa-label'].forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', layers.batasDesa ? 'visible' : 'none');
      }
    });
  }, [layers, isReady]);

  // Filter ArcGIS JTM layer by penyulang
  useEffect(() => {
    if (!isReady || !mapInstance.current) return;
    const map = mapInstance.current;
    if (!map.getLayer('jtm-arcgis-layer')) return;

    if (filterPenyulang === 'all') {
      map.setFilter('jtm-arcgis-layer', null);
    } else {
      // Match against penyulang/feeder/NAMAPENYULANG in multiple property naming conventions
      map.setFilter('jtm-arcgis-layer', [
        'any',
        ['==', ['upcase', ['coalesce', ['get', 'penyulang'], '']], filterPenyulang],
        ['==', ['upcase', ['coalesce', ['get', 'feeder'], '']], filterPenyulang],
        ['==', ['upcase', ['coalesce', ['get', 'NAMAPENYULANG'], '']], filterPenyulang],
      ]);
    }
  }, [filterPenyulang, isReady]);



  // JOSM Upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !mapInstance.current) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parser = new DOMParser();
        const gpxDoc = parser.parseFromString(event.target?.result as string, 'text/xml');
        const geojson = gpx(gpxDoc);
        
        mapInstance.current!.addSource('josm-source', { type: 'geojson', data: geojson as any });
        mapInstance.current!.addLayer({
          id: 'josm-layer',
          type: 'circle',
          source: 'josm-source',
          paint: { 'circle-color': '#f97316', 'circle-radius': 6, 'circle-stroke-color': '#fff' }
        });
        
        // Fit bounds
        const coordinates = (geojson as any).features.flatMap((f: any) => 
          f.geometry.type === 'Point' ? [f.geometry.coordinates] : f.geometry.coordinates
        );
        if (coordinates.length > 0) {
          const bounds = coordinates.reduce((b: maplibregl.LngLatBounds, c: number[]) => b.extend(c as [number, number]), new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));
          mapInstance.current!.fitBounds(bounds, { padding: 50 });
        }
      } catch (err) {
        alert('Gagal memproses file GPX.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const toggleLayer = (key: keyof LayerState) => setLayers(p => ({ ...p, [key]: !p[key] }));

  // ===== PLANNING MODE HANDLERS =====
  const cancelDrawing = useCallback(() => {
    drawMarkersRef.current.forEach(m => m.remove());
    drawMarkersRef.current = [];
    setDrawingJalur([]);
    setPlanningTool('none');
    if (mapInstance.current) mapInstance.current.getCanvas().style.cursor = '';
  }, []);

  const finishDrawJalur = useCallback(() => {
    if (drawingJalur.length < 2) { toast.error('Minimal 2 titik untuk jalur'); return; }
    addUsulanJalur({
      id: 'UJ_' + Date.now(),
      nama: `Jalur Usulan ${planPenyulang || 'Baru'}`,
      penyulang: planPenyulang || undefined,
      coordinates: drawingJalur,
      status: 'usulan',
      createdAt: new Date().toISOString(),
    });
    toast.success(`Jalur usulan tersimpan (${drawingJalur.length} titik)`);
    cancelDrawing();
  }, [drawingJalur, planPenyulang, addUsulanJalur, cancelDrawing]);

  // Global helper for map popup deletion
  useEffect(() => {
    (window as any).deleteJalurFromMap = (namaJalur: string) => {
      const state = useAssetStore.getState();
      const j = state.usulanJalur.find(x => x.nama === namaJalur);
      if (j) {
        state.deleteUsulanJalur(j.id);
        toast.success('Usulan jalur dihapus.');
        const popups = document.getElementsByClassName('maplibregl-popup');
        if (popups.length) popups[0].remove();
      }
    };
    (window as any).deleteTiangFromMap = (id: string) => {
      const state = useAssetStore.getState();
      state.deleteUsulanTiang(id);
      toast.success('Usulan tiang dihapus.');
      const popups = document.getElementsByClassName('maplibregl-popup');
      if (popups.length) popups[0].remove();
    };
    (window as any).deleteGarduFromMap = (id: string) => {
      const state = useAssetStore.getState();
      state.deleteUsulanGardu(id);
      toast.success('Usulan gardu dihapus.');
      const popups = document.getElementsByClassName('maplibregl-popup');
      if (popups.length) popups[0].remove();
    };
  }, []);

  // Planning click handler
  useEffect(() => {
    if (!mapInstance.current || !isReady) return;
    const map = mapInstance.current;

    const onPlanClick = (e: maplibregl.MapMouseEvent) => {
      if (planningTool === 'none' || measureMode) return;
      const lng = e.lngLat.lng, lat = e.lngLat.lat;

      if (planningTool === 'add-tiang') {
        const input = window.prompt("Pilih Tipe Tiang Usulan:\n1 = Tumpu (â­•)\n2 = Sudut (â—‡)\n3 = Penegang (â—»)\n(Biarkan kosong untuk Tumpu default)");
        if (input === null) return;
        let tk: 'Tumpu' | 'Sudut' | 'Penegang' | 'Akhir' = 'Tumpu';
        if (input === '2') tk = 'Sudut';
        else if (input === '3') tk = 'Penegang';
        else if (input === '4') tk = 'Akhir';

        const id = 'UT_' + Date.now();
        addUsulanTiang({
          id, nama_tiang: `Tiang Usulan ${usulanTiang.length + 1}`,
          tipe_konstruksi: tk,
          penyulang: planPenyulang || undefined,
          latitude: lat, longitude: lng, status: 'usulan',
          createdAt: new Date().toISOString(),
        });
        toast.success(`Tiang ${tk} usulan ditambahkan!`);
      } else if (planningTool === 'add-gardu') {
        addUsulanGardu({
          id: 'UG_' + Date.now(),
          nama: `Gardu Usulan ${usulanGardu.length + 1}`,
          penyulang: planPenyulang || undefined,
          latitude: lat, longitude: lng, status: 'usulan', kapasitas_kva: 50,
          createdAt: new Date().toISOString(),
        });
        toast.success('Gardu/Trafo usulan ditambahkan!');
      } else if (planningTool === 'draw-jalur') {
        const pt: [number, number] = [lng, lat];
        setDrawingJalur(prev => [...prev, pt]);
        const el = document.createElement('div');
        el.style.cssText = 'width:10px;height:10px;background:#eab308;border:2px solid #fff;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,0.3)';
        const marker = new maplibregl.Marker({ element: el }).setLngLat(pt).addTo(map);
        drawMarkersRef.current.push(marker);
      }
    };

    if (planningTool !== 'none') {
      map.on('click', onPlanClick);
      map.getCanvas().style.cursor = 'crosshair';
    }
    return () => {
      map.off('click', onPlanClick);
      if (planningTool === 'none' && !measureMode) map.getCanvas().style.cursor = '';
    };
  }, [planningTool, isReady, measureMode, planPenyulang, usulanTiang.length, usulanGardu.length]);

  // Render Usulan markers
  useEffect(() => {
    if (!mapInstance.current || !isReady) return;
    const map = mapInstance.current;
    // Clear old markers
    usulanMarkersRef.current.forEach(m => m.remove());
    usulanMarkersRef.current = [];
    if (!layers.usulan) return;

    // Tiang usulan markers
    usulanTiang.forEach(t => {
      const el = document.createElement('div');
      const sc = STATUS_COLORS[t.status] || '#f59e0b';
      el.innerHTML = getProposedPoleSVG(t.tipe_konstruksi || 'Tumpu', sc);
      el.style.cursor = 'pointer';
      el.title = `${t.nama_tiang} [${t.status.toUpperCase()}]`;
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([t.longitude, t.latitude])
        .setPopup(new maplibregl.Popup({ offset: 15 }).setHTML(
          `<div style="color:#0f172a;font-size:12px;min-width:180px">
             <b>${t.nama_tiang}</b><br/>
             Tipe Konstr: <b>${t.tipe_konstruksi || 'Tumpu'} ${t.tipe_tiang ? `(${t.tipe_tiang})` : ''}</b><br/>
             Status: <span style="color:${sc};font-weight:700">${t.status.toUpperCase()}</span><br/>
             Penyulang: ${t.penyulang || '-'}<br/>
             ${t.catatan ? `<div style="background:#f1f5f9; padding:6px; font-size:10px; border-radius:4px; margin-top:6px; color:#334155; white-space:pre-wrap;">${t.catatan}</div>` : ''}
             <button onclick="window.deleteTiangFromMap('${t.id}')" style="margin-top:8px; width:100%; padding:4px 8px; background:#ef4444; color:#fff; border:none; border-radius:4px; cursor:pointer; font-weight:bold; font-size:11px">Hapus Tiang Usulan</button>
           </div>`
        ))
        .addTo(map);
      usulanMarkersRef.current.push(marker);
    });

    // Gardu usulan markers
    usulanGardu.forEach(g => {
      const el = document.createElement('div');
      const sc = STATUS_COLORS[g.status] || '#f59e0b';
      el.innerHTML = getProposedTrafoSVG(sc);
      el.style.cursor = 'pointer';
      el.title = `${g.nama} [${g.status.toUpperCase()}]`;
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([g.longitude, g.latitude])
        .setPopup(new maplibregl.Popup({ offset: 15 }).setHTML(
          `<div style="color:#0f172a;font-size:12px;min-width:180px">
             <b>${g.nama}</b><br/>
             Status: <span style="color:${sc};font-weight:700">${g.status.toUpperCase()}</span><br/>
             Kapasitas: ${g.kapasitas_kva || '?'} kVA<br/>
             Penyulang: ${g.penyulang || '-'}<br/>
             ${g.catatan ? `<div style="background:#f1f5f9; padding:6px; font-size:10px; border-radius:4px; margin-top:6px; color:#334155; white-space:pre-wrap;">${g.catatan}</div>` : ''}
             <button onclick="window.deleteGarduFromMap('${g.id}')" style="margin-top:8px; width:100%; padding:4px 8px; background:#ef4444; color:#fff; border:none; border-radius:4px; cursor:pointer; font-weight:bold; font-size:11px">Hapus Gardu Usulan</button>
           </div>`
        ))
        .addTo(map);
      usulanMarkersRef.current.push(marker);
    });

    // Jalur usulan as GeoJSON source
    const jalurFeatures = usulanJalur.map(j => ({
      type: 'Feature' as const, properties: { nama: j.nama, status: j.status, color: STATUS_COLORS[j.status] },
      geometry: { type: 'LineString' as const, coordinates: j.coordinates },
    }));
    if (map.getSource('usulan-jalur-source')) {
      (map.getSource('usulan-jalur-source') as maplibregl.GeoJSONSource).setData({ type: 'FeatureCollection', features: jalurFeatures as any });
    } else {
      map.addSource('usulan-jalur-source', { type: 'geojson', data: { type: 'FeatureCollection', features: jalurFeatures as any } });
      map.addLayer({
        id: 'usulan-jalur-layer', type: 'line', source: 'usulan-jalur-source',
        paint: { 'line-color': ['get', 'color'], 'line-width': 3, 'line-dasharray': [6, 4] },
      });
    }

    // Drawing preview line
    if (drawingJalur.length > 1 && map.getSource('draw-preview-source')) {
      (map.getSource('draw-preview-source') as maplibregl.GeoJSONSource).setData({
        type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: drawingJalur } }],
      });
    }
  }, [usulanTiang, usulanGardu, usulanJalur, drawingJalur, layers.usulan, isReady]);

  // Add draw preview source
  useEffect(() => {
    if (!mapInstance.current || !isReady) return;
    const map = mapInstance.current;
    if (!map.getSource('draw-preview-source')) {
      map.addSource('draw-preview-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: 'draw-preview-layer', type: 'line', source: 'draw-preview-source',
        paint: { 'line-color': '#eab308', 'line-width': 3, 'line-dasharray': [4, 3] },
      });
    }
  }, [isReady]);

  const layerLabels: Record<string, { label: string; icon: string }> = {
    pembangkit: { label: 'Pembangkit / PLT', icon: 'âš¡' },
    recloser: { label: 'Recloser LBS', icon: 'ðŸ”´' },
    fco: { label: 'Fuse Cut Out', icon: 'ðŸ›¡ï¸' },
    gardu: { label: 'Gardu / Trafo', icon: 'âš¡' },
    penyulang: { label: 'Jalur JTM', icon: 'ã€°ï¸' },
    tiang: { label: 'Tiang JTM', icon: 'ðŸ“' },
    proteksi: { label: 'Proteksi', icon: 'ðŸ›¡ï¸' },
    usulan: { label: 'Aset Usulan', icon: 'ðŸŸ¡' }
  };

  // --- Rensis NTT Shared Styles ---
  const rensisFieldset: React.CSSProperties = { border: '1px solid #ccc', borderRadius: 5, padding: 10, margin: 0 };
  const rensisLegend: React.CSSProperties = { fontWeight: 'bold', fontSize: 13, color: '#333' };
  const rensisLabel: React.CSSProperties = { fontWeight: 'bold', fontSize: 12, color: '#333', display: 'block', marginBottom: 4 };
  const rensisSelect: React.CSSProperties = { width: '100%', padding: 6, fontSize: 12, border: '1px solid #ccc', borderRadius: 5 };
  const rensisBtnCyan: React.CSSProperties = { background: '#1fb8cc', color: '#fff', border: 'none', padding: '5px 8px', borderRadius: 5, cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'background 0.2s' };
  const rensisBtnSmall: React.CSSProperties = { color: '#fff', border: 'none', padding: '5px 8px', borderRadius: 5, cursor: 'pointer', fontSize: 11, fontWeight: 600 };

  const { searchTerm, setSearchTerm, searchResults, performSearch, checkConnectivity } = useAssetStore();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    performSearch();
  };

  const zoomToAsset = (asset: any) => {
    if (!mapInstance.current) return;
    const lng = asset.longitude || asset.lng;
    const lat = asset.latitude || asset.lat;
    if (lng && lat) {
      mapInstance.current.flyTo({ center: [lng, lat], zoom: 18 });
      new maplibregl.Popup({ offset: 15 })
        .setLngLat([lng, lat])
        .setHTML(`<div style="padding:10px;"><b>${asset.nama || asset.nama_tiang}</b><br/>Type: ${asset.type}</div>`)
        .addTo(mapInstance.current);
    }
  };

  const [healthStatus, setHealthStatus] = useState<{ connected: boolean; issues: string[] } | null>(null);
  
  const runConnectivityCheck = () => {
    if (filterPenyulang === 'all') {
      toast.error('Pilih satu penyulang spesifik untuk cek konektivitas');
      return;
    }
    const res = checkConnectivity(filterPenyulang);
    setHealthStatus(res);
    if (res.connected) toast.success(`Penyulang ${filterPenyulang} terkoneksi sempurna!`);
    else toast.error(`Ditemukan ${res.issues.length} masalah koneksi pada ${filterPenyulang}`);
  };

  const [activeMenuTab, setActiveMenuTab] = useState<'layers' | 'planning' | 'analysis'>('layers');

  return (
    <div className="map-container" style={{ display: 'flex', height: '100%', width: '100%', position: 'relative', fontFamily: 'Inter, sans-serif' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {/* ===== SEARCH & FILTER PANEL (top-left overlay) ===== */}
      {isReady && (
        <MapSearchFilter
          mapInstance={mapInstance.current}
          gardus={gardus}
          tiangJTM={tiangJTM}
          penyulangList={penyulangList}
          filterPenyulang={filterPenyulang}
          onFilterPenyulang={(p) => setFilterPenyulang(p)}
          batasDesaGeoJSON={batasDesaGeoJSON}
        />
      )}

      {/* Fault Analysis Overlay */}
      <FaultAnalysisPanel
        result={faultResult}
        isActive={faultMode}
        onClear={clearFault}
        onToggle={toggleFaultMode}
      />
      <style>{`@keyframes faultPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.3)} }`}</style>
      
      {/* Search Input (Top Center) */}
      <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', flexDirection: 'column', gap: 0, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 15, alignItems: 'center', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', padding: '6px 15px', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.3)' }}>
          <div style={{ color: '#6366f1' }}>🔍</div>
          <input 
            type="text" 
            placeholder="Search assets (Pole ID, Transformer Name...)" 
            value={searchTerm}
            onChange={handleSearchChange}
            style={{ width: 320, padding: '8px 4px', fontSize: 13, border: 'none', background: 'none', outline: 'none', color: '#1e293b', fontWeight: 500 }} 
          />
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div style={{ width: 350, background: '#fff', marginTop: 8, borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.2)', border: '1px solid #e2e8f0', maxHeight: 350, overflowY: 'auto' }}>
            {searchResults.map((res, i) => (
              <div 
                key={i} 
                onClick={() => { zoomToAsset(res); setSearchTerm(''); performSearch(); }}
                style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                onMouseOut={(e) => e.currentTarget.style.background = '#fff'}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{res.nama || res.nama_tiang}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{res.type} • {res.penyulang}</div>
                </div>
                <div style={{ fontSize: 10, background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, color: '#475569', fontWeight: 700 }}>GO TO</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hamburger Toggle Button */}
      <button onClick={() => setShowSurveyPanel(!showSurveyPanel)} style={{ position: 'absolute', top: 12, right: showSurveyPanel ? 375 : 12, zIndex: 1000, background: '#fff', border: 'none', width: 40, height: 40, borderRadius: 10, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontSize: 20, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {showSurveyPanel ? '✕' : '☰'}
      </button>

      {/* ====== MODERN TABBED SIDEBAR ====== */}
      <div style={{ 
        position: 'absolute', top: 12, right: showSurveyPanel ? 12 : -400, zIndex: 999, 
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(16px)', 
        borderRadius: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.2)', 
        width: 350, maxHeight: 'calc(100vh - 24px)', overflow: 'hidden', 
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
        display: 'flex', flexDirection: 'column', border: '1px solid rgba(255,255,255,0.5)' 
      }}>
        
        {/* Sidebar Header Tabs */}
        <div style={{ display: 'flex', background: '#f8fafc', padding: 4, borderBottom: '1px solid #e2e8f0' }}>
          {[
            { id: 'layers', label: 'Layers', icon: '🗺️' },
            { id: 'planning', label: 'Survey', icon: '🛠️' },
            { id: 'analysis', label: 'Analysis', icon: '📊' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveMenuTab(tab.id as any)}
              style={{
                flex: 1, padding: '10px 4px', border: 'none', borderRadius: 10,
                background: activeMenuTab === tab.id ? '#fff' : 'transparent',
                color: activeMenuTab === tab.id ? '#6366f1' : '#64748b',
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                boxShadow: activeMenuTab === tab.id ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4
              }}
            >
              <span style={{ fontSize: 16 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {activeMenuTab === 'layers' && (
            <>
              <fieldset style={rensisFieldset}>
                <legend style={rensisLegend}>Asset Visibility</legend>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Object.keys(layers).filter(k => !['gangguan','josm','batasDesa'].includes(k)).map(k => (
                    <label key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, cursor: 'pointer', padding: '4px 0' }}>
                      <span style={{ color: '#334155', fontWeight: 500 }}>{layerLabels[k]?.icon} {layerLabels[k]?.label}</span>
                      <input 
                        type="checkbox" 
                        checked={layers[k as keyof LayerState]} 
                        onChange={() => toggleLayer(k as keyof LayerState)} 
                        style={{ width: 16, height: 16, accentColor: '#6366f1' }} 
                      />
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset style={rensisFieldset}>
                <legend style={rensisLegend}>Base Maps</legend>
                <select value={basemap} onChange={(e) => setBasemap(e.target.value as any)} style={rensisSelect}>
                  <option value="voyager">Standard (Voyager)</option>
                  <option value="osm">Street Detail (OSM)</option>
                  <option value="satellite">Satellite (Esri)</option>
                </select>
              </fieldset>
            </>
          )}

          {activeMenuTab === 'planning' && (
            <>
              <fieldset style={rensisFieldset}>
                <legend style={rensisLegend}>Distribution Survey</legend>
                <div style={{ marginBottom: 12 }}>
                  <label style={rensisLabel}>Network Type:</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                      onClick={() => toggleSurveyMode('JTM')}
                      style={{ ...rensisBtnSmall, flex: 1, background: surveyMode === 'JTM' ? '#3b82f6' : '#f1f5f9', color: surveyMode === 'JTM' ? '#fff' : '#475569', border: '1px solid #e2e8f0' }}
                    >JTM (MV)</button>
                    <button 
                      onClick={() => toggleSurveyMode('JTR')}
                      style={{ ...rensisBtnSmall, flex: 1, background: surveyMode === 'JTR' ? '#ef4444' : '#f1f5f9', color: surveyMode === 'JTR' ? '#fff' : '#475569', border: '1px solid #e2e8f0' }}
                    >JTR (LV)</button>
                  </div>
                </div>
                
                {surveyMode && (
                  <div style={{ padding: 12, background: '#eff6ff', borderRadius: 8, border: '1px solid #dbeafe', marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#1e40af', marginBottom: 4 }}>ACTVE: {surveyMode} SURVEY</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#1e3a8a' }}>{(surveyDistance/1000).toFixed(3)} <span style={{fontSize: 12}}>kms</span></div>
                  </div>
                )}

                <button onClick={calculateBoM} disabled={surveyPoints.length < 2} style={{ ...rensisBtnCyan, width: '100%', padding: 12, borderRadius: 10, background: '#6366f1', opacity: surveyPoints.length < 2 ? 0.5 : 1 }}>
                  📊 Calculate Material (BoM)
                </button>
              </fieldset>

              <fieldset style={rensisFieldset}>
                <legend style={rensisLegend}>Construction Elements</legend>
                <select style={rensisSelect}>
                  <option>-- Select Assembly --</option>
                  <optgroup label="Poles">
                    <option>Intermediate (B2)</option>
                    <option>Angle (B3)</option>
                    <option>Tension / Dead-end</option>
                  </optgroup>
                  <optgroup label="Schoor">
                    <option>Treck Schoor</option>
                    <option>Druck Schoor</option>
                    <option>Kontramast</option>
                  </optgroup>
                </select>
              </fieldset>
            </>
          )}

          {activeMenuTab === 'analysis' && (
            <>
              <fieldset style={rensisFieldset}>
                <legend style={rensisLegend}>Network Integrity Check</legend>
                <p style={{ fontSize: 11, color: '#64748b', marginBottom: 12 }}>Validate spatial connectivity and attribute completeness.</p>
                <button 
                  onClick={runConnectivityCheck}
                  style={{ ...rensisBtnCyan, width: '100%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  🔍 Run Health Audit
                </button>
                {healthStatus && (
                  <div style={{ marginTop: 12, padding: 12, background: healthStatus.connected ? '#f0fdf4' : '#fef2f2', border: `1px solid ${healthStatus.connected ? '#bbf7d0' : '#fecaca'}`, borderRadius: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: healthStatus.connected ? '#166534' : '#991b1b', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {healthStatus.connected ? '✅ Healthy' : '⚠️ Issues Found'}
                    </div>
                    {healthStatus.issues.length > 0 && (
                      <ul style={{ margin: '8px 0 0 0', paddingLeft: 16, fontSize: 11, color: '#4b5563', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {healthStatus.issues.map((iss, i) => <li key={i}>{iss}</li>)}
                      </ul>
                    )}
                  </div>
                )}
              </fieldset>

              <fieldset style={rensisFieldset}>
                <legend style={rensisLegend}>Power Flow Simulation</legend>
                <div style={{ marginBottom: 12 }}>
                  <label style={rensisLabel}>Selected Feeder:</label>
                  <select value={filterPenyulang} onChange={(e) => setFilterPenyulang(e.target.value)} style={rensisSelect}>
                    <option value="all">Global Simulation</option>
                    {penyulangList.map(p => (<option key={p} value={p}>{p}</option>))}
                  </select>
                </div>
                <button style={{ ...rensisBtnCyan, width: '100%', background: '#10b981' }}>
                  ⚡ Start NR Load Flow
                </button>
              </fieldset>
            </>
          )}

        </div>

        {/* Sidebar Footer */}
        <div style={{ padding: 12, borderTop: '1px solid #e2e8f0', background: '#f8fafc', fontSize: 10, color: '#94a3b8', textAlign: 'center' }}>
          PLN ULP KALABAHI • ARC-GIS INTEGRATED ENGINE v2.0
        </div>
      </div>


      {/* ===== MODAL REKAPITULASI PERHITUNGAN MATERIAL (RENSIS STYLE) ===== */}
      {showBomModal && (
        <React.Fragment>
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#fff', padding: 20, borderRadius: 8, zIndex: 9999, boxShadow: '0 0 20px rgba(0,0,0,0.3)', width: 380, maxHeight: '90vh', overflow: 'auto', fontSize: 14, lineHeight: 1.4 }}>
            <div style={{ textAlign: 'center', marginBottom: 12, position: 'relative' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 'bold', color: '#333' }}>REKAPITULASI PERHITUNGAN{'\n'}MATERIAL</h3>
              <button onClick={() => setShowBomModal(false)} style={{ position: 'absolute', top: -5, right: -5, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#999' }}>Ã—</button>
            </div>
            <div style={{ border: '1px solid #333', padding: '6px 10px', marginBottom: 15, textAlign: 'center', fontSize: 13, fontWeight: 'bold', color: '#333' }}>
              JARINGAN TEGANGAN {bomData.jtmOrjtr === 'JTM' ? 'MENENGAH (JTM)' : 'RENDAH (JTR)'}
            </div>
            <div style={{ color: '#e74c3c', fontWeight: 'bold', fontSize: 14, marginBottom: 8, borderBottom: '1px solid #ccc', paddingBottom: 4 }}>Material Utama</div>
            {[
              { label: `Tiang ${bomData.jtmOrjtr === 'JTM' ? 'TM' : 'TR'}`, unit: 'Batang', val: bomData.tiang },
              { label: 'Isolator Tumpu', unit: 'Buah', val: bomData.isolatorQty },
              { label: 'Isolator Tarik', unit: 'Set', val: Math.floor(bomData.tiang * 0.15) },
              { label: 'Fuse Cut Out', unit: 'Set', val: 0 },
              { label: 'Fuse Link', unit: 'Buah', val: 0 },
              { label: 'Lightning Arrester', unit: 'Set', val: 0 },
              { label: `Panjang ${bomData.jtmOrjtr}`, unit: 'kms', val: bomData.kabelKms.toFixed(2) },
            ].map((row, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr auto', gap: 4, padding: '4px 0', borderBottom: '1px solid #f0f0f0', fontSize: 13, color: '#333' }}>
                <span>{row.label}</span><span style={{ color: '#888' }}>{row.unit}</span><span style={{ fontWeight: 'bold', textAlign: 'right', minWidth: 40 }}>{row.val}</span>
              </div>
            ))}
            <div style={{ color: '#e74c3c', fontWeight: 'bold', fontSize: 14, marginTop: 15, marginBottom: 8, borderBottom: '1px solid #ccc', paddingBottom: 4 }}>Schoor</div>
            {[
              { label: 'Treck Schoor', unit: 'Set', val: Math.floor(bomData.tiang * 0.1) },
              { label: 'Druck Schoor', unit: 'Set', val: Math.floor(bomData.tiang * 0.08) },
              { label: 'Kontramast', unit: 'Set', val: Math.floor(bomData.tiang * 0.05) },
            ].map((row, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr auto', gap: 4, padding: '4px 0', borderBottom: '1px solid #f0f0f0', fontSize: 13, color: '#333' }}>
                <span>{row.label}</span><span style={{ color: '#888' }}>{row.unit}</span><span style={{ fontWeight: 'bold', textAlign: 'right', minWidth: 40 }}>{row.val}</span>
              </div>
            ))}
            <div style={{ color: '#e74c3c', fontWeight: 'bold', fontSize: 14, marginTop: 15, marginBottom: 8, borderBottom: '1px solid #ccc', paddingBottom: 4 }}>Type Cross Arm</div>
            {[
              { label: 'A1', unit: 'Set', val: Math.floor(bomData.tiang * 0.4) },
              { label: 'A2', unit: 'Set', val: Math.floor(bomData.tiang * 0.25) },
              { label: 'B', unit: 'Set', val: Math.floor(bomData.tiang * 0.15) },
              { label: 'C', unit: 'Set', val: Math.floor(bomData.tiang * 0.1) },
            ].map((row, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr auto', gap: 4, padding: '4px 0', borderBottom: '1px solid #f0f0f0', fontSize: 13, color: '#333' }}>
                <span>{row.label}</span><span style={{ color: '#888' }}>{row.unit}</span><span style={{ fontWeight: 'bold', textAlign: 'right', minWidth: 40 }}>{row.val}</span>
              </div>
            ))}
            <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
              <button onClick={saveSurveyToGlobal} style={{ flex: 1, padding: '10px', background: '#4285F4', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 'bold', cursor: 'pointer' }}>ðŸ“¥ Simpan ke Usulan</button>
              <button onClick={() => setShowBomModal(false)} style={{ flex: 1, padding: '10px', background: '#bbb', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 'bold', cursor: 'pointer' }}>Tutup</button>
            </div>
          </div>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9998 }} onClick={() => setShowBomModal(false)} />
        </React.Fragment>
      )}

      {/* Legend */}
      <div style={{ position: 'absolute', bottom: 32, left: 16, zIndex: 1, background: '#fff', padding: 14, borderRadius: 8, boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontSize: 11, color: '#334155', maxWidth: 180 }}>
        <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 12 }}>Legenda</div>
        
        <div style={{ fontWeight: 600, marginBottom: 4, color: '#64748b', fontSize: 10 }}>Konduktor JTM</div>
        <div style={{ display:'flex', gap:6, marginBottom:3, alignItems: 'center' }}><div style={{ width: 20, height: 3, background: '#ef4444', borderRadius: 2 }} /><span style={{fontSize: 10}}>AAAC (Merah)</span></div>
        <div style={{ display:'flex', gap:6, marginBottom:3, alignItems: 'center' }}><div style={{ width: 20, height: 3, background: '#3b82f6', borderRadius: 2 }} /><span style={{fontSize: 10}}>AAAC-S (Biru)</span></div>
        <div style={{ display:'flex', gap:6, marginBottom:3, alignItems: 'center' }}><div style={{ width: 20, height: 3, background: '#10b981', borderRadius: 2 }} /><span style={{fontSize: 10}}>SKUTR / Hijau</span></div>
        <div style={{ display:'flex', gap:6, marginBottom:3, alignItems: 'center' }}><div style={{ width: 20, height: 3, background: '#8b5cf6', borderRadius: 2 }} /><span style={{fontSize: 10}}>MVTIC / XLPE</span></div>
        <div style={{ display:'flex', gap:6, marginBottom:6, alignItems: 'center' }}><div style={{ width: 20, height: 3, background: '#334155', borderRadius: 2 }} /><span style={{fontSize: 10}}>Underbuilt JTR (Abu)</span></div>
        
        <div style={{ fontWeight: 600, marginBottom: 4, color: '#64748b', fontSize: 10 }}>Penyulang (Tiang)</div>
        {Object.entries(PENYULANG_COLORS).map(([name, color]) => (
          <div key={name} style={{ display:'flex', gap:5, marginBottom:2, alignItems: 'center' }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 10 }}>{name}</span>
          </div>
        ))}
        
        <div style={{ fontWeight: 600, marginTop: 6, marginBottom: 4, color: '#64748b', fontSize: 10 }}>Peralatan</div>
        <div style={{ display:'flex', gap:6, marginBottom:2, alignItems: 'center' }}>
          <div style={{ width: 12, height: 12, borderRadius: 2, background: '#1e40af' }} />
          <span style={{ fontSize: 10 }}>Trafo/Gardu</span>
        </div>

        <div style={{ fontWeight: 600, marginTop: 6, marginBottom: 4, color: '#64748b', fontSize: 10 }}>Status Usulan</div>
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} style={{ display:'flex', gap:5, marginBottom:2, alignItems: 'center' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 10, textTransform: 'capitalize' }}>{status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
