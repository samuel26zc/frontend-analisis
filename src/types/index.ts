export type PlaceCategory =
  | 'CABECERA_MUNICIPAL'
  | 'ATRACTIVO_TURISTICO'
  | 'FINCA_HOTEL'
  | 'CENTRO_ACOPIO';

export type DijkstraVersion = 'LINEAL' | 'COLA_PRIORIDAD';

export type TspAlgorithm = 'HELD_KARP' | 'FUERZA_BRUTA' | 'VORAZ';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface Place {
  id: string;
  name: string;
  municipality: string;
  category: PlaceCategory;
  latitude: number;
  longitude: number;
  utmX: number;
  utmY: number;
  visitDurationMinutes: number;
  nearestNodeId?: number;
  distanceToNodeMeters?: number;
  isExceeding500m?: boolean;
  treatmentNote?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlaceMappingDetail {
  placeId: string;
  placeName: string;
  municipality: string;
  category: PlaceCategory;
  nearestNodeId: number;
  distanceMeters: number;
  isExceeding500m: boolean;
  treatment: string;
}

export interface PlaceMappingReport {
  totalPlaces: number;
  exceeding500mCount: number;
  generalTreatmentStrategy: string;
  details: PlaceMappingDetail[];
}

export interface NetworkStats {
  totalNodes: number;
  totalEdges: number;
  sccNodes: number;
  sccEdges: number;
  totalPlaces: number;
  downloadSource: string;
  networkType: string;
  coordinateSystem: string;
  speedTreatmentNote: string;
}

export interface MemoryEstimation {
  nodeCount: number;
  edgeCount: number;
  matrixMegabytes: number;
  matrixAssumptions: string;
  listMegabytes: number;
  listAssumptions: string;
  ratioMatrixToList: number;
  justification: string;
}

export interface SccReport {
  totalNodesBefore: number;
  totalEdgesBefore: number;
  sccNodesCount: number;
  sccEdgesCount: number;
  retentionPercentageNodes: number;
  retentionPercentageEdges: number;
  executionTimeMs: number;
  totalComponents: number;
  algorithmName: string;
  complexity: string;
  justification: string;
}

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface ShortestPathResult {
  originPlaceId: string;
  originPlaceName: string;
  destinationPlaceId: string;
  destinationPlaceName: string;
  originNodeId: number;
  destinationNodeId: number;
  travelTimeSeconds: number;
  travelTimeMinutes: number;
  distanceMeters: number;
  distanceKilometers: number;
  exploredNodesCount: number;
  executionTimeMs: number;
  version: DijkstraVersion;
  nodePath: number[];
  polyline: Coordinate[];
  invariant: string;
}

export interface CompareDijkstraResult {
  originPlaceId: string;
  originPlaceName: string;
  destinationPlaceId: string;
  destinationPlaceName: string;
  travelTimeSeconds: number;
  distanceMeters: number;
  linearExploredNodes: number;
  linearExecutionTimeMs: number;
  pqExploredNodes: number;
  pqExecutionTimeMs: number;
  ratioLinearToPq: number;
  sameTravelTimeVerified: boolean;
  invariantStatement: string;
}

export interface TimeMatrixData {
  size: number;
  placeIds: string[];
  placeNames: string[];
  asymmetricVerified: boolean;
  description: string;
  matrixSeconds: Record<string, Record<string, number>>;
}

export interface ConvexHullResult {
  inputPointsCount: number;
  hullVerticesCount: number;
  polygonCoordinates: Coordinate[];
  perimeterMeters: number;
  perimeterKilometers: number;
  areaSquareMeters: number;
  areaSquareKilometers: number;
  executionTimeMs: number;
  algorithmName: string;
  complexity: string;
}

export interface BenchmarkRow {
  pointSet: string;
  n: number;
  hullVertices: number;
  ownTimeMs: number;
  referenceTimeMs: number;
  ratio: number;
}

export interface ConvexHullBenchmarkResult {
  seed: number;
  note: string;
  rows: BenchmarkRow[];
}

export interface TspResult {
  originPlaceId: string;
  originPlaceName: string;
  k: number;
  visitedPlaceIds: string[];
  fullTourPlaceIds: string[];
  fullTourPlaceNames: string[];
  totalTravelTimeSeconds: number;
  totalTravelTimeMinutes: number;
  totalTravelTimeHours: number;
  executionTimeMs: number;
  algorithm: string;
  memoryEstimationMb: number;
  timeoutExceeded: boolean;
  recurrenceFormula: string;
  theoreticalJustification: string;
}

export interface CompareTspResult {
  originPlaceId: string;
  k: number;
  targetPlaceIds: string[];
  bruteForceTimeSeconds: number;
  bruteForceExecutionTimeMs: number;
  bruteForceTimeout: boolean;
  heldKarpTimeSeconds: number;
  heldKarpExecutionTimeMs: number;
  heldKarpMemoryMb: number;
  optimalTour: string[];
  greedyTimeSeconds: number;
  greedyExecutionTimeMs: number;
  greedyTour: string[];
  gapGreedyPercent: number;
  exactMatches: boolean;
  analysisNote: string;
}

export interface ItineraryStop {
  order: string;
  placeId: string;
  placeName: string;
  travelFromPreviousMinutes: number;
  visitDurationMinutes: number;
  accumulatedTimeHours: number;
}

export interface DayItineraryResult {
  originPlaceId: string;
  originPlaceName: string;
  initialAttractionsCount: number;
  finalAttractionsCount: number;
  totalTravelMinutes: number;
  totalVisitMinutes: number;
  totalDurationMinutes: number;
  totalDurationHours: number;
  maxAllowedHours: number;
  fitsIn11Hours: boolean;
  prunedAttractions: string[];
  pruningJustifications: string[];
  recalculatedWithHeldKarp: boolean;
  heldKarpTotalMinutes?: number;
  greedyTotalMinutes?: number;
  differenceMinutes?: number;
  heldKarpTravelMinutes?: number;
  greedyTravelMinutes?: number;
  greedyTourNames?: string[];
  stops: ItineraryStop[];
}

export interface SystemInfo {
  processor: string;
  availableProcessors: number;
  totalMemoryRam: string;
  maxMemoryJvm: string;
  operatingSystem: string;
  osVersion: string;
  osArch: string;
  javaVersion: string;
  javaVendor: string;
  experimentProtocol: string;
}

export interface AllExperiments {
  systemInfo: SystemInfo;
  r1SccTimes: Array<{ red: string; v: number; e: number; vPlusE: number; tiempoMs: number }>;
  r2DijkstraQueries: Array<{ origen: string; destino: string; version: string; tiempoViajeS: number; nodosExplorados: number; tiempoMs: number }>;
  r2RatioSummary: { minimo: number; mediana: number; maximo: number };
  r3ConvexHullBenchmarks: BenchmarkRow[];
  r4ExactTspTimes: Array<{ k: number; tiempoFuerzaBrutaMs: string; tiempoHeldKarpMs: number }>;
  r4HeuristicQuality: Array<{ k: number; instancias: number; brechaPromedioPorcentaje: number; brechaMaximaPorcentaje: number }>;
  r4SampleItinerary: DayItineraryResult;
}
