'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import GeoJSON from 'ol/format/GeoJSON';
import { Feature } from 'ol';
import { Point } from 'ol/geom';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Style, Circle as CircleStyle, Fill, Stroke, Icon, Text } from 'ol/style';
import Overlay from 'ol/Overlay';
import { defaults as defaultControls, ScaleLine, FullScreen } from 'ol/control';
import toast from 'react-hot-toast';
import { CheckCircle2, AlertCircle, X, Camera, Navigation, Search } from 'lucide-react';
import { VerificationPanel } from '@/components/verification/VerificationPanel';

const CENTER_LAT = -8.2247;
const CENTER_LNG = 124.1935;

// SVG icon generator
function svg(c: string, s: number = 40): string {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">${c}</svg>`
  );
}

function tiangIcon(color: string, status: 'verified' | 'pending' | 'error' = 'pending'): string {
  let strokeColor = '#94a3b8';
  let fillColor = color;
  
  if (status === 'verified') {
    strokeColor = '#22c55e';
    fillColor = '#bbf7d0';
  } else if (status === 'error') {
    strokeColor = '#ef4444';
    fillColor = '#fecaca';
  }
  
  return svg(
    `<circle cx="20" cy="20" r="18" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/><line x1="20" y1="6" x2="20" y2="34" stroke="#1e293b" stroke-width="3"/>`,
    40
  );
}

function garduIcon(status: 'verified' | 'pending' | 'error' = 'pending'): string {
  let strokeColor = '#94a3b8';
  let fillColor = '#e0f2fe';
  
  if (status === 'verified') {
    strokeColor = '#22c55e';
    fillColor = '#bbf7d0';
  } else if (status === 'error') {
    strokeColor = '#ef4444';
    fillColor = '#fecaca';
  }
  
  return svg(
    `<circle cx="20" cy="20" r="18" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/><rect x="12" y="10" width="16" height="20" fill="none" stroke="#1e293b" stroke-width="2" rx="2"/>`,
    40
  );
}

interface AssetMarker {
  id: string;
  name: string;
  type: 'tiang' | 'gardu' | 'proteksi';
  lat: number;
  lng: number;
  status: 'verified' | 'pending' | 'error';
  color: string;
  details?: Record<string, any>;
}

// Demo assets
const DEMO_ASSETS: AssetMarker[] = [
  { id: 'T001', name: 'Tiang 001', type: 'tiang', lat: -8.2247, lng: 124.1935, status: 'pending', color: '#3b82f6' },
  { id: 'T002', name: 'Tiang 002', type: 'tiang', lat: -8.2250, lng: 124.1940, status: 'pending', color: '#3b82f6' },
  { id: 'T003', name: 'Tiang 003', type: 'tiang', lat: -8.2245, lng: 124.1930, status: 'verified', color: '#3b82f6' },
  { id: 'G001', name: 'Gardu Kalabahi', type: 'gardu', lat: -8.2240, lng: 124.1945, status: 'pending', color: '#34d399' },
  { id: 'G002', name: 'Gardu Utama', type: 'gardu', lat: -8.2255, lng: 124.1925, status: 'error', color: '#34d399' },
  { id: 'P001', name: 'Proteksi P1', type: 'proteksi', lat: -8.2242, lng: 124.1938, status: 'pending', color: '#a78bfa' },
];

