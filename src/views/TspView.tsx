import React, { useState, useEffect } from 'react';
import {
  Route,
  Calendar,
  Clock,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Cpu,
  ChevronRight,
  TrendingDown,
  Layers,
  Sparkles,
  MapPin,
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
import { Badge } from '../components/common/Badge';
import { Alert } from '../components/common/Alert';
import { QuindioMap } from '../components/map/QuindioMap';

export const TspView: React.FC = () => {
  // Mode: ATSP Solver vs Day Itinerary (11h)
  const [activeTab, setActiveTab] = useState<'solver' | 'itinerary'>('itinerary');

  // Common State
  const [places, setPlaces] = useState<Place[]>([]);
  const [originId, setOriginId] = useState<string>('');
  const [selectedPlaceIds, setSelectedPlaceIds] = useState<string[]>([]);
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // ATSP Solver State
  const [algorithm, setAlgorithm] = useState<TspAlgorithm>('HELD_KARP');
  const [compareMode, setCompareMode] = useState<boolean>(true);
  const [tspResult, setTspResult] = useState<TspResult | null>(null);
  const [compareResult, setCompareResult] = useState<CompareTspResult | null>(null);
  const [tspRoadPolyline, setTspRoadPolyline] = useState<Coordinate[]>([]);

  // Day Itinerary State
  const [itineraryResult, setItineraryResult] = useState<DayItineraryResult | null>(null);
  const [itineraryRoadPolyline, setItineraryRoadPolyline] = useState<Coordinate[]>([]);

  // Initial load
  useEffect(() => {
    loadPlaces();
  }, []);

  const loadPlaces = async () => {
    try {
      const data = await placesApi.getAll();
      setPlaces(data);
      if (data.length > 0) {
        // Set default origin (Armenia)
        const armenia = data.find((p) => p.name.toLowerCase().includes('armenia')) || data[0];
        setOriginId(armenia.id);

        // Preselect 7 popular attractions for the 11h itinerary
        const sampleAttractions = data
          .filter((p) => p.category === 'ATRACTIVO_TURISTICO' && p.id !== armenia.id)
          .slice(0, 7)
          .map((p) => p.id);
        setSelectedPlaceIds(sampleAttractions);
      }
    } catch (err: any) {
      console.error('Error cargando lugares:', err);
      setError('No se pudo conectar con el backend (puerto 8080).');
    }
  };

  // Toggle place selection
  const togglePlace = (id: string) => {
    if (selectedPlaceIds.includes(id)) {
      setSelectedPlaceIds(selectedPlaceIds.filter((pId) => pId !== id));
    } else {
      if (selectedPlaceIds.length >= 10 && activeTab === 'solver') {
        alert('Para el solucionador exacto Held-Karp/Fuerza Bruta se recomienda un máximo de 10 lugares.');
        return;
      }
      setSelectedPlaceIds([...selectedPlaceIds, id]);
    }
  };

  // Quick preset handlers
  const applyPreset = (type: 'cafetera' | 'cordillera' | 'familiar') => {
    if (places.length === 0) return;
    let selected: string[] = [];
    if (type === 'cafetera') {
      selected = places
        .filter((p) =>
          ['parque del café', 'recuca', 'jardín botánico', 'valle del cocora', 'panaca', 'filandia'].some((k) =>
            p.name.toLowerCase().includes(k)
          )
        )
        .map((p) => p.id);
    } else if (type === 'cordillera') {
      selected = places
        .filter((p) => ['salento', 'filandia', 'circasia', 'buenavista', 'pijao', 'córdoba'].some((k) => p.municipality.toLowerCase().includes(k)))
        .slice(0, 7)
        .map((p) => p.id);
    } else {
      selected = places
        .filter((p) => p.category === 'ATRACTIVO_TURISTICO')
        .slice(0, 6)
        .map((p) => p.id);
    }
    setSelectedPlaceIds(selected);
  };

  // Execute ATSP Solver
  const handleSolveTsp = async () => {
    if (!originId || selectedPlaceIds.length < 2) {
      setError('Por favor selecciona un punto de origen y al menos 2 atractivos turísticos para visitar.');
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

      // Proyectar el circuito óptimo sobre la red vial continua de OpenStreetMap
      if (finalTourIds && finalTourIds.length > 0) {
        const baseCoords = getTourCoordinates(finalTourIds);
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

  // Execute Day Itinerary
  const handlePlanItinerary = async () => {
    if (!originId || selectedPlaceIds.length < 3) {
      setError('Por favor selecciona un punto de partida y al menos 3 atractivos (recomendado 6 a 8).');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await tspApi.planDayItinerary(originId, selectedPlaceIds);
      setItineraryResult(res);

      // Proyectar el itinerario sobre carreteras terrestres reales
      const tourIds = [res.originPlaceId, ...res.stops.map((s) => s.placeId)];
      const baseCoords = getTourCoordinates(tourIds);
      getTourRealRoadRoute(baseCoords)
        .then((roadCoords) => {
          if (roadCoords && roadCoords.length > 0) setItineraryRoadPolyline(roadCoords);
          else setItineraryRoadPolyline(baseCoords);
        })
        .catch(() => setItineraryRoadPolyline(baseCoords));
    } catch (err: any) {
      console.error('Error planificando itinerario de 11h:', err);
      setError(err.message || 'Error al procesar el itinerario con poda.');
    } finally {
      setLoading(false);
    }
  };

  // Tour coordinates for map polyline
  const getTourCoordinates = (placeIds: string[]): Coordinate[] => {
    const coords: Coordinate[] = [];
    placeIds.forEach((id) => {
      const p = places.find((item) => item.id === id);
      if (p) coords.push({ latitude: p.latitude, longitude: p.longitude });
    });
    // Close the loop to origin
    if (coords.length > 0 && placeIds.length > 0) {
      const orig = places.find((item) => item.id === placeIds[0]);
      if (orig) coords.push({ latitude: orig.latitude, longitude: orig.longitude });
    }
    return coords;
  };

  const originPlace = places.find((p) => p.id === originId);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Editorial Header */}
      <div className="bg-gradient-to-r from-cafe-900 via-amber-950 to-cafe-900 text-white rounded-3xl p-8 shadow-xl border border-amber-900/60">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-900/70 text-amber-200 text-xs font-semibold uppercase tracking-wider mb-4 border border-amber-700">
            <Route className="w-3.5 h-3.5 text-amber-400" />
            Módulo R4 • Optimización Combinatoria NP-Hard & ATSP
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-cafe-50 tracking-tight leading-tight">
            Viajante Asimétrico (ATSP) & Itinerario de 11 Horas
          </h1>
          <p className="mt-3 text-cafe-200 text-sm sm:text-base leading-relaxed">
            Resolución exacta mediante programación dinámica <strong>Held-Karp</strong> <code className="text-amber-300 font-mono text-xs bg-cafe-800 px-1.5 py-0.5 rounded border border-cafe-700">O(2^k k^2)</code> con máscaras de bits, contrastada contra búsqueda exhaustiva <code className="text-amber-300 font-mono text-xs bg-cafe-800 px-1.5 py-0.5 rounded border border-cafe-700">O(k!)</code> y heurística voraz.
            Incluye el planificador con <strong>algoritmo de poda sistemática</strong> para garantizar jornadas turísticas de máximo 11 horas.
          </p>
        </div>
      </div>

      {error && <Alert type="error" title="Atención">{error}</Alert>}

      {/* Tab Selector: Solver vs Itinerary */}
      <div className="flex border-b border-cafe-200">
        <button
          onClick={() => setActiveTab('itinerary')}
          className={`flex items-center gap-2.5 px-6 py-3.5 font-serif font-bold text-sm transition-all border-b-2 -mb-px ${
            activeTab === 'itinerary'
              ? 'border-cordillera-600 text-cordillera-900 bg-white rounded-t-2xl'
              : 'border-transparent text-cafe-600 hover:text-cafe-900'
          }`}
        >
          <Calendar className="w-4 h-4 text-cordillera-600" />
          <span>Itinerario de un Día (11 Horas con Poda)</span>
          <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-cordillera-100 text-cordillera-800 font-semibold">
            Requerimiento Principal
          </span>
        </button>

        <button
          onClick={() => setActiveTab('solver')}
          className={`flex items-center gap-2.5 px-6 py-3.5 font-serif font-bold text-sm transition-all border-b-2 -mb-px ${
            activeTab === 'solver'
              ? 'border-amber-600 text-amber-950 bg-white rounded-t-2xl'
              : 'border-transparent text-cafe-600 hover:text-cafe-900'
          }`}
        >
          <Cpu className="w-4 h-4 text-amber-600" />
          <span>Solucionador ATSP Teórico (Held-Karp vs Voraz)</span>
        </button>
      </div>

      {/* Place Selection & Origin Controls */}
      <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-md border border-cafe-200 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-cafe-100 pb-5">
          <div>
            <h2 className="text-lg font-serif font-bold text-cafe-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-terracota-600" />
              Configuración de Atractivos a Visitar
            </h2>
            <p className="text-xs text-cafe-600 mt-0.5">
              Selecciona el punto de partida y los lugares a incluir en el circuito.
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-cafe-600">Plantillas rápidas:</span>
            <button
              onClick={() => applyPreset('cafetera')}
              className="text-xs px-3 py-1.5 rounded-lg bg-cafe-100 hover:bg-cafe-200 text-cafe-800 font-medium transition-colors"
            >
              Ruta Cafetera (6)
            </button>
            <button
              onClick={() => applyPreset('cordillera')}
              className="text-xs px-3 py-1.5 rounded-lg bg-cafe-100 hover:bg-cafe-200 text-cafe-800 font-medium transition-colors"
            >
              Pueblos Cordillera (7)
            </button>
            <button
              onClick={() => applyPreset('familiar')}
              className="text-xs px-3 py-1.5 rounded-lg bg-cafe-100 hover:bg-cafe-200 text-cafe-800 font-medium transition-colors"
            >
              Aventura Familiar (6)
            </button>
          </div>
        </div>

        {/* Origin Selector */}
        <div className="max-w-md space-y-1.5">
          <label className="block text-xs font-bold text-cafe-700 uppercase tracking-wider">
            Punto de Partida y Regreso (Origen / Hotel)
          </label>
          <select
            value={originId}
            onChange={(e) => setOriginId(e.target.value)}
            className="w-full bg-cafe-50 border border-cafe-300 rounded-xl px-4 py-2.5 text-sm font-medium text-cafe-900 focus:ring-2 focus:ring-cordillera-500 focus:outline-none"
          >
            {places.map((p) => (
              <option key={`orig-${p.id}`} value={p.id}>
                {p.name} ({p.municipality})
              </option>
            ))}
          </select>
          {originPlace && (
            <p className="text-xs text-cafe-500">
              Categoría: <span className="font-semibold">{originPlace.category}</span> • Municipio: {originPlace.municipality}
            </p>
          )}
        </div>

        {/* Attractions Selector Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-cafe-700 uppercase tracking-wider">
              Atractivos Turísticos ({selectedPlaceIds.length} seleccionados):
            </label>
            <input
              type="text"
              placeholder="Buscar atractivo..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="px-3 py-1 bg-cafe-50 border border-cafe-200 rounded-lg text-xs text-cafe-900 w-48 focus:outline-none focus:ring-1 focus:ring-cordillera-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-64 overflow-y-auto p-3 bg-cafe-50 rounded-2xl border border-cafe-200 shadow-inner">
            {places
              .filter((p) => p.id !== originId)
              .filter((p) =>
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
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-cordillera-50 border-cordillera-400 text-cordillera-900 font-semibold shadow-sm'
                        : 'bg-white border-cafe-200 text-cafe-700 hover:border-cafe-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="mt-0.5 rounded text-cordillera-600 focus:ring-cordillera-500 border-cafe-300 pointer-events-none"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-cafe-900">{place.name}</p>
                      <p className="text-[10px] text-cafe-500">
                        {place.municipality} • Visita: {place.visitDurationMinutes} min
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Action Button for current tab */}
        <div className="pt-4 border-t border-cafe-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-cafe-600">
            {activeTab === 'itinerary' ? (
              <span>Límite estricto de jornada: <strong className="text-cafe-900">11 Horas (660 min)</strong>. Poda automática si el tiempo de visita + traslados excede el cupo.</span>
            ) : (
              <span>Complejidad Held-Karp: <code className="font-mono font-bold text-amber-800">O(2^k · k^2)</code>. Búsqueda de ciclo hamiltoniano asimétrico de costo mínimo.</span>
            )}
          </div>

          {activeTab === 'itinerary' ? (
            <button
              onClick={handlePlanItinerary}
              disabled={loading || selectedPlaceIds.length < 3}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-cordillera-600 hover:bg-cordillera-700 text-white font-semibold text-sm shadow-md transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Procesando Itinerario y Poda...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Optimizar Itinerario de 11h</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-cafe-800">
                <input
                  type="checkbox"
                  checked={compareMode}
                  onChange={(e) => setCompareMode(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 border-cafe-300"
                />
                Comparar Held-Karp vs Fuerza Bruta vs Voraz
              </label>

              <button
                onClick={handleSolveTsp}
                disabled={loading || selectedPlaceIds.length < 2}
                className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm shadow-md transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Resolviendo ATSP...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-white" />
                    <span>Resolver ATSP</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RESULTS: TAB 1 ITINERARY (11 HOURS) */}
      {activeTab === 'itinerary' && itineraryResult && (
        <div className="space-y-6">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Duración Total Jornada"
              value={`${itineraryResult.totalDurationHours.toFixed(1)} h`}
              subtitle={`${itineraryResult.totalDurationMinutes} min (de máx 11.0 h)`}
              icon={<Clock className="w-5 h-5 text-cordillera-700" />}
              variant={itineraryResult.fitsIn11Hours ? 'emerald' : 'terracotta'}
            />
            <MetricCard
              title="Tiempo en Tránsito"
              value={`${(itineraryResult.totalTravelMinutes / 60).toFixed(1)} h`}
              subtitle={`${itineraryResult.totalTravelMinutes} min en carretera`}
              icon={<Route className="w-5 h-5 text-amber-700" />}
              variant="amber"
            />
            <MetricCard
              title="Tiempo en Visitas"
              value={`${(itineraryResult.totalVisitMinutes / 60).toFixed(1)} h`}
              subtitle={`${itineraryResult.totalVisitMinutes} min de actividades`}
              icon={<Calendar className="w-5 h-5 text-cafe-800" />}
              variant="coffee"
            />
            <MetricCard
              title="Atractivos Visitados"
              value={`${itineraryResult.finalAttractionsCount} de ${itineraryResult.initialAttractionsCount}`}
              subtitle={itineraryResult.prunedAttractions.length > 0 ? `${itineraryResult.prunedAttractions.length} podados` : '0 podados (cupo exacto)'}
              icon={<CheckCircle2 className="w-5 h-5 text-cordillera-700" />}
              variant="emerald"
            />
          </div>

          {/* Pruning Alert Banner (if any were pruned) */}
          {itineraryResult.prunedAttractions.length > 0 && (
            <div className="bg-amber-50 rounded-2xl p-6 border border-amber-300 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-serif font-bold text-base">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>Aplicación de Poda Sistemática de Atractivos</span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed">
                El conjunto inicial de atractivos ({itineraryResult.initialAttractionsCount}) requería un tiempo acumulado superior al cupo legal de la jornada turística (11 horas / 660 minutos). Se ejecutó el algoritmo de poda para descartar las atracciones con mayor desvío marginal y menor relación permanencia/traslado:
              </p>
              <div className="space-y-2 mt-2">
                {itineraryResult.prunedAttractions.map((prunedName, i) => (
                  <div key={`pruned-${i}`} className="p-3 bg-white rounded-xl border border-amber-200 text-xs flex items-start gap-2">
                    <TrendingDown className="w-4 h-4 text-terracota-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-cafe-900">{prunedName}:</span>{' '}
                      <span className="text-cafe-700">
                        {itineraryResult.pruningJustifications[i] || 'Descartado por costo marginal excesivo en matriz asimétrica.'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-[11px] text-amber-800 italic pt-1">
                ✓ El circuito restante de {itineraryResult.finalAttractionsCount} atractivos fue recalculado de forma óptima mediante <strong>Held-Karp</strong> para garantizar el retorno puntual a {itineraryResult.originPlaceName}.
              </div>
            </div>
          )}

          {/* Interactive Map of the 11h Tour */}
          <div className="bg-white rounded-3xl p-6 lg:p-8 border border-cafe-200 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-serif font-bold text-cafe-900">
                  Cartografía del Itinerario Optimizado
                </h3>
                <p className="text-xs text-cafe-600 mt-0.5">
                  Circuito cerrado con origen y retorno en {itineraryResult.originPlaceName}.
                </p>
              </div>
              <span className="px-3 py-1 bg-cordillera-50 text-cordillera-700 border border-cordillera-200 rounded-full text-xs font-semibold">
                Jornada de {itineraryResult.totalDurationHours.toFixed(1)} h
              </span>
            </div>

            <QuindioMap
              places={places.filter((p) =>
                itineraryResult.stops.some((s) => s.placeId === p.id) || p.id === itineraryResult.originPlaceId
              )}
              routePolyline={
                itineraryRoadPolyline.length > 0
                  ? itineraryRoadPolyline
                  : getTourCoordinates([
                      itineraryResult.originPlaceId,
                      ...itineraryResult.stops.map((s) => s.placeId),
                    ])
              }
              selectedPlaceId={itineraryResult.originPlaceId}
              className="h-[460px] rounded-2xl overflow-hidden border border-cafe-200 shadow-inner"
            />
          </div>

          {/* Chronological Stop Timeline */}
          <div className="bg-white rounded-3xl p-6 lg:p-8 border border-cafe-200 shadow-md space-y-6">
            <div className="border-b border-cafe-100 pb-4">
              <h3 className="text-lg font-serif font-bold text-cafe-900">
                Cronograma Detallado de Paradas (08:00 AM - 19:00 PM)
              </h3>
              <p className="text-xs text-cafe-600 mt-0.5">
                Secuencia temporal minuto a minuto con tiempos de traslado entre atractivos y tiempo asignado a cada experiencia.
              </p>
            </div>

            <div className="relative border-l-2 border-cafe-300 ml-4 space-y-6 py-2">
              {/* Departure Start */}
              <div className="relative pl-6">
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-cordillera-600 border-2 border-white shadow"></div>
                <div className="bg-cafe-50 p-4 rounded-xl border border-cafe-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-cordillera-700 uppercase">
                      08:00 AM • Inicio de Jornada
                    </span>
                    <span className="text-xs text-cafe-500 font-medium">Parada 0</span>
                  </div>
                  <h4 className="text-base font-serif font-bold text-cafe-900 mt-1">
                    {itineraryResult.originPlaceName} (Punto de Salida)
                  </h4>
                  <p className="text-xs text-cafe-600 mt-0.5">
                    Preparación, abastecimiento y partida inicial.
                  </p>
                </div>
              </div>

              {/* Intermediate Stops */}
              {itineraryResult.stops.map((stop, idx) => {
                const totalMinutesSoFar = Math.round(stop.accumulatedTimeHours * 60);
                const startHour = 8 + Math.floor(totalMinutesSoFar / 60);
                const startMin = totalMinutesSoFar % 60;
                const formattedTime = `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`;

                return (
                  <div key={`stop-${stop.placeId}-${idx}`} className="relative pl-6">
                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-amber-500 border-2 border-white shadow"></div>
                    <div className="bg-white p-4 rounded-xl border border-cafe-200 shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-mono text-amber-800">
                          ~ {formattedTime} • Parada #{idx + 1}
                        </span>
                        <span className="text-xs font-mono font-semibold text-cafe-700">
                          Acumulado: {stop.accumulatedTimeHours.toFixed(1)} h
                        </span>
                      </div>

                      <h4 className="text-base font-serif font-bold text-cafe-900">
                        {stop.placeName}
                      </h4>

                      <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-cafe-100">
                        <div className="flex items-center gap-1.5 text-cafe-700">
                          <Route className="w-3.5 h-3.5 text-terracota-600" />
                          <span>Traslado: <strong>{stop.travelFromPreviousMinutes.toFixed(0)} min</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5 text-cafe-700">
                          <Clock className="w-3.5 h-3.5 text-cordillera-600" />
                          <span>Permanencia: <strong>{stop.visitDurationMinutes} min</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Final Return */}
              <div className="relative pl-6">
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-cordillera-700 border-2 border-white shadow"></div>
                <div className="bg-cordillera-50 p-4 rounded-xl border border-cordillera-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-cordillera-800 uppercase">
                      Llegada Final • Fin de la Jornada
                    </span>
                    <span className="text-xs text-cordillera-700 font-semibold">
                      Duración Total: {itineraryResult.totalDurationHours.toFixed(2)} h (≤ 11h)
                    </span>
                  </div>
                  <h4 className="text-base font-serif font-bold text-cordillera-950 mt-1">
                    Retorno a {itineraryResult.originPlaceName}
                  </h4>
                  <p className="text-xs text-cordillera-800 mt-0.5">
                    Cierre exitoso del circuito con margen de seguridad ante imprevistos viales.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESULTS: TAB 2 ATSP SOLVER */}
      {activeTab === 'solver' && tspResult && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Tiempo Total de Viaje"
              value={`${tspResult.totalTravelTimeHours.toFixed(1)} h`}
              subtitle={`${tspResult.totalTravelTimeMinutes.toFixed(1)} min de carretera`}
              icon={<Route className="w-5 h-5 text-amber-700" />}
              variant="amber"
            />
            <MetricCard
              title="Tiempo Cómputo CPU"
              value={`${tspResult.executionTimeMs.toFixed(2)} ms`}
              subtitle={`Algoritmo: ${tspResult.algorithm}`}
              icon={<Zap className="w-5 h-5 text-terracota-700" />}
              variant="terracotta"
            />
            <MetricCard
              title="Memoria Dinámica"
              value={`${tspResult.memoryEstimationMb.toFixed(2)} MB`}
              subtitle={`Tabla O(2^k · k) con k=${tspResult.k}`}
              icon={<Layers className="w-5 h-5 text-cordillera-700" />}
              variant="emerald"
            />
            <MetricCard
              title="Lugares en el Circuito"
              value={`${tspResult.fullTourPlaceIds.length} paradas`}
              subtitle={`Ciclo cerrado a ${tspResult.originPlaceName}`}
              icon={<CheckCircle2 className="w-5 h-5 text-cafe-800" />}
              variant="coffee"
            />
          </div>

          {/* Comparison Table (Held-Karp vs Fuerza Bruta vs Voraz) */}
          {compareResult && (
            <div className="bg-white rounded-3xl p-6 lg:p-8 border border-cafe-200 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-cafe-100 pb-4">
                <div>
                  <h3 className="text-lg font-serif font-bold text-cafe-900">
                    Comparativa de Enfoques: Exacto vs Heurístico (k = {compareResult.k})
                  </h3>
                  <p className="text-xs text-cafe-600 mt-0.5">
                    Evaluación simultánea con origen en {tspResult.originPlaceName}.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-full text-xs font-semibold">
                  Brecha Voraz: {compareResult.gapGreedyPercent.toFixed(1)}% respecto al óptimo
                </div>
              </div>

              <div className="overflow-x-auto border border-cafe-200 rounded-2xl">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-cafe-100 text-cafe-800 uppercase font-semibold">
                    <tr>
                      <th className="p-3 border-b border-r border-cafe-200">Algoritmo</th>
                      <th className="p-3 border-b border-r border-cafe-200">Complejidad Teórica</th>
                      <th className="p-3 border-b border-r border-cafe-200 text-right">Tiempo Viaje (h)</th>
                      <th className="p-3 border-b border-r border-cafe-200 text-right">Tiempo CPU (ms)</th>
                      <th className="p-3 border-b border-r border-cafe-200 text-center">Garantía</th>
                      <th className="p-3 border-b border-cafe-200 text-center">Brecha (% Gap)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cafe-100 font-mono">
                    {/* Held-Karp */}
                    <tr className="bg-cordillera-50/40">
                      <td className="p-3 font-sans font-bold text-cordillera-900 border-r border-cafe-100 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-cordillera-600"></span>
                        Held-Karp (Prog. Dinámica)
                      </td>
                      <td className="p-3 border-r border-cafe-100 text-cafe-700">O(2^k · k^2)</td>
                      <td className="p-3 text-right border-r border-cafe-100 font-bold text-cafe-900">
                        {(compareResult.heldKarpTimeSeconds / 3600).toFixed(2)} h
                      </td>
                      <td className="p-3 text-right border-r border-cafe-100 font-bold text-cordillera-800">
                        {compareResult.heldKarpExecutionTimeMs.toFixed(2)} ms
                      </td>
                      <td className="p-3 text-center border-r border-cafe-100 font-sans text-cordillera-700 font-semibold">
                        Óptimo Global (100%)
                      </td>
                      <td className="p-3 text-center font-bold text-cordillera-700">0.0%</td>
                    </tr>

                    {/* Fuerza Bruta */}
                    <tr>
                      <td className="p-3 font-sans font-bold text-cafe-900 border-r border-cafe-100 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-cafe-500"></span>
                        Fuerza Bruta (Exhaustivo)
                      </td>
                      <td className="p-3 border-r border-cafe-100 text-cafe-700">O(k!)</td>
                      <td className="p-3 text-right border-r border-cafe-100 text-cafe-900">
                        {(compareResult.bruteForceTimeSeconds / 3600).toFixed(2)} h
                      </td>
                      <td className="p-3 text-right border-r border-cafe-100 text-cafe-700">
                        {compareResult.bruteForceTimeout ? '> 10,000 ms (Timeout)' : `${compareResult.bruteForceExecutionTimeMs.toFixed(2)} ms`}
                      </td>
                      <td className="p-3 text-center border-r border-cafe-100 font-sans text-cafe-600">
                        Óptimo (si no satura)
                      </td>
                      <td className="p-3 text-center text-cafe-400">—</td>
                    </tr>

                    {/* Voraz */}
                    <tr className="bg-amber-50/40">
                      <td className="p-3 font-sans font-bold text-amber-950 border-r border-cafe-100 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                        Heurística Voraz (Vecino Cercano)
                      </td>
                      <td className="p-3 border-r border-cafe-100 text-cafe-700">O(k^2)</td>
                      <td className="p-3 text-right border-r border-cafe-100 text-cafe-900">
                        {(compareResult.greedyTimeSeconds / 3600).toFixed(2)} h
                      </td>
                      <td className="p-3 text-right border-r border-cafe-100 font-bold text-amber-800">
                        {compareResult.greedyExecutionTimeMs.toFixed(2)} ms
                      </td>
                      <td className="p-3 text-center border-r border-cafe-100 font-sans text-amber-800">
                        Aproximación local
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

          {/* Tour Map */}
          <div className="bg-white rounded-3xl p-6 lg:p-8 border border-cafe-200 shadow-md space-y-4">
            <h3 className="text-lg font-serif font-bold text-cafe-900">
              Circuito Óptimo Proyectado sobre la Cartografía
            </h3>
            <QuindioMap
              places={places.filter((p) => tspResult.fullTourPlaceIds.includes(p.id))}
              routePolyline={
                tspRoadPolyline.length > 0
                  ? tspRoadPolyline
                  : getTourCoordinates(tspResult.fullTourPlaceIds)
              }
              selectedPlaceId={tspResult.originPlaceId}
              className="h-[460px] rounded-2xl overflow-hidden border border-cafe-200 shadow-inner"
            />
          </div>

          {/* Recurrence & Bitmask Card */}
          <div className="bg-cafe-50 rounded-3xl p-6 lg:p-8 border border-cafe-200 space-y-4">
            <h4 className="text-sm font-serif font-bold text-cafe-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cordillera-700" />
              Ecuación de Recurrencia Bellman-Held-Karp con Máscaras de Bits
            </h4>
            <div className="p-4 bg-white rounded-2xl border border-cafe-200 font-mono text-xs text-cafe-900 overflow-x-auto">
              {"C(S, v) = min_{u ∈ S \\ {v}} [ C(S \\ {v}, u) + W(u, v) ]"}
            </div>
            <p className="text-xs text-cafe-700 leading-relaxed">
              Donde <code className="font-mono">S</code> es el subconjunto de nodos visitados codificado como un entero de bits (bitmask de <code className="font-mono">2^k</code> estados), <code className="font-mono">v</code> es el último nodo alcanzado y <code className="font-mono">W(u, v)</code> es el tiempo de viaje tomado directamente de la matriz asimétrica calculada con Dijkstra. El caso base corresponde a <code className="font-mono">{"C({s}, s) = 0"}</code>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
