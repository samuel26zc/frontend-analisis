import React, { useEffect, useState } from 'react';
import { Compass, Database, GitFork, MapPin, Network, Sparkles, TrendingUp } from 'lucide-react';
import { networkApi } from '../../services/api';

export type ActiveTab = 'catalog' | 'routes' | 'convex-hull' | 'tsp' | 'experiments';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange }) => {
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    networkApi
      .getStats()
      .then(() => setBackendOnline(true))
      .catch(() => setBackendOnline(false));
  }, []);

  const navItems: Array<{ id: ActiveTab; label: string; icon: React.ReactNode; badge: string }> = [
    {
      id: 'catalog',
      label: 'Territorio & Red',
      icon: <MapPin className="w-4 h-4" />,
      badge: 'R1',
    },
    {
      id: 'routes',
      label: 'Caminos Mínimos',
      icon: <GitFork className="w-4 h-4" />,
      badge: 'R2',
    },
    {
      id: 'convex-hull',
      label: 'Envolvente Convexa',
      icon: <Compass className="w-4 h-4" />,
      badge: 'R3',
    },
    {
      id: 'tsp',
      label: 'Ruta ATSP & Itinerario',
      icon: <Network className="w-4 h-4" />,
      badge: 'R4',
    },
    {
      id: 'experiments',
      label: 'Laboratorio & Anexo',
      icon: <TrendingUp className="w-4 h-4" />,
      badge: 'R5',
    },
  ];

  return (
    <header className="bg-cafe-900 text-cafe-50 shadow-lg sticky top-0 z-50 border-b border-cafe-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo y Branding */}
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-600 to-terracota-700 flex items-center justify-center shadow-md border border-amber-400/30">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-serif font-bold text-white tracking-wide">
                  Rutas del Quindío
                </span>
                <span className="text-[10px] font-sans font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-cordillera-700/80 text-cordillera-100 border border-cordillera-500/40">
                  UNESCO PCC
                </span>
              </div>
              <p className="text-xs text-cafe-200 font-sans font-medium">
                Paisaje Cultural Cafetero • Algoritmos & Grafos
              </p>
            </div>
          </div>

          {/* Backend Connection Status */}
          <div className="hidden md:flex items-center space-x-2 bg-cafe-950/60 px-3 py-1.5 rounded-full border border-cafe-800 text-xs">
            <Database className="w-3.5 h-3.5 text-cafe-200" />
            <span className="text-cafe-200">Backend Spring Boot:</span>
            {backendOnline === null ? (
              <span className="text-stone-400 font-mono">Conectando...</span>
            ) : backendOnline ? (
              <span className="flex items-center gap-1.5 text-cordillera-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-cordillera-500 animate-pulse" />
                Online :8080
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-terracota-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-terracota-500" />
                Desconectado
              </span>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 overflow-x-auto pb-2 scrollbar-none">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-sm font-semibold'
                    : 'text-cafe-200 hover:text-white hover:bg-cafe-800/60'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isActive ? 'bg-amber-700 text-white' : 'bg-cafe-800 text-cafe-200'
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
