import React, { useState } from 'react';
import { ActiveTab, Header } from './components/layout/Header';
import { CatalogView } from './views/CatalogView';
import { RoutesView } from './views/RoutesView';
import { ConvexHullView } from './views/ConvexHullView';
import { TspView } from './views/TspView';
import { ExperimentsView } from './views/ExperimentsView';
import { Compass, GitFork, MapPin, Network, Sparkles, TrendingUp } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('catalog');

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-cafe-50 flex flex-col font-sans text-cafe-950">
      <Header activeTab={activeTab} onTabChange={handleTabChange} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'catalog' && <CatalogView onNavigateTab={handleTabChange} />}
        {activeTab === 'routes' && <RoutesView />}
        {activeTab === 'convex-hull' && <ConvexHullView />}
        {activeTab === 'tsp' && <TspView />}
        {activeTab === 'experiments' && <ExperimentsView />}
      </main>

      {/* Pie de Página Académico e Interactivo */}
      <footer className="bg-cafe-950 border-t border-cafe-800 text-cafe-200 py-8 mt-12 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-cafe-800/80">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <p className="font-serif text-base font-bold text-white tracking-wide">
                  Rutas del Paisaje Cultural Cafetero • Departamento del Quindío
                </p>
              </div>
              <p className="text-xs text-cafe-300 max-w-xl leading-relaxed">
                Plataforma integral de análisis de grafos, caminos mínimos (Dijkstra), geometría computacional (QuickHull 2D)
                y optimización combinatoria (Held-Karp ATSP) calibrada sobre la red vial del Quindío.
              </p>
            </div>

            {/* Accesos Rápidos a Módulos */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleTabChange('catalog')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cafe-900 hover:bg-cafe-800 text-cafe-200 hover:text-white text-xs font-medium border border-cafe-800 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-amber-400" /> R1: Red Vial
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('routes')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cafe-900 hover:bg-cafe-800 text-cafe-200 hover:text-white text-xs font-medium border border-cafe-800 transition-colors"
              >
                <GitFork className="w-3.5 h-3.5 text-amber-400" /> R2: Dijkstra
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('convex-hull')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cafe-900 hover:bg-cafe-800 text-cafe-200 hover:text-white text-xs font-medium border border-cafe-800 transition-colors"
              >
                <Compass className="w-3.5 h-3.5 text-amber-400" /> R3: QuickHull
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('tsp')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cafe-900 hover:bg-cafe-800 text-cafe-200 hover:text-white text-xs font-medium border border-cafe-800 transition-colors"
              >
                <Network className="w-3.5 h-3.5 text-amber-400" /> R4: ATSP & 11h
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('experiments')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cafe-900 hover:bg-cafe-800 text-cafe-200 hover:text-white text-xs font-medium border border-cafe-800 transition-colors"
              >
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" /> R5: Laboratorio
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-cafe-400">
            <span>Universidad del Quindío • Análisis de Algoritmos • Proyecto Final 2026-2</span>
            <span className="font-mono text-[11px]">
              Proyección Cartográfica WGS84 / UTM Zona 18N • Java 21 + React + TypeScript
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
