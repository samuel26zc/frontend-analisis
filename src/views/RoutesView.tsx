import React, { useState, useEffect, useCallback } from 'react';
import {
  Navigation,
  Clock,
  MapPin,
  ArrowRightLeft,
  Download,
  Zap,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Sparkles,
  Route,
} from 'lucide-react';
import {
  Place,
  DijkstraVersion,
  ShortestPathResult,
  CompareDijkstraResult,
  TimeMatrixData,
  Coordinate,
} from '../types';
import { placesApi, routesApi } from '../services/api';
import { getRealRoadRoute } from '../services/roadRoutingService';
import { MetricCard } from '../components/common/MetricCard';
import { Alert } from '../components/common/Alert';
import { QuindioMap } from '../components/map/QuindioMap';

export const RoutesView: React.FC = () => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [originId, setOriginId] = useState<string>('ARM_CAB');
  const [destinationId, setDestinationId] = useState<string>('PARQ_CAFE');
  const [version, setVersion] = useState<DijkstraVersion>('COLA_PRIORIDAD');
  const [compareMode, setCompareMode] = useState<boolean>(true);

  const [singleResult, setSingleResult] = useState<ShortestPathResult | null>(null);
  const [compareResult, setCompareResult] = useState<CompareDijkstraResult | null>(null);
  const [roadPolyline, setRoadPolyline] = useState<Coordinate[]>([]);
  const [isRoadSnapping, setIsRoadSnapping] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Estado de la Matriz 42×42
  const [matrixData, setMatrixData] = useState<TimeMatrixData | null>(null);
  const [loadingMatrix, setLoadingMatrix] = useState<boolean>(false);
  const [matrixSearch, setMatrixSearch] = useState<string>('');
  const [showAllMatrixRows, setShowAllMatrixRows] = useState<boolean>(false);
  const [inspectPair, setInspectPair] = useState<{ orig: string; dest: string }>({
    orig: 'ARM_CAB',
    dest: 'SAL_CAB',
  });

  const executeRouteCalculation = useCallback(
    async (orig: string, dest: string, isCompare: boolean, ver: DijkstraVersion) => {
      if (!orig || !dest || orig === dest) return;

      setLoading(true);
      setError(null);

      try {
        let resolvedSingle: ShortestPathResult;

        if (isCompare) {
          const [compRes, singleRes] = await Promise.all([
            routesApi.compareDijkstra(orig, dest),
            routesApi.computeShortestPath(orig, dest, 'COLA_PRIORIDAD'),
          ]);
          setCompareResult(compRes);
          setSingleResult(singleRes);
          resolvedSingle = singleRes;
        } else {
          const res = await routesApi.computeShortestPath(orig, dest, ver);
          setSingleResult(res);
          setCompareResult(null);
          resolvedSingle = res;
        }

        // Proyectar el trazado continuo sobre carreteras terrestres reales (OSRM / OpenStreetMap)
        setIsRoadSnapping(true);
        try {
          const roadRes = await getRealRoadRoute(resolvedSingle.polyline);
          if (roadRes && roadRes.polyline.length > 0) {
            setRoadPolyline(roadRes.polyline);
          } else {
            setRoadPolyline(resolvedSingle.polyline);
          }
        } catch {
          setRoadPolyline(resolvedSingle.polyline);
        } finally {
          setIsRoadSnapping(false);
        }
      } catch (err: any) {
        console.error('Error calculando ruta:', err);
        setError(err.message || 'Error al calcular el camino mínimo en el servidor.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const init = async () => {
      try {
        const data = await placesApi.getAll();
        setPlaces(data);
        if (data.length >= 2) {
          const defaultOrig = data.find((p) => p.id === 'ARM_CAB')?.id || data[0].id;
          const defaultDest = data.find((p) => p.id === 'PARQ_CAFE')?.id || data[1].id;
          setOriginId(defaultOrig);
          setDestinationId(defaultDest);
          setInspectPair({
            orig: defaultOrig,
            dest: data.find((p) => p.id === 'SAL_CAB')?.id || defaultDest,
          });
          await executeRouteCalculation(defaultOrig, defaultDest, true, 'COLA_PRIORIDAD');
        }
      } catch (err) {
        console.error('Error al cargar lugares:', err);
        setError(
          'No se pudo conectar con el servidor Backend (puerto 8080). Verifica que el servicio Spring Boot esté en ejecución.'
        );
      }
    };
    init();
  }, [executeRouteCalculation]);

  const handleSwap = () => {
    const newOrig = destinationId;
    const newDest = originId;
    setOriginId(newOrig);
    setDestinationId(newDest);
    executeRouteCalculation(newOrig, newDest, compareMode, version);
  };

  const handleCalculate = () => {
    if (!originId || !destinationId) {
      setError('Por favor selecciona un punto de origen y un punto de destino.');
      return;
    }
    if (originId === destinationId) {
      setError('El lugar de origen y el de destino deben ser distintos.');
      return;
    }
    executeRouteCalculation(originId, destinationId, compareMode, version);
  };

  const handleQuickRoute = (orig: string, dest: string) => {
    setOriginId(orig);
    setDestinationId(dest);
    executeRouteCalculation(orig, dest, compareMode, version);
  };

  const handleLoadMatrix = async () => {
    setLoadingMatrix(true);
    try {
      const data = await routesApi.getTimeMatrix();
      setMatrixData(data);
    } catch (err: any) {
      setError(err.message || 'Error al obtener la matriz asimétrica de tiempos.');
    } finally {
      setLoadingMatrix(false);
    }
  };

  const originPlace = places.find((p) => p.id === originId);
  const destPlace = places.find((p) => p.id === destinationId);

  const inspectOrigPlace = places.find((p) => p.id === inspectPair.orig);
  const inspectDestPlace = places.find((p) => p.id === inspectPair.dest);
  const timeAtoB = matrixData?.matrixSeconds[inspectPair.orig]?.[inspectPair.dest];
  const timeBtoA = matrixData?.matrixSeconds[inspectPair.dest]?.[inspectPair.orig];

  const quickRoutes = [
    { label: 'Armenia → Parque del Café', orig: 'ARM_CAB', dest: 'PARQ_CAFE' },
    { label: 'Armenia → Salento', orig: 'ARM_CAB', dest: 'SAL_CAB' },
    { label: 'Salento → Filandia', orig: 'SAL_CAB', dest: 'FIL_CAB' },
    { label: 'Quimbaya → PANACA', orig: 'QUI_CAB', dest: 'PANACA' },
    { label: 'Armenia → Valle de Cocora', orig: 'ARM_CAB', dest: 'VALLE_COCORA' },
    { label: 'Armenia → Génova', orig: 'ARM_CAB', dest: 'GEN_CAB' },
  ];

  const matrixRowLimit = showAllMatrixRows ? 42 : 15;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Encabezado Editorial del Módulo R2 */}
      <div className="bg-gradient-to-r from-cafe-950 via-cafe-900 to-cafe-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-cafe-800 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-72 h-72 bg-terracota-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cafe-800/90 text-amber-300 text-xs font-semibold uppercase tracking-wider border border-cafe-700">
            <Navigation className="w-3.5 h-3.5 text-amber-400" />
            Módulo R2 • Caminos Mínimos y Matriz Asimétrica Vial
          </div>
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-cafe-50 tracking-tight leading-tight">
            Algoritmo de Dijkstra & Matriz Asimétrica (42 × 42)
          </h1>
          <p className="text-cafe-200 text-sm sm:text-base leading-relaxed">
            Cálculo de rutas óptimas sobre la mayor componente fuertemente conexa (SCC) del Quindío,
            calibradas con distancias y tiempos viales reales. Contraste empírico entre la cola de prioridad{' '}
            <code className="text-amber-300 font-mono text-xs bg-cafe-800 px-1.5 py-0.5 rounded border border-cafe-700">
              O((V + E) log V)
            </code>{' '}
            y la búsqueda lineal{' '}
            <code className="text-amber-300 font-mono text-xs bg-cafe-800 px-1.5 py-0.5 rounded border border-cafe-700">
              O(V²)
            </code>
            , con verificación formal del invariante de relajación.
          </p>
        </div>
      </div>

      {/* Panel Planificador de Ruta */}
      <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-md border border-cafe-200/90 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-cafe-100 pb-4">
          <div>
            <h2 className="text-xl font-serif font-bold text-cafe-950 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-terracota-600" />
              <span>Planificador de Camino Mínimo entre Lugares</span>
            </h2>
            <p className="text-xs text-cafe-600 mt-0.5">
              Selecciona cualquier par de puntos del catálogo o prueba una ruta emblemática en un clic.
            </p>
          </div>

          {/* Rutas Rápidas Predefinidas */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cafe-500 mr-1">
              Rutas rápidas:
            </span>
            {quickRoutes.map((qr) => {
              const isCurrent = originId === qr.orig && destinationId === qr.dest;
              return (
                <button
                  key={`${qr.orig}-${qr.dest}`}
                  type="button"
                  onClick={() => handleQuickRoute(qr.orig, qr.dest)}
                  className={`text-xs px-2.5 py-1.5 rounded-xl font-semibold transition-all border ${
                    isCurrent
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-cafe-50 hover:bg-cafe-100 text-cafe-800 border-cafe-200'
                  }`}
                >
                  {qr.label}
                </button>
              );
            })}
          </div>
        </div>

        {error && <Alert type="error" title="Atención">{error}</Alert>}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Selector de Origen */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="block text-xs font-bold text-cordillera-800 uppercase tracking-wider">
              Punto de Origen (Salida A)
            </label>
            <select
              value={originId}
              onChange={(e) => setOriginId(e.target.value)}
              className="w-full bg-cafe-50 border border-cafe-300 rounded-xl px-4 py-3 text-sm text-cafe-950 font-semibold focus:ring-2 focus:ring-cordillera-500 focus:bg-white focus:outline-none transition-all"
            >
              {places.map((p) => (
                <option key={`orig-${p.id}`} value={p.id}>
                  {p.name} ({p.municipality})
                </option>
              ))}
            </select>
            {originPlace && (
              <p className="text-xs text-cafe-600 flex items-center justify-between px-1">
                <span>
                  Municipio: <strong className="text-cafe-900">{originPlace.municipality}</strong>
                </span>
                <span className="font-mono text-[11px] text-cafe-500">
                  Nodo vial #{originPlace.nearestNodeId ?? 'N/A'}
                </span>
              </p>
            )}
          </div>

          {/* Botón Intercambiar */}
          <div className="md:col-span-2 flex justify-center py-1 md:py-0">
            <button
              onClick={handleSwap}
              type="button"
              className="p-3 rounded-2xl bg-cafe-100 hover:bg-amber-100 text-cafe-800 hover:text-amber-900 transition-all shadow-sm border border-cafe-300 active:scale-95 group"
              title="Invertir sentido de la ruta ( comprobar asimetría A ↔ B )"
            >
              <ArrowRightLeft className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" />
            </button>
          </div>

          {/* Selector de Destino */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="block text-xs font-bold text-terracota-800 uppercase tracking-wider">
              Punto de Destino (Llegada B)
            </label>
            <select
              value={destinationId}
              onChange={(e) => setDestinationId(e.target.value)}
              className="w-full bg-cafe-50 border border-cafe-300 rounded-xl px-4 py-3 text-sm text-cafe-950 font-semibold focus:ring-2 focus:ring-terracota-500 focus:bg-white focus:outline-none transition-all"
            >
              {places.map((p) => (
                <option key={`dest-${p.id}`} value={p.id}>
                  {p.name} ({p.municipality})
                </option>
              ))}
            </select>
            {destPlace && (
              <p className="text-xs text-cafe-600 flex items-center justify-between px-1">
                <span>
                  Municipio: <strong className="text-cafe-900">{destPlace.municipality}</strong>
                </span>
                <span className="font-mono text-[11px] text-cafe-500">
                  Nodo vial #{destPlace.nearestNodeId ?? 'N/A'}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Barra de Opciones y Ejecución */}
        <div className="pt-4 border-t border-cafe-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <label className="inline-flex items-center gap-2.5 cursor-pointer text-xs sm:text-sm font-semibold text-cafe-800 select-none">
              <input
                type="checkbox"
                checked={compareMode}
                onChange={(e) => setCompareMode(e.target.checked)}
                className="w-4 h-4 rounded text-cordillera-600 focus:ring-cordillera-500 border-cafe-300"
              />
              <span>Contrastación simultánea: Min-Heap O((V + E) log V) vs Lineal O(V²)</span>
            </label>

            {!compareMode && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-cafe-600 font-semibold">Implementación:</span>
                <select
                  value={version}
                  onChange={(e) => setVersion(e.target.value as DijkstraVersion)}
                  className="bg-cafe-50 border border-cafe-300 rounded-xl px-3 py-1.5 text-xs text-cafe-900 font-semibold"
                >
                  <option value="COLA_PRIORIDAD">Cola de Prioridad (Min-Heap Binario)</option>
                  <option value="LINEAL">Búsqueda Lineal Exhaustiva O(V²)</option>
                </select>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleCalculate}
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-cordillera-700 hover:bg-cordillera-800 text-white font-semibold text-sm shadow-md transition-all disabled:opacity-50 active:scale-98"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Calculando Camino Mínimo...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Calcular Camino Mínimo</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Resultados del Cálculo */}
      {singleResult && (
        <div className="space-y-6">
          {/* Tarjetas KPI Principales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Tiempo Estimado de Viaje"
              value={`${singleResult.travelTimeMinutes.toFixed(1)} min`}
              subtitle={`${singleResult.travelTimeSeconds.toLocaleString()} s (${(
                singleResult.travelTimeSeconds / 3600
              ).toFixed(2)} h) en red calibrada`}
              icon={<Clock className="w-5 h-5" />}
              badge="Óptimo"
              variant="terracotta"
            />
            <MetricCard
              title="Distancia Vial Terrestre"
              value={`${singleResult.distanceKilometers.toFixed(2)} km`}
              subtitle={`${Math.round(singleResult.distanceMeters).toLocaleString()} metros sobre carretera`}
              icon={<Route className="w-5 h-5" />}
              badge="Calibrada"
              variant="emerald"
            />
            <MetricCard
              title="Vértices Explorados"
              value={`${singleResult.exploredNodesCount} nodos`}
              subtitle={`Recorrido de ${singleResult.nodePath.length} intersecciones viales`}
              icon={<Layers className="w-5 h-5" />}
              badge="SCC"
              variant="amber"
            />
            <MetricCard
              title="Tiempo de Cómputo CPU"
              value={`${singleResult.executionTimeMs.toFixed(2)} ms`}
              subtitle={
                singleResult.version === 'COLA_PRIORIDAD'
                  ? 'Min-Heap Binario O((V+E) log V)'
                  : 'Búsqueda Lineal O(V²)'
              }
              icon={<Zap className="w-5 h-5" />}
              variant="coffee"
            />
          </div>

          {/* Mapa Cartográfico con Trazado Terrestre */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-cafe-200/90 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-serif font-bold text-cafe-950 flex items-center gap-2">
                  <span>
                    Trayecto Vial: {singleResult.originPlaceName} → {singleResult.destinationPlaceName}
                  </span>
                </h3>
                <div className="text-xs text-cafe-600 mt-1">
                  {isRoadSnapping ? (
                    <span className="text-amber-800 font-semibold inline-flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600 shrink-0" />
                      Refinando geometría sobre ejes viales reales de OpenStreetMap...
                    </span>
                  ) : (
                    <span className="text-cordillera-800 font-semibold inline-flex items-center gap-1.5 bg-cordillera-50 px-2.5 py-1 rounded-lg border border-cordillera-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cordillera-600 shrink-0" />
                      Ruta vehicular calibrada ({roadPolyline.length || singleResult.polyline.length}{' '}
                      vértices geográficos sobre vía terrestre)
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                <span className="inline-flex items-center gap-1.5 bg-cordillera-50 text-cordillera-900 px-2.5 py-1 rounded-lg border border-cordillera-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  Origen: {singleResult.originPlaceName}
                </span>
                <span className="inline-flex items-center gap-1.5 bg-terracota-50 text-terracota-900 px-2.5 py-1 rounded-lg border border-terracota-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-terracota-600" />
                  Destino: {singleResult.destinationPlaceName}
                </span>
              </div>
            </div>

            <QuindioMap
              places={places}
              selectedPlaceId={originId}
              destinationPlaceId={destinationId}
              routePolyline={roadPolyline.length > 0 ? roadPolyline : singleResult.polyline}
              className="h-[460px] sm:h-[500px]"
            />
          </div>

          {/* Tarjeta Comparativa: Min-Heap vs Búsqueda Lineal */}
          {compareResult && (
            <div className="bg-white rounded-3xl p-6 lg:p-8 border border-cafe-200/90 shadow-md space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-cafe-100 pb-4">
                <div>
                  <h3 className="text-lg font-serif font-bold text-cafe-950">
                    Contrastación Experimental: Min-Heap Binario vs Búsqueda Lineal
                  </h3>
                  <p className="text-xs text-cafe-600 mt-0.5">
                    Ambas implementaciones resuelven la misma consulta y convergen al mismo costo óptimo.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-cordillera-50 text-cordillera-800 border border-cordillera-200 rounded-full text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-cordillera-600" />
                  Equivalencia de Costo Verificada ({(compareResult.travelTimeSeconds / 60).toFixed(1)} min /{' '}
                  {(compareResult.distanceMeters / 1000).toFixed(2)} km)
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Min-Heap */}
                <div className="bg-cordillera-50/50 rounded-2xl p-5 border border-cordillera-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cordillera-800 uppercase tracking-wider">
                      Cola de Prioridad (Min-Heap)
                    </span>
                    <span className="text-[11px] font-mono font-bold bg-cordillera-100 text-cordillera-900 px-2 py-0.5 rounded">
                      O((V + E) log V)
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-cordillera-950 font-mono">
                    {compareResult.pqExecutionTimeMs.toFixed(2)} ms
                  </div>
                  <p className="text-xs text-cordillera-800">
                    Vértices extraídos: <strong>{compareResult.pqExploredNodes}</strong>
                  </p>
                  <p className="text-[11px] text-cordillera-700 leading-relaxed">
                    Extrae el vértice frontera de menor distancia tentativa en tiempo logarítmico{' '}
                    <code className="font-mono">O(log V)</code>.
                  </p>
                </div>

                {/* Lineal */}
                <div className="bg-cafe-50 rounded-2xl p-5 border border-cafe-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cafe-800 uppercase tracking-wider">
                      Búsqueda Lineal Exhaustiva
                    </span>
                    <span className="text-[11px] font-mono font-bold bg-cafe-200 text-cafe-900 px-2 py-0.5 rounded">
                      O(V²)
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-cafe-950 font-mono">
                    {compareResult.linearExecutionTimeMs.toFixed(2)} ms
                  </div>
                  <p className="text-xs text-cafe-800">
                    Vértices explorados: <strong>{compareResult.linearExploredNodes}</strong>
                  </p>
                  <p className="text-[11px] text-cafe-600 leading-relaxed">
                    Recorre linealmente el conjunto de vértices no visitados en <code className="font-mono">O(V)</code>{' '}
                    en cada iteración del bucle principal.
                  </p>
                </div>

                {/* Factor de Aceleración e Invariante */}
                <div className="bg-amber-50/60 rounded-2xl p-5 border border-amber-200 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block mb-1">
                      Cociente de Desempeño (Lineal / Heap)
                    </span>
                    <div className="text-3xl font-bold text-amber-950 font-mono">
                      {compareResult.ratioLinearToPq.toFixed(2)}×
                    </div>
                    <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                      Invariante del bucle: al extraer un nodo <code className="font-mono">u</code> de la cola,{' '}
                      <code className="font-mono">d[u] = δ(s, u)</code> es definitivo gracias a que{' '}
                      <code className="font-mono">w(e) ≥ 0</code>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Declaración Formal del Invariante */}
              <div className="p-4 rounded-2xl bg-cafe-50 border border-cafe-200 text-xs text-cafe-800 leading-relaxed">
                <strong className="text-cafe-950">Invariante de Correctitud de Dijkstra:</strong>{' '}
                {compareResult.invariantStatement || singleResult.invariant}
              </div>
            </div>
          )}

          {/* Secuencia Topológica de Nodos Viales */}
          <div className="bg-white rounded-3xl p-6 border border-cafe-200/90 shadow-md space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-base font-serif font-bold text-cafe-950">
                Secuencia Topológica de Nodos en el Grafo Vial ({singleResult.nodePath.length} saltos)
              </h3>
              <span className="text-xs font-mono text-cafe-500">
                Nodo inicial #{singleResult.originNodeId} → Nodo final #{singleResult.destinationNodeId}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 p-4 bg-cafe-50 rounded-2xl border border-cafe-200 font-mono text-xs">
              {singleResult.nodePath.map((nodeId, idx) => (
                <React.Fragment key={`node-${nodeId}-${idx}`}>
                  <span
                    className={`px-2.5 py-1 rounded-lg font-bold ${
                      idx === 0
                        ? 'bg-cordillera-700 text-white shadow-xs'
                        : idx === singleResult.nodePath.length - 1
                        ? 'bg-terracota-600 text-white shadow-xs'
                        : 'bg-white text-cafe-900 border border-cafe-200'
                    }`}
                  >
                    #{nodeId}
                  </span>
                  {idx < singleResult.nodePath.length - 1 && (
                    <span className="text-cafe-400 font-sans font-bold">→</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sección de la Matriz Asimétrica 42 × 42 */}
      <div className="bg-white rounded-3xl p-6 lg:p-8 border border-cafe-200/90 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-cafe-100 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-terracota-700 uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5" />
              Preprocesamiento Multi-Origen (42 × 42 = 1,764 Pares)
            </div>
            <h2 className="text-xl font-serif font-bold text-cafe-950 mt-1">
              Matriz Asimétrica de Tiempos de Viaje
            </h2>
            <p className="text-xs text-cafe-600 mt-1 max-w-2xl leading-relaxed">
              Construida para alimentar el solucionador del Problema del Viajante Asimétrico (ATSP) en el Módulo R4,
              almacenando el tiempo vehicular exacto entre cada par ordenado de lugares del catálogo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={routesApi.getCsvDownloadUrl()}
              download="matriz_tiempos_42x42_quindio.csv"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cafe-900 hover:bg-cafe-800 text-white font-semibold text-xs transition-colors shadow-sm"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Exportar CSV (42 × 42)</span>
            </a>

            {!matrixData && (
              <button
                type="button"
                onClick={handleLoadMatrix}
                disabled={loadingMatrix}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cordillera-700 hover:bg-cordillera-800 text-white font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
              >
                {loadingMatrix ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Cargando matriz...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Explorar Matriz Interactiva</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Fundamentación de la Asimetría */}
        <div className="bg-cafe-50 rounded-2xl p-5 border border-cafe-200 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-cafe-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>¿Por qué el tiempo de viaje es asimétrico? — T(A, B) ≠ T(B, A)</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-cafe-700 leading-relaxed">
            <div className="p-3.5 bg-white rounded-xl border border-cafe-200/80">
              <span className="font-bold text-cafe-950 block mb-1">1. Pendiente Orográfica Andina:</span>
              El ascenso hacia municipios de cordillera (Salento, Filandia, Pijao, Génova) impone velocidades medias
              distintas respecto al sentido de descenso.
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-cafe-200/80">
              <span className="font-bold text-cafe-950 block mb-1">2. Sentidos Viales Dirigidos:</span>
              Los anillos urbanos de Armenia, Calarcá y Montenegro poseen pares viales de un solo sentido que modifican
              la longitud de entrada y salida.
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-cafe-200/80">
              <span className="font-bold text-cafe-950 block mb-1">3. Retornos en Doble Calzada:</span>
              En corredores como la Autopista del Café, los giros e incorporaciones requieren usar glorietas o retornos
              según el sentido de marcha.
            </div>
          </div>
        </div>

        {/* Inspector de Asimetría entre Pares */}
        <div className="bg-amber-50/50 rounded-2xl p-5 border border-amber-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h4 className="text-sm font-serif font-bold text-cafe-950">
              Verificador de Asimetría entre Pares (A ↔ B)
            </h4>
            {!matrixData && (
              <button
                type="button"
                onClick={handleLoadMatrix}
                className="text-xs font-semibold text-amber-800 underline hover:text-amber-950 self-start sm:self-auto"
              >
                Cargar datos de la matriz para inspeccionar tiempos
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-cafe-800 mb-1">Lugar A</label>
              <select
                value={inspectPair.orig}
                onChange={(e) => setInspectPair({ ...inspectPair, orig: e.target.value })}
                className="w-full bg-white border border-amber-300 rounded-xl px-3.5 py-2 text-xs font-semibold text-cafe-950"
              >
                {places.map((p) => (
                  <option key={`insp-a-${p.id}`} value={p.id}>
                    {p.name} ({p.municipality})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-cafe-800 mb-1">Lugar B</label>
              <select
                value={inspectPair.dest}
                onChange={(e) => setInspectPair({ ...inspectPair, dest: e.target.value })}
                className="w-full bg-white border border-amber-300 rounded-xl px-3.5 py-2 text-xs font-semibold text-cafe-950"
              >
                {places.map((p) => (
                  <option key={`insp-b-${p.id}`} value={p.id}>
                    {p.name} ({p.municipality})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {matrixData && timeAtoB !== undefined && timeBtoA !== undefined && (
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-xs">
                <span className="text-[10px] font-bold text-cafe-500 uppercase block truncate">
                  Ida: {inspectOrigPlace?.name ?? 'A'} → {inspectDestPlace?.name ?? 'B'}
                </span>
                <span className="text-lg font-bold text-cafe-950 font-mono mt-0.5 block">
                  {(timeAtoB / 60).toFixed(1)} min
                </span>
                <span className="text-[11px] font-mono text-cafe-500 block">({timeAtoB.toFixed(1)} s)</span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-xs">
                <span className="text-[10px] font-bold text-cafe-500 uppercase block truncate">
                  Regreso: {inspectDestPlace?.name ?? 'B'} → {inspectOrigPlace?.name ?? 'A'}
                </span>
                <span className="text-lg font-bold text-cafe-950 font-mono mt-0.5 block">
                  {(timeBtoA / 60).toFixed(1)} min
                </span>
                <span className="text-[11px] font-mono text-cafe-500 block">({timeBtoA.toFixed(1)} s)</span>
              </div>
              <div className="bg-terracota-50 p-3.5 rounded-xl border border-terracota-200 shadow-xs">
                <span className="text-[10px] font-bold text-terracota-800 uppercase block">
                  Diferencia Asimétrica |Δ|
                </span>
                <span className="text-lg font-bold text-terracota-800 font-mono mt-0.5 block">
                  {Math.abs(timeAtoB - timeBtoA).toFixed(1)} s
                </span>
                <button
                  type="button"
                  onClick={() => handleQuickRoute(inspectPair.orig, inspectPair.dest)}
                  className="text-[11px] text-terracota-700 hover:text-terracota-950 font-bold underline mt-0.5"
                >
                  Trazar este par en el mapa ↑
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tabla Interactiva de la Matriz */}
        {matrixData && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-cafe-800">
                  Matriz de Tiempos ({matrixData.size} × {matrixData.size}) en minutos:
                </span>
                <button
                  type="button"
                  onClick={() => setShowAllMatrixRows(!showAllMatrixRows)}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-cafe-100 hover:bg-cafe-200 text-cafe-800 transition-colors"
                >
                  {showAllMatrixRows ? 'Mostrar vista compacta (15×15)' : 'Mostrar los 42×42 lugares'}
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-cafe-400" />
                <input
                  type="text"
                  placeholder="Filtrar filas/columnas por lugar..."
                  value={matrixSearch}
                  onChange={(e) => setMatrixSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-cafe-50 border border-cafe-200 rounded-xl text-xs text-cafe-950 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-cafe-200 rounded-2xl max-h-96 shadow-inner">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-cafe-100 text-cafe-800 uppercase tracking-wider font-bold sticky top-0 z-10">
                  <tr>
                    <th className="p-3 border-b border-r border-cafe-300 bg-cafe-100 min-w-[180px] sticky left-0 z-20">
                      Origen \ Destino
                    </th>
                    {matrixData.placeNames
                      .filter((name) => name.toLowerCase().includes(matrixSearch.toLowerCase()))
                      .slice(0, matrixRowLimit)
                      .map((name, i) => (
                        <th
                          key={`col-${i}`}
                          className="p-2.5 border-b border-r border-cafe-200 text-center min-w-[100px] truncate max-w-[120px]"
                          title={name}
                        >
                          {name}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-cafe-100 font-mono">
                  {matrixData.placeIds
                    .map((id, rowIdx) => ({
                      id,
                      name: matrixData.placeNames[rowIdx],
                    }))
                    .filter((item) => item.name.toLowerCase().includes(matrixSearch.toLowerCase()))
                    .slice(0, matrixRowLimit)
                    .map((row) => (
                      <tr key={`row-${row.id}`} className="hover:bg-amber-50/30 transition-colors">
                        <td className="p-2.5 font-sans font-bold text-cafe-950 border-r border-cafe-200 bg-cafe-50 sticky left-0 z-10 truncate max-w-[180px]">
                          {row.name}
                        </td>
                        {matrixData.placeIds
                          .map((id, colIdx) => ({
                            id,
                            name: matrixData.placeNames[colIdx],
                          }))
                          .filter((item) => item.name.toLowerCase().includes(matrixSearch.toLowerCase()))
                          .slice(0, matrixRowLimit)
                          .map((col) => {
                            const secs = matrixData.matrixSeconds[row.id]?.[col.id] ?? 0;
                            const isSelf = row.id === col.id;
                            const mins = (secs / 60).toFixed(1);
                            return (
                              <td
                                key={`cell-${row.id}-${col.id}`}
                                onClick={() => {
                                  if (!isSelf) {
                                    setInspectPair({ orig: row.id, dest: col.id });
                                  }
                                }}
                                title={
                                  isSelf
                                    ? row.name
                                    : `${row.name} → ${col.name}: ${mins} min (${secs.toFixed(0)} s). Haz clic para inspeccionar.`
                                }
                                className={`p-2 text-center border-r border-cafe-100 transition-colors ${
                                  isSelf
                                    ? 'bg-cafe-100/60 text-cafe-400 font-sans'
                                    : secs > 3600
                                    ? 'bg-amber-50/60 text-amber-950 hover:bg-amber-200/60 cursor-pointer'
                                    : 'text-cafe-800 hover:bg-cordillera-100/60 cursor-pointer'
                                }`}
                              >
                                {isSelf ? '—' : `${mins}'`}
                              </td>
                            );
                          })}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-cafe-500">
              Haz clic en cualquier celda de la tabla para analizar la asimetría de ese trayecto. Puedes descargar el
              dataset íntegro de 1,764 pares usando el botón <strong>Exportar CSV (42 × 42)</strong>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
