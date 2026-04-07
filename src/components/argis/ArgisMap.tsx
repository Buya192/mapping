'use client';

import { useEffect, useRef, useState } from 'react';
import type { LayerInfo } from '@/app/api/argis/route';

const LAYER_COLORS = [
  '#3b82f6', '#22c55e', '#ef4444', '#eab308', '#8b5cf6',
  '#06b6d4', '#f97316', '#ec4899', '#14b8a6', '#a855f7',
];

interface ArgisMapProps {
  layers: LayerInfo[];
  visibleLayers: Set<string>;
}

export function ArgisMap({ layers, visibleLayers }: ArgisMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const layerGroupsRef = useRef<Map<string, unknown>>(new Map());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const container = mapRef.current;
    if (!container) return;

    let destroyed = false;

    // Fully purge any existing Leaflet state from the DOM node
    type LeafletContainer = HTMLDivElement & {
      _leaflet_id?: number;
      _leaflet_events?: unknown;
    };
    const el = container as LeafletContainer;
    if (el._leaflet_id != null) {
      delete el._leaflet_id;
    }

    import('leaflet').then((L) => {
      if (destroyed || !mapRef.current) return;

      // If a map already exists on this element (StrictMode second run), remove it first
      const existingMap = (L as unknown as { _map?: { remove: () => void } })._map;
      if (existingMap) existingMap.remove();

      // Also remove via mapInstanceRef
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
        layerGroupsRef.current.clear();
      }

      // Re-check container after async gap
      const el2 = mapRef.current as LeafletContainer;
      if (el2._leaflet_id != null) delete el2._leaflet_id;

      delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current, {
        center: [-8.2, 124.5],
        zoom: 10,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(map);

      mapInstanceRef.current = map;
      if (!destroyed) setIsLoaded(true);
    });

    return () => {
      destroyed = true;
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
        layerGroupsRef.current.clear();
      }
      if (mapRef.current) {
        const c = mapRef.current as LeafletContainer;
        if (c._leaflet_id != null) delete c._leaflet_id;
      }
    };
  }, []);

  // Add/remove layers when visibility or data changes
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;
    import('leaflet').then((L) => {
      const map = mapInstanceRef.current as ReturnType<typeof L.map>;

      layers.forEach((layer, idx) => {
        const color = LAYER_COLORS[idx % LAYER_COLORS.length];
        const existingGroup = layerGroupsRef.current.get(layer.name);

        if (visibleLayers.has(layer.name)) {
          if (!existingGroup) {
            const group = L.featureGroup();

            if (layer.data?.features) {
              layer.data.features.forEach((feature) => {
                const geomType = feature.geometry?.type;
                const props = feature.properties ?? {};

                const popupContent = `
                  <div class="popup-title">${props['name'] ?? props['NAMA'] ?? props['nama'] ?? layer.name}</div>
                  ${Object.entries(props)
                    .slice(0, 8)
                    .map(([k, v]) => `<div class="popup-row"><span class="popup-label">${k}</span><span class="popup-value">${v ?? '-'}</span></div>`)
                    .join('')}
                `;

                if (geomType === 'Point' || geomType === 'MultiPoint') {
                  const coords = geomType === 'Point'
                    ? [feature.geometry.coordinates as number[]]
                    : feature.geometry.coordinates as number[][];

                  coords.forEach((coord) => {
                    const circle = L.circleMarker([coord[1], coord[0]], {
                      radius: 6,
                      fillColor: color,
                      color: '#fff',
                      weight: 1.5,
                      opacity: 1,
                      fillOpacity: 0.9,
                    });
                    circle.bindPopup(popupContent);
                    group.addLayer(circle);
                  });
                } else if (geomType === 'LineString' || geomType === 'MultiLineString') {
                  const geoLayer = L.geoJSON(feature as unknown as GeoJSON.GeoJsonObject, {
                    style: {
                      color,
                      weight: 2.5,
                      opacity: 0.9,
                    },
                  });
                  geoLayer.bindPopup(popupContent);
                  group.addLayer(geoLayer);
                } else if (geomType === 'Polygon' || geomType === 'MultiPolygon') {
                  const geoLayer = L.geoJSON(feature as unknown as GeoJSON.GeoJsonObject, {
                    style: {
                      color,
                      fillColor: color,
                      weight: 1.5,
                      opacity: 0.9,
                      fillOpacity: 0.2,
                    },
                  });
                  geoLayer.bindPopup(popupContent);
                  group.addLayer(geoLayer);
                }
              });
            }

            group.addTo(map);
            layerGroupsRef.current.set(layer.name, group);

            // Fit bounds on first layer added
            if (layerGroupsRef.current.size === 1) {
              try {
                map.fitBounds(group.getBounds(), { padding: [40, 40] });
              } catch {}
            }
          }
        } else {
          if (existingGroup) {
            map.removeLayer(existingGroup as ReturnType<typeof L.featureGroup>);
            layerGroupsRef.current.delete(layer.name);
          }
        }
      });
    });
  }, [layers, visibleLayers, isLoaded]);

  return (
    <div
      ref={mapRef}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
