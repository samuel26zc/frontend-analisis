import React from 'react';
import { GitFork } from 'lucide-react';

export const RoutesView: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-8 border border-cafe-200 text-center space-y-4">
      <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
        <GitFork className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-serif font-bold text-cafe-900">Módulo 2: Caminos Mínimos (Dijkstra)</h3>
      <p className="text-sm text-stone-600 max-w-md mx-auto">
        Cálculo de rutas más rápidas, comparación de versiones Lineal vs Cola de Prioridad y matriz asimétrica de tiempos.
      </p>
    </div>
  );
};
