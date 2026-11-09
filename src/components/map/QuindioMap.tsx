import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Crosshair, Info, Maximize2, Minimize2 } from 'lucide-react';
import { Coordinate, Place } from '../../types';

export type MapTileStyle = 'satellite' | 'gray' | 'topo' | 'streets';

interface QuindioMapProps {
  places?: Place[];
  routePolyline?: Coordinate[];
  convexHullPolygon?: Coordinate[];
  selectedPlaceId?: string | null;
  destinationPlaceId?: string | null;
  orderedStopIds?: string[];
  onPlaceSelect?: (place: Place) => void;
  className?: string;
  defaultTileStyle?: MapTileStyle;
}

export const QuindioMap: React.FC<QuindioMapProps> = ({
  places = [],
  routePolyline = [],
  convexHullPolygon = [],
  selectedPlaceId,
  destinationPlaceId,
  orderedStopIds = [],
  onPlaceSelect,
  className = 'h-[500px]',
  defaultTileStyle = 'satellite',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const currentBaseLayerRef = useRef<L.LayerGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Layer | null>(null);
  const hullLayerRef = useRef<L.Polygon | null>(null);

  const [activeStyle, setActiveStyle] = useState<MapTileStyle>(defaultTileStyle);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showLegendMobile, setShowLegendMobile] = useState<boolean>(false);

  // Generador de capas base según el estilo seleccionado
  const createBaseLayer = (style: MapTileStyle): L.LayerGroup => {
    switch (style) {
      case 'satellite': {
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

    // Centro en la Plaza de Bolívar de Armenia, Quindío
    const map = L.map(mapContainerRef.current, {
      center: [4.53252, -75.67304],
      zoom: 11,
      minZoom: 9,
      maxZoom: 18,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomleft' }).addTo(map);

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

  // Recalcular tamaño del contenedor al alternar pantalla completa
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [isFullscreen]);

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

  // Función para re-encuadrar la vista en la ruta, polígono o catálogo completo
  const handleResetBounds = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routePolyline && routePolyline.length > 1) {
      const bounds = L.latLngBounds(routePolyline.map((c) => [c.latitude, c.longitude]));
      map.fitBounds(bounds, { padding: [45, 45] });
    } else if (convexHullPolygon && convexHullPolygon.length > 2) {
      const bounds = L.latLngBounds(convexHullPolygon.map((c) => [c.latitude, c.longitude]));
      map.fitBounds(bounds, { padding: [35, 35] });
    } else if (places.length > 0) {
      const bounds = L.latLngBounds(places.map((p) => [p.latitude, p.longitude]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    } else {
      map.setView([4.53252, -75.67304], 11);
    }
  };

  // Iconos SVG tipo Pin Teardrop con soporte para numeración de paradas y resaltado de Origen/Destino
  const createCategoryIcon = (
    category: string,
    isSelected: boolean,
    isDestination: boolean,
    stopIndex: number
  ) => {
    const colors: Record<string, { bg: string; border: string; label: string }> = {
      CABECERA_MUNICIPAL: { bg: '#1B3B2B', border: '#2E5A44', label: 'Cabecera Municipal' },
      ATRACTIVO_TURISTICO: { bg: '#B45309', border: '#D97706', label: 'Atractivo Turístico' },
      FINCA_HOTEL: { bg: '#523620', border: '#784E2D', label: 'Finca / Hotel Rural' },
      CENTRO_ACOPIO: { bg: '#991B1B', border: '#DC2626', label: 'Centro de Acopio' },
    };

    const cfg = colors[category] || { bg: '#2C1D11', border: '#523620', label: 'Lugar' };
    const isHighlighted = isSelected || isDestination || stopIndex >= 0;
    const width = isHighlighted ? 34 : 26;
    const height = isHighlighted ? 44 : 34;

    const fillBg = isSelected ? '#15803D' : isDestination ? '#C05638' : cfg.bg;
    const strokeColor = isSelected || isDestination ? '#FFFFFF' : cfg.border;

    const innerContent =
      stopIndex >= 0
        ? `<circle cx="12" cy="11.5" r="6.5" fill="#FFFFFF"/>
           <text x="12" y="14.5" text-anchor="middle" fill="#1F140E" font-size="8.5" font-family="JetBrains Mono, monospace" font-weight="800">${stopIndex}</text>`
        : `<circle cx="12" cy="11.5" r="5" fill="#FFFFFF"/>
           <circle cx="12" cy="11.5" r="3" fill="${fillBg}"/>`;

    const svgHtml = `
      <div style="
        width: ${width}px;
        height: ${height}px;
        position: relative;
        filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.48));
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        ${isSelected || isDestination ? 'transform: scale(1.12);' : ''}
      ">
        <svg viewBox="0 0 24 32" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0C5.373 0 0 5.373 0 12c0 8.5 12 20 12 20s12-11.5 12-20c0-6.627-5.373-12-12-12z" 
                fill="${fillBg}" 
                stroke="${strokeColor}" 
                stroke-width="${isSelected || isDestination ? '2.5' : '1.5'}"/>
          ${innerContent}
        </svg>
      </div>
    `;

    return L.divIcon({
      html: svgHtml,
      className: 'custom-teardrop-pin',
      iconSize: [width, height],
      iconAnchor: [width / 2, height],
      popupAnchor: [0, -height - 2],
    });
  };

  // Actualizar marcadores de lugares
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    places.forEach((place) => {
      const isSelected = place.id === selectedPlaceId;
      const isDestination = place.id === destinationPlaceId;
      const stopIdx = orderedStopIds.indexOf(place.id);

      const marker = L.marker([place.latitude, place.longitude], {
        icon: createCategoryIcon(place.category, isSelected, isDestination, stopIdx),
        zIndexOffset: isSelected || isDestination ? 1000 : stopIdx >= 0 ? 500 : 0,
      });

      const stopPrefix = stopIdx >= 0 ? `[Parada #${stopIdx}] ` : '';
      marker.bindTooltip(`${stopPrefix}${place.name} (${place.municipality})`, {
        direction: 'top',
        offset: [0, -36],
      });

      const categoryLabel =
        place.category === 'CABECERA_MUNICIPAL'
          ? 'Cabecera Municipal'
          : place.category === 'ATRACTIVO_TURISTICO'
          ? 'Atractivo Turístico'
          : place.category === 'FINCA_HOTEL'
          ? 'Finca / Hotel Rural'
          : 'Centro de Acopio Cafetero';

      const popupHtml = `
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 230px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 3px;">
            <span style="font-size: 0.68rem; color: #92400e; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
              ${place.municipality} • ${categoryLabel}
            </span>
          </div>
          <h4 style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 1.02rem; color: #1F140E; margin-bottom: 6px;">
            ${place.name}
          </h4>
          <div style="font-size: 0.74rem; color: #44403c; border-top: 1px solid #E6D8C8; padding-top: 7px; line-height: 1.55;">
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 0.7rem;">
              <strong>WGS84:</strong> ${place.latitude.toFixed(5)}°N, ${place.longitude.toFixed(5)}°W
            </div>
            ${
              place.utmX && place.utmY
                ? `<div style="font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: #57534e;">
                    <strong>UTM 18N:</strong> X=${Math.round(place.utmX).toLocaleString()}m, Y=${Math.round(place.utmY).toLocaleString()}m
                  </div>`
                : ''
            }
            ${
              place.visitDurationMinutes > 0
                ? `<div style="margin-top: 3px;"><strong>Permanencia estimada:</strong> ${place.visitDurationMinutes} min (${(
                    place.visitDurationMinutes / 60
                  ).toFixed(1)} h)</div>`
                : ''
            }
            ${
              place.distanceToNodeMeters !== undefined
                ? `<div><strong>Nodo vial #${place.nearestNodeId ?? '—'}:</strong> a ${place.distanceToNodeMeters} m</div>`
                : ''
            }
            ${
              place.isExceeding500m
                ? `<div style="color: #9A3E26; background: #FDF5F3; border: 1px solid #F8D0C4; border-radius: 6px; padding: 3px 6px; font-weight: 600; margin-top: 5px; font-size: 0.68rem;">
                    ⚠️ &gt; 500 m: Proyección ortogonal rural (R1.4)
                  </div>`
                : ''
            }
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: 'custom-card-popup',
      });

      if (isSelected && routePolyline.length === 0) {
        marker.openPopup();
      }

      marker.on('click', () => {
        if (onPlaceSelect) onPlaceSelect(place);
      });

      markersLayerRef.current?.addLayer(marker);
    });

    if (places.length > 0 && !selectedPlaceId && routePolyline.length === 0 && convexHullPolygon.length === 0) {
      const bounds = L.latLngBounds(places.map((p) => [p.latitude, p.longitude]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [places, selectedPlaceId, destinationPlaceId, orderedStopIds]);

  // Centrar cámara suavemente si se selecciona un lugar en modo explorador
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedPlaceId || routePolyline.length > 0) return;
    const target = places.find((p) => p.id === selectedPlaceId);
    if (target) {
      mapInstanceRef.current.flyTo([target.latitude, target.longitude], 14, { duration: 0.75 });
    }
  }, [selectedPlaceId]);

  // Actualizar trazado vehicular sobre vías terrestres
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (routeLayerRef.current) {
      mapInstanceRef.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    if (routePolyline && routePolyline.length > 1) {
      const latlngs: L.LatLngExpression[] = routePolyline.map((c) => [c.latitude, c.longitude]);

      const halo = L.polyline(latlngs, {
        color: '#FFFFFF',
        weight: 8,
        opacity: 0.92,
        lineCap: 'round',
        lineJoin: 'round',
      });

      const routeLine = L.polyline(latlngs, {
        color: '#D97706',
        weight: 4.5,
        opacity: 0.98,
        lineCap: 'round',
        lineJoin: 'round',
      });

      const group = L.layerGroup([halo, routeLine]).addTo(mapInstanceRef.current);
      routeLayerRef.current = group;
      mapInstanceRef.current.fitBounds(routeLine.getBounds(), { padding: [45, 45] });
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
        color: '#10B981',
        weight: 3.5,
        dashArray: '8, 6',
        fillColor: '#10B981',
        fillOpacity: 0.2,
      }).addTo(mapInstanceRef.current);

      hullLayerRef.current = polygon;
      mapInstanceRef.current.fitBounds(polygon.getBounds(), { padding: [35, 35] });
    }
  }, [convexHullPolygon]);

  const containerClasses = isFullscreen
    ? 'fixed inset-3 sm:inset-6 z-[2000] rounded-3xl overflow-hidden border-2 border-cafe-800 shadow-2xl bg-cafe-950'
    : `relative w-full rounded-2xl overflow-hidden border border-cafe-200 shadow-md ${className}`;

  return (
    <>
      {isFullscreen && (
        <div
          onClick={() => setIsFullscreen(false)}
          className="fixed inset-0 bg-cafe-950/70 backdrop-blur-sm z-[1999]"
        />
      )}

      <div className={containerClasses}>
        {/* Contenedor del Mapa Leaflet */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Controles Superiores Izquierdos: Encuadrar y Pantalla Completa */}
        <div className="absolute top-3.5 left-3.5 z-[1000] flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleResetBounds}
            className="flex items-center gap-1.5 bg-white/95 hover:bg-white text-cafe-900 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md border border-cafe-200 transition-all active:scale-95"
            title="Re-encuadrar mapa para mostrar todos los puntos o la ruta activa"
          >
            <Crosshair className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Encuadrar</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center gap-1.5 bg-white/95 hover:bg-white text-cafe-900 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md border border-cafe-200 transition-all active:scale-95"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Expandir mapa a pantalla completa'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-terracota-600" />
                <span>Cerrar Vista</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-cordillera-700" />
                <span className="hidden md:inline">Expandir</span>
              </>
            )}
          </button>
        </div>

        {/* Selector de Estilo de Mapa Flotante en la esquina superior derecha */}
        <div className="absolute top-3.5 right-3.5 z-[1000] flex items-center bg-white/95 backdrop-blur-md rounded-xl p-1 shadow-md border border-cafe-200">
          <button
            type="button"
            onClick={() => setActiveStyle('satellite')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeStyle === 'satellite'
                ? 'bg-cafe-900 text-white shadow-sm'
                : 'text-cafe-700 hover:text-cafe-950 hover:bg-cafe-100'
            }`}
            title="Fotografía satelital de alta resolución con nombres de vías y municipios"
          >
            <span>🛰️</span>
            <span className="hidden sm:inline">Satélite</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStyle('streets')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeStyle === 'streets'
                ? 'bg-cafe-900 text-white shadow-sm'
                : 'text-cafe-700 hover:text-cafe-950 hover:bg-cafe-100'
            }`}
            title="Mapa callejero y de carreteras OpenStreetMap"
          >
            <span>🗺️</span>
            <span className="hidden sm:inline">Vial</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStyle('topo')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeStyle === 'topo'
                ? 'bg-cafe-900 text-white shadow-sm'
                : 'text-cafe-700 hover:text-cafe-950 hover:bg-cafe-100'
            }`}
            title="Relieve topográfico con curvas de nivel de la Cordillera Central"
          >
            <span>⛰️</span>
            <span className="hidden sm:inline">Relieve</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStyle('gray')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeStyle === 'gray'
                ? 'bg-cafe-900 text-white shadow-sm'
                : 'text-cafe-700 hover:text-cafe-950 hover:bg-cafe-100'
            }`}
            title="Lienzo minimalista ejecutivo para análisis de grafos"
          >
            <span>🏙️</span>
            <span className="hidden sm:inline">Minimalista</span>
          </button>
        </div>

        {/* Botón de Leyenda para Móvil */}
        <button
          type="button"
          onClick={() => setShowLegendMobile(!showLegendMobile)}
          className="sm:hidden absolute bottom-3.5 right-3.5 z-[1000] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cafe-200 shadow-md text-xs font-semibold text-cafe-900 flex items-center gap-1.5"
        >
          <Info className="w-3.5 h-3.5 text-amber-600" />
          <span>Convenciones</span>
        </button>

        {/* Leyenda Flotante en la esquina inferior derecha */}
        <div
          className={`absolute bottom-12 sm:bottom-3.5 right-3.5 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-cafe-200 shadow-lg z-[1000] text-[11px] font-sans space-y-1.5 ${
            showLegendMobile ? 'block' : 'hidden sm:block'
          }`}
        >
          <div className="font-bold text-cafe-900 border-b border-cafe-100 pb-1 flex items-center justify-between gap-4">
            <span>Convenciones del Quindío</span>
            <span className="text-[10px] font-mono text-cafe-500">{places.length} pts</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1B3B2B] ring-2 ring-[#2E5A44]/40 shrink-0" />
            <span className="text-cafe-800 font-medium">Cabecera Municipal (12)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B45309] ring-2 ring-[#D97706]/40 shrink-0" />
            <span className="text-cafe-800 font-medium">Atractivo Turístico (15)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#523620] ring-2 ring-[#784E2D]/40 shrink-0" />
            <span className="text-cafe-800 font-medium">Finca / Hotel Rural (8)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#991B1B] ring-2 ring-[#DC2626]/40 shrink-0" />
            <span className="text-cafe-800 font-medium">Centro de Acopio (7)</span>
          </div>
        </div>
      </div>
    </>
  );
};