export default function VerificationMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const vectorLayerRef = useRef<VectorLayer | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<AssetMarker | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyAssets, setNearbyAssets] = useState<AssetMarker[]>([]);
  const [verificationStatus, setVerificationStatus] = useState<Record<string, 'verified' | 'pending' | 'error'>>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(loc);
        },
        () => {
          // Fallback to default location if permission denied
          setUserLocation({ lat: CENTER_LAT, lng: CENTER_LNG });
        }
      );
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !userLocation) return;

    const osmLayer = new TileLayer({
      source: new OSM(),
    });

    const vectorSource = new VectorSource();
    
    // Add user location marker
    const userFeature = new Feature({
      geometry: new Point(fromLonLat([userLocation.lng, userLocation.lat])),
    });
    userFeature.setStyle(new Style({
      image: new CircleStyle({
        radius: 8,
        fill: new Fill({ color: 'rgba(59, 130, 246, 0.8)' }),
        stroke: new Stroke({ color: '#1e40af', width: 2 }),
      }),
    }));
    vectorSource.addFeature(userFeature);

    // Add asset markers
    DEMO_ASSETS.forEach((asset) => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([asset.lng, asset.lat])),
        asset,
      });

      const iconUrl = asset.type === 'tiang' 
        ? tiangIcon(asset.color, asset.status)
        : asset.type === 'gardu'
        ? garduIcon(asset.status)
        : garduIcon(asset.status);

      feature.setStyle(new Style({
        image: new Icon({
          src: iconUrl,
          scale: 1,
          anchor: [0.5, 0.5],
        }),
      }));

      vectorSource.addFeature(feature);
    });

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      zIndex: 10,
    });
    vectorLayerRef.current = vectorLayer;

    const map = new Map({
      target: mapContainer.current,
      layers: [osmLayer, vectorLayer],
      view: new View({
        center: fromLonLat([userLocation.lng, userLocation.lat]),
        zoom: 16,
        minZoom: 10,
        maxZoom: 19,
      }),
      controls: defaultControls({ attribution: false }).extend([
        new ScaleLine(),
        new FullScreen(),
      ]),
    });

    mapRef.current = map;

    // Handle map clicks to select assets
    const handleMapClick = (evt: any) => {
      const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f);
      if (feature && feature.get('asset')) {
        setSelectedAsset(feature.get('asset'));
      }
    };
    map.on('click', handleMapClick);

    return () => {
      map.un('click', handleMapClick);
      map.dispose();
    };
  }, [userLocation]);

  // Calculate nearby assets
  useEffect(() => {
    if (!userLocation) return;
    
    const nearby = DEMO_ASSETS.filter((asset) => {
      const dx = asset.lat - userLocation.lat;
      const dy = asset.lng - userLocation.lng;
      const dist = Math.sqrt(dx * dx + dy * dy) * 111; // roughly km
      return dist < 1; // 1 km radius
    }).sort((a, b) => {
      const distA = Math.sqrt(Math.pow(a.lat - userLocation.lat, 2) + Math.pow(a.lng - userLocation.lng, 2));
      const distB = Math.sqrt(Math.pow(b.lat - userLocation.lat, 2) + Math.pow(b.lng - userLocation.lng, 2));
      return distA - distB;
    });

    setNearbyAssets(nearby);
  }, [userLocation]);

  // Filter assets by search
  const filteredAssets = useMemo(() => {
    return nearbyAssets.filter(a => 
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [nearbyAssets, searchQuery]);

  const handleVerify = (assetId: string, status: 'verified' | 'error') => {
    setVerificationStatus(prev => ({ ...prev, [assetId]: status }));
    
    // Update the asset in demo data
    const asset = DEMO_ASSETS.find(a => a.id === assetId);
    if (asset) {
      asset.status = status;
      if (selectedAsset?.id === assetId) {
        setSelectedAsset({ ...selectedAsset, status });
      }
    }

    toast.success(`${asset?.name} marked as ${status}`, {
      icon: status === 'verified' ? '✓' : '⚠',
    });
  };

  const handleVerifyWithNotes = (assetId: string, status: 'verified' | 'error', notes?: string) => {
    handleVerify(assetId, status);
    if (notes) {
      console.log(`[Verification] ${assetId}: ${notes}`);
    }
  };

  const handleLocationUpdate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const newLoc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(newLoc);
        if (mapRef.current) {
          mapRef.current.getView().animate({
            center: fromLonLat([newLoc.lng, newLoc.lat]),
            duration: 500,
          });
        }
        toast.success('Location updated');
      });
    }
  };

  return (
    <div className="h-screen flex gap-4 p-4 bg-[#0a0e1a]">
      {/* Map Section */}
      <div className="flex-1 relative rounded-xl overflow-hidden">
        <div
          ref={mapContainer}
          className="w-full h-full"
          style={{ position: 'relative' }}
        />
        
        {/* Quick Controls */}
        <div className="absolute top-4 left-4 flex gap-2 z-20">
          <button
            onClick={handleLocationUpdate}
            className="bg-[#1c1c2e] border border-[#27272a] rounded-lg p-2 hover:bg-[#27272a] transition-colors"
            title="Update location"
          >
            <Navigation size={20} className="text-[#34d399]" />
          </button>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-96 flex flex-col gap-4">
        {/* Search Section */}
        <div className="glass-card">
          <div className="glass-card-header">
            <Search size={16} />
            Cari Aset
          </div>
          <div className="p-4">
            <input
              type="text"
              placeholder="Cari tiang, gardu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-white placeholder-[#52525b] focus:outline-none focus:border-[#34d399]"
            />
          </div>
        </div>

        {/* Nearby Assets List */}
        <div className="glass-card flex-1 overflow-hidden flex flex-col">
          <div className="glass-card-header">
            <span>[ ASET TERDEKAT ] {filteredAssets.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredAssets.length === 0 ? (
              <div className="p-4 text-center text-[#52525b] text-sm">
                Tidak ada aset terdekat
              </div>
            ) : (
              filteredAssets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset)}
                  className={`w-full p-3 border-b border-[#18181b] hover:bg-[#1c1c2e] transition-colors text-left ${
                    selectedAsset?.id === asset.id ? 'bg-[#1c1c2e] border-l-2 border-l-[#34d399]' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                      asset.status === 'verified' ? 'bg-[#22c55e]' : 
                      asset.status === 'error' ? 'bg-[#ef4444]' : 
                      'bg-[#f59e0b]'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{asset.name}</div>
                      <div className="text-[10px] text-[#52525b] uppercase tracking-wider">{asset.type} • {asset.id}</div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Verification Panel Modal */}
      {selectedAsset && (
        <VerificationPanel 
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          onVerify={handleVerifyWithNotes}
        />
      )}
    </div>
  );
}
