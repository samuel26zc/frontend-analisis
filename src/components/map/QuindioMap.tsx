import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Coordinate, Place } from '../../types';

interface QuindioMapProps {
  places?: Place[];
  routePolyline?: Coordinate[];
  convexHullPolygon?: Coordinate[];
  selectedPlaceId?: string | null;
  onPlaceSelect?: (place: Place) => void;
  className?: string;
}

export const QuindioMap: React.FC<QuindioMapProps> = ({
  places = [],
  routePolyline = [],
  convexHullPolygon = [],
  selectedPlaceId,
  onPlaceSelect,
  className = 'h-[500px]',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const hullLayerRef = useRef<L.Polygon | null>(null);

  // Inicializar el mapa de Leaflet
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centro del departamento del Quindío (Armenia)
    const map = L.map(mapContainerRef.current, {
      center: [4.53389, -75.68111],
      zoom: 11,
      minZoom: 9,
      maxZoom: 18,
    });

    // CartoDB Voyager Tile Layer (cartografía cálida, elegante y legible)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Iconos SVG personalizados según categoría
  const createCategoryIcon = (category: string, isSelected: boolean) => {
    const colors: Record<string, { bg: string; border: string }> = {
      CABECERA_MUNICIPAL: { bg: '#2E5A44', border: '#1B3B2B' }, // Verde Cordillera
      ATRACTIVO_TURISTICO: { bg: '#D97706', border: '#92400E' }, // Ámbar Cafetero
      FINCA_HOTEL: { bg: '#6E492B', border: '#3E2718' },         // Café Tostado
      CENTRO_ACOPIO: { bg: '#C05638', border: '#7A271A' },       // Terracota
    };

    const cfg = colors[category] || { bg: '#523620', border: '#2C1D11' };
    const size = isSelected ? 34 : 26;

    const svgHtml = `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${cfg.bg};
        border: 2px solid ${isSelected ? '#FFFFFF' : cfg.border};
        box-shadow: 0 4px 10px rgba(44, 29, 17, ${isSelected ? '0.45' : '0.25'});
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        transition: transform 0.2s ease;
        ${isSelected ? 'transform: scale(1.18); ring: 3px solid #D97706;' : ''}
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="${size * 0.52}" height="${size * 0.52}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      </div>
    `;

    return L.divIcon({
      html: svgHtml,
      className: 'custom-map-pin',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2],
    });
  };

  // Actualizar marcadores de lugares
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    places.forEach((place) => {
      const isSelected = place.id === selectedPlaceId;
      const marker = L.marker([place.latitude, place.longitude], {
        icon: createCategoryIcon(place.category, isSelected),
        zIndexOffset: isSelected ? 1000 : 0,
      });

      const popupHtml = `
        <div style="font-family: 'Plus Jakarta Sans', sans-serif;">
          <h4 style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 1rem; color: #2C1D11; margin-bottom: 4px;">
            ${place.name}
          </h4>
          <p style="font-size: 0.75rem; color: #6E492B; margin-bottom: 6px; font-weight: 500;">
            ${place.municipality} • ${place.category.replace('_', ' ')}
          </p>
          <div style="font-size: 0.75rem; color: #523620; border-top: 1px solid #EBE5DC; padding-top: 6px;">
            <div><strong>Coordenadas:</strong> ${place.latitude.toFixed(5)}, ${place.longitude.toFixed(5)}</div>
            ${place.visitDurationMinutes > 0 ? `<div><strong>Duración visita:</strong> ${place.visitDurationMinutes} min (${(place.visitDurationMinutes / 60).toFixed(1)} h)</div>` : ''}
            ${place.distanceToNodeMeters ? `<div><strong>Distancia a nodo vial:</strong> ${place.distanceToNodeMeters} m</div>` : ''}
            ${place.isExceeding500m ? `<div style="color: #C05638; font-weight: 600; margin-top: 4px;">⚠️ Excede 500 m: Acceso virtual rural</div>` : ''}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        if (onPlaceSelect) onPlaceSelect(place);
      });

      markersLayerRef.current?.addLayer(marker);
    });
  }, [places, selectedPlaceId]);

  // Actualizar polyline de caminos mínimos
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (routeLayerRef.current) {
      mapInstanceRef.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    if (routePolyline && routePolyline.length > 1) {
      const latlngs: L.LatLngExpression[] = routePolyline.map((c) => [c.latitude, c.longitude]);
      const polyline = L.polyline(latlngs, {
        color: '#C05638', // Terracota Andina
        weight: 5,
        opacity: 0.9,
        lineJoin: 'round',
      }).addTo(mapInstanceRef.current);

      routeLayerRef.current = polyline;
      mapInstanceRef.current.fitBounds(polyline.getBounds(), { padding: [40, 40] });
    }
  }, [routePolyline]);

  // Actualizar polígono de la envolvente convexa
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (hullLayerRef.current) {
      mapInstanceRef.current.removeLayer(hullLayerRef.current);
      hullLayerRef.current = null;
    }

    if (convexHullPolygon && convexHullPolygon.length > 2) {
      const latlngs: L.LatLngExpression[] = convexHullPolygon.map((c) => [c.latitude, c.longitude]);
      const polygon = L.polygon(latlngs, {
        color: '#2E5A44', // Verde Cordillera
        weight: 3,
        dashArray: '6, 6',
        fillColor: '#2E5A44',
        fillOpacity: 0.16,
      }).addTo(mapInstanceRef.current);

      hullLayerRef.current = polygon;
      mapInstanceRef.current.fitBounds(polygon.getBounds(), { padding: [30, 30] });
    }
  }, [convexHullPolygon]);

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-cafe-200 shadow-sm ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full" />
      {/* Mini Leyenda Flotante */}
      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm p-3 rounded-xl border border-cafe-200/80 shadow-md z-[1000] text-[11px] font-sans space-y-1.5 hidden sm:block">
        <div className="font-semibold text-cafe-900 border-b border-cafe-100 pb-1">Leyenda Quindío</div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-cordillera-700" />
          <span className="text-cafe-700">Cabecera Municipal (12)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-600" />
          <span className="text-cafe-700">Atractivo Turístico (15+)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#6E492B]" />
          <span className="text-cafe-700">Finca / Hotel Rural (8+)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-terracota-600" />
          <span className="text-cafe-700">Centro de Acopio (7)</span>
        </div>
      </div>
    </div>
  );
};
