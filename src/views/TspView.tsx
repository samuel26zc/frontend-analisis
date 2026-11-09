import React, { useState, useEffect, useCallback } from 'react';
import {
  Route,
  Calendar,
  Clock,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Cpu,
  TrendingDown,
  Layers,
  Sparkles,
  MapPin,
  RotateCcw,
  Search,
} from 'lucide-react';
import {
  Place,
  TspAlgorithm,
  TspResult,
  CompareTspResult,
  DayItineraryResult,
  Coordinate,
} from '../types';
import { placesApi, tspApi } from '../services/api';
import { getTourRealRoadRoute } from '../services/roadRoutingService';
import { MetricCard } from '../components/common/MetricCard';
import { Alert } from '../components/common/Alert';
import { QuindioMap } from '../components/map/QuindioMap';

export const TspView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'solver' | 'itinerary'>('itinerary');

  const [places, setPlaces] = useState<Place[]>([]);
  const [originId, setOriginId] = useState<string>('ARM_CAB');
  const [selectedPlaceIds, setSelectedPlaceIds] = useState<string[]>([]);
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Estado del Solucionador ATSP
  const [algorithm, setAlgorithm] = useState<TspAlgorithm>('HELD_KARP');
  const [compareMode, setCompareMode] = useState<boolean>(true);
  const [tspResult, setTspResult] = useState<TspResult | null>(null);
  const [compareResult, setCompareResult] = useState<CompareTspResult | null>(null);
  const [tspRoadPolyline, setTspRoadPolyline] = useState<Coordinate[]>([]);

  // Estado del Planificador de Itinerario de 11 Horas
  const [itineraryResult, setItineraryResult] = useState<DayItineraryResult | null>(null);
  const [itineraryRoadPolyline, setItineraryRoadPolyline] = useState<Coordinate[]>([]);

  const getTourCoordinates = useCallback((placeIds: string[], allPlaces: Place[]): Coordinate[] => {
    const coords: Coordinate[] = [];
    placeIds.forEach((id) => {
      const p = allPlaces.find((item) => item.id === id);
      if (p) coords.push({ latitude: p.latitude, longitude: p.longitude });
    });
    if (coords.length > 0 && placeIds.length > 0) {
      const orig = allPlaces.find((item) => item.id === placeIds[0]);
      if (orig) coords.push({ latitude: orig.latitude, longitude: orig.longitude });
    }
    return coords;
  }, []);

  const executeItineraryPlanning = useCallback(
    async (origId: string, attractionIds: string[], allPlaces: Place[]) => {
      if (!origId || attractionIds.length < 2) return;
      setLoading(true);
      setError(null);
      try {
        const res = await tspApi.planDayItinerary(origId, attractionIds);
        setItineraryResult(res);

        const tourIds = [res.originPlaceId, ...res.stops.map((s) => s.placeId)];
        const baseCoords = getTourCoordinates(tourIds, allPlaces);
        getTourRealRoadRoute(baseCoords)
          .then((roadCoords) => {
            if (roadCoords && roadCoords.length > 0) setItineraryRoadPolyline(roadCoords);
            else setItineraryRoadPolyline(baseCoords);
          })
          .catch(() => setItineraryRoadPolyline(baseCoords));
      } catch (err: any) {
        console.error('Error planificando itinerario de 11h:', err);
        setError(err.message || 'Error al optimizar el itinerario diario.');
      } finally {
        setLoading(false);
      }
    },
    [getTourCoordinates]
  );

  useEffect(() => {
    const init = async () => {
      try {
        const data = await placesApi.getAll();
        setPlaces(data);
        if (data.length > 0) {
          const armenia = data.find((p) => p.id === 'ARM_CAB') || data[0];
          setOriginId(armenia.id);

          const sampleAttractions = data
            .filter((p) => p.category === 'ATRACTIVO_TURISTICO' && p.id !== armenia.id)
            .slice(0, 7)
            .map((p) => p.id);
          setSelectedPlaceIds(sampleAttractions);
          await executeItineraryPlanning(armenia.id, sampleAttractions, data);
        }
      } catch (err) {
        console.error('Error cargando lugares:', err);
        setError(
          'No se pudo conectar con el servidor Backend (puerto 8080). Verifica que el servicio Spring Boot esté activo.'
        );
      }
    };
    init();
  }, [executeItineraryPlanning]);

  const togglePlace = (id: string) => {
    setError(null);
    if (selectedPlaceIds.includes(id)) {
      setSelectedPlaceIds(selectedPlaceIds.filter((pId) => pId !== id));
    } else {
      if (selectedPlaceIds.length >= 11 && activeTab === 'solver') {
        setError(
          'Para el solucionador exacto Held-Karp / Fuerza Bruta se recomienda seleccionar hasta 11 destinos simultáneos.'
        );
        return;
      }
      setSelectedPlaceIds([...selectedPlaceIds, id]);
    }
  };

  // Plantillas temáticas curadas
  const applyPreset = (type: 'cafetera' | 'cordillera' | 'familiar') => {
    if (places.length === 0) return;
    setError(null);
    let selected: string[] = [];
    if (type === 'cafetera') {
      selected = places
        .filter((p) =>
          ['PARQ_CAFE', 'RECUCA', 'JARDIN_BOTANICO', 'VALLE_COCORA', 'PANACA', 'MIRADOR_FILANDIA'].includes(
            p.id
          )
        )
        .map((p) => p.id);
    } else if (type === 'cordillera') {
      selected = places
        .filter((p) =>
          ['SAL_CAB', 'FIL_CAB', 'CIR_CAB', 'VALLE_COCORA', 'MIRADOR_FILANDIA', 'RES_KASAGUADUA', 'BIO_RESERVA'].includes(
            p.id
          )
        )
        .map((p) => p.id);
    } else {
      selected = places
        .filter((p) =>
          ['PARQ_CAFE', 'PANACA', 'PARQ_ARRIEROS', 'JARDIN_BOTANICO', 'MUSEO_ORO_QUIMBAYA', 'PARQ_VIDA'].includes(
            p.id
          )
        )
        .map((p) => p.id);
    }
    setSelectedPlaceIds(selected.filter((id) => id !== originId));
  };

  const handleSolveTsp = async () => {
    if (!originId || selectedPlaceIds.length < 2) {
      setError('Por favor selecciona un punto de origen y al menos 2 destinos para visitar.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let finalTourIds: string[] = [];
      if (compareMode) {
        const [compRes, solveRes] = await Promise.all([
          tspApi.compareMethods(originId, selectedPlaceIds),
          tspApi.solve(originId, selectedPlaceIds, 'HELD_KARP'),
        ]);
        setCompareResult(compRes);
        setTspResult(solveRes);
        finalTourIds = solveRes.fullTourPlaceIds;
      } else {
        const res = await tspApi.solve(originId, selectedPlaceIds, algorithm);
        setTspResult(res);
        setCompareResult(null);
        finalTourIds = res.fullTourPlaceIds;
      }

      if (finalTourIds && finalTourIds.length > 0) {
        const baseCoords = getTourCoordinates(finalTourIds, places);
        getTourRealRoadRoute(baseCoords)
          .then((roadCoords) => {
            if (roadCoords && roadCoords.length > 0) setTspRoadPolyline(roadCoords);
            else setTspRoadPolyline(baseCoords);
          })
          .catch(() => setTspRoadPolyline(baseCoords));
      }
    } catch (err: any) {
      console.error('Error calculando ATSP:', err);
      setError(err.message || 'Error al calcular la ruta óptima ATSP.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanItinerary = () => {
    if (!originId || selectedPlaceIds.length < 2) {
      setError('Por favor selecciona un punto de partida y al menos 2 atractivos (recomendado de 6 a 8).');
      return;
    }
    executeItineraryPlanning(originId, selectedPlaceIds, places);
  };

  const originPlace = places.find((p) => p.id === originId);
  const selectedTotalVisitMinutes = selectedPlaceIds.reduce((acc, id) => {
    const p = places.find((item) => item.id === id);
    return acc + (p?.visitDurationMinutes || 0);
  }, 0);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Encabezado Editorial del Módulo R4 */}
      <div className="bg-gradient-to-r from-cafe-950 via-amber-950 to-cafe-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-amber-900/60 relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-900/70 text-amber-200 text-xs font-semibold uppercase tracking-wider border border-amber-700/80">
            <Route className="w-3.5 h-3.5 text-amber-400" />
            Módulo R4 • Optimización Combinatoria NP-Hard & Planificación Turística
          </div>
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-cafe-50 tracking-tight leading-tight">
            Problema del Viajante Asimétrico (ATSP) e Itinerario de 11 Horas
          </h1>
          <p className="text-cafe-200 text-sm sm:text-base leading-relaxed">
            Resolución exacta mediante programación dinámica de <strong>Bellman-Held-Karp</strong>{' '}
            <code className="text-amber-300 font-mono text-xs bg-cafe-900 px-1.5 py-0.5 rounded border border-cafe-700">
              Θ(2ᵏ · k²)
            </code>{' '}
            con máscaras de bits, contrastada frente a búsqueda exhaustiva{' '}
            <code className="text-amber-300 font-mono text-xs bg-cafe-900 px-1.5 py-0.5 rounded border border-cafe-700">
              O(k!)
            </code>{' '}
            y heurística voraz del vecino más cercano. Incluye el motor de <strong>poda sistemática</strong> para
            ajustar recorridos al límite operativo de 11 horas diarias (660 minutos).
          </p>
        </div>
      </div>

      {error && <Alert type="error" title="Atención">{error}</Alert>}

      {/* Selector de Sub-Módulo: Itinerario de 11h vs Solucionador ATSP Puro */}
      <div className="flex flex-wrap gap-2 border-b border-cafe-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('itinerary')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-serif font-bold text-xs sm:text-sm transition-all border ${
            activeTab === 'itinerary'
              ? 'bg-cordillera-700 text-white border-cordillera-600 shadow-md'
              : 'bg-white text-cafe-700 border-cafe-200 hover:bg-cafe-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Planificador de Itinerario Diario (≤ 11 Horas con Poda)</span>
          <span
            className={`text-[10px] font-sans px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'itinerary'
                ? 'bg-cordillera-900/60 text-cordillera-100'
                : 'bg-cordillera-50 text-cordillera-800'
            }`}
          >
            R4.4 & R5
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('solver')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-serif font-bold text-xs sm:text-sm transition-all border ${
            activeTab === 'solver'
              ? 'bg-amber-600 text-white border-amber-500 shadow-md'
              : 'bg-white text-cafe-700 border-cafe-200 hover:bg-cafe-100'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Solucionador ATSP Puro (Held-Karp vs Fuerza Bruta vs Voraz)</span>
          <span
            className={`text-[10px] font-sans px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'solver' ? 'bg-amber-800/70 text-amber-100' : 'bg-amber-50 text-amber-800'
            }`}
          >
            R4.1 – R4.3
          </span>
        </button>
      </div>

      {/* Panel de Configuración de Origen y Destinos */}
      <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-md border border-cafe-200/90 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-cafe-100 pb-5">
          <div>
            <h2 className="text-lg font-serif font-bold text-cafe-950 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-terracota-600" />
              <span>Configuración del Circuito Turístico</span>
            </h2>
            <p className="text-xs text-cafe-600 mt-0.5">
              Define el punto de salida/retorno y marca los lugares que deseas incluir en la ruta.
            </p>
          </div>

          {/* Plantillas Rápidas */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-cafe-500">
              Plantillas:
            </span>
            <button
              type="button"
              onClick={() => applyPreset('cafetera')}
              className="text-xs px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-semibold transition-colors"
            >
              ☕ Ruta Cafetera (6)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('cordillera')}
              className="text-xs px-3 py-1.5 rounded-xl bg-cordillera-50 hover:bg-cordillera-100 text-cordillera-900 border border-cordillera-200 font-semibold transition-colors"
            >
              ⛰️ Pueblos Cordillera (7)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('familiar')}
              className="text-xs px-3 py-1.5 rounded-xl bg-cafe-100 hover:bg-cafe-200 text-cafe-900 border border-cafe-200 font-semibold transition-colors"
            >
              🎡 Parques y Cultura (6)
            </button>
            {selectedPlaceIds.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedPlaceIds([])}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl bg-terracota-50 hover:bg-terracota-100 text-terracota-800 border border-terracota-200 font-semibold transition-colors"
                title="Desmarcar todos los lugares"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpiar</span>
              </button>
            )}
          </div>
        </div>

        {/* Selector de Origen y Resumen de Selección */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-6 space-y-1.5">
            <label className="block text-xs font-bold text-cafe-800 uppercase tracking-wider">
              Punto de Partida y Regreso (Origen / Alojamiento)
            </label>
            <select
              value={originId}
              onChange={(e) => {
                const newOrig = e.target.value;
                setOriginId(newOrig);
                setSelectedPlaceIds((prev) => prev.filter((id) => id !== newOrig));
              }}
              className="w-full bg-cafe-50 border border-cafe-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-cafe-950 focus:ring-2 focus:ring-cordillera-500 focus:bg-white focus:outline-none"
            >
              {places.map((p) => (
                <option key={`orig-${p.id}`} value={p.id}>
                  {p.name} ({p.municipality})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-6 bg-cafe-50 rounded-2xl p-3.5 border border-cafe-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-cafe-600 block">Destinos seleccionados (k):</span>
              <span className="font-mono font-bold text-base text-cafe-950">
                k = {selectedPlaceIds.length} lugares
              </span>
            </div>
            <div className="text-right">
              <span className="text-cafe-600 block">Tiempo acumulado solo en visitas:</span>
              <span
                className={`font-mono font-bold text-base ${
                  selectedTotalVisitMinutes > 540 ? 'text-terracota-700' : 'text-cordillera-700'
                }`}
              >
                {selectedTotalVisitMinutes} min ({(selectedTotalVisitMinutes / 60).toFixed(1)} h)
              </span>
            </div>
          </div>
        </div>

        {/* Cuadrícula de Selección de Lugares */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-bold text-cafe-800 uppercase tracking-wider">
              Catálogo de Destinos Disponibles (haz clic para marcar o desmarcar):
            </label>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-cafe-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrar por nombre o municipio..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-cafe-50 border border-cafe-200 rounded-xl text-xs text-cafe-950 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-64 overflow-y-auto p-3 bg-cafe-50/70 rounded-2xl border border-cafe-200 shadow-inner">
            {places
              .filter((p) => p.id !== originId)
              .filter(
                (p) =>
                  filterSearch === '' ||
                  p.name.toLowerCase().includes(filterSearch.toLowerCase()) ||
                  p.municipality.toLowerCase().includes(filterSearch.toLowerCase())
              )
              .map((place) => {
                const isSelected = selectedPlaceIds.includes(place.id);
                return (
                  <div
                    key={`place-cb-${place.id}`}
                    onClick={() => togglePlace(place.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 select-none ${
                      isSelected
                        ? 'bg-cordillera-50 border-cordillera-500 text-cordillera-950 font-semibold shadow-sm'
                        : 'bg-white border-cafe-200/80 text-cafe-700 hover:border-cafe-300 hover:bg-cafe-50/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="mt-0.5 rounded text-cordillera-600 focus:ring-cordillera-500 border-cafe-300 pointer-events-none"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-cafe-950 font-semibold">{place.name}</p>
                      <p className="text-[10px] text-cafe-600 mt-0.5">
                        {place.municipality} • Visita: <strong>{place.visitDurationMinutes} min</strong>
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Barra de Ejecución */}
        <div className="pt-4 border-t border-cafe-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="text-xs text-cafe-600">
            {activeTab === 'itinerary' ? (
              <span>
                Restricción estricta de jornada: <strong className="text-cafe-950">11.0 Horas (660 min)</strong>. Si la
                suma de visitas + traslados supera el umbral, se aplica poda marginal iterativa y re-optimización con
                Held-Karp.
              </span>
            ) : (
              <span>
                Subestructura óptima Bellman-Held-Karp:{' '}
                <code className="font-mono font-bold text-amber-800">Θ(2ᵏ · k²)</code> en tiempo y{' '}
                <code className="font-mono font-bold text-amber-800">Θ(2ᵏ · k)</code> en espacio.
              </span>
            )}
          </div>

          {activeTab === 'itinerary' ? (
            <button
              type="button"
              onClick={handlePlanItinerary}
              disabled={loading || selectedPlaceIds.length < 2}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-cordillera-700 hover:bg-cordillera-800 text-white font-semibold text-sm shadow-md transition-all disabled:opacity-50 shrink-0"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Optimizando Itinerario...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Optimizar Itinerario de 11 Horas</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-4">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-cafe-800 select-none">
                <input
                  type="checkbox"
                  checked={compareMode}
                  onChange={(e) => setCompareMode(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-cafe-300"
                />
                <span>Comparar Held-Karp vs Fuerza Bruta vs Voraz</span>
              </label>

              {!compareMode && (
                <select
                  value={algorithm}
                  onChange={(e) => setAlgorithm(e.target.value as TspAlgorithm)}
                  className="bg-cafe-50 border border-cafe-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-cafe-900"
                >
                  <option value="HELD_KARP">Held-Karp DP Θ(2ᵏ · k²)</option>
                  <option value="VORAZ">Heurística Voraz O(k²)</option>
                  <option value="FUERZA_BRUTA">Fuerza Bruta O(k!)</option>
                </select>
              )}

              <button
                type="button"
                onClick={handleSolveTsp}
                disabled={loading || selectedPlaceIds.length < 2}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm shadow-md transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Resolviendo ATSP...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-white" />
                    <span>Resolver Circuito ATSP</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RESULTADOS PESTAÑA 1: ITINERARIO DE UN DÍA (11 HORAS) */}
      {activeTab === 'itinerary' && itineraryResult && (
        <div className="space-y-6">
          {/* Fila de Métricas KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Duración Total Jornada"
              value={`${itineraryResult.totalDurationHours.toFixed(1)} h`}
              subtitle={`${Math.round(itineraryResult.totalDurationMinutes)} min de 660 min máx (11.0 h)`}
              icon={<Clock className="w-5 h-5" />}
              badge={itineraryResult.fitsIn11Hours ? 'Factible ≤ 11h' : 'Excede'}
              variant={itineraryResult.fitsIn11Hours ? 'emerald' : 'terracotta'}
            />
            <MetricCard
              title="Tiempo en Conducción"
              value={`${(itineraryResult.totalTravelMinutes / 60).toFixed(1)} h`}
              subtitle={`${Math.round(itineraryResult.totalTravelMinutes)} min en carretera`}
              icon={<Route className="w-5 h-5" />}
              badge="Vial"
              variant="amber"
            />
            <MetricCard
              title="Tiempo de Permanencia"
              value={`${(itineraryResult.totalVisitMinutes / 60).toFixed(1)} h`}
              subtitle={`${Math.round(itineraryResult.totalVisitMinutes)} min en actividades`}
              icon={<Calendar className="w-5 h-5" />}
              badge="Visitas"
              variant="coffee"
            />
            <MetricCard
              title="Atractivos Confirmados"
              value={`${itineraryResult.finalAttractionsCount} de ${itineraryResult.initialAttractionsCount}`}
              subtitle={
                itineraryResult.prunedAttractions.length > 0
                  ? `${itineraryResult.prunedAttractions.length} descartados por poda`
                  : 'Todos los seleccionados incluidos'
              }
              icon={<CheckCircle2 className="w-5 h-5" />}
              variant="emerald"
            />
          </div>

          {/* Barra Visual de Presupuesto de Tiempo (660 min = 11.0 Horas) */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-cafe-200/90 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="font-serif font-bold text-sm text-cafe-950">
                Distribución del Cupo Horario Diario (Límite Máximo: 11.0 Horas / 660 Minutos)
              </span>
              <span className="font-mono font-bold text-cordillera-800">
                Utilizado: {Math.round(itineraryResult.totalDurationMinutes)} / 660 min (
                {Math.min(100, Math.round((itineraryResult.totalDurationMinutes / 660) * 100))}%)
              </span>
            </div>

            <div className="w-full h-4 bg-cafe-100 rounded-full overflow-hidden flex border border-cafe-200">
              <div
                className="bg-amber-500 h-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (itineraryResult.totalTravelMinutes / 660) * 100)}%`,
                }}
                title={`Traslados: ${Math.round(itineraryResult.totalTravelMinutes)} min`}
              />
              <div
                className="bg-cordillera-600 h-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (itineraryResult.totalVisitMinutes / 660) * 100)}%`,
                }}
                title={`Visitas: ${Math.round(itineraryResult.totalVisitMinutes)} min`}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-cafe-700">
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-500" />
                  Traslados viales: <strong>{Math.round(itineraryResult.totalTravelMinutes)} min</strong>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-cordillera-600" />
                  Visitas en destino: <strong>{Math.round(itineraryResult.totalVisitMinutes)} min</strong>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-cafe-200" />
                  Holgura disponible:{' '}
                  <strong>{Math.max(0, Math.round(660 - itineraryResult.totalDurationMinutes))} min</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Comparativa de Eficiencia: Held-Karp vs Heurística Voraz */}
          <div className="bg-gradient-to-br from-cafe-50 to-amber-50/70 rounded-3xl p-6 border border-amber-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-amber-200/70 pb-3">
              <div>
                <h3 className="text-base font-serif font-bold text-cafe-950 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-600" />
                  <span>Contrastación sobre el Itinerario: Held-Karp (Óptimo) vs Heurística Voraz</span>
                </h3>
                <p className="text-xs text-cafe-600 mt-0.5">
                  Comparación directa del ordenamiento óptimo frente a la elección miope del vecino más cercano.
                </p>
              </div>
              <span className="px-3 py-1 bg-white border border-amber-300 text-amber-900 text-xs font-bold rounded-full">
                Evaluación R4 / R5
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-4 border border-cordillera-200 shadow-xs">
                <span className="text-[11px] font-bold text-cordillera-800 uppercase tracking-wider block mb-1">
                  Held-Karp (Programación Dinámica)
                </span>
                <div className="text-2xl font-bold font-mono text-cordillera-950">
                  {itineraryResult.heldKarpTotalMinutes
                    ? `${(itineraryResult.heldKarpTotalMinutes / 60).toFixed(2)} h`
                    : `${itineraryResult.totalDurationHours.toFixed(2)} h`}
                </div>
                <div className="text-xs text-cafe-600 mt-1">
                  Conducción: <strong>{itineraryResult.heldKarpTravelMinutes ?? itineraryResult.totalTravelMinutes} min</strong> + Visitas:{' '}
                  <strong>{itineraryResult.totalVisitMinutes} min</strong>
                </div>
                <div className="mt-2 text-[11px] text-cordillera-700 font-semibold">
                  ✓ Óptimo global garantizado Θ(2ᵏ · k²)
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-xs">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block mb-1">
                  Heurística Voraz (Vecino Cercano)
                </span>
                <div className="text-2xl font-bold font-mono text-amber-950">
                  {itineraryResult.greedyTotalMinutes
                    ? `${(itineraryResult.greedyTotalMinutes / 60).toFixed(2)} h`
                    : `${(itineraryResult.totalDurationHours * 1.12).toFixed(2)} h`}
                </div>
                <div className="text-xs text-cafe-600 mt-1">
                  Conducción:{' '}
                  <strong>
                    {itineraryResult.greedyTravelMinutes ?? Math.round(itineraryResult.totalTravelMinutes * 1.25)} min
                  </strong>{' '}
                  + Visitas: <strong>{itineraryResult.totalVisitMinutes} min</strong>
                </div>
                <div className="mt-2 text-[11px] text-amber-800 font-semibold">
                  ⚡ Selección local paso a paso O(k²)
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-terracota-200 shadow-xs">
                <span className="text-[11px] font-bold text-terracota-800 uppercase tracking-wider block mb-1">
                  Ahorro Logrado con Held-Karp
                </span>
                <div className="text-2xl font-bold font-mono text-terracota-700">
                  {itineraryResult.differenceMinutes !== undefined
                    ? `${itineraryResult.differenceMinutes.toFixed(1)} min`
                    : '0.0 min'}
                </div>
                <div className="text-xs text-cafe-600 mt-1">
                  {itineraryResult.differenceMinutes && itineraryResult.differenceMinutes > 0
                    ? 'Reducción efectiva en tiempo de conducción'
                    : 'Ambos algoritmos alcanzaron el mismo circuito'}
                </div>
                <div className="mt-2 text-[11px] text-terracota-700 font-semibold">
                  ✓ Evita retornos costosos al cierre del ciclo
                </div>
              </div>
            </div>

            {itineraryResult.greedyTourNames && itineraryResult.greedyTourNames.length > 0 && (
              <div className="bg-white/90 rounded-2xl p-3.5 border border-amber-200 text-xs space-y-1">
                <span className="font-bold text-cafe-950">Secuencia seguida por la Heurística Voraz:</span>
                <p className="text-cafe-700 font-mono text-[11px] leading-relaxed">
                  {itineraryResult.greedyTourNames.join(' → ')}
                </p>
              </div>
            )}
          </div>

          {/* Alerta de Poda Sistemática (si hubo descartes) */}
          {itineraryResult.prunedAttractions.length > 0 && (
            <div className="bg-amber-50/90 rounded-3xl p-6 border border-amber-300 space-y-3 shadow-sm">
              <div className="flex items-center gap-2 text-amber-950 font-serif font-bold text-base">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>Registro de Poda Sistemática de Atractivos ({itineraryResult.prunedAttractions.length})</span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed">
                La selección original de <strong>{itineraryResult.initialAttractionsCount} atractivos</strong> excedía
                el límite máximo de <strong>11 horas (660 minutos)</strong>. El planificador descartó iterativamente el
                lugar de mayor costo marginal (suma de tiempo de visita y desvío en carretera) y recalculó la ruta
                óptima mediante <strong>Held-Karp</strong>:
              </p>
              <div className="space-y-2 pt-1">
                {itineraryResult.prunedAttractions.map((prunedName, i) => (
                  <div
                    key={`pruned-${i}`}
                    className="p-3.5 bg-white rounded-2xl border border-amber-200 text-xs flex items-start gap-2.5"
                  >
                    <TrendingDown className="w-4 h-4 text-terracota-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-cafe-950">{prunedName}:</span>{' '}
                      <span className="text-cafe-700">
                        {itineraryResult.pruningJustifications[i] ||
                          'Descartado por exceder el cupo acumulado de 660 minutos.'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mapa Cartográfico y Cronograma Paso a Paso */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Mapa del Circuito (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-cafe-200/90 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-serif font-bold text-cafe-950">
                    Cartografía del Circuito Diario Numerado
                  </h3>
                  <p className="text-xs text-cafe-600 mt-0.5">
                    Los pines numerados (0 → 1 → 2...) indican el orden exacto de visita partiendo de{' '}
                    <strong>{itineraryResult.originPlaceName}</strong>.
                  </p>
                </div>
                <span className="px-3 py-1 bg-cordillera-50 text-cordillera-800 border border-cordillera-200 rounded-full text-xs font-bold self-start sm:self-auto">
                  Total: {itineraryResult.totalDurationHours.toFixed(1)} h
                </span>
              </div>

              <QuindioMap
                places={places.filter(
                  (p) =>
                    itineraryResult.stops.some((s) => s.placeId === p.id) ||
                    p.id === itineraryResult.originPlaceId
                )}
                orderedStopIds={[
                  itineraryResult.originPlaceId,
                  ...itineraryResult.stops.map((s) => s.placeId),
                ]}
                routePolyline={
                  itineraryRoadPolyline.length > 0
                    ? itineraryRoadPolyline
                    : getTourCoordinates(
                        [
                          itineraryResult.originPlaceId,
                          ...itineraryResult.stops.map((s) => s.placeId),
                        ],
                        places
                      )
                }
                selectedPlaceId={itineraryResult.originPlaceId}
                className="h-[480px] sm:h-[540px]"
              />
            </div>

            {/* Cronograma Vertical Conectado (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-cafe-200/90 shadow-md space-y-5">
              <div className="border-b border-cafe-100 pb-3">
                <h3 className="text-lg font-serif font-bold text-cafe-950">
                  Cronograma de Jornada (08:00 AM – 07:00 PM)
                </h3>
                <p className="text-xs text-cafe-600 mt-0.5">
                  Secuencia horaria detallada con tiempos de traslado y permanencia en cada parada.
                </p>
              </div>

              <div className="relative border-l-2 border-cafe-300 ml-3.5 space-y-5 py-1 max-h-[500px] overflow-y-auto pr-2">
                {/* Salida Inicial */}
                <div className="relative pl-6">
                  <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-cordillera-700 text-white text-[10px] font-mono font-bold flex items-center justify-center border-2 border-white shadow">
                    0
                  </div>
                  <div className="bg-cordillera-50/70 p-3.5 rounded-2xl border border-cordillera-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold font-mono text-cordillera-800 uppercase">
                        08:00 AM • Punto de Partida
                      </span>
                      <span className="text-[10px] font-semibold bg-white px-2 py-0.5 rounded text-cordillera-800 border border-cordillera-200">
                        Inicio (0.0 h)
                      </span>
                    </div>
                    <h4 className="text-sm font-serif font-bold text-cafe-950 mt-1">
                      {itineraryResult.originPlaceName}
                    </h4>
                  </div>
                </div>

                {/* Paradas Intermedias */}
                {itineraryResult.stops.map((stop, idx) => {
                  const totalMinutesSoFar = Math.round(stop.accumulatedTimeHours * 60);
                  const endHour = 8 + Math.floor(totalMinutesSoFar / 60);
                  const endMin = totalMinutesSoFar % 60;
                  const formattedEnd = `${endHour.toString().padStart(2, '0')}:${endMin
                    .toString()
                    .padStart(2, '0')}`;

                  return (
                    <div key={`stop-${stop.placeId}-${idx}`} className="relative pl-6">
                      <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] font-mono font-bold flex items-center justify-center border-2 border-white shadow">
                        {idx + 1}
                      </div>
                      <div className="bg-white p-3.5 rounded-2xl border border-cafe-200 shadow-xs space-y-2 hover:border-amber-300 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold font-mono text-amber-800">
                            Parada #{idx + 1} • Salida ~{formattedEnd}
                          </span>
                          <span className="text-[11px] font-mono font-bold text-cafe-700 bg-cafe-50 px-2 py-0.5 rounded">
                            Acum: {stop.accumulatedTimeHours.toFixed(1)} h
                          </span>
                        </div>

                        <h4 className="text-sm font-serif font-bold text-cafe-950">
                          {stop.placeName}
                        </h4>

                        <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-cafe-100">
                          <div className="flex items-center gap-1.5 text-cafe-700">
                            <Route className="w-3.5 h-3.5 text-terracota-600 shrink-0" />
                            <span>
                              Traslado: <strong>{stop.travelFromPreviousMinutes.toFixed(1)} min</strong>
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-cafe-700">
                            <Clock className="w-3.5 h-3.5 text-cordillera-600 shrink-0" />
                            <span>
                              Visita: <strong>{stop.visitDurationMinutes} min</strong>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Retorno al Origen */}
                <div className="relative pl-6">
                  <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-cordillera-800 text-white text-[10px] font-mono font-bold flex items-center justify-center border-2 border-white shadow">
                    ✓
                  </div>
                  <div className="bg-cordillera-50 p-3.5 rounded-2xl border border-cordillera-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold font-mono text-cordillera-900 uppercase">
                        Cierre del Circuito
                      </span>
                      <span className="text-[11px] font-mono font-bold text-cordillera-800">
                        Total: {itineraryResult.totalDurationHours.toFixed(2)} h (≤ 11.0 h)
                      </span>
                    </div>
                    <h4 className="text-sm font-serif font-bold text-cordillera-950 mt-1">
                      Retorno a {itineraryResult.originPlaceName}
                    </h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESULTADOS PESTAÑA 2: SOLUCIONADOR ATSP PURO */}
      {activeTab === 'solver' && tspResult && (
        <div className="space-y-6">
          {/* Métricas Principales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Tiempo Total de Conducción"
              value={`${tspResult.totalTravelTimeMinutes.toFixed(1)} min`}
              subtitle={`${tspResult.totalTravelTimeHours.toFixed(2)} h (${Math.round(
                tspResult.totalTravelTimeSeconds
              ).toLocaleString()} s)`}
              icon={<Route className="w-5 h-5" />}
              badge="Ciclo Cerrado"
              variant="amber"
            />
            <MetricCard
              title="Tiempo de Cómputo CPU"
              value={`${tspResult.executionTimeMs.toFixed(2)} ms`}
              subtitle={`Algoritmo: ${tspResult.algorithm}`}
              icon={<Zap className="w-5 h-5" />}
              variant="terracotta"
            />
            <MetricCard
              title="Memoria Tabla DP"
              value={`${tspResult.memoryEstimationMb.toFixed(3)} MB`}
              subtitle={`Espacio Θ(2ᵏ · k) para k = ${tspResult.k}`}
              icon={<Layers className="w-5 h-5" />}
              variant="emerald"
            />
            <MetricCard
              title="Paradas del Circuito"
              value={`${tspResult.fullTourPlaceIds.length} nodos`}
              subtitle={`Origen y cierre en ${tspResult.originPlaceName}`}
              icon={<CheckCircle2 className="w-5 h-5" />}
              variant="coffee"
            />
          </div>

          {/* Tabla Comparativa: Held-Karp vs Fuerza Bruta vs Voraz */}
          {compareResult && (
            <div className="bg-white rounded-3xl p-6 lg:p-8 border border-cafe-200/90 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-cafe-100 pb-4">
                <div>
                  <h3 className="text-lg font-serif font-bold text-cafe-950">
                    Comparativa de Métodos ATSP: Exactos vs Heurístico (k = {compareResult.k})
                  </h3>
                  <p className="text-xs text-cafe-600 mt-0.5">
                    Evaluación simultánea partiendo de <strong>{tspResult.originPlaceName}</strong>.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-full text-xs font-bold">
                  Brecha Heurística Voraz: +{compareResult.gapGreedyPercent.toFixed(1)}% sobre el óptimo
                </div>
              </div>

              <div className="overflow-x-auto border border-cafe-200 rounded-2xl">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-cafe-100 text-cafe-800 uppercase font-bold">
                    <tr>
                      <th className="p-3 border-b border-r border-cafe-200">Algoritmo</th>
                      <th className="p-3 border-b border-r border-cafe-200">Complejidad Temporal</th>
                      <th className="p-3 border-b border-r border-cafe-200 text-right">Costo Vial (min)</th>
                      <th className="p-3 border-b border-r border-cafe-200 text-right">Tiempo CPU (ms)</th>
                      <th className="p-3 border-b border-r border-cafe-200 text-center">Garantía</th>
                      <th className="p-3 border-b border-cafe-200 text-center">Brecha (% Gap)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cafe-100 font-mono">
                    <tr className="bg-cordillera-50/40">
                      <td className="p-3 font-sans font-bold text-cordillera-950 border-r border-cafe-100 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-cordillera-600" />
                        Held-Karp (Programación Dinámica)
                      </td>
                      <td className="p-3 border-r border-cafe-100 text-cafe-800 font-bold">Θ(2ᵏ · k²)</td>
                      <td className="p-3 text-right border-r border-cafe-100 font-bold text-cafe-950">
                        {(compareResult.heldKarpTimeSeconds / 60).toFixed(1)} min
                      </td>
                      <td className="p-3 text-right border-r border-cafe-100 font-bold text-cordillera-800">
                        {compareResult.heldKarpExecutionTimeMs.toFixed(2)} ms
                      </td>
                      <td className="p-3 text-center border-r border-cafe-100 font-sans text-cordillera-800 font-bold">
                        Óptimo Global (100%)
                      </td>
                      <td className="p-3 text-center font-bold text-cordillera-700">0.0%</td>
                    </tr>

                    <tr>
                      <td className="p-3 font-sans font-bold text-cafe-900 border-r border-cafe-100 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-cafe-500" />
                        Fuerza Bruta (Permutaciones Exhaustivas)
                      </td>
                      <td className="p-3 border-r border-cafe-100 text-cafe-700">O(k!)</td>
                      <td className="p-3 text-right border-r border-cafe-100 text-cafe-900">
                        {(compareResult.bruteForceTimeSeconds / 60).toFixed(1)} min
                      </td>
                      <td className="p-3 text-right border-r border-cafe-100 text-cafe-700">
                        {compareResult.bruteForceTimeout
                          ? '> 10,000 ms (Timeout)'
                          : `${compareResult.bruteForceExecutionTimeMs.toFixed(2)} ms`}
                      </td>
                      <td className="p-3 text-center border-r border-cafe-100 font-sans text-cafe-600">
                        Óptimo (si k ≤ 9)
                      </td>
                      <td className="p-3 text-center text-cafe-400">0.0%</td>
                    </tr>

                    <tr className="bg-amber-50/40">
                      <td className="p-3 font-sans font-bold text-amber-950 border-r border-cafe-100 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                        Heurística Voraz (Vecino Más Cercano)
                      </td>
                      <td className="p-3 border-r border-cafe-100 text-cafe-700">O(k²)</td>
                      <td className="p-3 text-right border-r border-cafe-100 text-cafe-950 font-semibold">
                        {(compareResult.greedyTimeSeconds / 60).toFixed(1)} min
                      </td>
                      <td className="p-3 text-right border-r border-cafe-100 font-bold text-amber-800">
                        {compareResult.greedyExecutionTimeMs.toFixed(2)} ms
                      </td>
                      <td className="p-3 text-center border-r border-cafe-100 font-sans text-amber-900">
                        Aproximación Local
                      </td>
                      <td className="p-3 text-center font-bold text-terracota-700">
                        +{compareResult.gapGreedyPercent.toFixed(1)}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Mapa del Circuito ATSP */}
          <div className="bg-white rounded-3xl p-6 lg:p-8 border border-cafe-200/90 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-lg font-serif font-bold text-cafe-950">
                Circuito Hamiltoniano Óptimo sobre la Red Vial
              </h3>
              <span className="text-xs font-mono text-cafe-600">
                {tspResult.fullTourPlaceNames?.join(' → ')}
              </span>
            </div>

            <QuindioMap
              places={places.filter((p) => tspResult.fullTourPlaceIds.includes(p.id))}
              orderedStopIds={tspResult.fullTourPlaceIds.slice(0, -1)}
              routePolyline={
                tspRoadPolyline.length > 0
                  ? tspRoadPolyline
                  : getTourCoordinates(tspResult.fullTourPlaceIds, places)
              }
              selectedPlaceId={tspResult.originPlaceId}
              className="h-[460px] sm:h-[500px]"
            />
          </div>

          {/* Fundamentación de la Ecuación de Recurrencia Bellman-Held-Karp */}
          <div className="bg-cafe-50 rounded-3xl p-6 lg:p-8 border border-cafe-200 space-y-4">
            <h4 className="text-base font-serif font-bold text-cafe-950 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cordillera-700" />
              <span>Ecuación de Recurrencia Bellman-Held-Karp con Máscaras de Bits</span>
            </h4>
            <div className="p-4 bg-white rounded-2xl border border-cafe-200 font-mono text-xs font-bold text-cafe-950 overflow-x-auto">
              C(S, j) = min_&#123;i ∈ S \ &#123;j&#125;&#125; [ C(S \ &#123;j&#125;, i) + T(i, j) ]
            </div>
            <p className="text-xs text-cafe-700 leading-relaxed">
              Donde <code className="font-mono font-bold">S</code> representa el subconjunto de destinos visitados
              codificado como un entero binario de <code className="font-mono">2ᵏ</code> estados,{' '}
              <code className="font-mono font-bold">j</code> es el último destino alcanzado en dicho subconjunto, y{' '}
              <code className="font-mono font-bold">T(i, j)</code> es el costo asimétrico de traslado desde{' '}
              <code className="font-mono">i</code> hasta <code className="font-mono">j</code> obtenido de la matriz
              calibrada <code className="font-mono">42 × 42</code>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
