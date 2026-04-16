'use client';

import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { createSvgIcon, getGarduSVG, getProteksiSVG, getTiangSVG } from '@/lib/map-utils';

interface InputPreviewMapProps {
  gpsCoords: { lat: number; lng: number } | null;
  selectedTypes: string[];
  formData: Record<string, string>;
}

export default function InputPreviewMap({ gpsCoords, selectedTypes, formData }: InputPreviewMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const markerInstance = useRef<maplibregl.Marker | null>(null);

  // Determine which SVG to show
  const getPreviewIconHtml = () => {
    const isProteksi = selectedTypes.some(t => t.toLowerCase().includes('proteksi') || t.toLowerCase().includes('lbs'));
    const isGardu = selectedTypes.some(t => t.toLowerCase().includes('gardu') || t.toLowerCase().includes('transformator'));
    const isTiang = selectedTypes.some(t => t.toLowerCase().includes('tiang'));

    if (isProteksi) {
      const pType = formData.jenisProteksi || 'Switchgear';
      return createSvgIcon(getProteksiSVG(pType, '#0f172a'), '#0f172a', '#f8fafc');
    }
    if (isGardu) {
      return createSvgIcon(getGarduSVG('Trafo', '#0f172a'), '#0f172a', '#f8fafc');
    }
    if (isTiang) {
      const type = formData.tinggiTiang ? 'normal' : 'sudut';
      return getTiangSVG(type, '#854d0e'); // Brown pole
    }
    
    // Default blue pin
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="#3b82f6" stroke="#ffffff" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>`;
  };

  useEffect(() => {
    if (!mapContainer.current || !gpsCoords) return;

    if (!mapInstance.current) {
      mapInstance.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
        center: [gpsCoords.lng, gpsCoords.lat],
        zoom: 17,
        attributionControl: false,
        interactive: false // just a preview
      });
    } else {
      mapInstance.current.setCenter([gpsCoords.lng, gpsCoords.lat]);
    }

    // Update marker
    const el = document.createElement('div');
    el.innerHTML = getPreviewIconHtml();

    if (markerInstance.current) {
      markerInstance.current.remove();
    }

    markerInstance.current = new maplibregl.Marker({ element: el })
      .setLngLat([gpsCoords.lng, gpsCoords.lat])
      .addTo(mapInstance.current);

  }, [gpsCoords, selectedTypes, formData]);

  if (!gpsCoords) return null;

  return (
    <div style={{ marginTop: '16px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #334155' }}>
      <div style={{ background: '#1e293b', padding: '8px 12px', fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>
        Preview Posisi & Simbol SLD
      </div>
      <div ref={mapContainer} style={{ width: '100%', height: '200px' }} />
    </div>
  );
}
