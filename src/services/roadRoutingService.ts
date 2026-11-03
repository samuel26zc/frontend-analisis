import { Coordinate } from '../types';

interface OsrmRouteResponse {
  code: string;
  routes?: Array<{
    geometry: {
      coordinates: Array<[number, number]>; // [longitude, latitude]
      type: string;
    };
    distance: number; // meters
    duration: number; // seconds
  }>;
}

// Cache en memoria para respuestas de rutas ya calculadas (evita llamadas repetidas)
const routeCache = new Map<string, {
  polyline: Coordinate[];
  roadDistanceMeters: number;
  roadDurationSeconds: number;
}>();

/**
 * Consulta el servicio público de ruteo vehicular de OpenStreetMap (OSRM)
 * para obtener la geometría vial continua y exacta que discurre estrictamente
 * sobre la malla vial terrestre (autopistas, vías secundarias, calles urbanas)
 * sin atravesar predios privados, casas ni barrancos.
 */
export async function getRealRoadRoute(
  waypoints: Coordinate[]
): Promise<{
  polyline: Coordinate[];
  roadDistanceMeters: number;
  roadDurationSeconds: number;
} | null> {
  if (!waypoints || waypoints.length < 2) {
    return null;
  }

  const origin = waypoints[0];
  const dest = waypoints[waypoints.length - 1];
  const cacheKey = `${origin.latitude.toFixed(5)},${origin.longitude.toFixed(5)}->${dest.latitude.toFixed(5)},${dest.longitude.toFixed(5)}`;

  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)!;
  }

  try {
    // Si la ruta contiene nodos intermedios del camino mínimo de Dijkstra,
    // seleccionamos hasta 4 puntos de paso representativos para guiar el trazado
    const sampledWaypoints: Coordinate[] = [origin];

    if (waypoints.length > 2) {
      const intermediates = waypoints.slice(1, -1);
      const step = Math.max(1, Math.floor(intermediates.length / 3));
      for (let i = 0; i < intermediates.length; i += step) {
        sampledWaypoints.push(intermediates[i]);
      }
    }
    sampledWaypoints.push(dest);

    const coordsParam = sampledWaypoints
      .map((c) => `${c.longitude.toFixed(5)},${c.latitude.toFixed(5)}`)
      .join(';');

    const url = `https://router.project-osrm.org/route/v1/driving/${coordsParam}?overview=full&geometries=geojson`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data: OsrmRouteResponse = await response.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const bestRoute = data.routes[0];
        const roadCoordinates: Coordinate[] = bestRoute.geometry.coordinates.map(
          ([lon, lat]) => ({
            latitude: lat,
            longitude: lon,
          })
        );

        const result = {
          polyline: roadCoordinates,
          roadDistanceMeters: Math.round(bestRoute.distance),
          roadDurationSeconds: Math.round(bestRoute.duration),
        };

        routeCache.set(cacheKey, result);
        return result;
      }
    }
  } catch (error) {
    console.warn('Fallo al consultar geometría vial OSRM (usando fallback topológico):', error);
  }

  // Si la consulta con waypoints falla, intentamos una consulta directa origen -> destino
  try {
    const directUrl = `https://router.project-osrm.org/route/v1/driving/${origin.longitude.toFixed(5)},${origin.latitude.toFixed(5)};${dest.longitude.toFixed(5)},${dest.latitude.toFixed(5)}?overview=full&geometries=geojson`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const directResponse = await fetch(directUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (directResponse.ok) {
      const directData: OsrmRouteResponse = await directResponse.json();
      if (directData.code === 'Ok' && directData.routes && directData.routes.length > 0) {
        const route = directData.routes[0];
        const roadCoords: Coordinate[] = route.geometry.coordinates.map(
          ([lon, lat]) => ({ latitude: lat, longitude: lon })
        );
        const result = {
          polyline: roadCoords,
          roadDistanceMeters: Math.round(route.distance),
          roadDurationSeconds: Math.round(route.duration),
        };
        routeCache.set(cacheKey, result);
        return result;
      }
    }
  } catch (err) {
    console.warn('Fallback directo OSRM no disponible:', err);
  }

  return null;
}

/**
 * Traza un tour completo (circuito de itinerario o TSP) sobre las vías terrestres reales
 * resolviendo la geometría vial entre cada par consecutivo de paradas.
 */
export async function getTourRealRoadRoute(
  tourWaypoints: Coordinate[]
): Promise<Coordinate[]> {
  if (!tourWaypoints || tourWaypoints.length < 2) {
    return tourWaypoints || [];
  }

  const completeTourPolyline: Coordinate[] = [];

  for (let i = 0; i < tourWaypoints.length - 1; i++) {
    const from = tourWaypoints[i];
    const to = tourWaypoints[i + 1];
    const legRoute = await getRealRoadRoute([from, to]);

    if (legRoute && legRoute.polyline.length > 0) {
      // Evitar duplicar el punto de unión
      if (completeTourPolyline.length > 0) {
        completeTourPolyline.push(...legRoute.polyline.slice(1));
      } else {
        completeTourPolyline.push(...legRoute.polyline);
      }
    } else {
      if (completeTourPolyline.length === 0) {
        completeTourPolyline.push(from);
      }
      completeTourPolyline.push(to);
    }
  }

  return completeTourPolyline;
}
