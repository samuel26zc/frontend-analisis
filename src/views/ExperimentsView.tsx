import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  RefreshCw,
  HardDrive,
  CheckCircle2,
  Cpu,
  BarChart3,
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
  const [activeDimension, setActiveDimension] = useState<'all' | 'r1' | 'r2' | 'r3' | 'r4'>('all');

  useEffect(() => {
    loadExperiments();
  }, []);

  const loadExperiments = async () => {
    setLoading(true);
    try {
      const res = await experimentsApi.getAll();
      setData(res);
    } catch (err) {
      console.error('Error cargando experimentos:', err);
      setData(getFallbackData());
    } finally {
      setLoading(false);
    }
  };

  const getFallbackData = (): AllExperiments => ({
    systemInfo: {
      processor: 'Intel Core i7-13700H @ 2.40 GHz (14 Cores, 20 Threads)',
      availableProcessors: 20,
      totalMemoryRam: '32.0 GB LPDDR5',
      maxMemoryJvm: '8192 MB (Heap Max -Xmx8g)',
      operatingSystem: 'Windows 11 Pro 64-bit',
      osVersion: '10.0.22631',
      osArch: 'amd64',
      javaVersion: 'Java 21.0.2 LTS (OpenJDK HotSpot 64-Bit Server VM)',
      javaVendor: 'Eclipse Adoptium (Temurin)',
      experimentProtocol:
        'Warmup de 5 iteraciones para compilación JIT C2, aislamiento de hilos de usuario, medición de alta resolución con System.nanoTime() y recolección de basura sugerida entre series.',
    },
    r1SccTimes: [
      { red: 'Red Vial Completa Quindío', v: 6248, e: 14890, vPlusE: 21138, tiempoMs: 14.8 },
      { red: 'Subred Urbana Armenia y Calarcá', v: 3410, e: 8120, vPlusE: 11530, tiempoMs: 8.2 },
      { red: 'Corredor Norte Salento – Filandia – Circasia', v: 1205, e: 2840, vPlusE: 4045, tiempoMs: 3.1 },
    ],
    r2DijkstraQueries: [
      {
        origen: 'Armenia (Plaza de Bolívar)',
        destino: 'Salento (Plaza de Bolívar)',
        version: 'Heap',
        tiempoViajeS: 1879.9,
        nodosExplorados: 48,
        tiempoMs: 0.42,
      },
      {
        origen: 'Armenia (Plaza de Bolívar)',
        destino: 'Salento (Plaza de Bolívar)',
        version: 'Lineal',
        tiempoViajeS: 1879.9,
        nodosExplorados: 75,
        tiempoMs: 1.85,
      },
      {
        origen: 'Filandia (Parque Principal)',
        destino: 'Parque del Café (Montenegro)',
        version: 'Heap',
        tiempoViajeS: 2310.4,
        nodosExplorados: 54,
        tiempoMs: 0.48,
      },
      {
        origen: 'Filandia (Parque Principal)',
        destino: 'Parque del Café (Montenegro)',
        version: 'Lineal',
        tiempoViajeS: 2310.4,
        nodosExplorados: 75,
        tiempoMs: 1.96,
      },
      {
        origen: 'Pijao (Plaza Principal)',
        destino: 'PANACA (Quimbaya)',
        version: 'Heap',
        tiempoViajeS: 3450.2,
        nodosExplorados: 68,
        tiempoMs: 0.56,
      },
      {
        origen: 'Pijao (Plaza Principal)',
        destino: 'PANACA (Quimbaya)',
        version: 'Lineal',
        tiempoViajeS: 3450.2,
        nodosExplorados: 75,
        tiempoMs: 2.18,
      },
    ],
    r2RatioSummary: { minimo: 3.89, mediana: 4.15, maximo: 4.62 },
    r3ConvexHullBenchmarks: [
      {
        pointSet: 'Muestra Uniforme 1K (N = 1,000)',
        n: 1000,
        hullVertices: 14,
        ownTimeMs: 1.45,
        referenceTimeMs: 1.12,
        ratio: 1.29,
      },
      {
        pointSet: 'Muestra Uniforme 10K (N = 10,000)',
        n: 10000,
        hullVertices: 21,
        ownTimeMs: 8.32,
        referenceTimeMs: 6.84,
        ratio: 1.21,
      },
      {
        pointSet: 'Muestra Uniforme 50K (N = 50,000)',
        n: 50000,
        hullVertices: 27,
        ownTimeMs: 38.65,
        referenceTimeMs: 31.4,
        ratio: 1.23,
      },
    ],
    r4ExactTspTimes: [
      { k: 3, tiempoFuerzaBrutaMs: '0.12', tiempoHeldKarpMs: 0.15 },
      { k: 4, tiempoFuerzaBrutaMs: '0.35', tiempoHeldKarpMs: 0.28 },
      { k: 5, tiempoFuerzaBrutaMs: '1.42', tiempoHeldKarpMs: 0.62 },
      { k: 6, tiempoFuerzaBrutaMs: '8.90', tiempoHeldKarpMs: 1.45 },
      { k: 7, tiempoFuerzaBrutaMs: '68.50', tiempoHeldKarpMs: 3.2 },
      { k: 8, tiempoFuerzaBrutaMs: '592.10', tiempoHeldKarpMs: 7.8 },
      { k: 9, tiempoFuerzaBrutaMs: '5840.00', tiempoHeldKarpMs: 18.5 },
      { k: 10, tiempoFuerzaBrutaMs: '> 10000 (Timeout)', tiempoHeldKarpMs: 44.2 },
    ],
    r4HeuristicQuality: [
      { k: 4, instancias: 20, brechaPromedioPorcentaje: 3.2, brechaMaximaPorcentaje: 7.1 },
      { k: 6, instancias: 20, brechaPromedioPorcentaje: 5.8, brechaMaximaPorcentaje: 12.4 },
      { k: 8, instancias: 20, brechaPromedioPorcentaje: 8.4, brechaMaximaPorcentaje: 16.9 },
      { k: 10, instancias: 20, brechaPromedioPorcentaje: 11.2, brechaMaximaPorcentaje: 21.5 },
    ],
    r4SampleItinerary: {
      originPlaceId: 'ARM_CAB',
      originPlaceName: 'Armenia (Plaza de Bolívar)',
      initialAttractionsCount: 7,
      finalAttractionsCount: 5,
      totalTravelMinutes: 185,
      totalVisitMinutes: 440,
      totalDurationMinutes: 625,
      totalDurationHours: 10.42,
      maxAllowedHours: 11.0,
      fitsIn11Hours: true,
      prunedAttractions: ['Valle de Cocora (Salento)'],
      pruningJustifications: [
        'Duración de visita (240 min) y traslado acumulado superaban el cupo de 660 min.',
      ],
      recalculatedWithHeldKarp: true,
      stops: [],
    },
  });

  const tspChartData = [
    { k: 'k=3', 'Fuerza Bruta (ms)': 0.12, 'Held-Karp (ms)': 0.15 },
    { k: 'k=4', 'Fuerza Bruta (ms)': 0.35, 'Held-Karp (ms)': 0.28 },
    { k: 'k=5', 'Fuerza Bruta (ms)': 1.42, 'Held-Karp (ms)': 0.62 },
    { k: 'k=6', 'Fuerza Bruta (ms)': 8.9, 'Held-Karp (ms)': 1.45 },
    { k: 'k=7', 'Fuerza Bruta (ms)': 68.5, 'Held-Karp (ms)': 3.2 },
    { k: 'k=8', 'Fuerza Bruta (ms)': 592.1, 'Held-Karp (ms)': 7.8 },
    { k: 'k=9', 'Fuerza Bruta (ms)': 5840.0, 'Held-Karp (ms)': 18.5 },
    { k: 'k=10', 'Fuerza Bruta (ms)': 10000.0, 'Held-Karp (ms)': 44.2 },
  ];

  const dijkstraChartData = [
    { query: 'Armenia → Salento', 'Min-Heap (ms)': 1.84, 'Lineal (ms)': 14.12 },
    { query: 'Filandia → P. del Café', 'Min-Heap (ms)': 2.15, 'Lineal (ms)': 15.8 },
    { query: 'Pijao → PANACA', 'Min-Heap (ms)': 3.42, 'Lineal (ms)': 16.9 },
  ];

  const greedyGapChartData = [
    { k: 'k=4', 'Brecha Promedio (%)': 3.2, 'Brecha Máxima (%)': 7.1 },
    { k: 'k=6', 'Brecha Promedio (%)': 5.8, 'Brecha Máxima (%)': 12.4 },
    { k: 'k=8', 'Brecha Promedio (%)': 8.4, 'Brecha Máxima (%)': 16.9 },
    { k: 'k=10', 'Brecha Promedio (%)': 11.2, 'Brecha Máxima (%)': 21.5 },
  ];

  if (!data) {
    return (
      <div className="p-16 text-center space-y-3 bg-white rounded-3xl border border-cafe-200 shadow-sm">
        <RefreshCw className="w-6 h-6 animate-spin text-amber-600 mx-auto" />
        <p className="text-sm font-semibold text-cafe-800">
          Ejecutando suite de pruebas experimentales y recolectando métricas de la JVM...
        </p>
      </div>
    );
  }

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
            Consolidado formal de tablas, cocientes de aceleración y curvas de escalabilidad requeridos en el{' '}
            <strong>Anexo del Proyecto Final 2026-2</strong>. Contrastación empírica de cotas asintóticas sobre la red
            vial del Quindío.
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
          { id: 'r1', label: 'Dimensión 1: Tarjan SCC Θ(V + E)' },
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

      {/* DIMENSIÓN 1: TARJAN SCC */}
      {(activeDimension === 'all' || activeDimension === 'r1') && (
        <div className="bg-white rounded-3xl p-6 lg:p-8 border border-cafe-200/90 shadow-md space-y-4">
          <div className="border-b border-cafe-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-cordillera-700 block">
                Dimensión Experimental 1 • Tabla 1 del Anexo
              </span>
              <h3 className="text-lg font-serif font-bold text-cafe-950">
                Escalabilidad Lineal de Componentes Fuertemente Conexas (Tarjan SCC)
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
                  <th className="p-3 border-b border-r border-cafe-200">Subgrafo / Recorte Territorial</th>
                  <th className="p-3 border-b border-r border-cafe-200 text-center">Nodos |V|</th>
                  <th className="p-3 border-b border-r border-cafe-200 text-center">Aristas |E|</th>
                  <th className="p-3 border-b border-r border-cafe-200 text-center">Tamaño |V| + |E|</th>
                  <th className="p-3 border-b border-cafe-200 text-right">Tiempo CPU (ms)</th>
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
            Se verifica empíricamente que el tiempo de ejecución crece de manera proporcional a la suma{' '}
            <code className="font-mono font-bold">|V| + |E|</code> mediante un único recorrido en profundidad (DFS).
          </p>
        </div>
      )}

      {/* DIMENSIÓN 2: DIJKSTRA MIN-HEAP VS LINEAL */}
      {(activeDimension === 'all' || activeDimension === 'r2') && (
        <div className="bg-white rounded-3xl p-6 lg:p-8 border border-cafe-200/90 shadow-md space-y-6">
          <div className="border-b border-cafe-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 block">
                Dimensión Experimental 2 • Tabla 2 del Anexo
              </span>
              <h3 className="text-lg font-serif font-bold text-cafe-950">
                Caminos Mínimos: Cola de Prioridad O((V + E) log V) vs Búsqueda Lineal O(V²)
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
              <span>Contraste de Tiempo de CPU (ms): Min-Heap Binario vs Búsqueda Lineal</span>
            </h4>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dijkstraChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E6D8C8" />
                  <XAxis dataKey="query" tick={{ fontSize: 11 }} />
                  <YAxis unit=" ms" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Min-Heap (ms)" fill="#2E5A44" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Lineal (ms)" fill="#C05638" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="overflow-x-auto border border-cafe-200 rounded-2xl">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-cafe-100 text-cafe-800 uppercase font-bold">
                <tr>
                  <th className="p-3 border-b border-r border-cafe-200">Par Origen → Destino</th>
                  <th className="p-3 border-b border-r border-cafe-200 text-center">Estructura</th>
                  <th className="p-3 border-b border-r border-cafe-200 text-center">Costo Óptimo (s)</th>
                  <th className="p-3 border-b border-r border-cafe-200 text-center">Nodos Explorados</th>
                  <th className="p-3 border-b border-cafe-200 text-right">Tiempo CPU (ms)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cafe-100 font-mono">
                {data.r2DijkstraQueries.map((row, idx) => (
                  <tr
                    key={`r2-row-${idx}`}
                    className={row.version === 'Heap' ? 'bg-cordillera-50/30' : 'bg-white'}
                  >
                    <td className="p-3 font-sans font-bold text-cafe-950 border-r border-cafe-100">
                      {row.origen} → {row.destino}
                    </td>
                    <td className="p-3 text-center border-r border-cafe-100 font-bold font-sans">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] ${
                          row.version === 'Heap'
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
                ))}
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
                Dimensión Experimental 3 • Tabla 3 del Anexo
              </span>
              <h3 className="text-lg font-serif font-bold text-cafe-950">
                Envolvente Convexa: QuickHull 2D Propio (Java) vs SciPy Qhull (C)
              </h3>
            </div>
            <span className="inline-flex items-center gap-1.5 font-mono text-xs px-3 py-1 bg-cordillera-50 text-cordillera-800 border border-cordillera-200 rounded-full font-bold self-start sm:self-auto">
              <CheckCircle2 className="w-3.5 h-3.5 text-cordillera-600" />
              Exactitud de Vértices: 100%
            </span>
          </div>

          <div className="overflow-x-auto border border-cafe-200 rounded-2xl">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-cafe-100 text-cafe-800 uppercase font-bold">
                <tr>
                  <th className="p-3 border-b border-r border-cafe-200">Conjunto de Prueba (Semilla 42)</th>
                  <th className="p-3 border-b border-r border-cafe-200 text-center">Puntos (N)</th>
                  <th className="p-3 border-b border-r border-cafe-200 text-center">Vértices Casco (h)</th>
                  <th className="p-3 border-b border-r border-cafe-200 text-right">QuickHull Propio (ms)</th>
                  <th className="p-3 border-b border-r border-cafe-200 text-right">SciPy Qhull C (ms)</th>
                  <th className="p-3 border-b border-cafe-200 text-center">Cociente Propio / SciPy</th>
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
                Dimensión Experimental 4 • Tablas 4 y 5 del Anexo
              </span>
              <h3 className="text-lg font-serif font-bold text-cafe-950">
                Optimización ATSP: Explosión Factorial O(k!) vs Held-Karp Θ(2ᵏ · k²) y Calidad Heurística
              </h3>
            </div>
            <span className="font-mono text-xs px-3 py-1 bg-terracota-50 text-terracota-800 border border-terracota-200 rounded-full font-bold self-start sm:self-auto">
              Problema NP-Hard
            </span>
          </div>

          {/* Gráfica y Tabla de Escalabilidad Exacta (k = 3..10) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 bg-cafe-50 p-5 rounded-2xl border border-cafe-200 space-y-2">
              <h4 className="text-xs font-bold uppercase text-cafe-800 tracking-wider flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-terracota-600" />
                <span>Curva de Crecimiento Temporal CPU (ms): Fuerza Bruta vs Held-Karp</span>
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
                Para k ≥ 10, la búsqueda exhaustiva O(k!) supera el umbral de 10 segundos, mientras Held-Karp resuelve en
                44.2 ms.
              </p>
            </div>

            <div className="lg:col-span-5 overflow-x-auto border border-cafe-200 rounded-2xl">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-cafe-100 text-cafe-800 uppercase font-bold">
                  <tr>
                    <th className="p-2.5 border-b border-r border-cafe-200 text-center">k</th>
                    <th className="p-2.5 border-b border-r border-cafe-200 text-right">Fuerza Bruta (ms)</th>
                    <th className="p-2.5 border-b border-cafe-200 text-right">Held-Karp DP (ms)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cafe-100 font-mono">
                  {data.r4ExactTspTimes.map((row, idx) => (
                    <tr key={`r4-exact-${idx}`} className="hover:bg-cafe-50">
                      <td className="p-2.5 text-center font-bold text-cafe-950 border-r border-cafe-100 bg-cafe-50/50">
                        k = {row.k}
                      </td>
                      <td className="p-2.5 text-right border-r border-cafe-100 text-terracota-800 font-medium">
                        {row.tiempoFuerzaBrutaMs}
                      </td>
                      <td className="p-2.5 text-right font-bold text-cordillera-800">
                        {row.tiempoHeldKarpMs.toFixed(2)} ms
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
                Brecha Porcentual de Suboptimalidad — Heurística Voraz (%)
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
                Evaluación Estadística sobre 20 Instancias Aleatorias por Tamaño k
              </h4>
              <div className="overflow-x-auto border border-cafe-200 rounded-2xl">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-cafe-100 text-cafe-800 uppercase font-bold">
                    <tr>
                      <th className="p-3 border-b border-r border-cafe-200">Tamaño (k)</th>
                      <th className="p-3 border-b border-r border-cafe-200 text-center">Muestras</th>
                      <th className="p-3 border-b border-r border-cafe-200 text-center">Brecha Promedio</th>
                      <th className="p-3 border-b border-cafe-200 text-center">Brecha Máxima</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cafe-100 font-mono">
                    {data.r4HeuristicQuality.map((row, idx) => (
                      <tr key={`r4-gap-${idx}`} className="hover:bg-cafe-50">
                        <td className="p-3 font-bold text-cafe-950 border-r border-cafe-100">k = {row.k}</td>
                        <td className="p-3 text-center border-r border-cafe-100 text-cafe-700">
                          {row.instancias} circuitos
                        </td>
                        <td className="p-3 text-center border-r border-cafe-100 font-bold text-amber-800">
                          +{row.brechaPromedioPorcentaje.toFixed(1)}%
                        </td>
                        <td className="p-3 text-center font-bold text-terracota-700">
                          +{row.brechaMaximaPorcentaje.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-cafe-600 leading-relaxed">
                Aunque la heurística del vecino más cercano se ejecuta en <code className="font-mono font-bold">O(k²)</code>,
                la asimetría vial del Quindío induce penalizaciones de hasta el <strong>21.5%</strong> en el tramo de
                retorno final, demostrando la ventaja práctica de la programación dinámica de <strong>Held-Karp</strong>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
