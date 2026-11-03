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
 * Consulta el motor de ruteo OpenStreetMap (OSRM) para encontrar el camino vehicular
 * estrictamente más corto y rápido entre origen y destino, discurriendo al 100%
 * sobre la red de carreteras y calles reales, coincidiendo con la precisión métrica
 * de sistemas como Google Maps / Waze.
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

  // 1. Consulta directa del camino vehicular óptimo global entre origen y destino
  // Esto garantiza que el motor encuentre la ruta verdaderamente más corta sin desvíos artificiales
  try {
    const directUrl = `https://router.project-osrm.org/route/v1/driving/${origin.longitude.toFixed(5)},${origin.latitude.toFixed(5)};${dest.longitude.toFixed(5)},${dest.latitude.toFixed(5)}?overview=full&geometries=geojson&steps=false`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const response = await fetch(directUrl, { signal: controller.signal });
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
    console.warn('Fallo en consulta directa OSRM, intentando con waypoints:', error);
  }

  // 2. Si falla la consulta directa, intentamos con waypoints intermedios
  try {
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
    const timeoutId = setTimeout(() => controller.abort(), 4000);

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
  } catch (err) {
    console.warn('Fallback con waypoints OSRM no disponible:', err);
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
