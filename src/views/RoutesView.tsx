import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import {
  Place,
  DijkstraVersion,
  ShortestPathResult,
  CompareDijkstraResult,
  TimeMatrixData,
} from '../types';
import { placesApi, routesApi } from '../services/api';
import { MetricCard } from '../components/common/MetricCard';
import { Badge } from '../components/common/Badge';
import { Alert } from '../components/common/Alert';
import { QuindioMap } from '../components/map/QuindioMap';

export const RoutesView: React.FC = () => {
  // State: Places & selection
  const [places, setPlaces] = useState<Place[]>([]);
  const [originId, setOriginId] = useState<string>('');
  const [destinationId, setDestinationId] = useState<string>('');
  const [version, setVersion] = useState<DijkstraVersion>('COLA_PRIORIDAD');
  const [compareMode, setCompareMode] = useState<boolean>(true);

  // Results & Loading
  const [singleResult, setSingleResult] = useState<ShortestPathResult | null>(null);
  const [compareResult, setCompareResult] = useState<CompareDijkstraResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Time Matrix State
  const [matrixData, setMatrixData] = useState<TimeMatrixData | null>(null);
  const [loadingMatrix, setLoadingMatrix] = useState<boolean>(false);
  const [matrixSearch, setMatrixSearch] = useState<string>('');
  const [inspectPair, setInspectPair] = useState<{ orig: string; dest: string }>({ orig: '', dest: '' });

  // Initial load
  useEffect(() => {
    loadPlaces();
  }, []);

  const loadPlaces = async () => {
    try {
      const data = await placesApi.getAll();
      setPlaces(data);
      if (data.length >= 2) {
        setOriginId(data[0].id);
        setDestinationId(data[1].id);
        setInspectPair({ orig: data[0].id, dest: data[1].id });
      }
    } catch (err) {
      console.error('Error al cargar lugares:', err);
      setError('No se pudo conectar con el backend (puerto 8080). Verifica que el servicio Spring Boot esté activo.');
    }
  };

  const handleSwap = () => {
    setOriginId(destinationId);
    setDestinationId(originId);
  };

  const handleCalculate = async () => {
    if (!originId || !destinationId) {
      setError('Por favor selecciona un punto de origen y un punto de destino.');
      return;
    }
    if (originId === destinationId) {
      setError('El origen y el destino deben ser diferentes.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (compareMode) {
        const [compRes, singleRes] = await Promise.all([
          routesApi.compareDijkstra(originId, destinationId),
          routesApi.computeShortestPath(originId, destinationId, 'COLA_PRIORIDAD'),
        ]);
        setCompareResult(compRes);
        setSingleResult(singleRes);
      } else {
        const res = await routesApi.computeShortestPath(originId, destinationId, version);
        setSingleResult(res);
        setCompareResult(null);
      }
    } catch (err: any) {
      console.error('Error calculando ruta:', err);
      setError(err.message || 'Error al calcular la ruta en el servidor.');
    } finally {
      setLoading(false);
    }
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

  // Compute asymmetry for inspected pair
  const inspectOrigPlace = places.find((p) => p.id === inspectPair.orig);
  const inspectDestPlace = places.find((p) => p.id === inspectPair.dest);
  const timeAtoB = matrixData?.matrixSeconds[inspectPair.orig]?.[inspectPair.dest];
  const timeBtoA = matrixData?.matrixSeconds[inspectPair.dest]?.[inspectPair.orig];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Editorial */}
      <div className="bg-gradient-to-r from-cafe-900 via-cafe-800 to-cafe-900 text-white rounded-3xl p-8 shadow-xl border border-cafe-700/50">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cafe-700/60 text-cafe-100 text-xs font-semibold uppercase tracking-wider mb-4 border border-cafe-600">
            <Navigation className="w-3.5 h-3.5 text-ambar-400" />
            Módulo R2 • Caminos Mínimos y Topología Vial
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-cafe-50 tracking-tight leading-tight">
            Dijkstra Vial & Matriz Asimétrica
          </h1>
          <p className="mt-3 text-cafe-200 text-sm sm:text-base leading-relaxed">
            Cálculo de trayectos de tiempo mínimo sobre la componente fuertemente conexa (SCC) del Quindío.
            Comprobación empírica y teórica del invariante de Dijkstra, comparación del Min-Heap binario
            <code className="text-ambar-300 font-mono text-xs ml-1 bg-cafe-800 px-1.5 py-0.5 rounded border border-cafe-700">O((V+E) \log V)</code> frente a búsqueda lineal
            <code className="text-ambar-300 font-mono text-xs ml-1 bg-cafe-800 px-1.5 py-0.5 rounded border border-cafe-700">O(V^2)</code>, y matriz asimétrica $42 \times 42$.
          </p>
        </div>
      </div>

      {/* Selector Card */}
      <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-md border border-cafe-200">
        <h2 className="text-xl font-serif font-bold text-cafe-900 mb-6 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-terracota-600" />
          Planificador de Ruta entre Atractivos
        </h2>

        {error && (
          <div className="mb-6">
            <Alert type="error" title="Atención">{error}</Alert>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Origin selector */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="block text-xs font-bold text-cafe-700 uppercase tracking-wider">
              Punto de Origen (A)
            </label>
            <select
              value={originId}
              onChange={(e) => setOriginId(e.target.value)}
              className="w-full bg-cafe-50 border border-cafe-300 rounded-xl px-4 py-3 text-sm text-cafe-900 font-medium focus:ring-2 focus:ring-cordillera-500 focus:outline-none transition-shadow"
            >
              {places.map((p) => (
                <option key={`orig-${p.id}`} value={p.id}>
                  {p.name} ({p.municipality})
                </option>
              ))}
            </select>
            {originPlace && (
              <p className="text-xs text-cafe-500">
                Municipio: <span className="font-semibold text-cafe-700">{originPlace.municipality}</span> • Nodo vial: #{originPlace.nearestNodeId ?? 'N/A'}
              </p>
            )}
          </div>

          {/* Swap Button */}
          <div className="md:col-span-2 flex justify-center py-2 md:py-0">
            <button
              onClick={handleSwap}
              type="button"
              className="p-3 rounded-full bg-cafe-100 hover:bg-cafe-200 text-cafe-700 hover:text-cafe-900 transition-colors shadow-sm border border-cafe-300 active:scale-95"
              title="Intercambiar Origen y Destino"
            >
              <ArrowRightLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Destination selector */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="block text-xs font-bold text-cafe-700 uppercase tracking-wider">
              Punto de Destino (B)
            </label>
            <select
              value={destinationId}
              onChange={(e) => setDestinationId(e.target.value)}
              className="w-full bg-cafe-50 border border-cafe-300 rounded-xl px-4 py-3 text-sm text-cafe-900 font-medium focus:ring-2 focus:ring-cordillera-500 focus:outline-none transition-shadow"
            >
              {places.map((p) => (
                <option key={`dest-${p.id}`} value={p.id}>
                  {p.name} ({p.municipality})
                </option>
              ))}
            </select>
            {destPlace && (
              <p className="text-xs text-cafe-500">
                Municipio: <span className="font-semibold text-cafe-700">{destPlace.municipality}</span> • Nodo vial: #{destPlace.nearestNodeId ?? 'N/A'}
              </p>
            )}
          </div>
        </div>

        {/* Options & Action Bar */}
        <div className="mt-6 pt-6 border-t border-cafe-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-semibold text-cafe-800">
              <input
                type="checkbox"
                checked={compareMode}
                onChange={(e) => setCompareMode(e.target.checked)}
                className="w-4 h-4 rounded text-cordillera-600 focus:ring-cordillera-500 border-cafe-300"
              />
              <span>Comparar Min-Heap vs Búsqueda Lineal</span>
            </label>

            {!compareMode && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-cafe-600 font-medium">Algoritmo:</span>
                <select
                  value={version}
                  onChange={(e) => setVersion(e.target.value as DijkstraVersion)}
                  className="bg-cafe-50 border border-cafe-300 rounded-lg px-2.5 py-1 text-xs text-cafe-900 font-medium"
                >
                  <option value="COLA_PRIORIDAD">Min-Heap Binario O((V+E)log V)</option>
                  <option value="LINEAL">Búsqueda Lineal O(V^2)</option>
                </select>
              </div>
            )}
          </div>

          <button
            onClick={handleCalculate}
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-cordillera-600 hover:bg-cordillera-700 text-white font-semibold text-sm shadow-md transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Calculando Ruta...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-ambar-300" />
                <span>Calcular Camino Mínimo</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {singleResult && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Tiempo de Viaje"
              value={`${singleResult.travelTimeMinutes.toFixed(1)} min`}
              subtitle={`(${(singleResult.travelTimeSeconds / 3600).toFixed(2)} h)`}
              icon={<Clock className="w-5 h-5 text-terracota-700" />}
              variant="terracotta"
            />
            <MetricCard
              title="Distancia Terrestre"
              value={`${singleResult.distanceKilometers.toFixed(2)} km`}
              subtitle={`${singleResult.distanceMeters.toLocaleString()} metros`}
              icon={<Navigation className="w-5 h-5 text-cordillera-700" />}
              variant="emerald"
            />
            <MetricCard
              title="Nodos Explorados"
              value={singleResult.exploredNodesCount.toLocaleString()}
              subtitle="Nodos procesados en la SCC"
              icon={<Layers className="w-5 h-5 text-amber-700" />}
              variant="amber"
            />
            <MetricCard
              title="Tiempo Cómputo CPU"
              value={`${singleResult.executionTimeMs.toFixed(2)} ms`}
              subtitle={`Versión: ${singleResult.version === 'COLA_PRIORIDAD' ? 'Min-Heap' : 'Lineal'}`}
              icon={<Zap className="w-5 h-5 text-cafe-800" />}
              variant="coffee"
            />
          </div>

          {/* Comparison Card (if compareMode enabled) */}
          {compareResult && (
            <div className="bg-white rounded-3xl p-6 lg:p-8 border border-cafe-200 shadow-md space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-cafe-100 pb-4">
                <div>
                  <h3 className="text-lg font-serif font-bold text-cafe-900">
                    Análisis Comparativo: Min-Heap vs Búsqueda Lineal
                  </h3>
                  <p className="text-xs text-cafe-600 mt-1">
                    Evaluación empírica sobre la misma consulta entre {compareResult.originPlaceName} y {compareResult.destinationPlaceName}.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cordillera-50 text-cordillera-700 border border-cordillera-200 rounded-full text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cordillera-600" />
                  Invariante Verificado: Tiempos Idénticos ({compareResult.travelTimeSeconds}s)
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Min-Heap */}
                <div className="bg-cordillera-50/50 rounded-2xl p-5 border border-cordillera-200">
                  <span className="text-xs font-bold text-cordillera-700 uppercase tracking-wider block mb-2">
                    Min-Heap Binario
                  </span>
                  <div className="text-2xl font-bold text-cordillera-900 font-mono">
                    {compareResult.pqExecutionTimeMs.toFixed(2)} ms
                  </div>
                  <p className="text-xs text-cordillera-800 mt-1">
                    Complejidad: <code className="font-mono font-bold">O((V + E) log V)</code>
                  </p>
                  <p className="text-xs text-cordillera-700 mt-2">
                    Nodos explorados: <span className="font-bold">{compareResult.pqExploredNodes.toLocaleString()}</span>
                  </p>
                  <p className="text-xs text-cordillera-600 mt-1">
                    Usa extracción eficiente de mínima distancia en <code className="font-mono">O(log V)</code>.
                  </p>
                </div>

                {/* Lineal */}
                <div className="bg-cafe-50 rounded-2xl p-5 border border-cafe-200">
                  <span className="text-xs font-bold text-cafe-700 uppercase tracking-wider block mb-2">
                    Búsqueda Lineal
                  </span>
                  <div className="text-2xl font-bold text-cafe-900 font-mono">
                    {compareResult.linearExecutionTimeMs.toFixed(2)} ms
                  </div>
                  <p className="text-xs text-cafe-800 mt-1">
                    Complejidad: <code className="font-mono font-bold">O(V^2)</code>
                  </p>
                  <p className="text-xs text-cafe-700 mt-2">
                    Nodos explorados: <span className="font-bold">{compareResult.linearExploredNodes.toLocaleString()}</span>
                  </p>
                  <p className="text-xs text-cafe-600 mt-1">
                    Escanea secuencialmente todo el arreglo de distancias en <code className="font-mono">O(V)</code> por vértice.
                  </p>
                </div>

                {/* Ratio & Theory */}
                <div className="bg-ambar-50/60 rounded-2xl p-5 border border-ambar-200 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-ambar-800 uppercase tracking-wider block mb-2">
                      Factor de Aceleración
                    </span>
                    <div className="text-3xl font-bold text-ambar-900 font-mono">
                      {compareResult.ratioLinearToPq.toFixed(2)}x
                    </div>
                    <p className="text-xs text-ambar-800 mt-1">
                      Min-Heap es <span className="font-bold">{compareResult.ratioLinearToPq.toFixed(2)} veces más rápido</span> en tiempo de CPU para esta instancia.
                    </p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-ambar-200 text-xs text-ambar-900 font-sans">
                    <p className="font-semibold">Teorema de Subestructura Óptima:</p>
                    <p className="text-[11px] text-ambar-800 mt-0.5">
                      Todo subcamino de un camino mínimo es a su vez un camino mínimo.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Map & Route Polyline */}
          <div className="bg-white rounded-3xl p-6 lg:p-8 border border-cafe-200 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-serif font-bold text-cafe-900">
                  Visualización Cartográfica del Trayecto
                </h3>
                <p className="text-xs text-cafe-600 mt-0.5">
                  Ruta proyectada sobre la red vial OpenStreetMap del Quindío ({singleResult.polyline.length} puntos de trazado).
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-cordillera-600"></span>
                  Origen
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-terracota-600"></span>
                  Destino
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-4 h-1 bg-terracota-500 rounded"></span>
                  Trayecto Mínimo
                </span>
              </div>
            </div>

            <QuindioMap
              places={places}
              selectedPlaceId={originId}
              routePolyline={singleResult.polyline}
              className="h-[460px] rounded-2xl overflow-hidden border border-cafe-200 shadow-inner"
            />
          </div>

          {/* Detailed Timeline / Nodes Path */}
          <div className="bg-white rounded-3xl p-6 lg:p-8 border border-cafe-200 shadow-md">
            <h3 className="text-lg font-serif font-bold text-cafe-900 mb-3">
              Secuencia Topológica de Intersecciones Viales
            </h3>
            <p className="text-xs text-cafe-600 mb-4">
              Secuencia de nodos viales cruzados en la red vial orientada ({singleResult.nodePath.length} nodos en el camino mínimo).
            </p>

            <div className="flex flex-wrap items-center gap-1.5 max-h-48 overflow-y-auto p-4 bg-cafe-50 rounded-2xl border border-cafe-200 font-mono text-xs text-cafe-800">
              {singleResult.nodePath.map((nodeId, idx) => (
                <React.Fragment key={`node-${nodeId}-${idx}`}>
                  <span
                    className={`px-2 py-1 rounded-md font-semibold ${
                      idx === 0
                        ? 'bg-cordillera-600 text-white'
                        : idx === singleResult.nodePath.length - 1
                        ? 'bg-terracota-600 text-white'
                        : 'bg-white text-cafe-800 border border-cafe-200'
                    }`}
                  >
                    #{nodeId}
                  </span>
                  {idx < singleResult.nodePath.length - 1 && (
                    <span className="text-cafe-400">→</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Asymmetric Time Matrix Section */}
      <div className="bg-white rounded-3xl p-6 lg:p-8 border border-cafe-200 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-cafe-100 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-terracota-700 uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5" />
              Matriz de Tiempos de Viaje ($42 \times 42$)
            </div>
            <h2 className="text-xl font-serif font-bold text-cafe-900 mt-1">
              Matriz Asimétrica de Costos Viales
            </h2>
            <p className="text-xs text-cafe-600 mt-1 max-w-2xl">
              Calculada ejecutando Dijkstra $42$ veces (uno por cada atractivo turístico y cabecera municipal de origen)
              sobre la red vial completa.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={routesApi.getCsvDownloadUrl()}
              download="matriz_tiempos_quindio.csv"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cafe-800 hover:bg-cafe-900 text-white font-semibold text-xs transition-colors shadow-sm"
            >
              <Download className="w-4 h-4 text-ambar-400" />
              Descargar Matriz CSV
            </a>

            {!matrixData && (
              <button
                onClick={handleLoadMatrix}
                disabled={loadingMatrix}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cordillera-600 hover:bg-cordillera-700 text-white font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
              >
                {loadingMatrix ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  <>
                    <Layers className="w-3.5 h-3.5" />
                    Explorar Matriz en Vivo
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Why is it asymmetric? Editorial Alert */}
        <div className="bg-cafe-50 rounded-2xl p-5 border border-cafe-200 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-cafe-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-ambar-600" />
            ¿Por qué la matriz de tiempos es asimétrica? (T(A, B) ≠ T(B, A))
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-cafe-700 leading-relaxed">
            <div className="p-3 bg-white rounded-xl border border-cafe-200">
              <span className="font-bold text-cafe-900 block mb-1">1. Topografía y Pendiente:</span>
              En la cordillera central, ascender (ej. Armenia → Salento o Filandia) requiere velocidades menores por potencia y curvas cerradas, mientras que el descenso tiene velocidades reguladas distintas.
            </div>
            <div className="p-3 bg-white rounded-xl border border-cafe-200">
              <span className="font-bold text-cafe-900 block mb-1">2. Sentidos Viales Únicos:</span>
              Los cascos urbanos de Armenia, Calarcá y Circasia cuentan con calles y carreras unidireccionales obligatorias (arcos dirigidos en la red OSM).
            </div>
            <div className="p-3 bg-white rounded-xl border border-cafe-200">
              <span className="font-bold text-cafe-900 block mb-1">3. Giros Prohibidos y Cruces:</span>
              Las incorporaciones a vías nacionales (como la Autopista del Café) obligan a retornos viales que añaden kilómetros y minutos en un solo sentido.
            </div>
          </div>
        </div>

        {/* Asymmetry Inspector Widget */}
        <div className="bg-amber-50/50 rounded-2xl p-5 border border-amber-200">
          <h4 className="text-sm font-serif font-bold text-amber-900 mb-3">
            Comprobador Interactivo de Asimetría entre Pares
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-amber-800 mb-1">Punto A</label>
              <select
                value={inspectPair.orig}
                onChange={(e) => setInspectPair({ ...inspectPair, orig: e.target.value })}
                className="w-full bg-white border border-amber-300 rounded-lg px-3 py-2 text-xs font-medium text-cafe-900"
              >
                {places.map((p) => (
                  <option key={`insp-a-${p.id}`} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-amber-800 mb-1">Punto B</label>
              <select
                value={inspectPair.dest}
                onChange={(e) => setInspectPair({ ...inspectPair, dest: e.target.value })}
                className="w-full bg-white border border-amber-300 rounded-lg px-3 py-2 text-xs font-medium text-cafe-900"
              >
                {places.map((p) => (
                  <option key={`insp-b-${p.id}`} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {matrixData && timeAtoB !== undefined && timeBtoA !== undefined && (
            <div className="mt-4 pt-4 border-t border-amber-200 grid grid-cols-3 gap-4 text-center">
              <div className="bg-white p-3 rounded-xl border border-amber-200">
                <span className="text-[10px] font-bold text-cafe-500 uppercase block">
                  {inspectOrigPlace?.name ?? 'A'} → {inspectDestPlace?.name ?? 'B'}
                </span>
                <span className="text-lg font-bold text-cafe-900 font-mono">
                  {(timeAtoB / 60).toFixed(1)} min
                </span>
                <span className="text-xs text-cafe-500 block">({timeAtoB} seg)</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-amber-200">
                <span className="text-[10px] font-bold text-cafe-500 uppercase block">
                  {inspectDestPlace?.name ?? 'B'} → {inspectOrigPlace?.name ?? 'A'}
                </span>
                <span className="text-lg font-bold text-cafe-900 font-mono">
                  {(timeBtoA / 60).toFixed(1)} min
                </span>
                <span className="text-xs text-cafe-500 block">({timeBtoA} seg)</span>
              </div>
              <div className="bg-terracota-50 p-3 rounded-xl border border-terracota-200">
                <span className="text-[10px] font-bold text-terracota-800 uppercase block">
                  Diferencia Asimétrica (Δ)
                </span>
                <span className="text-lg font-bold text-terracota-700 font-mono">
                  {(Math.abs(timeAtoB - timeBtoA) / 60).toFixed(1)} min
                </span>
                <span className="text-xs text-terracota-600 block">
                  {timeAtoB !== timeBtoA ? 'Asimetría detectada' : 'Simétrico'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Matrix Grid Preview */}
        {matrixData && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-cafe-700">
                Vista previa de la matriz ({matrixData.size} x {matrixData.size}) • Tiempos en minutos:
              </div>
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-cafe-400" />
                <input
                  type="text"
                  placeholder="Filtrar por nombre..."
                  value={matrixSearch}
                  onChange={(e) => setMatrixSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-cafe-50 border border-cafe-200 rounded-lg text-xs text-cafe-900 focus:outline-none focus:ring-1 focus:ring-cordillera-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-cafe-200 rounded-2xl max-h-96 shadow-inner">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-cafe-100 text-cafe-800 uppercase tracking-wider font-semibold sticky top-0 z-10">
                  <tr>
                    <th className="p-3 border-b border-r border-cafe-300 bg-cafe-100 min-w-[180px]">
                      Origen \ Destino
                    </th>
                    {matrixData.placeNames
                      .filter((name) =>
                        name.toLowerCase().includes(matrixSearch.toLowerCase())
                      )
                      .slice(0, 15)
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
                    .filter((item) =>
                      item.name.toLowerCase().includes(matrixSearch.toLowerCase())
                    )
                    .slice(0, 15)
                    .map((row) => (
                      <tr key={`row-${row.id}`} className="hover:bg-cafe-50 transition-colors">
                        <td className="p-2.5 font-sans font-bold text-cafe-900 border-r border-cafe-200 bg-cafe-50/50 truncate max-w-[180px]">
                          {row.name}
                        </td>
                        {matrixData.placeIds
                          .map((id, colIdx) => ({
                            id,
                            name: matrixData.placeNames[colIdx],
                          }))
                          .filter((item) =>
                            item.name.toLowerCase().includes(matrixSearch.toLowerCase())
                          )
                          .slice(0, 15)
                          .map((col) => {
                            const secs = matrixData.matrixSeconds[row.id]?.[col.id] ?? 0;
                            const isSelf = row.id === col.id;
                            const mins = (secs / 60).toFixed(1);
                            return (
                              <td
                                key={`cell-${row.id}-${col.id}`}
                                className={`p-2 text-center border-r border-cafe-100 ${
                                  isSelf
                                    ? 'bg-cafe-100/50 text-cafe-400 font-sans'
                                    : secs > 3600
                                    ? 'bg-amber-50/50 text-amber-900'
                                    : 'text-cafe-700'
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
            <p className="text-[11px] text-cafe-500 italic">
              Mostrando primeros 15 registros. Para el dataset completo de 42x42 (1,764 trayectos), descarga el archivo CSV.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
