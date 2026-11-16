import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  RefreshCw,
  HardDrive,
  CheckCircle2,
  Cpu,
  BarChart3,
  AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { AllExperiments } from '../types';
import { experimentsApi } from '../services/api';

export const ExperimentsView: React.FC = () => {
  const [data, setData] = useState<AllExperiments | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDimension, setActiveDimension] = useState<'all' | 'r1' | 'r2' | 'r3' | 'r4'>('all');

  useEffect(() => {
    loadExperiments();
  }, []);

  const loadExperiments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await experimentsApi.getAll();
      setData(res);
    } catch (err: any) {
      console.error('Error cargando experimentos desde el backend:', err);
      setError(
        err?.message ||
          'No se pudo obtener el consolidado experimental desde el servidor Backend (puerto 8080). Verifica que Spring Boot esté en ejecución.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="p-16 text-center space-y-3 bg-white rounded-3xl border border-cafe-200 shadow-sm">
        <RefreshCw className="w-6 h-6 animate-spin text-amber-600 mx-auto" />
        <p className="text-sm font-semibold text-cafe-800">
          Cargando resultados experimentales desde los archivos CSV/JSON del servidor...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-12 text-center space-y-4 bg-white rounded-3xl border border-terracota-300 shadow-sm">
        <AlertTriangle className="w-8 h-8 text-terracota-600 mx-auto" />
        <h3 className="text-base font-serif font-bold text-cafe-950">
          Error al cargar los resultados experimentales
        </h3>
        <p className="text-xs text-cafe-700 max-w-lg mx-auto">{error}</p>
        <button
          type="button"
          onClick={loadExperiments}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cafe-900 text-white text-xs font-semibold hover:bg-cafe-800 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reintentar conexión</span>
        </button>
      </div>
    );
  }

  // Construir datos de gráficas dinámicamente a partir de los resultados medidos en el backend
  const tspChartData = data.r4ExactTspTimes
    .filter((row) => !isNaN( parseFloat(String(row.tiempoFuerzaBrutaMs)) ))
    .map((row) => ({
      k: `k=${row.k}`,
      'Fuerza Bruta (ms)': parseFloat(String(row.tiempoFuerzaBrutaMs)),
      'Held-Karp (ms)': Number(row.tiempoHeldKarpMs),
    }));

  // Emparejar los 10 pares medidos con ambas versiones (cola_prioridad y lineal) para la gráfica R2
  const pairedQueriesMap = new Map<
    string,
    { query: string; nodos: number; 'Cola Prioridad (ms)'?: number; 'Lineal (ms)'?: number }
  >();
  data.r2DijkstraQueries.forEach((row) => {
    const key = `${row.origen} → ${row.destino}`;
    const existing = pairedQueriesMap.get(key) || {
      query: key,
      nodos: row.nodosExplorados,
    };
    if (row.version === 'cola_prioridad' || row.version === 'Heap') {
      existing['Cola Prioridad (ms)'] = row.tiempoMs;
    } else {
      existing['Lineal (ms)'] = row.tiempoMs;
    }
    pairedQueriesMap.set(key, existing);
  });

  const dijkstraChartData = Array.from(pairedQueriesMap.values()).filter(
    (item) => item['Lineal (ms)'] !== undefined && item['Cola Prioridad (ms)'] !== undefined
  );

  const greedyGapChartData = data.r4HeuristicQuality.map((row) => ({
    k: `k=${row.k}`,
    'Brecha Promedio (%)': row.brechaPromedioPorcentaje,
    'Brecha Máxima (%)': row.brechaMaximaPorcentaje,
  }));

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Encabezado Editorial del Módulo R5 */}
      <div className="bg-gradient-to-r from-cafe-950 via-cordillera-950 to-cafe-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-cordillera-800 relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cordillera-800/80 text-cordillera-100 text-xs font-semibold uppercase tracking-wider border border-cordillera-700">
            <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
            Módulo R5 & Anexo • Protocolo de Evaluación Experimental
          </div>
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-cafe-50 tracking-tight leading-tight">
            Laboratorio de Complejidad Teórica y Empírica
          </h1>
          <p className="text-cafe-200 text-sm sm:text-base leading-relaxed">
            Consolidado formal de tablas, cocientes de aceleración y curvas de escalabilidad generados a partir de los
            archivos experimentales CSV/JSON (<code className="font-mono text-amber-300">results/</code>) sobre la red
            vial de OpenStreetMap del Quindío.
          </p>
        </div>
      </div>

      {/* Ficha Técnica del Entorno de Pruebas */}
      <div className="bg-white rounded-3xl p-6 lg:p-8 border border-cafe-200/90 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cafe-100 pb-4">
          <div className="flex items-center gap-2.5">
            <HardDrive className="w-5 h-5 text-terracota-600 shrink-0" />
            <div>
              <h2 className="text-lg font-serif font-bold text-cafe-950">
                Ficha Técnica del Sistema de Ensayo (Hardware & Runtime JVM)
              </h2>
              <p className="text-xs text-cafe-600">
                Parámetros del equipo reportados en vivo por la Máquina Virtual de Java.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadExperiments}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-cafe-100 hover:bg-cafe-200 text-cafe-900 font-semibold text-xs border border-cafe-300 transition-colors disabled:opacity-50 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-600' : ''}`} />
            <span>{loading ? 'Actualizando métricas...' : 'Actualizar Ensayos en Vivo'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-cafe-50 rounded-2xl border border-cafe-200 space-y-1">
            <span className="text-[10px] font-bold text-cafe-500 uppercase tracking-wider block">
              Procesador / Arquitectura CPU
            </span>
            <p className="text-xs font-bold text-cafe-950 line-clamp-2">{data.systemInfo.processor}</p>
            <span className="text-[11px] font-mono text-cordillera-700 font-semibold block">
              {data.systemInfo.availableProcessors} hilos lógicos disponibles
            </span>
          </div>

          <div className="p-4 bg-cafe-50 rounded-2xl border border-cafe-200 space-y-1">
            <span className="text-[10px] font-bold text-cafe-500 uppercase tracking-wider block">
              Memoria RAM Física & Heap JVM
            </span>
            <p className="text-xs font-bold text-cafe-950">{data.systemInfo.totalMemoryRam}</p>
            <span className="text-[11px] text-cordillera-700 font-mono font-semibold block">
              Heap Máx: {data.systemInfo.maxMemoryJvm}
            </span>
          </div>

          <div className="p-4 bg-cafe-50 rounded-2xl border border-cafe-200 space-y-1">
            <span className="text-[10px] font-bold text-cafe-500 uppercase tracking-wider block">
              Sistema Operativo
            </span>
            <p className="text-xs font-bold text-cafe-950">{data.systemInfo.operatingSystem}</p>
            <span className="text-[11px] text-cafe-600 font-mono block">
              {data.systemInfo.osArch} • v{data.systemInfo.osVersion}
            </span>
          </div>

          <div className="p-4 bg-cafe-50 rounded-2xl border border-cafe-200 space-y-1">
            <span className="text-[10px] font-bold text-cafe-500 uppercase tracking-wider block">
              Entorno Java & Cronometraje
            </span>
            <p className="text-xs font-bold text-cafe-950">{data.systemInfo.javaVersion}</p>
            <span className="text-[11px] text-amber-800 font-mono font-semibold block">
              System.nanoTime() + JIT Warmup
            </span>
          </div>
        </div>

        <div className="text-xs text-cafe-800 bg-amber-50/60 p-4 rounded-2xl border border-amber-200 leading-relaxed">
          <strong className="text-amber-950">Protocolo Metodológico:</strong>{' '}
          {data.systemInfo.experimentProtocol}
        </div>
      </div>

      {/* Pestañas de Filtrado por Dimensión */}
      <div className="flex flex-wrap gap-2 border-b border-cafe-200 pb-3">
        {[
          { id: 'all', label: 'Todas las Dimensiones (R1 – R4)' },
          { id: 'r1', label: 'Dimensión 1: SCC OSMnx / Tarjan Θ(V + E)' },
          { id: 'r2', label: 'Dimensión 2: Dijkstra Min-Heap vs Lineal' },
          { id: 'r3', label: 'Dimensión 3: QuickHull 2D vs SciPy' },
          { id: 'r4', label: 'Dimensión 4: ATSP Held-Karp vs Voraz' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveDimension(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeDimension === tab.id
                ? 'bg-cafe-900 text-white shadow-sm'
                : 'bg-white border border-cafe-200 text-cafe-700 hover:bg-cafe-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* DIMENSIÓN 1: TARJAN / OSMNX SCC */}
      {(activeDimension === 'all' || activeDimension === 'r1') && (
        <div className="bg-white rounded-3xl p-6 lg:p-8 border border-cafe-200/90 shadow-md space-y-4">
          <div className="border-b border-cafe-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-cordillera-700 block">
                Dimensión Experimental 1 • Tabla R1.3 del Anexo (results/r1_scc_times.csv)
              </span>
              <h3 className="text-lg font-serif font-bold text-cafe-950">
                Escalabilidad Lineal de la Mayor Componente Fuertemente Conexa (ox.truncate.largest_component)
              </h3>
            </div>
            <span className="font-mono text-xs px-3 py-1 bg-cordillera-50 text-cordillera-800 border border-cordillera-200 rounded-full font-bold self-start sm:self-auto">
              Complejidad Teórica: Θ(V + E)
            </span>
          </div>

          <div className="overflow-x-auto border border-cafe-200 rounded-2xl">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-cafe-100 text-cafe-800 uppercase font-bold">
                <tr>
                  <th className="p-3 border-b border-r border-cafe-200">Red Evaluada</th>
                  <th className="p-3 border-b border-r border-cafe-200 text-center">V (Nodos)</th>
                  <th className="p-3 border-b border-r border-cafe-200 text-center">E (Aristas)</th>
                  <th className="p-3 border-b border-r border-cafe-200 text-center">V + E</th>
                  <th className="p-3 border-b border-cafe-200 text-right">Tiempo Mediano (ms)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cafe-100 font-mono">
                {data.r1SccTimes.map((row, idx) => (
                  <tr key={`r1-row-${idx}`} className="hover:bg-cafe-50 transition-colors">
                    <td className="p-3 font-sans font-bold text-cafe-950 border-r border-cafe-100">
                      {row.red}
                    </td>
                    <td className="p-3 text-center border-r border-cafe-100 text-cafe-700">
                      {row.v.toLocaleString()}
                    </td>
                    <td className="p-3 text-center border-r border-cafe-100 text-cafe-700">
                      {row.e.toLocaleString()}
                    </td>
                    <td className="p-3 text-center border-r border-cafe-100 font-bold text-cordillera-800">
                      {row.vPlusE.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-bold text-cafe-950">{row.tiempoMs} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-cafe-600 leading-relaxed">
            Medición real ejecutada sobre las redes radiales de 2, 5, 10 y 20 km alrededor de la Plaza de Bolívar de
            Armenia y el departamento completo (5 repeticiones, mediana). El tiempo crece proporcionalmente a{' '}
            <code className="font-mono font-bold">V + E</code>, confirmando la cota lineal <code className="font-mono font-bold">Θ(V + E)</code> del algoritmo de Tarjan-Nuutila.
          </p>
        </div>
      )}

      {/* DIMENSIÓN 2: DIJKSTRA MIN-HEAP VS LINEAL */}
      {(activeDimension === 'all' || activeDimension === 'r2') && (
        <div className="bg-white rounded-3xl p-6 lg:p-8 border border-cafe-200/90 shadow-md space-y-6">
          <div className="border-b border-cafe-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 block">
                Dimensión Experimental 2 • Tabla R2 del Anexo (results/r2_dijkstra_measurements.csv)
              </span>
              <h3 className="text-lg font-serif font-bold text-cafe-950">
                Caminos Mínimos en la SCC (35,442 nodos): Cola de Prioridad O((V + E) log V) vs Lineal O(V²)
              </h3>
            </div>
            <span className="font-mono text-xs px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-full font-bold self-start sm:self-auto">
              Cociente Mediano: {data.r2RatioSummary.mediana}× (Mín: {data.r2RatioSummary.minimo}× / Máx:{' '}
              {data.r2RatioSummary.maximo}×)
            </span>
          </div>

          <div className="bg-cafe-50 p-5 rounded-2xl border border-cafe-200 space-y-2">
            <h4 className="text-xs font-bold uppercase text-cafe-800 tracking-wider flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-amber-600" />
              <span>Contraste de Tiempo (ms) en los 10 Pares Medidos con Ambas Versiones</span>
            </h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dijkstraChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E6D8C8" />
                  <XAxis dataKey="query" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={55} />
                  <YAxis unit=" ms" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Cola Prioridad (ms)" fill="#2E5A44" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Lineal (ms)" fill="#C05638" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="overflow-x-auto border border-cafe-200 rounded-2xl">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-cafe-100 text-cafe-800 uppercase font-bold">
                <tr>
                  <th className="p-3 border-b border-r border-cafe-200">Origen → Destino</th>
                  <th className="p-3 border-b border-r border-cafe-200 text-center">Versión</th>
                  <th className="p-3 border-b border-r border-cafe-200 text-center">Tiempo Viaje (s)</th>
                  <th className="p-3 border-b border-r border-cafe-200 text-center">Nodos Explorados</th>
                  <th className="p-3 border-b border-cafe-200 text-right">Tiempo Mediano (ms)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cafe-100 font-mono">
                {data.r2DijkstraQueries.map((row, idx) => {
                  const isPq = row.version === 'cola_prioridad' || row.version === 'Heap';
                  return (
                    <tr
                      key={`r2-row-${idx}`}
                      className={isPq ? 'bg-cordillera-50/30' : 'bg-white'}
                    >
                      <td className="p-3 font-sans font-bold text-cafe-950 border-r border-cafe-100">
                        {row.origen} → {row.destino}
                      </td>
                      <td className="p-3 text-center border-r border-cafe-100 font-bold font-sans">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] ${
                            isPq
                              ? 'bg-cordillera-100 text-cordillera-800'
                              : 'bg-cafe-200 text-cafe-800'
                          }`}
                        >
                          {row.version}
                        </span>
                      </td>
                      <td className="p-3 text-center border-r border-cafe-100 text-cafe-800">
                        {row.tiempoViajeS} s
                      </td>
                      <td className="p-3 text-center border-r border-cafe-100 text-cafe-900 font-bold">
                        {row.nodosExplorados.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-bold text-cafe-950">{row.tiempoMs} ms</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DIMENSIÓN 3: CONVEX HULL VS SCIPY */}
      {(activeDimension === 'all' || activeDimension === 'r3') && (
        <div className="bg-white rounded-3xl p-6 lg:p-8 border border-cafe-200/90 shadow-md space-y-4">
          <div className="border-b border-cafe-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-cordillera-700 block">
                Dimensión Experimental 3 • Tabla R3 del Anexo (results/r3_convex_hull.csv)
              </span>
              <h3 className="text-lg font-serif font-bold text-cafe-950">
                Envolvente Convexa: QuickHull 2D Propio (Java 21) vs SciPy Qhull (C Nativo, SciPy 1.18.1)
              </h3>
            </div>
            <span className="inline-flex items-center gap-1.5 font-mono text-xs px-3 py-1 bg-cordillera-50 text-cordillera-800 border border-cordillera-200 rounded-full font-bold self-start sm:self-auto">
              <CheckCircle2 className="w-3.5 h-3.5 text-cordillera-600" />
              Coincidencia de Vértices con SciPy: 100% Verificada
            </span>
          </div>

          <div className="overflow-x-auto border border-cafe-200 rounded-2xl">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-cafe-100 text-cafe-800 uppercase font-bold">
                <tr>
                  <th className="p-3 border-b border-r border-cafe-200">Conjunto de Puntos (Semilla 42)</th>
                  <th className="p-3 border-b border-r border-cafe-200 text-center">n</th>
                  <th className="p-3 border-b border-r border-cafe-200 text-center">Vértices de la Envolvente</th>
                  <th className="p-3 border-b border-r border-cafe-200 text-right">Tiempo Propio (ms)</th>
                  <th className="p-3 border-b border-r border-cafe-200 text-right">Tiempo SciPy (ms)</th>
                  <th className="p-3 border-b border-cafe-200 text-center">Cociente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cafe-100 font-mono">
                {data.r3ConvexHullBenchmarks.map((row, idx) => (
                  <tr key={`r3-bench-${idx}`} className="hover:bg-cafe-50 transition-colors">
                    <td className="p-3 font-sans font-bold text-cafe-950 border-r border-cafe-100">
                      {row.pointSet}
                    </td>
                    <td className="p-3 text-center border-r border-cafe-100 text-cafe-700">
                      {row.n.toLocaleString()}
                    </td>
                    <td className="p-3 text-center border-r border-cafe-100 font-bold text-cordillera-700">
                      {row.hullVertices}
                    </td>
                    <td className="p-3 text-right border-r border-cafe-100 font-bold text-cafe-950">
                      {row.ownTimeMs.toFixed(2)} ms
                    </td>
                    <td className="p-3 text-right border-r border-cafe-100 text-cafe-600">
                      {row.referenceTimeMs.toFixed(2)} ms
                    </td>
                    <td className="p-3 text-center font-bold text-amber-900 bg-amber-50/50">
                      {row.ratio.toFixed(2)}×
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DIMENSIÓN 4: ATSP EXACTO VS FUERZA BRUTA VS VORAZ */}
      {(activeDimension === 'all' || activeDimension === 'r4') && (
        <div className="bg-white rounded-3xl p-6 lg:p-8 border border-cafe-200/90 shadow-md space-y-6">
          <div className="border-b border-cafe-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-terracota-700 block">
                Dimensión Experimental 4 • Tablas R4.1 y R4.3 del Anexo (results/r4_exact_times.csv)
              </span>
              <h3 className="text-lg font-serif font-bold text-cafe-950">
                Optimización ATSP: Fuerza Bruta O(k!) vs Held-Karp Θ(2ᵏ · k²) y Calidad de la Heurística
              </h3>
            </div>
            <span className="font-mono text-xs px-3 py-1 bg-terracota-50 text-terracota-800 border border-terracota-200 rounded-full font-bold self-start sm:self-auto">
              Semilla Fija = 42
            </span>
          </div>

          {/* Gráfica y Tabla de Escalabilidad Exacta (k = 5..12) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 bg-cafe-50 p-5 rounded-2xl border border-cafe-200 space-y-2">
              <h4 className="text-xs font-bold uppercase text-cafe-800 tracking-wider flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-terracota-600" />
                <span>Curva de Crecimiento Temporal (ms): Fuerza Bruta vs Held-Karp (k = 5..12)</span>
              </h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={tspChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E6D8C8" />
                    <XAxis dataKey="k" tick={{ fontSize: 11 }} />
                    <YAxis unit=" ms" tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line
                      type="monotone"
                      dataKey="Fuerza Bruta (ms)"
                      stroke="#C05638"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Held-Karp (ms)"
                      stroke="#2E5A44"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[11px] text-cafe-600 text-center">
                Fuerza Bruta O(k!) evalúa las 479,001,600 permutaciones de k = 12 en ~1.5 minutos, mientras Held-Karp
                Θ(2ᵏ · k²) resuelve el mismo k = 12 en menos de 2 ms.
              </p>
            </div>

            <div className="lg:col-span-5 overflow-x-auto border border-cafe-200 rounded-2xl">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-cafe-100 text-cafe-800 uppercase font-bold">
                  <tr>
                    <th className="p-2.5 border-b border-r border-cafe-200 text-center">k</th>
                    <th className="p-2.5 border-b border-r border-cafe-200 text-right">Tiempo Fuerza Bruta (ms)</th>
                    <th className="p-2.5 border-b border-cafe-200 text-right">Tiempo Held-Karp (ms)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cafe-100 font-mono">
                  {data.r4ExactTspTimes.map((row, idx) => (
                    <tr key={`r4-exact-${idx}`} className="hover:bg-cafe-50">
                      <td className="p-2.5 text-center font-bold text-cafe-950 border-r border-cafe-100 bg-cafe-50/50">
                        {row.k}
                      </td>
                      <td className="p-2.5 text-right border-r border-cafe-100 text-terracota-800 font-medium">
                        {row.tiempoFuerzaBrutaMs}
                      </td>
                      <td className="p-2.5 text-right font-bold text-cordillera-800">
                        {Number(row.tiempoHeldKarpMs).toFixed(2)} ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Brecha de Calidad de la Heurística Voraz */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2 border-t border-cafe-100">
            <div className="space-y-3 bg-cafe-50 p-5 rounded-2xl border border-cafe-200">
              <h4 className="text-xs font-bold uppercase text-cafe-800 tracking-wider">
                Brecha Porcentual de la Heurística Voraz frente a Held-Karp (%)
              </h4>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={greedyGapChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E6D8C8" />
                    <XAxis dataKey="k" tick={{ fontSize: 11 }} />
                    <YAxis unit="%" tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="Brecha Promedio (%)" fill="#D97706" radius={[5, 5, 0, 0]} />
                    <Bar dataKey="Brecha Máxima (%)" fill="#C05638" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-cafe-800 tracking-wider">
                Calidad de la Heurística (k = 5, 8, 10 y 12; 5 Instancias por cada k, Semilla 42)
              </h4>
              <div className="overflow-x-auto border border-cafe-200 rounded-2xl">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-cafe-100 text-cafe-800 uppercase font-bold">
                    <tr>
                      <th className="p-3 border-b border-r border-cafe-200">k</th>
                      <th className="p-3 border-b border-r border-cafe-200 text-center">Instancias</th>
                      <th className="p-3 border-b border-r border-cafe-200 text-center">Brecha Promedio (%)</th>
                      <th className="p-3 border-b border-cafe-200 text-center">Brecha Máxima (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cafe-100 font-mono">
                    {data.r4HeuristicQuality.map((row, idx) => (
                      <tr key={`r4-gap-${idx}`} className="hover:bg-cafe-50">
                        <td className="p-3 font-bold text-cafe-950 border-r border-cafe-100">{row.k}</td>
                        <td className="p-3 text-center border-r border-cafe-100 text-cafe-700">
                          {row.instancias}
                        </td>
                        <td className="p-3 text-center border-r border-cafe-100 font-bold text-amber-800">
                          {row.brechaPromedioPorcentaje.toFixed(2)}%
                        </td>
                        <td className="p-3 text-center font-bold text-terracota-700">
                          {row.brechaMaximaPorcentaje.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
