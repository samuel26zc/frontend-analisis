import React, { useState } from 'react';
import { ActiveTab, Header } from './components/layout/Header';
import { CatalogView } from './views/CatalogView';
import { RoutesView } from './views/RoutesView';
import { ConvexHullView } from './views/ConvexHullView';
import { TspView } from './views/TspView';
import { ExperimentsView } from './views/ExperimentsView';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('catalog');

  return (
    <div className="min-h-screen bg-cafe-50 flex flex-col font-sans">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'catalog' && <CatalogView />}
        {activeTab === 'routes' && <RoutesView />}
        {activeTab === 'convex-hull' && <ConvexHullView />}
        {activeTab === 'tsp' && <TspView />}
        {activeTab === 'experiments' && <ExperimentsView />}
      </main>

      {/* Footer */}
      <footer className="bg-cafe-900 border-t border-cafe-800 text-cafe-200 py-6 text-xs text-center font-sans">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-serif text-sm font-bold text-white tracking-wide">
            Paisaje Cultural Cafetero • Quindío, Colombia
          </p>
          <p className="text-cafe-300">
            Proyecto Final 2026-2 • Algoritmos y Complejidad Teórica/Experimental
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
