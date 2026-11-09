import React, { useEffect, useState, useCallback } from 'react';
import {
  Compass,
  Database,
  GitFork,
  MapPin,
  Network,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { networkApi } from '../../services/api';

export type ActiveTab = 'catalog' | 'routes' | 'convex-hull' | 'tsp' | 'experiments';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange }) => {
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [checkingStatus, setCheckingStatus] = useState<boolean>(false);

  const checkBackend = useCallback(() => {
    setCheckingStatus(true);
    networkApi
      .getStats()
      .then(() => setBackendOnline(true))
      .catch(() => setBackendOnline(false))
      .finally(() => setCheckingStatus(false));
  }, []);

  useEffect(() => {
    checkBackend();
  }, [checkBackend]);

  const navItems: Array<{
    id: ActiveTab;
    label: string;
    shortLabel: string;
    subtitle: string;
    icon: React.ReactNode;
    badge: string;
  }> = [
    {
      id: 'catalog',
      label: 'Territorio & Red Vial',
      shortLabel: 'Territorio',
      subtitle: '42 Lugares • Tarjan SCC • Memoria',
      icon: <MapPin className="w-4 h-4" />,
      badge: 'R1',
    },
    {
      id: 'routes',
      label: 'Caminos Mínimos',
      shortLabel: 'Rutas',
      subtitle: 'Dijkstra • Matriz Asimétrica 42×42',
      icon: <GitFork className="w-4 h-4" />,
      badge: 'R2',
    },
    {
      id: 'convex-hull',
      label: 'Envolvente Convexa',
      shortLabel: 'Envolvente',
      subtitle: 'QuickHull 2D • Benchmark SciPy',
      icon: <Compass className="w-4 h-4" />,
      badge: 'R3',
    },
    {
      id: 'tsp',
      label: 'Ruta ATSP & Itinerario',
      shortLabel: 'ATSP & 11h',
      subtitle: 'Held-Karp • Poda Jornada 11 Horas',
      icon: <Network className="w-4 h-4" />,
      badge: 'R4',
    },
    {
      id: 'experiments',
      label: 'Laboratorio & Anexo',
      shortLabel: 'Laboratorio',
      subtitle: 'Complejidad Empírica • Gráficas',
      icon: <TrendingUp className="w-4 h-4" />,
      badge: 'R5',
    },
  ];

  return (
    <header className="bg-cafe-950 text-cafe-50 shadow-lg border-b border-cafe-800/90 relative">
      {/* Cinta superior decorativa inspirada en los colores del Paisaje Cultural Cafetero */}
      <div className="h-1 w-full bg-gradient-to-r from-cordillera-600 via-amber-500 to-terracota-600" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Fila Principal: Identidad y Estado del Servidor */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 gap-3 border-b border-cafe-800/70">
          {/* Logo y Título */}
          <div className="flex items-center justify-between">
            <div
              onClick={() => onTabChange('catalog')}
              className="flex items-center space-x-3.5 cursor-pointer group"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-terracota-700 flex items-center justify-center shadow-md border border-amber-400/30 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center flex-wrap gap-2">
                  <span className="text-lg sm:text-xl font-serif font-bold text-white tracking-tight">
                    Rutas del Paisaje Cultural Cafetero
                  </span>
                  <span className="text-[10px] font-sans font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-cordillera-800/90 text-cordillera-200 border border-cordillera-600/50">
                    Quindío • UNESCO
                  </span>
                </div>
                <p className="text-xs text-cafe-300 font-sans mt-0.5">
                  Sistema de Análisis Algorítmico, Optimización Combinatoria y Cartografía Vial
                </p>
              </div>
            </div>
          </div>

          {/* Estado de Conexión con Backend */}
          <div className="flex items-center self-start sm:self-auto space-x-2.5 bg-cafe-900/90 px-3.5 py-1.5 rounded-full border border-cafe-800 text-xs shadow-inner">
            <Database className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-cafe-300 hidden md:inline">Motor Spring Boot:</span>
            {backendOnline === null || checkingStatus ? (
              <span className="text-cafe-300 font-mono flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                Verificando...
              </span>
            ) : backendOnline ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Activo (:8080)
              </span>
            ) : (
              <button
                type="button"
                onClick={checkBackend}
                className="flex items-center gap-1.5 text-terracota-300 hover:text-white font-semibold transition-colors"
                title="Haz clic para reintentar conexión con el servidor en puerto 8080"
              >
                <span className="w-2 h-2 rounded-full bg-terracota-500" />
                <span>Sin conexión (Reintentar)</span>
                <RefreshCw className="w-3 h-3 ml-0.5" />
              </button>
            )}
          </div>
        </div>

        {/* Barra de Navegación por Módulos (Responsiva) */}
        <nav
          aria-label="Módulos del proyecto"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 py-2.5"
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all border ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white border-amber-400/50 shadow-md'
                    : 'bg-cafe-900/50 text-cafe-200 border-cafe-800/60 hover:text-white hover:bg-cafe-800/80 hover:border-cafe-700'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div
                    className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                      isActive
                        ? 'bg-amber-800/70 text-amber-100'
                        : 'bg-cafe-800 text-cafe-300 group-hover:text-amber-300'
                    }`}
                  >
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">
                      <span className="hidden sm:inline">{item.label}</span>
                      <span className="sm:hidden">{item.shortLabel}</span>
                    </div>
                    <div
                      className={`text-[10px] truncate hidden xl:block ${
                        isActive ? 'text-amber-100/90' : 'text-cafe-400'
                      }`}
                    >
                      {item.subtitle}
                    </div>
                  </div>
                </div>
                <span
                  className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold shrink-0 ${
                    isActive
                      ? 'bg-cafe-950/40 text-white border border-amber-300/30'
                      : 'bg-cafe-950/60 text-cafe-300'
                  }`}
                >
                  {item.badge}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
