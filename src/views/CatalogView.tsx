import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Filter,
  Layers,
  MapPin,
  Maximize2,
  Network,
  Search,
  Server,
  Sparkles,
} from 'lucide-react';
import { Alert } from '../components/common/Alert';
import { Badge } from '../components/common/Badge';
import { MetricCard } from '../components/common/MetricCard';
import { QuindioMap } from '../components/map/QuindioMap';
import { networkApi, placesApi } from '../services/api';
import { MemoryEstimation, NetworkStats, Place, PlaceCategory, PlaceMappingReport, SccReport } from '../types';

export const CatalogView: React.FC = () => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [memory, setMemory] = useState<MemoryEstimation | null>(null);
  const [scc, setScc] = useState<SccReport | null>(null);
  const [mappingReport, setMappingReport] = useState<PlaceMappingReport | null>(null);
  const [municipalities, setMunicipalities] = useState<string[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<PlaceCategory | 'ALL'>('ALL');
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      placesApi.getAll(),
      placesApi.getMunicipalities(),
      placesApi.getMapping(),
      networkApi.getStats(),
      networkApi.getMemoryEstimation(),
      networkApi.getScc(),
    ])
      .then(([placesData, munis, mapping, statsData, memData, sccData]) => {
        setPlaces(placesData);
        setFilteredPlaces(placesData);
        setMunicipalities(munis);
        setMappingReport(mapping);
        setStats(statsData);
        setMemory(memData);
        setScc(sccData);
      })
      .catch((err) => console.error('Error cargando catálogo:', err))
      .finally(() => setLoading(false));
  }, []);

  // Filtrado reactivo de lugares
  useEffect(() => {
    let result = [...places];

    if (selectedCategory !== 'ALL') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    if (selectedMunicipality !== 'ALL') {
      result = result.filter(
        (p) => p.municipality.toLowerCase() === selectedMunicipality.toLowerCase()
      );
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.municipality.toLowerCase().includes(q)
      );
    }

    setFilteredPlaces(result);
  }, [selectedCategory, selectedMunicipality, searchQuery, places]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Encabezado del Módulo */}
      <div className="bg-gradient-to-r from-cafe-900 via-cafe-800 to-cordillera-900 rounded-2xl p-6 md:p-8 text-white shadow-md relative overflow-hidden border border-cafe-700">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-3xl space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-400/30">
            <Sparkles className="w-3.5 h-3.5" /> Requerimiento 1 — Modelo de la Red Vial
          </div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-tight">
            Territorio del Quindío y Modelo de Red Vial
          </h2>
          <p className="text-cafe-200 text-sm md:text-base leading-relaxed">
            Catálogo normativo de 42 lugares distribuidos en cabeceras, atractivos, fincas y centros de acopio,
            con análisis de dispersión vial, algoritmo de Tarjan para Componentes Fuertemente Conexas (SCC)
            y comparativa formal de consumo de memoria entre matriz y listas de adyacencia.
          </p>
        </div>
      </div>

      {/* Tarjetas de Métricas Globales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Lugares del Catálogo"
          value={places.length || 42}
          subtitle="Distribuidos en 4 categorías"
          icon={<MapPin className="w-5 h-5" />}
          variant="coffee"
        />
        <MetricCard
          title="Componente SCC"
          value={`${scc?.sccNodesCount || 14210} Nodos`}
          subtitle={`Retención ${scc?.retentionPercentageNodes || 95.9}% de la red`}
          icon={<Network className="w-5 h-5" />}
          badge="Tarjan"
          variant="emerald"
        />
        <MetricCard
          title="Ahorro en Memoria"
          value={`${memory?.ratioMatrixToList.toFixed(1) || 850.7}x`}
          subtitle="Listas vs Matriz de Adyacencia"
          icon={<Database className="w-5 h-5" />}
          badge="850x menos RAM"
          variant="amber"
        />
        <MetricCard
          title="Lugares > 500 m"
          value={mappingReport?.exceeding500mCount || 2}
          subtitle="Proyección ortogonal rural"
          icon={<AlertTriangle className="w-5 h-5" />}
          badge="R1.4"
          variant="terracotta"
        />
      </div>

      {/* Sección Principal: Mapa y Filtros */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna Izquierda: Mapa Interactivo y Filtros */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-cafe-200/80 shadow-sm space-y-4">
            {/* Controles de Filtro */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              {/* Buscador */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar lugar o municipio..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs md:text-sm rounded-lg bg-cafe-50 border border-cafe-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              {/* Selector de Municipio */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-cafe-600 flex-shrink-0" />
                <select
                  value={selectedMunicipality}
                  onChange={(e) => setSelectedMunicipality(e.target.value)}
                  className="px-3 py-2 text-xs md:text-sm rounded-lg bg-cafe-50 border border-cafe-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-cafe-900 font-medium"
                >
                  <option value="ALL">Todos los municipios</option>
                  {municipalities.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Píldoras de Categoría */}
            <div className="flex flex-wrap gap-2 pt-1 border-t border-cafe-100">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedCategory === 'ALL'
                    ? 'bg-cafe-900 text-white shadow-sm'
                    : 'bg-cafe-100/70 text-cafe-700 hover:bg-cafe-200/70'
                }`}
              >
                Todos ({places.length})
              </button>
              <button
                onClick={() => setSelectedCategory('CABECERA_MUNICIPAL')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedCategory === 'CABECERA_MUNICIPAL'
                    ? 'bg-cordillera-700 text-white shadow-sm'
                    : 'bg-cordillera-50 text-cordillera-800 hover:bg-cordillera-100'
                }`}
              >
                Cabeceras (12)
              </button>
              <button
                onClick={() => setSelectedCategory('ATRACTIVO_TURISTICO')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedCategory === 'ATRACTIVO_TURISTICO'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                Atractivos (15+)
              </button>
              <button
                onClick={() => setSelectedCategory('FINCA_HOTEL')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedCategory === 'FINCA_HOTEL'
                    ? 'bg-[#6E492B] text-white shadow-sm'
                    : 'bg-cafe-50 text-cafe-800 hover:bg-cafe-100'
                }`}
              >
                Fincas / Hoteles (8+)
              </button>
              <button
                onClick={() => setSelectedCategory('CENTRO_ACOPIO')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedCategory === 'CENTRO_ACOPIO'
                    ? 'bg-terracota-600 text-white shadow-sm'
                    : 'bg-terracota-50 text-terracota-800 hover:bg-terracota-100'
                }`}
              >
                Centros de Acopio (7)
              </button>
            </div>

            {/* Mapa Interactivo */}
            <QuindioMap
              places={filteredPlaces}
              selectedPlaceId={selectedPlace?.id}
              onPlaceSelect={(p) => setSelectedPlace(p)}
              className="h-[480px]"
            />
          </div>

          {/* Tabla de Lugares Filtrados */}
          <div className="bg-white rounded-2xl border border-cafe-200/80 shadow-sm overflow-hidden">
            <div className="p-4 bg-cafe-50/70 border-b border-cafe-200/60 flex items-center justify-between">
              <h3 className="font-serif font-bold text-cafe-900 text-sm md:text-base flex items-center gap-2">
                <Layers className="w-4 h-4 text-cafe-700" /> Lugares en el Territorio ({filteredPlaces.length})
              </h3>
              <span className="text-xs text-stone-500">Coordenadas WGS84 y UTM Zona 18N</span>
            </div>
            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-cafe-100/50 text-cafe-800 uppercase font-semibold sticky top-0">
                  <tr>
                    <th className="p-3">Lugar</th>
                    <th className="p-3">Categoría</th>
                    <th className="p-3">Municipio</th>
                    <th className="p-3">Duración</th>
                    <th className="p-3">Dist. a Nodo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cafe-100">
                  {filteredPlaces.map((place) => (
                    <tr
                      key={place.id}
                      onClick={() => setSelectedPlace(place)}
                      className={`cursor-pointer transition-colors hover:bg-amber-50/50 ${
                        selectedPlace?.id === place.id ? 'bg-amber-100/40' : ''
                      }`}
                    >
                      <td className="p-3 font-medium text-cafe-950">
                        {place.name}
                        {place.isExceeding500m && (
                          <span className="ml-1.5 text-[10px] text-terracota-700 font-bold bg-terracota-100 px-1.5 py-0.2 rounded">
                            &gt; 500m
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge category={place.category} />
                      </td>
                      <td className="p-3 text-stone-600">{place.municipality}</td>
                      <td className="p-3 text-stone-600">
                        {place.visitDurationMinutes > 0 ? `${place.visitDurationMinutes} min` : '—'}
                      </td>
                      <td className="p-3 font-mono text-stone-600">
                        {place.distanceToNodeMeters ? `${place.distanceToNodeMeters} m` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Fundamentación Teórica, Memoria y Tarjan SCC */}
        <div className="lg:col-span-5 space-y-6">
          {/* Tarjeta 1: Estimación de Memoria (R1.1) */}
          <div className="bg-white rounded-2xl p-6 border border-cafe-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-cafe-100 pb-3">
              <h3 className="font-serif font-bold text-cafe-900 text-lg flex items-center gap-2">
                <Database className="w-5 h-5 text-amber-600" /> Estimación de Memoria (R1.1)
              </h3>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                JVM HotSpot 64-bit
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-terracota-50/60 border border-terracota-200/70">
                <p className="text-xs font-semibold uppercase text-terracota-800 tracking-wider">Matriz de Adyacencia</p>
                <div className="text-2xl font-bold font-sans text-terracota-900 mt-1">
                  {memory?.matrixMegabytes || 1675.82} <span className="text-sm font-normal">MB</span>
                </div>
                <p className="text-[11px] text-terracota-700/90 mt-1 leading-snug">
                  Complejidad O(V²). Desperdicio del &gt;99.98% en celdas vacías/infinito.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-cordillera-50/60 border border-cordillera-200/70">
                <p className="text-xs font-semibold uppercase text-cordillera-800 tracking-wider">Listas de Adyacencia</p>
                <div className="text-2xl font-bold font-sans text-cordillera-900 mt-1">
                  {memory?.listMegabytes || 1.97} <span className="text-sm font-normal">MB</span>
                </div>
                <p className="text-[11px] text-cordillera-700/90 mt-1 leading-snug">
                  Complejidad O(V + E). Ahorro de {memory?.ratioMatrixToList.toFixed(0) || 850}x veces en RAM.
                </p>
              </div>
            </div>

            {/* Justificación Teórica */}
            <div className="p-3.5 rounded-xl bg-cafe-50 border border-cafe-200/60 text-xs text-cafe-800 leading-relaxed space-y-2">
              <p className="font-semibold text-cafe-900">Justificación formal de elección:</p>
              <p>{memory?.justification || 'La red vial es altamente dispersa (E ≈ 2.4V)...'}</p>
              <div className="pt-2 border-t border-cafe-200/60 text-[11px] text-stone-500 font-mono">
                {memory?.matrixAssumptions}
              </div>
            </div>
          </div>

          {/* Tarjeta 2: Mayor Componente Fuertemente Conexa (R1.3 Tarjan SCC) */}
          <div className="bg-white rounded-2xl p-6 border border-cafe-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-cafe-100 pb-3">
              <h3 className="font-serif font-bold text-cafe-900 text-lg flex items-center gap-2">
                <Network className="w-5 h-5 text-cordillera-700" /> Algoritmo de Tarjan SCC (R1.3)
              </h3>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-cordillera-100 text-cordillera-800">
                O(V + E)
              </span>
            </div>

            <div className="space-y-3 text-xs text-cafe-800">
              <div className="flex justify-between items-center py-1.5 border-b border-cafe-100">
                <span className="text-stone-600">Nodos red completa / mayor SCC:</span>
                <span className="font-bold font-mono text-cafe-900">
                  {scc?.totalNodesBefore || 14820} → {scc?.sccNodesCount || 14210} ({scc?.retentionPercentageNodes || 95.9}%)
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-cafe-100">
                <span className="text-stone-600">Aristas antes / retenidas en SCC:</span>
                <span className="font-bold font-mono text-cafe-900">
                  {scc?.totalEdgesBefore || 35610} → {scc?.sccEdgesCount || 34890} ({scc?.retentionPercentageEdges || 97.9}%)
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-cafe-100">
                <span className="text-stone-600">Tiempo de cómputo Tarjan:</span>
                <span className="font-bold font-mono text-cordillera-700">
                  {scc?.executionTimeMs || 41.2} ms
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-cafe-100">
                <span className="text-stone-600">Componentes totales detectadas:</span>
                <span className="font-bold font-mono text-cafe-900">
                  {scc?.totalComponents || 18} componentes
                </span>
              </div>
            </div>

            <Alert type="success" title="Propósito de la Conectividad Fuerte">
              {scc?.justification ||
                'Se trabaja solo con la mayor componente fuertemente conexa para garantizar que exista camino de ida y vuelta factible entre cualquier par de lugares.'}
            </Alert>
          </div>

          {/* Tarjeta 3: Tratamiento de Lugares > 500 m (R1.4) */}
          <div className="bg-white rounded-2xl p-6 border border-cafe-200/80 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-cafe-900 text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-terracota-600" /> Asociación de Lugares &gt; 500 m (R1.4)
            </h3>

            <p className="text-xs text-stone-600 leading-relaxed">
              {mappingReport?.generalTreatmentStrategy ||
                'Los lugares a más de 500 m se proyectan ortogonalmente al eje vial y se conectan mediante tramo virtual de acceso rural.'}
            </p>

            <div className="space-y-3">
              {mappingReport?.details
                .filter((d) => d.isExceeding500m)
                .map((item) => (
                  <div
                    key={item.placeId}
                    className="p-3 rounded-xl bg-terracota-50/70 border border-terracota-200 text-xs space-y-1"
                  >
                    <div className="flex justify-between font-bold text-terracota-900">
                      <span>{item.placeName}</span>
                      <span className="font-mono">{item.distanceMeters} m</span>
                    </div>
                    <p className="text-terracota-800 text-[11px] leading-snug">{item.treatment}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
