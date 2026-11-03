import {
  AllExperiments,
  ApiResponse,
  CompareDijkstraResult,
  CompareTspResult,
  ConvexHullBenchmarkResult,
  ConvexHullResult,
  Coordinate,
  DayItineraryResult,
  DijkstraVersion,
  MemoryEstimation,
  NetworkStats,
  Place,
  PlaceCategory,
  PlaceMappingReport,
  SccReport,
  ShortestPathResult,
  SystemInfo,
  TimeMatrixData,
  TspAlgorithm,
  TspResult,
} from '../types';

const API_BASE_URL = 'http://localhost:8080/api/v1';

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let errorMsg = `Error en el servidor (${response.status})`;
    try {
      const errData = await response.json();
      if (errData.message) errorMsg = errData.message;
    } catch {
      // Usar mensaje por defecto
    }
    throw new Error(errorMsg);
  }

  const json: ApiResponse<T> = await response.json();
  return json.data;
}

// 🗺️ Módulo 1: Catálogo de Lugares
export const placesApi = {
  getAll: (category?: PlaceCategory, municipality?: string) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (municipality) params.append('municipality', municipality);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchJson<Place[]>(`/places${query}`);
  },
  getById: (id: string) => fetchJson<Place>(`/places/${id}`),
  getMapping: () => fetchJson<PlaceMappingReport>('/places/mapping'),
  getMunicipalities: () => fetchJson<string[]>('/places/municipalities'),
  getCategories: () => fetchJson<PlaceCategory[]>('/places/categories'),
};

// 🌐 Módulo 2: Red Vial y Tarjan SCC
export const networkApi = {
  getStats: () => fetchJson<NetworkStats>('/network/stats'),
  getMemoryEstimation: () => fetchJson<MemoryEstimation>('/network/memory-estimation'),
  getScc: () => fetchJson<SccReport>('/network/scc'),
  getNodes: () => fetchJson<Array<{ id: number; latitude: number; longitude: number; utmX: number; utmY: number }>>('/network/nodes'),
};

// ⚡ Módulo 3: Caminos Mínimos y Matriz de Tiempos
export const routesApi = {
  computeShortestPath: (originPlaceId: string, destinationPlaceId: string, version: DijkstraVersion) =>
    fetchJson<ShortestPathResult>('/routes/shortest-path', {
      method: 'POST',
      body: JSON.stringify({ originPlaceId, destinationPlaceId, version }),
    }),
  compareDijkstra: (originPlaceId: string, destinationPlaceId: string) =>
    fetchJson<CompareDijkstraResult>('/routes/compare-dijkstra', {
      method: 'POST',
      body: JSON.stringify({ originPlaceId, destinationPlaceId }),
    }),
  getTimeMatrix: () => fetchJson<TimeMatrixData>('/routes/time-matrix'),
  getCsvDownloadUrl: () => `${API_BASE_URL}/routes/time-matrix/csv`,
};

// 📐 Módulo 4: Envolvente Convexa
export const convexHullApi = {
  getNetworkHull: () => fetchJson<ConvexHullResult>('/convex-hull/network'),
  computeCustom: (coordinates: Coordinate[]) =>
    fetchJson<ConvexHullResult>('/convex-hull/compute', {
      method: 'POST',
      body: JSON.stringify({ coordinates }),
    }),
  getBenchmark: (pointCounts?: number[], seed?: number) =>
    fetchJson<ConvexHullBenchmarkResult>('/convex-hull/benchmark', {
      method: 'POST',
      body: JSON.stringify({ pointCounts: pointCounts || [1000, 10000, 50000], seed: seed || 42 }),
    }),
};

// 🧮 Módulo 5: Problema del Viajante (ATSP) e Itinerario 11h
export const tspApi = {
  solve: (originPlaceId: string, targetPlaceIds: string[], algorithm: TspAlgorithm) =>
    fetchJson<TspResult>('/tsp/solve', {
      method: 'POST',
      body: JSON.stringify({ originPlaceId, targetPlaceIds, algorithm }),
    }),
  compareMethods: (originPlaceId: string, targetPlaceIds: string[]) =>
    fetchJson<CompareTspResult>('/tsp/compare-methods', {
      method: 'POST',
      body: JSON.stringify({ originPlaceId, targetPlaceIds }),
    }),
  planDayItinerary: (originPlaceId: string, attractionIds: string[]) =>
    fetchJson<DayItineraryResult>('/tsp/day-itinerary', {
      method: 'POST',
      body: JSON.stringify({ originPlaceId, attractionIds }),
    }),
};

// 📊 Módulo 6: Experimentos y Ficha Técnica
export const experimentsApi = {
  getAll: () => fetchJson<AllExperiments>('/experiments/all'),
  getSystemInfo: () => fetchJson<SystemInfo>('/experiments/system-info'),
};
