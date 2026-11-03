import React from 'react';
import { Compass } from 'lucide-react';

export const ConvexHullView: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-8 border border-cafe-200 text-center space-y-4">
      <div className="w-12 h-12 mx-auto rounded-full bg-cordillera-100 text-cordillera-700 flex items-center justify-center">
        <Compass className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-serif font-bold text-cafe-900">Módulo 3: Envolvente Convexa (QuickHull)</h3>
      <p className="text-sm text-stone-600 max-w-md mx-auto">
        Aproximación de la extensión territorial del Quindío por Divide y Vencerás y benchmarking contra SciPy.
      </p>
    </div>
  );
};
