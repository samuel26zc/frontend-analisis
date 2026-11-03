import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Coordinate, Place } from '../../types';

export type MapTileStyle = 'satellite' | 'gray' | 'topo' | 'streets';

interface QuindioMapProps {
  places?: Place[];
  routePolyline?: Coordinate[];
  convexHullPolygon?: Coordinate[];
  selectedPlaceId?: string | null;
  onPlaceSelect?: (place: Place) => void;
  className?: string;
  defaultTileStyle?: MapTileStyle;
}

export const QuindioMap: React.FC<QuindioMapProps> = ({
  places = [],
  routePolyline = [],
  convexHullPolygon = [],
  selectedPlaceId,
  onPlaceSelect,
  className = 'h-[500px]',
  defaultTileStyle = 'satellite',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const currentBaseLayerRef = useRef<L.LayerGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const hullLayerRef = useRef<L.Polygon | null>(null);

  const [activeStyle, setActiveStyle] = useState<MapTileStyle>(defaultTileStyle);

  // Generador de capas base según el estilo seleccionado
  const createBaseLayer = (style: MapTileStyle): L.LayerGroup => {
    switch (style) {
      case 'satellite': {
        // Satélite Real de Alta Definición (Esri World Imagery) + Vías y Nombres nítidos
        const satLayer = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          {
            attribution: 'Fotografía &copy; Esri, Maxar, Earthstar Geographics',
            maxZoom: 19,
          }
        );
        const labelsLayer = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
          {
            maxZoom: 19,
          }
        );
        return L.layerGroup([satLayer, labelsLayer]);
      }

      case 'gray': {
        // Minimalista Ejecutivo (Esri Light Gray Canvas) - Sin ruido, colores suaves
        const grayBase = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
          {
            attribution: 'Tiles &copy; Esri &mdash; DeLorme, NAVTEQ',
            maxZoom: 16,
          }
        );
        const grayLabels = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
          {
            maxZoom: 16,
          }
        );
        return L.layerGroup([grayBase, grayLabels]);
      }

      case 'topo': {
        // Relieve de montaña y curvas de nivel de la Cordillera Central
        const topoLayer = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
          {
            attribution: 'Topografía &copy; Esri &mdash; USGS, NPS',
            maxZoom: 18,
          }
        );
        return L.layerGroup([topoLayer]);
      }

      case 'streets':
      default: {
        // Callejero nítido
        const streets = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        });
        return L.layerGroup([streets]);
      }
    }
  };

  // Inicializar el mapa de Leaflet
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centro del departamento del Quindío (Armenia)
    const map = L.map(mapContainerRef.current, {
      center: [4.53389, -75.68111],
      zoom: 11,
      minZoom: 9,
      maxZoom: 18,
      zoomControl: false, // Reubicaremos el zoom a un lugar más limpio
    });

    // Control de zoom en la esquina inferior izquierda para no tapar los controles
    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    // Añadir capa base inicial
    const initialLayer = createBaseLayer(activeStyle);
    initialLayer.addTo(map);
    currentBaseLayerRef.current = initialLayer;

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Cambiar capa base cuando el usuario pulsa un botón del selector
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (currentBaseLayerRef.current) {
      mapInstanceRef.current.removeLayer(currentBaseLayerRef.current);
    }

    const newLayer = createBaseLayer(activeStyle);
    newLayer.addTo(mapInstanceRef.current);
    currentBaseLayerRef.current = newLayer;
  }, [activeStyle]);

  // Iconos SVG tipo Pin Teardrop elegante (con punta hacia la coordenada exacta)
  const createCategoryIcon = (category: string, isSelected: boolean) => {
    const colors: Record<string, { bg: string; border: string; accent: string; label: string }> = {
      CABECERA_MUNICIPAL: { bg: '#1B3B2B', border: '#2E5A44', accent: '#4ADE80', label: 'Municipio' },
      ATRACTIVO_TURISTICO: { bg: '#B45309', border: '#D97706', accent: '#FDE047', label: 'Turismo' },
      FINCA_HOTEL: { bg: '#523620', border: '#784E2D', accent: '#FDBA74', label: 'Finca Hotel' },
      CENTRO_ACOPIO: { bg: '#991B1B', border: '#DC2626', accent: '#FCA5A5', label: 'Acopio' },
    };

    const cfg = colors[category] || { bg: '#2C1D11', border: '#523620', accent: '#EBE5DC', label: 'Lugar' };
    const width = isSelected ? 34 : 26;
    const height = isSelected ? 44 : 34;

    const svgHtml = `
      <div style="
        width: ${width}px;
        height: ${height}px;
        position: relative;
        filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.45));
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        ${isSelected ? 'transform: scale(1.15);' : ''}
      ">
        <svg viewBox="0 0 24 32" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <!-- Pin Teardrop con punta inferior exacta -->
          <path d="M12 0C5.373 0 0 5.373 0 12c0 8.5 12 20 12 20s12-11.5 12-20c0-6.627-5.373-12-12-12z" 
                fill="${cfg.bg}" 
                stroke="${isSelected ? '#FFFFFF' : cfg.border}" 
                stroke-width="${isSelected ? '2.5' : '1.5'}"/>
          <!-- Círculo interior elegante -->
          <circle cx="12" cy="11.5" r="5" fill="#FFFFFF"/>
          <circle cx="12" cy="11.5" r="3" fill="${cfg.border}"/>
        </svg>
      </div>
    `;

    return L.divIcon({
      html: svgHtml,
      className: 'custom-teardrop-pin',
      iconSize: [width, height],
      iconAnchor: [width / 2, height], // La punta inferior apunta al punto geográfico real
      popupAnchor: [0, -height - 2],
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

      // Tooltip informativo al pasar el cursor para saber de inmediato qué lugar es
      marker.bindTooltip(place.name, {
        direction: 'top',
        offset: [0, -36],
        className: 'font-sans font-semibold text-xs',
      });

      const popupHtml = `
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 210px;">
          <h4 style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 1rem; color: #1c1917; margin-bottom: 2px;">
            ${place.name}
          </h4>
          <p style="font-size: 0.72rem; color: #78350f; margin-bottom: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
            ${place.municipality} • ${place.category.replace('_', ' ')}
          </p>
          <div style="font-size: 0.75rem; color: #44403c; border-top: 1px solid #e7e5e4; padding-top: 6px; line-height: 1.5;">
            <div><strong>Coordenadas:</strong> ${place.latitude.toFixed(5)}, ${place.longitude.toFixed(5)}</div>
            ${place.visitDurationMinutes > 0 ? `<div><strong>Duración visita:</strong> ${place.visitDurationMinutes} min (${(place.visitDurationMinutes / 60).toFixed(1)} h)</div>` : ''}
            ${place.distanceToNodeMeters ? `<div><strong>Distancia a nodo vial:</strong> ${place.distanceToNodeMeters} m</div>` : ''}
            ${place.isExceeding500m ? `<div style="color: #b91c1c; font-weight: 600; margin-top: 4px;">⚠️ Excede 500 m: Acceso virtual rural</div>` : ''}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: 'custom-card-popup',
      });

      if (isSelected) {
        marker.openPopup();
      }

      marker.on('click', () => {
        if (onPlaceSelect) onPlaceSelect(place);
      });

      markersLayerRef.current?.addLayer(marker);
    });

    // Encuadre automático de la vista del mapa según los lugares mostrados
    if (places.length > 0 && !selectedPlaceId) {
      const bounds = L.latLngBounds(places.map((p) => [p.latitude, p.longitude]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [places, selectedPlaceId]);

  // Si se selecciona un lugar en particular, centrar la cámara suavemente sobre él
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedPlaceId) return;
    const target = places.find((p) => p.id === selectedPlaceId);
    if (target) {
      mapInstanceRef.current.flyTo([target.latitude, target.longitude], 14, { duration: 0.8 });
    }
  }, [selectedPlaceId]);

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
        color: '#EA580C', // Naranja Terracota brillante de alto contraste
        weight: 5.5,
        opacity: 0.95,
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
        color: '#10B981', // Verde esmeralda visible sobre cualquier fondo
        weight: 3.5,
        dashArray: '8, 8',
        fillColor: '#10B981',
        fillOpacity: 0.22,
      }).addTo(mapInstanceRef.current);

      hullLayerRef.current = polygon;
      mapInstanceRef.current.fitBounds(polygon.getBounds(), { padding: [30, 30] });
    }
  }, [convexHullPolygon]);

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-cafe-200 shadow-md ${className}`}>
      {/* Contenedor del Mapa Leaflet */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Selector de Estilo de Mapa Flotante en la esquina superior derecha */}
      <div className="absolute top-4 right-4 z-[1000] flex items-center bg-white/95 backdrop-blur-md rounded-2xl p-1 shadow-lg border border-cafe-200">
        <button
          type="button"
          onClick={() => setActiveStyle('satellite')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeStyle === 'satellite'
              ? 'bg-cafe-900 text-white shadow-sm'
              : 'text-cafe-700 hover:text-cafe-950 hover:bg-cafe-100'
          }`}
          title="Fotografía satelital real de las montañas y cafetales con nombres de vías"
        >
          <span>🛰️</span>
          <span className="hidden sm:inline">Satélite HD</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStyle('gray')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeStyle === 'gray'
              ? 'bg-cafe-900 text-white shadow-sm'
              : 'text-cafe-700 hover:text-cafe-950 hover:bg-cafe-100'
          }`}
          title="Diseño ultra-limpio en escala de grises estilo dashboard (sin distracciones)"
        >
          <span>🏙️</span>
          <span className="hidden sm:inline">Minimalista</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStyle('topo')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeStyle === 'topo'
              ? 'bg-cafe-900 text-white shadow-sm'
              : 'text-cafe-700 hover:text-cafe-950 hover:bg-cafe-100'
          }`}
          title="Relieve topográfico con curvas de nivel de la cordillera"
        >
          <span>⛰️</span>
          <span className="hidden sm:inline">Relieve Topo</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStyle('streets')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeStyle === 'streets'
              ? 'bg-cafe-900 text-white shadow-sm'
              : 'text-cafe-700 hover:text-cafe-950 hover:bg-cafe-100'
          }`}
          title="Mapa callejero tradicional"
        >
          <span>🗺️</span>
          <span className="hidden sm:inline">Vial</span>
        </button>
      </div>

      {/* Mini Leyenda Flotante en la esquina inferior derecha */}
      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-cafe-200 shadow-lg z-[1000] text-[11px] font-sans space-y-1.5 hidden sm:block">
        <div className="font-bold text-cafe-900 border-b border-cafe-100 pb-1">
          Convenciones del Quindío
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#1B3B2B] ring-2 ring-[#2E5A44]/40" />
          <span className="text-cafe-800 font-medium">Cabecera Municipal (12)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#B45309] ring-2 ring-[#D97706]/40" />
          <span className="text-cafe-800 font-medium">Atractivo Turístico (15+)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#523620] ring-2 ring-[#784E2D]/40" />
          <span className="text-cafe-800 font-medium">Finca Hotel / Alojamiento (8)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#991B1B] ring-2 ring-[#DC2626]/40" />
          <span className="text-cafe-800 font-medium">Centro de Acopio Cafetero (7)</span>
        </div>
      </div>
    </div>
  );
};
